import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Play, FileText, Music, CheckCircle, Circle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PlaylistItem } from "@/components/MediaPlayerDialog";
const MediaPlayerDialog = lazy(() => import("@/components/MediaPlayerDialog"));

interface MaterialItem { id: string; title: string; type: string; duration_minutes: number | null; url: string | null; done: boolean; }
interface TaskItem { id: string; title: string; instruction: string | null; done: boolean; responseText: string; progressId: string | null; }

const ModuleDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [moduleData, setModuleData] = useState<{ title: string; description: string | null } | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Player state
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playerStartIndex, setPlayerStartIndex] = useState(0);

  const fetchData = async () => {
    if (!user || !id) return;
    const [modRes, matsRes, tasksRes, progressRes] = await Promise.all([
      supabase.from("modules").select("title, description").eq("id", id).maybeSingle(),
      supabase.from("materials").select("*").eq("module_id", id).eq("status", "active").order("sort_order"),
      supabase.from("tasks").select("*").eq("module_id", id).order("sort_order"),
      supabase.from("user_progress").select("*").eq("user_id", user.id),
    ]);

    setModuleData(modRes.data);
    const progress = progressRes.data || [];
    const completedMats = new Set(progress.filter(p => p.completed && p.material_id).map(p => p.material_id));
    const taskProgressMap: Record<string, { completed: boolean; response_text: string | null; id: string }> = {};
    progress.forEach(p => { if (p.task_id) taskProgressMap[p.task_id] = { completed: p.completed, response_text: p.response_text, id: p.id }; });

    setMaterials((matsRes.data || []).map(m => ({ id: m.id, title: m.title, type: m.type, duration_minutes: m.duration_minutes, url: m.url, done: completedMats.has(m.id) })));
    setTasks((tasksRes.data || []).map(t => ({
      id: t.id, title: t.title, instruction: t.instruction,
      done: taskProgressMap[t.id]?.completed || false,
      responseText: taskProgressMap[t.id]?.response_text || "",
      progressId: taskProgressMap[t.id]?.id || null,
    })));
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
    // Check not already completed
    const { data: existing } = await supabase.from("user_progress").select("id").eq("user_id", user.id).eq("material_id", itemId).maybeSingle();
    if (!existing) {
      await supabase.from("user_progress").insert({ user_id: user.id, material_id: itemId, module_id: id, completed: true });
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
      await supabase.from("user_progress").insert({ user_id: user.id, material_id: mat.id, module_id: id, completed: true });
      await supabase.from("access_logs").insert({ user_id: user.id, content_type: mat.type, content_id: mat.id });
    }
    await fetchData();
    setSaving(null);
  };

  const completeTask = async (task: TaskItem) => {
    if (!user) return;
    setSaving(task.id);
    if (task.progressId) {
      await supabase.from("user_progress").update({ completed: true, response_text: task.responseText || null }).eq("id", task.progressId);
    } else {
      await supabase.from("user_progress").insert({ user_id: user.id, task_id: task.id, module_id: id, completed: true, response_text: task.responseText || null });
    }
    toast.success("Tarefa concluída!");
    await fetchData();
    setSaving(null);
  };

  const updateTaskResponse = (taskId: string, text: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, responseText: text } : t));
  };

  const completeModule = async () => {
    if (!user || !id) return;
    const { data: existing } = await supabase.from("user_progress").select("id").eq("user_id", user.id).eq("module_id", id).is("material_id", null).is("task_id", null).maybeSingle();
    if (!existing) {
      await supabase.from("user_progress").insert({ user_id: user.id, module_id: id, completed: true });
    } else {
      await supabase.from("user_progress").update({ completed: true }).eq("id", existing.id);
    }
    toast.success("Módulo concluído! 🎉");
    await fetchData();
  };

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;
  if (!moduleData) return <div className="text-gray-400 p-8">Módulo não encontrado.</div>;

  const totalItems = materials.length + tasks.length;
  const completedItems = materials.filter(m => m.done).length + tasks.filter(t => t.done).length;
  const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="max-w-4xl space-y-8">
      <Link to="/client/modules" className="inline-flex items-center gap-2 text-gray-400 hover:text-gold text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Voltar aos módulos
      </Link>

      <div>
        <h1 className="font-heading font-bold text-2xl text-white">{moduleData.title}</h1>
        <p className="text-gray-400 text-sm mt-1">{moduleData.description || ""}</p>
        <div className="mt-3 flex items-center gap-3">
          <Progress value={pct} className="h-1.5 bg-navy-dark [&>div]:bg-gradient-gold max-w-xs" />
          <span className="text-xs text-gray-500">{pct}%</span>
        </div>
      </div>

      {/* Materials */}
      {materials.length > 0 && (
        <div>
          <h2 className="font-heading font-bold text-lg text-white mb-4">Materiais do Módulo</h2>
          <div className="space-y-2">
            {materials.map(mat => {
              const isMedia = mat.type === "video" || mat.type === "audio";
              return (
                <Card key={mat.id} className="bg-navy-light/30 border-gold/5 hover:border-gold/20 transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                      {mat.type === "video" ? <Play className="h-4 w-4 text-gold" /> :
                       mat.type === "audio" ? <Music className="h-4 w-4 text-gold" /> :
                       <FileText className="h-4 w-4 text-gold" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{mat.title}</p>
                      <p className="text-xs text-gray-500">{mat.type.toUpperCase()} {mat.duration_minutes ? `• ${mat.duration_minutes} min` : ""}</p>
                    </div>
                    {isMedia && mat.url ? (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold" onClick={() => openPlayer(mat)}>
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : mat.url ? (
                      <a href={mat.url} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold"><ExternalLink className="h-4 w-4" /></Button>
                      </a>
                    ) : null}
                    <button onClick={() => toggleMaterial(mat)} disabled={saving === mat.id}>
                      {mat.done ? <CheckCircle className="h-5 w-5 text-gold shrink-0" /> : <Circle className="h-5 w-5 text-gray-600 shrink-0 hover:text-gold transition-colors" />}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <div>
          <h2 className="font-heading font-bold text-lg text-white mb-4">Tarefas Práticas</h2>
          <div className="space-y-3">
            {tasks.map(task => (
              <Card key={task.id} className={`bg-navy-light/30 border-gold/5 ${task.done ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {task.done ? <CheckCircle className="h-5 w-5 text-gold shrink-0" /> : <Circle className="h-5 w-5 text-gray-600 shrink-0" />}
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{task.title}</p>
                      {task.instruction && <p className="text-xs text-gray-500 mt-1">{task.instruction}</p>}
                    </div>
                  </div>
                  {!task.done && (
                    <div className="mt-4 pl-8 space-y-3">
                      <Textarea
                        placeholder="Escreva sua reflexão aqui (opcional)..."
                        value={task.responseText}
                        onChange={e => updateTaskResponse(task.id, e.target.value)}
                        className="bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600 min-h-[80px]"
                      />
                      <Button size="sm" className="bg-gradient-gold text-navy-dark font-heading font-semibold text-xs" onClick={() => completeTask(task)} disabled={saving === task.id}>
                        {saving === task.id ? "Salvando..." : "Marcar como concluída"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pct < 100 && (
        <Button onClick={completeModule} className="bg-gradient-gold text-navy-dark font-heading font-bold shadow-gold">
          Marcar Módulo como Concluído
        </Button>
      )}
      {pct === 100 && <p className="text-gold font-heading font-bold text-center">✅ Módulo concluído!</p>}

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
      </Suspense>
    </div>
  );
};

export default ModuleDetail;
