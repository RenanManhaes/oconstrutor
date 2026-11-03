import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Bell, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Announcement {
  id: string;
  title: string;
  message: string;
  active: boolean;
  created_at: string;
}

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: "", message: "" });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Erro ao carregar avisos"); return; }
    setAnnouncements(data || []);
  };

  useEffect(() => { fetchAnnouncements().then(() => setLoading(false)); }, []);

  const openNew = () => { setEditing(null); setForm({ title: "", message: "" }); setDialog(true); };
  const openEdit = (a: Announcement) => { setEditing(a); setForm({ title: a.title, message: a.message }); setDialog(true); };

  const save = async () => {
    if (!form.title.trim() || !form.message.trim()) { toast.error("Preencha todos os campos"); return; }
    if (editing) {
      const { error } = await supabase.from("announcements").update({ title: form.title, message: form.message }).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Aviso atualizado!");
    } else {
      const { error } = await supabase.from("announcements").insert({ title: form.title, message: form.message });
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Aviso publicado!");
    }
    setDialog(false);
    fetchAnnouncements();
  };

  const toggleActive = async (a: Announcement) => {
    const { error } = await supabase.from("announcements").update({ active: !a.active }).eq("id", a.id);
    if (error) { toast.error("Erro"); return; }
    toast.success(a.active ? "Aviso desativado" : "Aviso ativado");
    fetchAnnouncements();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("announcements").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erro ao excluir"); setDeleteTarget(null); return; }
    toast.success("Aviso excluído!");
    setDeleteTarget(null);
    fetchAnnouncements();
  };

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="studio-eyebrow mb-3">Comunicação</p>
          <h1 className="studio-title text-[30px] leading-tight sm:text-[38px]">Comunicados<span className="text-[#d6aa86]">.</span></h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie os avisos para os clientes.</p>
        </div>
        <Button size="sm" className="bg-gradient-gold text-navy-dark font-heading font-semibold" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Aviso
        </Button>
      </div>

      {announcements.length === 0 && <p className="text-gray-500 text-sm">Nenhum aviso criado.</p>}

      <div className="space-y-2">
        {announcements.map((a) => (
          <Card key={a.id} className="bg-[#1e2a25] border-[#36473d]">
            <CardContent className="p-4 flex items-center gap-4">
              <Bell className={`h-4 w-4 ${a.active ? "text-gold" : "text-gray-600"} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white font-medium">{a.title}</p>
                  <Badge className={a.active ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]" : "bg-gray-500/10 text-gray-500 border-gray-500/20 text-[10px]"}>
                    {a.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">{a.message}</p>
                <p className="text-xs text-gray-600 mt-1">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => openEdit(a)}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => toggleActive(a)}>
                  <span className="text-[10px]">{a.active ? "⏸" : "▶"}</span>
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeleteTarget({ id: a.id, title: a.title })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="bg-navy-light border-gold/10">
          <DialogHeader><DialogTitle className="text-white font-heading">{editing ? "Editar Aviso" : "Novo Aviso"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Título</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" placeholder="Título do aviso" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Mensagem</Label>
              <Textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" rows={4} placeholder="Conteúdo do aviso..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(false)} className="text-gray-400">Cancelar</Button>
            <Button onClick={save} className="bg-gradient-gold text-navy-dark font-heading font-semibold"><Save className="h-4 w-4 mr-1" /> Publicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-navy-light border-gold/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir aviso?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">Tem certeza que deseja excluir "{deleteTarget?.title}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-400 border-gold/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminAnnouncements;
