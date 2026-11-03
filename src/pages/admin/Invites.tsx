import { useEffect, useState, useCallback } from "react";
import { Plus, Copy, Share2, Trash2, Power, Users as UsersIcon, ExternalLink, Loader2, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface InviteRow {
  id: string;
  slug: string;
  title: string;
  encontro_id: string;
  description: string | null;
  cover_url: string | null;
  max_signups: number | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  encontro_title?: string;
  signups_count?: number;
}

interface EncontroOption {
  id: string;
  title: string;
}

interface GuestSignup {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: string;
  converted_user_id: string | null;
  created_at: string;
}

const PUBLIC_BASE = "https://oconstrutor.empresaprospera.com.br";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const AdminInvites = () => {
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [encontros, setEncontros] = useState<EncontroOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    encontro_id: "",
    description: "",
    cover_url: "",
    max_signups: "",
    expires_at: "",
  });

  const [signupsDialog, setSignupsDialog] = useState<InviteRow | null>(null);
  const [signups, setSignups] = useState<GuestSignup[]>([]);
  const [signupsLoading, setSignupsLoading] = useState(false);

  const [convertDialog, setConvertDialog] = useState<GuestSignup | null>(null);
  const [convertPassword, setConvertPassword] = useState("");
  const [converting, setConverting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: inv }, { data: enc }, { data: counts }] = await Promise.all([
      supabase.from("public_invites").select("*").order("created_at", { ascending: false }),
      supabase.from("encontros").select("id, title").order("sort_order"),
      supabase.from("guest_signups").select("invite_id"),
    ]);

    const encMap = new Map((enc || []).map((e) => [e.id, e.title]));
    const countMap = new Map<string, number>();
    (counts || []).forEach((c) => countMap.set(c.invite_id, (countMap.get(c.invite_id) || 0) + 1));

    setInvites((inv || []).map((i) => ({
      ...i,
      encontro_title: encMap.get(i.encontro_id) || "—",
      signups_count: countMap.get(i.id) || 0,
    })));
    setEncontros(enc || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setForm({ title: "", slug: "", encontro_id: "", description: "", cover_url: "", max_signups: "", expires_at: "" });
  };

  const handleTitleChange = (v: string) => {
    setForm((f) => ({ ...f, title: v, slug: f.slug || slugify(v) }));
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.encontro_id || !form.slug.trim()) {
      toast.error("Título, encontro e slug são obrigatórios");
      return;
    }
    setCreating(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("public_invites").insert({
      title: form.title.trim(),
      slug: slugify(form.slug),
      encontro_id: form.encontro_id,
      description: form.description.trim() || null,
      cover_url: form.cover_url.trim() || null,
      max_signups: form.max_signups ? parseInt(form.max_signups, 10) : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      created_by: user?.id,
    });
    setCreating(false);
    if (error) {
      toast.error(error.message.includes("duplicate") ? "Este slug já está em uso" : error.message);
      return;
    }
    toast.success("Convite criado");
    setShowNew(false);
    resetForm();
    load();
  };

  const toggleActive = async (inv: InviteRow) => {
    const { error } = await supabase.from("public_invites").update({ active: !inv.active }).eq("id", inv.id);
    if (error) { toast.error(error.message); return; }
    toast.success(inv.active ? "Convite desativado" : "Convite ativado");
    load();
  };

  const removeInvite = async (inv: InviteRow) => {
    if (!confirm(`Excluir o convite "${inv.title}"? As inscrições recebidas também serão removidas.`)) return;
    const { error } = await supabase.from("public_invites").delete().eq("id", inv.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Convite excluído");
    load();
  };

  const inviteUrl = (slug: string) => `${PUBLIC_BASE}/convite/${slug}`;

  const copyLink = async (slug: string) => {
    await navigator.clipboard.writeText(inviteUrl(slug));
    toast.success("Link copiado");
  };

  const shareLink = async (inv: InviteRow) => {
    const url = inviteUrl(inv.slug);
    const text = `${inv.title} — inscreva-se: ${url}`;
    if (navigator.share) {
      try { await navigator.share({ title: inv.title, text, url }); return; } catch { /* user cancelled */ }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  const openSignups = async (inv: InviteRow) => {
    setSignupsDialog(inv);
    setSignupsLoading(true);
    const { data, error } = await supabase
      .from("guest_signups")
      .select("*")
      .eq("invite_id", inv.id)
      .order("created_at", { ascending: false });
    setSignupsLoading(false);
    if (error) { toast.error(error.message); return; }
    setSignups(data || []);
  };

  const handleConvert = async () => {
    if (!convertDialog) return;
    if (convertPassword.length < 6) { toast.error("Senha precisa ter ao menos 6 caracteres"); return; }
    setConverting(true);
    const res = await supabase.functions.invoke("manage-users", {
      body: { action: "convert_guest_to_client", guest_signup_id: convertDialog.id, password: convertPassword },
    });
    setConverting(false);
    if (res.error || res.data?.error) {
      toast.error(res.data?.error || res.error?.message || "Erro ao converter");
      return;
    }
    toast.success("Convertido em cliente com sucesso");
    setConvertDialog(null);
    setConvertPassword("");
    if (signupsDialog) openSignups(signupsDialog);
    load();
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending:   { label: "Pendente",   cls: "bg-gold/20 text-gold" },
      confirmed: { label: "Confirmado", cls: "bg-blue-500/20 text-blue-400" },
      converted: { label: "Cliente",    cls: "bg-green-500/20 text-green-400" },
      declined:  { label: "Recusado",   cls: "bg-red-500/20 text-red-400" },
    };
    const v = map[s] || { label: s, cls: "bg-gray-500/20 text-gray-400" };
    return <Badge className={`${v.cls} border-0`}>{v.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-heading text-2xl text-white">Convites públicos</h1>
          <p className="text-sm text-gray-400 font-body">Gere links para divulgar nas redes sociais e capturar leads</p>
        </div>
        <Dialog open={showNew} onOpenChange={(o) => { setShowNew(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gold hover:bg-gold/90 text-navy-dark"><Plus className="h-4 w-4 mr-2" />Novo convite</Button>
          </DialogTrigger>
          <DialogContent className="bg-graphite border-graphite max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white font-heading">Novo convite</DialogTitle>
              <DialogDescription className="text-gray-400">Vincule a um encontro gratuito e gere o link público.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <Label className="text-gray-300">Título interno *</Label>
                <Input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="bg-navy-dark border-graphite text-white mt-1" placeholder="Ex: Primeiro encontro gratuito" />
              </div>
              <div>
                <Label className="text-gray-300">Slug (URL) *</Label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-gray-500 font-body">/convite/</span>
                  <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className="bg-navy-dark border-graphite text-white" placeholder="primeiro-encontro" />
                </div>
              </div>
              <div>
                <Label className="text-gray-300">Encontro *</Label>
                <Select value={form.encontro_id} onValueChange={(v) => setForm((f) => ({ ...f, encontro_id: v }))}>
                  <SelectTrigger className="bg-navy-dark border-graphite text-white mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{encontros.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300">Descrição (opcional)</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="bg-navy-dark border-graphite text-white mt-1" placeholder="Texto que aparece na landing pública" />
              </div>
              <div>
                <Label className="text-gray-300">URL da imagem de capa (opcional)</Label>
                <Input value={form.cover_url} onChange={(e) => setForm((f) => ({ ...f, cover_url: e.target.value }))} className="bg-navy-dark border-graphite text-white mt-1" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-gray-300">Limite de inscrições</Label>
                  <Input type="number" min="1" value={form.max_signups} onChange={(e) => setForm((f) => ({ ...f, max_signups: e.target.value }))} className="bg-navy-dark border-graphite text-white mt-1" placeholder="Ilimitado" />
                </div>
                <div>
                  <Label className="text-gray-300">Expira em</Label>
                  <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} className="bg-navy-dark border-graphite text-white mt-1" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNew(false)} className="border-graphite text-white">Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating} className="bg-gold hover:bg-gold/90 text-navy-dark">
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-graphite/40 border-graphite">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 text-gold animate-spin" /></div>
          ) : invites.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-body">Nenhum convite criado ainda. Clique em "Novo convite" para começar.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-graphite hover:bg-transparent">
                    <TableHead className="text-gray-400">Convite</TableHead>
                    <TableHead className="text-gray-400">Encontro</TableHead>
                    <TableHead className="text-gray-400">Inscrições</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invites.map((inv) => (
                    <TableRow key={inv.id} className="border-graphite">
                      <TableCell>
                        <div className="text-white font-medium">{inv.title}</div>
                        <div className="text-xs text-gray-500 font-mono">/{inv.slug}</div>
                      </TableCell>
                      <TableCell className="text-gray-300">{inv.encontro_title}</TableCell>
                      <TableCell className="text-gray-300">
                        {inv.signups_count}{inv.max_signups ? ` / ${inv.max_signups}` : ""}
                      </TableCell>
                      <TableCell>
                        {inv.active ? (
                          <Badge className="bg-green-500/20 text-green-400 border-0">Ativo</Badge>
                        ) : (
                          <Badge className="bg-gray-500/20 text-gray-400 border-0">Inativo</Badge>
                        )}
                        {inv.expires_at && new Date(inv.expires_at) < new Date() && (
                          <Badge className="ml-2 bg-red-500/20 text-red-400 border-0">Expirado</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" title="Copiar link" onClick={() => copyLink(inv.slug)} className="text-gray-300 hover:text-gold"><Copy className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" title="Compartilhar" onClick={() => shareLink(inv)} className="text-gray-300 hover:text-gold"><Share2 className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" title="Abrir landing" onClick={() => window.open(inviteUrl(inv.slug), "_blank", "noopener")} className="text-gray-300 hover:text-gold"><ExternalLink className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" title="Ver inscritos" onClick={() => openSignups(inv)} className="text-gray-300 hover:text-gold"><UsersIcon className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" title={inv.active ? "Desativar" : "Ativar"} onClick={() => toggleActive(inv)} className="text-gray-300 hover:text-gold"><Power className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" title="Excluir" onClick={() => removeInvite(inv)} className="text-gray-300 hover:text-red-400"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signups dialog */}
      <Dialog open={!!signupsDialog} onOpenChange={(o) => { if (!o) { setSignupsDialog(null); setSignups([]); } }}>
        <DialogContent className="bg-graphite border-graphite max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white font-heading">Inscritos — {signupsDialog?.title}</DialogTitle>
            <DialogDescription className="text-gray-400">Gerencie os leads recebidos por este convite.</DialogDescription>
          </DialogHeader>
          {signupsLoading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 text-gold animate-spin" /></div>
          ) : signups.length === 0 ? (
            <div className="p-8 text-center text-gray-400 font-body">Nenhuma inscrição ainda.</div>
          ) : (
            <div className="overflow-x-auto max-h-[55vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-graphite">
                    <TableHead className="text-gray-400">Nome</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Telefone</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Data</TableHead>
                    <TableHead className="text-gray-400 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signups.map((g) => (
                    <TableRow key={g.id} className="border-graphite">
                      <TableCell className="text-white">{g.full_name}</TableCell>
                      <TableCell className="text-gray-300">{g.email}</TableCell>
                      <TableCell className="text-gray-300">{g.phone || "—"}</TableCell>
                      <TableCell>{statusBadge(g.status)}</TableCell>
                      <TableCell className="text-gray-400 text-xs">{new Date(g.created_at).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-right">
                        {g.status !== "converted" ? (
                          <Button size="sm" onClick={() => { setConvertDialog(g); setConvertPassword(""); }} className="bg-gold hover:bg-gold/90 text-navy-dark">
                            <UserCheck className="h-4 w-4 mr-1" />Converter
                          </Button>
                        ) : (
                          <span className="text-xs text-green-400">Já é cliente</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert dialog */}
      <Dialog open={!!convertDialog} onOpenChange={(o) => { if (!o) setConvertDialog(null); }}>
        <DialogContent className="bg-graphite border-graphite max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white font-heading">Converter em cliente</DialogTitle>
            <DialogDescription className="text-gray-400">
              Será criada uma conta para <strong className="text-white">{convertDialog?.email}</strong>. Defina uma senha inicial — você pode enviar o convite de redefinição depois pela tela de Usuários.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-gray-300">Senha inicial</Label>
            <Input type="password" value={convertPassword} onChange={(e) => setConvertPassword(e.target.value)} minLength={6} className="bg-navy-dark border-graphite text-white" placeholder="Mínimo 6 caracteres" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialog(null)} className="border-graphite text-white">Cancelar</Button>
            <Button onClick={handleConvert} disabled={converting} className="bg-gold hover:bg-gold/90 text-navy-dark">
              {converting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Converter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvites;
