import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Search, Save, Calendar, Check, Image, Play, FileText, Music, Upload, X, Clock } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Encontro {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  sort_order: number;
  status: string;
}

interface Material {
  id: string;
  title: string;
  type: string;
  url: string | null;
  duration_minutes: number | null;
}

const typeIcon: Record<string, typeof Play> = { video: Play, audio: Music, pdf: FileText, image: Image };
const typeLabel: Record<string, string> = { video: "Vídeo", audio: "Áudio", pdf: "PDF", image: "Imagem" };

const AdminEncontros = () => {
  const [encontros, setEncontros] = useState<Encontro[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<Encontro | null>(null);
  const [form, setForm] = useState({ title: "", description: "", thumbnail_url: "", date: "", start_time: "", end_time: "" });
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [materialSearch, setMaterialSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [encontroMaterialsMap, setEncontroMaterialsMap] = useState<Record<string, string[]>>({});

  const fetchAll = async () => {
    const [encRes, matRes, emRes] = await Promise.all([
      supabase.from("encontros").select("*").order("sort_order"),
      supabase.from("materials").select("id, title, type, url, duration_minutes").eq("status", "active").order("title"),
      supabase.from("encontro_materials").select("encontro_id, material_id").order("sort_order"),
    ]);
    if (encRes.error) { toast.error("Erro ao carregar encontros"); return; }
    setEncontros(encRes.data || []);
    setAllMaterials(matRes.data || []);

    const map: Record<string, string[]> = {};
    (emRes.data || []).forEach(em => {
      if (!map[em.encontro_id]) map[em.encontro_id] = [];
      map[em.encontro_id].push(em.material_id);
    });
    setEncontroMaterialsMap(map);
  };

  useEffect(() => { fetchAll().then(() => setLoading(false)); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: "", description: "", thumbnail_url: "", date: "", start_time: "", end_time: "" });
    setSelectedMaterials(new Set());
    setMaterialSearch("");
    setDialog(true);
  };

  const openEdit = (enc: Encontro) => {
    setEditing(enc);
    setForm({
      title: enc.title,
      description: enc.description || "",
      thumbnail_url: enc.thumbnail_url || "",
      date: enc.date || "",
      start_time: enc.start_time || "",
      end_time: enc.end_time || "",
    });
    setSelectedMaterials(new Set(encontroMaterialsMap[enc.id] || []));
    setMaterialSearch("");
    setDialog(true);
  };

  const toggleMaterial = (matId: string) => {
    setSelectedMaterials(prev => {
      const next = new Set(prev);
      if (next.has(matId)) next.delete(matId); else next.add(matId);
      return next;
    });
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagem deve ter no máximo 5MB"); return; }
    setUploading(true);
    setUploadProgress(10);
    const compressed = await compressImage(file, { maxWidth: 800, maxHeight: 800, quality: 0.75 });
    setUploadProgress(30);
    const ext = compressed.name.split(".").pop() || "jpg";
    const path = `thumbnails/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, compressed);
    setUploadProgress(80);
    if (error) { toast.error("Erro ao enviar imagem"); setUploading(false); setUploadProgress(0); return; }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    setForm(p => ({ ...p, thumbnail_url: urlData.publicUrl }));
    setUploadProgress(100);
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 300);
    toast.success("Imagem enviada!");
  };

  const save = async () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }

    let encontroId: string;

    if (editing) {
      const { error } = await supabase.from("encontros").update({
        title: form.title,
        description: form.description || null,
        thumbnail_url: form.thumbnail_url || null,
        date: form.date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
      }).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      encontroId = editing.id;
    } else {
      const maxOrder = encontros.length > 0 ? Math.max(...encontros.map(e => e.sort_order)) + 1 : 0;
      const { data, error } = await supabase.from("encontros").insert({
        title: form.title,
        description: form.description || null,
        thumbnail_url: form.thumbnail_url || null,
        date: form.date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        sort_order: maxOrder,
      }).select("id").single();
      if (error || !data) { toast.error("Erro ao criar"); return; }
      encontroId = data.id;
    }

    await supabase.from("encontro_materials").delete().eq("encontro_id", encontroId);
    const matIds = Array.from(selectedMaterials);
    if (matIds.length > 0) {
      const inserts = matIds.map((mid, idx) => ({ encontro_id: encontroId, material_id: mid, sort_order: idx }));
      const { error: insErr } = await supabase.from("encontro_materials").insert(inserts);
      if (insErr) { toast.error("Erro ao vincular materiais"); }
    }

    toast.success(editing ? "Encontro atualizado!" : "Encontro criado!");
    setDialog(false);
    fetchAll();
  };

  const toggleStatus = async (enc: Encontro) => {
    const newStatus = enc.status === "active" ? "draft" : "active";
    const { error } = await supabase.from("encontros").update({ status: newStatus }).eq("id", enc.id);
    if (error) { toast.error("Erro"); return; }
    toast.success(`Encontro ${newStatus === "active" ? "ativado" : "desativado"}`);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("encontros").delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erro ao excluir"); setDeleteTarget(null); return; }
    toast.success("Encontro excluído!");
    setDeleteTarget(null);
    fetchAll();
  };

  const filtered = encontros.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));
  const filteredMaterials = allMaterials.filter(m => m.title.toLowerCase().includes(materialSearch.toLowerCase()));

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-white">Encontros</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie os encontros e associe materiais a cada sessão.</p>
        </div>
        <Button size="sm" className="bg-gradient-gold text-navy-dark font-heading font-semibold" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Encontro
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input placeholder="Buscar encontro..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-navy-light/50 border-gold/10 text-white placeholder:text-gray-600" />
      </div>

      {filtered.length === 0 && <p className="text-gray-500 text-sm">Nenhum encontro encontrado.</p>}

      <div className="space-y-2">
        {filtered.map((enc) => {
          const matCount = encontroMaterialsMap[enc.id]?.length || 0;
          return (
            <Card key={enc.id} className="bg-navy-light/30 border-gold/5">
              <CardContent className="p-4 flex items-center gap-4">
                {enc.thumbnail_url ? (
                  <img src={enc.thumbnail_url} alt="" loading="lazy" decoding="async" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-gold" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium">{enc.title}</p>
                  <p className="text-xs text-gray-500">
                    {enc.date ? new Date(enc.date + "T12:00:00").toLocaleDateString("pt-BR") : "Sem data"}
                    {enc.start_time && enc.end_time ? ` • ${enc.start_time.slice(0,5)} - ${enc.end_time.slice(0,5)}` : ""}
                    {" • "}{matCount} {matCount === 1 ? "material" : "materiais"}
                  </p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${enc.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                  {enc.status === "active" ? "Ativo" : "Rascunho"}
                </span>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => openEdit(enc)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => toggleStatus(enc)}>
                    <span className="text-[10px]">{enc.status === "active" ? "⏸" : "▶"}</span>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeleteTarget({ id: enc.id, title: enc.title })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="bg-navy-light border-gold/10 max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader><DialogTitle className="text-white font-heading">{editing ? "Editar Encontro" : "Novo Encontro"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Título</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" rows={2} />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Data</Label>
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-1"><Clock className="h-3 w-3" /> Hora Início</Label>
                <Input type="time" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm flex items-center gap-1"><Clock className="h-3 w-3" /> Hora Fim</Label>
                <Input type="time" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" />
              </div>
            </div>

            {/* Thumbnail upload */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Thumbnail</Label>
              {form.thumbnail_url ? (
                <div className="relative group rounded-xl overflow-hidden border border-accent/10">
                  <img src={form.thumbnail_url} alt="Thumbnail" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Button size="sm" variant="outline" className="border-white/30 text-white hover:bg-white/20" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-1" /> Trocar
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-400/30 text-red-400 hover:bg-red-500/20" onClick={() => setForm(p => ({ ...p, thumbnail_url: "" }))}>
                      <X className="h-4 w-4 mr-1" /> Remover
                    </Button>
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-accent", "bg-accent/5"); }}
                  onDragLeave={e => { e.preventDefault(); e.currentTarget.classList.remove("border-accent", "bg-accent/5"); }}
                  onDrop={e => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-accent", "bg-accent/5");
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith("image/")) {
                      const dt = new DataTransfer();
                      dt.items.add(file);
                      if (fileInputRef.current) { fileInputRef.current.files = dt.files; fileInputRef.current.dispatchEvent(new Event("change", { bubbles: true })); }
                    } else { toast.error("Selecione uma imagem"); }
                  }}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className="relative h-48 rounded-xl border-2 border-dashed border-accent/20 bg-background/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-accent/40 transition-colors"
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
                  {uploading ? (
                    <>
                      <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                      <p className="text-xs text-muted-foreground">Enviando...</p>
                      {uploadProgress > 0 && (
                        <div className="w-40 h-1.5 rounded-full bg-accent/10 overflow-hidden">
                          <div className="h-full bg-accent rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <Image className="h-6 w-6 text-accent" />
                      </div>
                      <p className="text-sm text-muted-foreground">Arraste uma imagem ou clique para enviar</p>
                      <p className="text-[10px] text-muted-foreground/50">PNG, JPG, WebP até 5MB</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Material selector */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Materiais ({selectedMaterials.size} selecionados)</Label>
              <Input
                placeholder="Buscar materiais..."
                value={materialSearch}
                onChange={e => setMaterialSearch(e.target.value)}
                className="bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600"
              />
              <ScrollArea className="h-48 rounded-lg border border-gold/10 bg-navy-dark/30">
                <div className="p-2 space-y-1">
                  {filteredMaterials.map(mat => {
                    const Icon = typeIcon[mat.type] || FileText;
                    const isSelected = selectedMaterials.has(mat.id);
                    return (
                      <button
                        key={mat.id}
                        onClick={() => toggleMaterial(mat.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-all ${isSelected ? "bg-gold/10 border border-gold/20" : "hover:bg-white/5 border border-transparent"}`}
                      >
                        <Checkbox checked={isSelected} className="border-gold/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold" />
                        <Icon className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">{mat.title}</p>
                          <p className="text-[10px] text-gray-600">{typeLabel[mat.type] || mat.type}{mat.duration_minutes ? ` • ${mat.duration_minutes} min` : ""}</p>
                        </div>
                      </button>
                    );
                  })}
                  {filteredMaterials.length === 0 && <p className="text-gray-600 text-xs p-2">Nenhum material encontrado.</p>}
                </div>
              </ScrollArea>
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
            <AlertDialogTitle className="text-white">Excluir encontro?</AlertDialogTitle>
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

export default AdminEncontros;
