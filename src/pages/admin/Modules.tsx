import { useState, useEffect } from "react";
import { Plus, Edit, ToggleLeft, GripVertical, Trash2, Save, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Module {
  id: string;
  title: string;
  description: string | null;
  stage_id: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  sort_order: number;
  status: string;
}

interface Stage {
  id: string;
  title: string;
  journey_id: string;
}

const AdminModules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [stagesList, setStagesList] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [form, setForm] = useState({ title: "", description: "", stage_id: "", duration_minutes: "", thumbnail_url: "" });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const fetchModules = async () => {
    const { data, error } = await supabase.from("modules").select("*").order("sort_order");
    if (error) { toast.error("Erro ao carregar módulos"); return; }
    setModules(data || []);
  };

  const fetchStages = async () => {
    const { data } = await supabase.from("journey_stages").select("id, title, journey_id").order("sort_order");
    setStagesList(data || []);
  };

  useEffect(() => { Promise.all([fetchModules(), fetchStages()]).then(() => setLoading(false)); }, []);

  const stageName = (id: string | null) => stagesList.find(s => s.id === id)?.title || "—";

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", stage_id: "", duration_minutes: "", thumbnail_url: "" }); setDialog(true); };
  const openEdit = (m: Module) => {
    setEditing(m);
    setForm({ title: m.title, description: m.description || "", stage_id: m.stage_id || "", duration_minutes: m.duration_minutes?.toString() || "", thumbnail_url: m.thumbnail_url || "" });
    setDialog(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    const payload = {
      title: form.title,
      description: form.description || null,
      stage_id: form.stage_id || null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
      thumbnail_url: form.thumbnail_url || null,
    };
    if (editing) {
      const { error } = await supabase.from("modules").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Módulo atualizado!");
    } else {
      const maxOrder = modules.length > 0 ? Math.max(...modules.map(m => m.sort_order)) + 1 : 0;
      const { error } = await supabase.from("modules").insert({ ...payload, sort_order: maxOrder });
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Módulo criado!");
    }
    setDialog(false);
    fetchModules();
  };

  const toggleStatus = async (m: Module) => {
    const newStatus = m.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("modules").update({ status: newStatus }).eq("id", m.id);
    if (error) { toast.error("Erro"); return; }
    toast.success(`Módulo ${newStatus === "active" ? "ativado" : "desativado"}`);
    fetchModules();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("modules").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erro ao excluir"); setDeleteTarget(null); return; }
    toast.success("Módulo excluído!");
    setDeleteTarget(null);
    fetchModules();
  };

  const filtered = modules.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Módulos</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie os módulos de conteúdo.</p>
        </div>
        <Button size="sm" className="bg-gradient-gold text-navy-dark font-heading font-semibold" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Módulo
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input placeholder="Buscar módulo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-navy-light/50 border-gold/10 text-white placeholder:text-gray-600" />
      </div>

      {filtered.length === 0 && <p className="text-gray-500 text-sm">Nenhum módulo encontrado.</p>}

      <div className="space-y-2">
        {filtered.map((mod) => (
          <Card key={mod.id} className="bg-navy-light/30 border-gold/5">
            <CardContent className="p-4 flex items-center gap-4">
              <GripVertical className="h-5 w-5 text-gray-600 cursor-grab shrink-0" />
              {mod.thumbnail_url ? (
                <img src={mod.thumbnail_url} alt="" loading="lazy" decoding="async" className="h-12 w-16 rounded object-cover shrink-0" />
              ) : (
                <div className="h-12 w-16 rounded bg-navy-dark flex items-center justify-center text-gray-600 text-xs shrink-0">IMG</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-white font-medium">{mod.title}</p>
                  <Badge className={mod.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]" : "bg-gray-500/10 text-gray-500 border-gray-500/20 text-[10px]"}>
                    {mod.status === "active" ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">Etapa: {stageName(mod.stage_id)} {mod.duration_minutes ? `• ${mod.duration_minutes} min` : ""}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => openEdit(mod)}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => toggleStatus(mod)}><ToggleLeft className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeleteTarget({ id: mod.id, title: mod.title })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="bg-navy-light border-gold/10">
          <DialogHeader><DialogTitle className="text-white font-heading">{editing ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Título</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" placeholder="Nome do módulo" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Etapa</Label>
              <Select value={form.stage_id} onValueChange={v => setForm(p => ({ ...p, stage_id: v }))}>
                <SelectTrigger className="bg-navy-dark/50 border-gold/10 text-white"><SelectValue placeholder="Selecione uma etapa" /></SelectTrigger>
                <SelectContent className="bg-navy-light border-gold/10">
                  {stagesList.map(s => <SelectItem key={s.id} value={s.id} className="text-white">{s.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Duração (min)</Label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">URL da Thumbnail</Label>
                <Input value={form.thumbnail_url} onChange={e => setForm(p => ({ ...p, thumbnail_url: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" placeholder="https://..." />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog(false)} className="text-gray-400">Cancelar</Button>
            <Button onClick={save} className="bg-gradient-gold text-navy-dark font-heading font-semibold"><Save className="h-4 w-4 mr-1" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-navy-light border-gold/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir módulo?</AlertDialogTitle>
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

export default AdminModules;
