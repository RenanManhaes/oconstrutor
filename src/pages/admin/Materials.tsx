import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, FileText, Music, Play, Edit, Trash2, Search, Save, Image, Upload, Loader2, UploadCloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { usePagination } from "@/hooks/usePagination";

interface Material {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  module_id: string | null;
  stage_id: string | null;
  sort_order: number;
  status: string;
}

interface ModuleOption { id: string; title: string; }

const typeIcon: Record<string, typeof Play> = { video: Play, audio: Music, pdf: FileText, image: Image };
const typeLabel: Record<string, string> = { video: "Vídeo", audio: "Áudio", pdf: "PDF", image: "Imagem" };

const AdminMaterials = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [modulesList, setModulesList] = useState<ModuleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [form, setForm] = useState({ title: "", description: "", type: "video", url: "", module_id: "", duration_minutes: "" });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Bulk upload state
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkFileName, setBulkFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const fetchMaterials = async () => {
    const { data, error } = await supabase.from("materials").select("*").order("sort_order");
    if (error) { toast.error("Erro ao carregar materiais"); return; }
    setMaterials(data || []);
  };

  const fetchModules = async () => {
    const { data } = await supabase.from("modules").select("id, title").order("sort_order");
    setModulesList(data || []);
  };

  useEffect(() => { Promise.all([fetchMaterials(), fetchModules()]).then(() => setLoading(false)); }, []);

  const moduleName = (id: string | null) => modulesList.find(m => m.id === id)?.title || "—";

  const openNew = () => { setEditing(null); setForm({ title: "", description: "", type: "video", url: "", module_id: "", duration_minutes: "" }); setDialog(true); };
  const openEdit = (m: Material) => {
    setEditing(m);
    setForm({ title: m.title, description: m.description || "", type: m.type, url: m.url || "", module_id: m.module_id || "", duration_minutes: m.duration_minutes?.toString() || "" });
    setDialog(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande (máx. 200 MB)");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const fileName = `materials/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from("media").upload(fileName, file, {
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) {
      toast.error("Erro ao fazer upload: " + error.message);
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from("media").getPublicUrl(fileName);
    setForm(p => ({ ...p, url: publicData.publicUrl }));
    toast.success("Arquivo enviado com sucesso!");
    setUploading(false);

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    const payload = {
      title: form.title,
      description: form.description || null,
      type: form.type,
      url: form.url || null,
      module_id: form.module_id || null,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes) : null,
    };
    if (editing) {
      const { error } = await supabase.from("materials").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Material atualizado!");
    } else {
      const maxOrder = materials.length > 0 ? Math.max(...materials.map(m => m.sort_order)) + 1 : 0;
      const { error } = await supabase.from("materials").insert({ ...payload, sort_order: maxOrder });
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Material criado!");
    }
    setDialog(false);
    fetchMaterials();
  };

  const toggleStatus = async (m: Material) => {
    const newStatus = m.status === "active" ? "draft" : "active";
    const { error } = await supabase.from("materials").update({ status: newStatus }).eq("id", m.id);
    if (error) { toast.error("Erro"); return; }
    toast.success(`Material ${newStatus === "active" ? "ativado" : "desativado"}`);
    fetchMaterials();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("materials").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erro ao excluir"); setDeleteTarget(null); return; }
    toast.success("Material excluído!");
    setDeleteTarget(null);
    fetchMaterials();
  };

  const detectType = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext)) return "video";
    if (["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(ext)) return "audio";
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return "image";
    return "pdf";
  };

  const MAX_BULK_SIZE = 200 * 1024 * 1024;

  const handleBulkUpload = async (fileList: FileList) => {
    const files = Array.from(fileList);
    const oversized = files.find(f => f.size > MAX_BULK_SIZE);
    if (oversized) {
      toast.error(`"${oversized.name}" excede 200 MB.`);
      return;
    }
    setBulkUploading(true);
    setBulkProgress(0);
    let created = 0;
    const maxOrder = materials.length > 0 ? Math.max(...materials.map(m => m.sort_order)) + 1 : 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setBulkFileName(file.name);
      setBulkProgress(Math.round((i / files.length) * 100));

      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const storageName = `materials/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage.from("media").upload(storageName, file, { cacheControl: "31536000" });
      if (upErr) { toast.error(`Erro em "${file.name}": ${upErr.message}`); continue; }

      const { data: pub } = supabase.storage.from("media").getPublicUrl(storageName);
      const type = detectType(file.name);
      const title = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

      const { error: dbErr } = await supabase.from("materials").insert({
        title,
        type,
        url: pub.publicUrl,
        sort_order: maxOrder + i,
      });
      if (dbErr) { toast.error(`Erro ao salvar "${file.name}"`); continue; }
      created++;
    }

    setBulkProgress(100);
    toast.success(`${created} material(is) criado(s)!`);
    setBulkUploading(false);
    setBulkProgress(0);
    setBulkFileName("");
    fetchMaterials();
    if (bulkInputRef.current) bulkInputRef.current.value = "";
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleBulkUpload(e.dataTransfer.files);
  }, [materials]);

  const filtered = materials.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));
  const { visible, hasMore, loadMore, total, shown } = usePagination(filtered, 24, search);

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Materiais</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie todos os conteúdos da mentoria.</p>
        </div>
        <Button size="sm" className="bg-gradient-gold text-navy-dark font-heading font-semibold" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Material
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
        <Input placeholder="Buscar material..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card/50 border-accent/10 text-foreground placeholder:text-muted-foreground/40" />
      </div>

      {/* Drop zone for bulk upload */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${dragOver ? "border-accent bg-accent/5" : "border-accent/15 hover:border-accent/30"}`}
        onClick={() => bulkInputRef.current?.click()}
      >
        <input
          ref={bulkInputRef}
          type="file"
          multiple
          accept="video/*,audio/*,application/pdf,image/*"
          className="hidden"
          onChange={e => { if (e.target.files && e.target.files.length > 0) handleBulkUpload(e.target.files); }}
        />
        {bulkUploading ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-accent" />
              <span className="truncate max-w-[250px]">{bulkFileName}</span>
              <span>{bulkProgress}%</span>
            </div>
            <Progress value={bulkProgress} className="h-2 max-w-md mx-auto" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UploadCloud className="h-8 w-8 text-accent/40" />
            <p className="text-sm text-muted-foreground">Arraste arquivos aqui ou <span className="text-accent font-medium">clique para enviar</span></p>
            <p className="text-xs text-muted-foreground/50">Áudio, vídeo, PDF, imagem — até 200 MB cada. Materiais serão criados automaticamente.</p>
          </div>
        )}
      </div>

      {filtered.length === 0 && <p className="text-gray-500 text-sm">Nenhum material encontrado.</p>}

      <div className="space-y-2">
        {visible.map((mat) => {
          const Icon = typeIcon[mat.type] || FileText;
          return (
            <Card key={mat.id} className="bg-navy-light/30 border-gold/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{mat.title}</p>
                  <p className="text-xs text-gray-500">{typeLabel[mat.type] || mat.type} • {moduleName(mat.module_id)} {mat.duration_minutes ? `• ${mat.duration_minutes} min` : ""}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${mat.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                  {mat.status === "active" ? "Ativo" : "Rascunho"}
                </span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => openEdit(mat)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => toggleStatus(mat)}>
                    <span className="text-[10px]">{mat.status === "active" ? "⏸" : "▶"}</span>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeleteTarget({ id: mat.id, title: mat.title })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-xs text-gray-500">Mostrando {shown} de {total}</p>
          <Button variant="outline" size="sm" className="border-gold/20 text-gold hover:bg-gold/10" onClick={loadMore}>
            Carregar mais
          </Button>
        </div>
      )}

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="bg-navy-light border-gold/10 max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white font-heading">{editing ? "Editar Material" : "Novo Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Título</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger className="bg-navy-dark/50 border-gold/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-navy-light border-gold/10">
                    <SelectItem value="video" className="text-white">Vídeo</SelectItem>
                    <SelectItem value="audio" className="text-white">Áudio</SelectItem>
                    <SelectItem value="pdf" className="text-white">PDF</SelectItem>
                    <SelectItem value="image" className="text-white">Imagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Módulo</Label>
                <Select value={form.module_id} onValueChange={v => setForm(p => ({ ...p, module_id: v }))}>
                  <SelectTrigger className="bg-navy-dark/50 border-gold/10 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-navy-light border-gold/10">
                    {modulesList.map(m => <SelectItem key={m.id} value={m.id} className="text-white">{m.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Upload de arquivo */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Upload de Arquivo</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*,audio/*,application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-gold/20 text-gray-300 hover:text-gold hover:bg-gold/10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                  {uploading ? "Enviando..." : "Enviar arquivo"}
                </Button>
                <span className="text-xs text-gray-600">ou cole a URL abaixo</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">URL do conteúdo</Label>
                <Input value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Duração (min)</Label>
                <Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" />
              </div>
            </div>

            {/* Preview */}
            {form.url && form.type === "image" && (
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Preview</Label>
                <img src={form.url} alt="Preview" className="max-h-40 rounded-lg border border-gold/10 object-contain" />
              </div>
            )}
            {form.url && form.type === "video" && (
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Preview</Label>
                <video src={form.url} controls className="max-h-48 rounded-lg border border-gold/10 w-full" />
              </div>
            )}
            {form.url && form.type === "audio" && (
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Preview</Label>
                <audio src={form.url} controls className="w-full" />
              </div>
            )}
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
            <AlertDialogTitle className="text-white">Excluir material?</AlertDialogTitle>
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

export default AdminMaterials;
