import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, Search, ClipboardList } from "lucide-react";
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

interface Task {
  id: string;
  title: string;
  instruction: string | null;
  module_id: string;
  sort_order: number;
}

interface ModuleOption { id: string; title: string; }

const AdminTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modulesList, setModulesList] = useState<ModuleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState<string>("all");

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: "", instruction: "", module_id: "" });

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from("tasks").select("*").order("sort_order");
    if (error) { toast.error("Erro ao carregar tarefas"); return; }
    setTasks(data || []);
  };

  const fetchModules = async () => {
    const { data } = await supabase.from("modules").select("id, title").order("sort_order");
    setModulesList(data || []);
  };

  useEffect(() => { Promise.all([fetchTasks(), fetchModules()]).then(() => setLoading(false)); }, []);

  const moduleName = (id: string) => modulesList.find(m => m.id === id)?.title || "—";

  const openNew = () => { setEditing(null); setForm({ title: "", instruction: "", module_id: "" }); setDialog(true); };
  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({ title: t.title, instruction: t.instruction || "", module_id: t.module_id });
    setDialog(true);
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    if (!form.module_id) { toast.error("Selecione um módulo"); return; }
    const payload = { title: form.title, instruction: form.instruction || null, module_id: form.module_id };
    if (editing) {
      const { error } = await supabase.from("tasks").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Tarefa atualizada!");
    } else {
      const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.sort_order)) + 1 : 0;
      const { error } = await supabase.from("tasks").insert({ ...payload, sort_order: maxOrder });
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Tarefa criada!");
    }
    setDialog(false);
    fetchTasks();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("tasks").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erro ao excluir"); setDeleteTarget(null); return; }
    toast.success("Tarefa excluída!");
    setDeleteTarget(null);
    fetchTasks();
  };

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchModule = filterModule === "all" || t.module_id === filterModule;
    return matchSearch && matchModule;
  });

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Tarefas</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie as tarefas dos módulos.</p>
        </div>
        <Button size="sm" className="bg-gradient-gold text-navy-dark font-heading font-semibold" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Nova Tarefa
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input placeholder="Buscar tarefa..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-navy-light/50 border-gold/10 text-white placeholder:text-gray-600" />
        </div>
        <Select value={filterModule} onValueChange={setFilterModule}>
          <SelectTrigger className="w-48 bg-navy-light/50 border-gold/10 text-white"><SelectValue placeholder="Filtrar módulo" /></SelectTrigger>
          <SelectContent className="bg-navy-light border-gold/10">
            <SelectItem value="all" className="text-white">Todos os módulos</SelectItem>
            {modulesList.map(m => <SelectItem key={m.id} value={m.id} className="text-white">{m.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && <p className="text-gray-500 text-sm">Nenhuma tarefa encontrada.</p>}

      <div className="space-y-2">
        {filtered.map((task) => (
          <Card key={task.id} className="bg-navy-light/30 border-gold/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                <ClipboardList className="h-4 w-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{task.title}</p>
                <p className="text-xs text-gray-500">Módulo: {moduleName(task.module_id)}</p>
                {task.instruction && <p className="text-xs text-gray-600 mt-1 line-clamp-1">{task.instruction}</p>}
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => openEdit(task)}><Edit className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeleteTarget({ id: task.id, title: task.title })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="bg-navy-light border-gold/10">
          <DialogHeader><DialogTitle className="text-white font-heading">{editing ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Título</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" placeholder="Nome da tarefa" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Módulo</Label>
              <Select value={form.module_id} onValueChange={v => setForm(p => ({ ...p, module_id: v }))}>
                <SelectTrigger className="bg-navy-dark/50 border-gold/10 text-white"><SelectValue placeholder="Selecione um módulo" /></SelectTrigger>
                <SelectContent className="bg-navy-light border-gold/10">
                  {modulesList.map(m => <SelectItem key={m.id} value={m.id} className="text-white">{m.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Instruções</Label>
              <Textarea value={form.instruction} onChange={e => setForm(p => ({ ...p, instruction: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" rows={4} placeholder="Descreva o que o mentorado deve fazer..." />
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
            <AlertDialogTitle className="text-white">Excluir tarefa?</AlertDialogTitle>
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

export default AdminTasks;
