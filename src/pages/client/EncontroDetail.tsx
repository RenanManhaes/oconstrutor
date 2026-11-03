import { useEffect, useState, useCallback, useRef, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Play, FileText, Music, Image, CheckCircle, Circle, Plus, Trash2, UserCheck, UserX, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PlaylistItem } from "@/components/MediaPlayerDialog";
const MediaPlayerDialog = lazy(() => import("@/components/MediaPlayerDialog"));
const MaterialPreviewDialog = lazy(() => import("@/components/MaterialPreviewDialog"));

interface MaterialItem {
  id: string;
  title: string;
  type: string;
  url: string | null;
  duration_minutes: number | null;
  done: boolean;
}

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  sort_order: number;
}

const EncontroDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [encontro, setEncontro] = useState<{ title: string; description: string | null; date: string | null; start_time: string | null; end_time: string | null } | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const [playerOpen, setPlayerOpen] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playerStartIndex, setPlayerStartIndex] = useState(0);

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMat, setPreviewMat] = useState<{ title: string; url: string; type: "pdf" | "image" } | null>(null);

  // Notes
  const [notes, setNotes] = useState("");
  const [actions, setActions] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheckItem, setNewCheckItem] = useState("");

  // Attendance
  const [attendance, setAttendance] = useState<string | null>(null); // 'present' | 'absent' | null
  const [attendanceLocked, setAttendanceLocked] = useState(false);

  // AI
  const [analyzing, setAnalyzing] = useState(false);

  const fetchData = async () => {
    if (!user || !id) return;
    const [encRes, emRes, progressRes, notesRes, checkRes, attRes] = await Promise.all([
      supabase.from("encontros").select("title, description, date, start_time, end_time").eq("id", id).maybeSingle(),
      supabase.from("encontro_materials").select("material_id").eq("encontro_id", id).order("sort_order"),
      supabase.from("user_progress").select("material_id, completed").eq("user_id", user.id).eq("completed", true),
      supabase.from("encontro_notes").select("*").eq("user_id", user.id).eq("encontro_id", id).maybeSingle(),
      supabase.from("encontro_checklist").select("*").eq("user_id", user.id).eq("encontro_id", id).order("sort_order"),
      supabase.from("encontro_attendance").select("status").eq("user_id", user.id).eq("encontro_id", id).maybeSingle(),
    ]);

    const enc = encRes.data;
    setEncontro(enc);

    // Attendance lock logic
    if (enc?.date && enc?.end_time) {
      const endDateTime = new Date(`${enc.date}T${enc.end_time}`);
      setAttendanceLocked(new Date() > endDateTime);
    } else {
      setAttendanceLocked(false);
    }

    setAttendance(attRes.data?.status || null);

    const completedMats = new Set((progressRes.data || []).filter(p => p.material_id).map(p => p.material_id));
    const matIds = (emRes.data || []).map(em => em.material_id);

    if (matIds.length > 0) {
      const { data: mats } = await supabase.from("materials").select("id, title, type, url, duration_minutes").in("id", matIds).eq("status", "active");
      const matMap = new Map((mats || []).map(m => [m.id, m]));
      const ordered: MaterialItem[] = matIds
        .filter(mid => matMap.has(mid))
        .map(mid => {
          const m = matMap.get(mid)!;
          return { id: m.id, title: m.title, type: m.type, url: m.url, duration_minutes: m.duration_minutes, done: completedMats.has(m.id) };
        });
      setMaterials(ordered);
    } else {
      setMaterials([]);
    }

    if (notesRes.data) {
      setNotes(notesRes.data.notes || "");
      setActions(notesRes.data.actions || "");
    }
    setChecklist(checkRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, id]);

  const openPlayer = (mat: MaterialItem) => {
    if (!mat.url || (mat.type !== "video" && mat.type !== "audio")) return;
    const mediaMats = materials
      .filter(m => (m.type === "video" || m.type === "audio") && m.url)
      .map(m => ({ id: m.id, title: m.title, type: m.type as "video" | "audio", url: m.url!, duration_minutes: m.duration_minutes }));
    const idx = mediaMats.findIndex(m => m.id === mat.id);
    setPlaylist(mediaMats);
    setPlayerStartIndex(idx >= 0 ? idx : 0);
    setPlayerOpen(true);
  };

  const handleItemComplete = async (itemId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from("user_progress").select("id").eq("user_id", user.id).eq("material_id", itemId).maybeSingle();
    if (!existing) {
      await supabase.from("user_progress").insert({ user_id: user.id, material_id: itemId, completed: true });
      await supabase.from("access_logs").insert({ user_id: user.id, content_type: materials.find(m => m.id === itemId)?.type || "video", content_id: itemId });
    }
    await fetchData();
  };

  const toggleMaterial = async (mat: MaterialItem) => {
    if (!user) return;
    setSaving(mat.id);
    if (mat.done) {
      await supabase.from("user_progress").delete().eq("user_id", user.id).eq("material_id", mat.id);
    } else {
      await supabase.from("user_progress").insert({ user_id: user.id, material_id: mat.id, completed: true });
      await supabase.from("access_logs").insert({ user_id: user.id, content_type: mat.type, content_id: mat.id });
    }
    await fetchData();
    setSaving(null);
  };

  // Notes auto-save
  const saveNotes = useCallback(async (n: string, a: string) => {
    if (!user || !id) return;
    setNotesSaving(true);
    const { data: existing } = await supabase.from("encontro_notes").select("id").eq("user_id", user.id).eq("encontro_id", id).maybeSingle();
    if (existing) {
      await supabase.from("encontro_notes").update({ notes: n, actions: a }).eq("id", existing.id);
    } else {
      await supabase.from("encontro_notes").insert({ user_id: user.id, encontro_id: id, notes: n, actions: a });
    }
    setNotesSaving(false);
  }, [user, id]);

  const handleNotesChange = (field: "notes" | "actions", value: string) => {
    if (field === "notes") setNotes(value); else setActions(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const n = field === "notes" ? value : notes;
      const a = field === "actions" ? value : actions;
      saveNotes(n, a);
    }, 1500);
  };

  // Attendance
  const markAttendance = async (status: "present" | "absent") => {
    if (!user || !id || attendanceLocked) return;
    const { data: existing } = await supabase.from("encontro_attendance").select("id").eq("user_id", user.id).eq("encontro_id", id).maybeSingle();
    if (existing) {
      await supabase.from("encontro_attendance").update({ status }).eq("id", existing.id);
    } else {
      await supabase.from("encontro_attendance").insert({ user_id: user.id, encontro_id: id, status });
    }
    setAttendance(status);
    toast.success(status === "present" ? "Presença marcada!" : "Falta registrada.");
  };

  // AI Analysis
  const triggerAI = async () => {
    if (!user || !id) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-encontro", {
        body: { encontro_id: id },
      });
      if (error) throw error;
      if (data?.insights?.length > 0) {
        toast.success(`IA analisou ${data.insights.length} pilar(es)!`);
      } else {
        toast.info("Adicione anotações ou ações para a IA analisar.");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erro na análise da IA");
    }
    setAnalyzing(false);
  };

  // Checklist
  const addCheckItem = async () => {
    if (!user || !id || !newCheckItem.trim()) return;
    const maxOrder = checklist.length > 0 ? Math.max(...checklist.map(c => c.sort_order)) + 1 : 0;
    await supabase.from("encontro_checklist").insert({ user_id: user.id, encontro_id: id, title: newCheckItem.trim(), sort_order: maxOrder });
    setNewCheckItem("");
    await fetchData();
  };

  const toggleCheckItem = async (item: ChecklistItem) => {
    await supabase.from("encontro_checklist").update({ completed: !item.completed }).eq("id", item.id);
    await fetchData();
  };

  const deleteCheckItem = async (itemId: string) => {
    await supabase.from("encontro_checklist").delete().eq("id", itemId);
    await fetchData();
  };

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;
  if (!encontro) return <div className="text-gray-400 p-8">Encontro não encontrado.</div>;

  const totalItems = materials.length;
  const completedItems = materials.filter(m => m.done).length;
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const checkDone = checklist.filter(c => c.completed).length;
  const checkTotal = checklist.length;
  const iconMap: Record<string, typeof Play> = { video: Play, audio: Music, pdf: FileText, image: Image };

  return (
    <div className="max-w-4xl space-y-6">
      <Link to="/client/encontros" className="inline-flex items-center gap-2 text-gray-400 hover:text-gold text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar aos encontros
      </Link>

      <div>
        <h1 className="font-heading font-bold text-xl sm:text-2xl text-white">{encontro.title}</h1>
        <p className="text-gray-400 text-sm mt-1">{encontro.description || ""}</p>
        {encontro.date && (
          <p className="text-xs text-gray-500 mt-1">
            {new Date(encontro.date + "T12:00:00").toLocaleDateString("pt-BR")}
            {encontro.start_time && encontro.end_time ? ` • ${encontro.start_time.slice(0, 5)} - ${encontro.end_time.slice(0, 5)}` : ""}
          </p>
        )}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <Progress value={pct} className="h-1.5 bg-navy-dark [&>div]:bg-gradient-gold w-full max-w-xs" />
          <span className="text-xs text-gray-500">{completedItems}/{totalItems} materiais • {pct}%</span>
        </div>
      </div>

      {/* Attendance */}
      <Card className="bg-navy-light/30 border-gold/5">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-heading font-semibold text-white">Presença</p>
              {attendanceLocked && <p className="text-[10px] text-gray-500">Período de marcação encerrado</p>}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={attendance === "present" ? "default" : "outline"}
                className={`flex-1 sm:flex-none ${attendance === "present" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "border-gold/20 text-gray-400 hover:text-emerald-400"}`}
                onClick={() => markAttendance("present")}
                disabled={attendanceLocked}
              >
                <UserCheck className="h-4 w-4 mr-1" /> Presente
              </Button>
              <Button
                size="sm"
                variant={attendance === "absent" ? "default" : "outline"}
                className={`flex-1 sm:flex-none ${attendance === "absent" ? "bg-red-600 hover:bg-red-700 text-white" : "border-gold/20 text-gray-400 hover:text-red-400"}`}
                onClick={() => markAttendance("absent")}
                disabled={attendanceLocked}
              >
                <UserX className="h-4 w-4 mr-1" /> Faltei
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="bg-navy-light/50 border border-gold/10 w-full grid grid-cols-3 h-auto">
          <TabsTrigger value="materials" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-gray-400 text-xs sm:text-sm">Materiais</TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-gray-400 text-xs sm:text-sm">Anotações</TabsTrigger>
          <TabsTrigger value="checklist" className="data-[state=active]:bg-gold/10 data-[state=active]:text-gold text-gray-400 text-xs sm:text-sm">
            Checklist {checkTotal > 0 && <span className="ml-1 text-[10px] hidden sm:inline">({checkDone}/{checkTotal})</span>}
          </TabsTrigger>
        </TabsList>

        {/* Materials Tab */}
        <TabsContent value="materials" className="space-y-2 mt-4">
          {materials.length > 0 ? materials.map(mat => {
            const isMedia = mat.type === "video" || mat.type === "audio";
            const isPreviewable = (mat.type === "pdf" || mat.type === "image") && mat.url;
            const Icon = iconMap[mat.type] || FileText;
            const handleOpen = () => {
              if (isMedia) openPlayer(mat);
              else if (isPreviewable) {
                setPreviewMat({ title: mat.title, url: mat.url!, type: mat.type as "pdf" | "image" });
                setPreviewOpen(true);
              }
            };
            return (
              <Card key={mat.id} className="bg-navy-light/30 border-gold/5 hover:border-gold/20 transition-all">
                <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-4">
                  <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{mat.title}</p>
                    <p className="text-xs text-gray-500">{mat.type.toUpperCase()} {mat.duration_minutes ? `• ${mat.duration_minutes} min` : ""}</p>
                  </div>
                  {(isMedia || isPreviewable) && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold" onClick={handleOpen}>
                      <Play className="h-4 w-4" />
                    </Button>
                  )}
                  <button onClick={() => toggleMaterial(mat)} disabled={saving === mat.id}>
                    {mat.done ? <CheckCircle className="h-5 w-5 text-gold shrink-0" /> : <Circle className="h-5 w-5 text-gray-600 shrink-0 hover:text-gold transition-colors" />}
                  </button>
                </CardContent>
              </Card>
            );
          }) : <p className="text-gray-500 text-sm">Nenhum material neste encontro.</p>}
          {pct === 100 && totalItems > 0 && <p className="text-gold font-heading font-bold text-center mt-4">✅ Encontro concluído!</p>}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-6 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-heading font-semibold text-white flex items-center gap-2">
              📝 Anotações Importantes
              {notesSaving && <span className="text-[10px] text-gray-500 font-normal">Salvando...</span>}
            </label>
            <Textarea
              value={notes}
              onChange={e => handleNotesChange("notes", e.target.value)}
              placeholder="Escreva aqui suas anotações do encontro..."
              className="bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600 min-h-[120px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-heading font-semibold text-white flex items-center gap-2">
              🎯 Ações que vou aplicar
              {notesSaving && <span className="text-[10px] text-gray-500 font-normal">Salvando...</span>}
            </label>
            <Textarea
              value={actions}
              onChange={e => handleNotesChange("actions", e.target.value)}
              placeholder="Que ações concretas você vai tomar a partir deste encontro?"
              className="bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600 min-h-[120px]"
            />
          </div>
          <Button onClick={triggerAI} disabled={analyzing} className="bg-gradient-gold text-navy-dark font-heading font-semibold">
            {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            {analyzing ? "Analisando..." : "Analisar com IA"}
          </Button>
        </TabsContent>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <Input
              value={newCheckItem}
              onChange={e => setNewCheckItem(e.target.value)}
              placeholder="Adicionar item ao checklist..."
              className="bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600"
              onKeyDown={e => e.key === "Enter" && addCheckItem()}
            />
            <Button size="sm" className="bg-gradient-gold text-navy-dark font-heading font-semibold shrink-0" onClick={addCheckItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {checkTotal > 0 && (
            <div className="flex items-center gap-3">
              <Progress value={checkTotal > 0 ? Math.round((checkDone / checkTotal) * 100) : 0} className="h-1.5 bg-navy-dark [&>div]:bg-gradient-gold flex-1" />
              <span className="text-xs text-gray-500 shrink-0">{checkDone}/{checkTotal} aplicadas</span>
            </div>
          )}

          <div className="space-y-2">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center gap-3 bg-navy-light/30 border border-gold/5 rounded-lg p-3">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggleCheckItem(item)}
                  className="border-gold/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                />
                <span className={`flex-1 text-sm ${item.completed ? "text-gray-500 line-through" : "text-white"}`}>{item.title}</span>
                <button onClick={() => deleteCheckItem(item.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {checkTotal === 0 && <p className="text-gray-500 text-sm text-center">Crie itens para acompanhar a aplicação do que aprendeu.</p>}
        </TabsContent>
      </Tabs>

      <Suspense fallback={null}>
        {playerOpen && (
          <MediaPlayerDialog
            open={playerOpen}
            onOpenChange={setPlayerOpen}
            playlist={playlist}
            startIndex={playerStartIndex}
            onItemComplete={handleItemComplete}
          />
        )}

        {previewMat && previewOpen && (
          <MaterialPreviewDialog
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            title={previewMat.title}
            url={previewMat.url}
            type={previewMat.type}
          />
        )}
      </Suspense>
    </div>
  );
};

export default EncontroDetail;
