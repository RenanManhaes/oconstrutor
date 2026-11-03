import { useState, useEffect } from "react";
import { User, Mail, Phone, Upload, Loader2, Calendar, CheckCircle2, BarChart3, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
}

const statusColors: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  overdue: "bg-red-500/10 text-red-400 border-red-500/20",
};
const statusLabels: Record<string, string> = { paid: "Pago", pending: "Pendente", overdue: "Vencido" };

const ClientProfile = () => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [stats, setStats] = useState({ attendance: 0, totalEncontros: 0, checklistDone: 0, checklistTotal: 0, avgProgress: 0 });

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");

    const load = async () => {
      const [profileRes, attendanceRes, checklistRes, insightsRes, encontrosRes, paymentsRes] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, avatar_url").eq("user_id", user.id).maybeSingle(),
        supabase.from("encontro_attendance").select("status").eq("user_id", user.id),
        supabase.from("encontro_checklist").select("completed").eq("user_id", user.id),
        supabase.from("encontro_ai_insights").select("progress_score").eq("user_id", user.id),
        supabase.from("encontros").select("id").eq("status", "active"),
        supabase.from("user_payments").select("*").eq("user_id", user.id).order("due_date"),
      ]);

      if (profileRes.data) {
        setName(profileRes.data.full_name || "");
        setPhone(profileRes.data.phone || "");
        setAvatarUrl(profileRes.data.avatar_url || null);
      }

      const attendance = (attendanceRes.data || []).filter(a => a.status === "present").length;
      const totalEncontros = (encontrosRes.data || []).length;
      const checklist = checklistRes.data || [];
      const checklistDone = checklist.filter(c => c.completed).length;
      const insights = insightsRes.data || [];
      const avgProgress = insights.length > 0 ? Math.round(insights.reduce((s, i) => s + i.progress_score, 0) / insights.length) : 0;

      setStats({ attendance, totalEncontros, checklistDone, checklistTotal: checklist.length, avgProgress });
      setPayments(paymentsRes.data as Payment[] || []);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.8 });
      const ext = compressed.name.split(".").pop() || "jpg";
      const path = `avatars/${user.id}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, compressed, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
      toast.success("Avatar atualizado!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name, phone: phone || null }).eq("user_id", user.id);
    if (error) toast.error("Erro ao salvar");
    else toast.success("Perfil atualizado!");
    setSaving(false);
  };

  if (loading) return <div className="text-muted-foreground p-8">Carregando...</div>;

  const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const statCards = [
    { icon: Calendar, label: "Presenças", value: `${stats.attendance}/${stats.totalEncontros}` },
    { icon: CheckCircle2, label: "Ações Aplicadas", value: `${stats.checklistDone}/${stats.checklistTotal}` },
    { icon: BarChart3, label: "Progresso Geral", value: `${stats.avgProgress}%` },
  ];

  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = payments.filter(p => p.status !== "paid").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <p className="studio-eyebrow mb-3">Sua conta</p>
          <h1 className="studio-title text-[30px] leading-tight sm:text-[38px]">Meu perfil<span className="text-[#d6aa86]">.</span></h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas informações pessoais.</p>
      </div>

      <Card className="bg-[#1e2a25] border-[#36473d]">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-accent/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-accent/20 text-accent text-2xl font-heading font-bold">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Upload className="h-5 w-5 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <div>
              <p className="font-heading font-bold text-lg text-foreground">{name || "Sem nome"}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {statCards.map((s, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-background/30 border border-accent/5">
                <s.icon className="h-4 w-4 text-accent mx-auto mb-1" />
                <p className="font-heading font-bold text-lg text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="bg-background/30 border border-accent/10 mb-4">
              <TabsTrigger value="profile" className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent text-muted-foreground">Perfil</TabsTrigger>
              <TabsTrigger value="financial" className="data-[state=active]:bg-accent/10 data-[state=active]:text-accent text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 mr-1" /> Financeiro
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input value={name} onChange={e => setName(e.target.value)} className="pl-10 bg-background/50 border-accent/10 text-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input value={email} disabled className="pl-10 bg-background/50 border-accent/10 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-sm">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input value={phone} onChange={e => setPhone(e.target.value)} className="pl-10 bg-background/50 border-accent/10 text-foreground" placeholder="(11) 99999-0000" />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="bg-accent text-accent-foreground font-heading font-bold hover:bg-accent/90">
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="financial">
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-center">
                    <p className="font-heading font-bold text-lg text-emerald-400">
                      R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Total Pago</p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-center">
                    <p className="font-heading font-bold text-lg text-yellow-400">
                      R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">Pendente</p>
                  </div>
                </div>

                {/* Payments list */}
                {payments.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">Nenhuma parcela registrada.</p>
                ) : (
                  <div className="space-y-2">
                    {payments.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/20 border border-accent/5">
                        <DollarSign className="h-4 w-4 text-accent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium">
                            R$ {Number(p.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Venc: {new Date(p.due_date + "T12:00:00").toLocaleDateString("pt-BR")}
                            {p.paid_at && ` • Pago: ${new Date(p.paid_at).toLocaleDateString("pt-BR")}`}
                          </p>
                        </div>
                        <Badge variant="outline" className={statusColors[p.status] || ""}>
                          {statusLabels[p.status] || p.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientProfile;
