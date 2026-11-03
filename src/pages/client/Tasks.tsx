import { useState, useEffect } from "react";
import { CheckCircle, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TaskView {
  id: string;
  title: string;
  instruction: string | null;
  moduleName: string;
  moduleId: string;
  done: boolean;
  responseText: string;
  progressId: string | null;
}

const ClientTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskView[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchTasks = async () => {
    if (!user) return;
    const [tasksRes, modulesRes, progressRes] = await Promise.all([
      supabase.from("tasks").select("*").order("sort_order"),
      supabase.from("modules").select("id, title"),
      supabase.from("user_progress").select("*").eq("user_id", user.id).not("task_id", "is", null),
    ]);

    const moduleMap: Record<string, string> = {};
    (modulesRes.data || []).forEach(m => { moduleMap[m.id] = m.title; });

    const progressMap: Record<string, { completed: boolean; response_text: string | null; id: string }> = {};
    (progressRes.data || []).forEach(p => { if (p.task_id) progressMap[p.task_id] = { completed: p.completed, response_text: p.response_text, id: p.id }; });

    setTasks((tasksRes.data || []).map(t => ({
      id: t.id, title: t.title, instruction: t.instruction,
      moduleName: moduleMap[t.module_id] || "",
      moduleId: t.module_id,
      done: progressMap[t.id]?.completed || false,
      responseText: progressMap[t.id]?.response_text || "",
      progressId: progressMap[t.id]?.id || null,
    })));
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [user]);

  const completeTask = async (task: TaskView) => {
    if (!user) return;
    setSaving(task.id);
    if (task.progressId) {
      await supabase.from("user_progress").update({ completed: true, response_text: task.responseText || null }).eq("id", task.progressId);
    } else {
      await supabase.from("user_progress").insert({ user_id: user.id, task_id: task.id, module_id: task.moduleId, completed: true, response_text: task.responseText || null });
    }
    toast.success("Tarefa concluída!");
    await fetchTasks();
    setSaving(null);
  };

  const updateResponse = (taskId: string, text: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, responseText: text } : t));
  };

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  const pending = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Tarefas</h1>
        <p className="text-gray-400 text-sm mt-1">Complete as tarefas práticas de cada módulo.</p>
        <p className="text-xs text-gray-500 mt-2">{completed.length}/{tasks.length} concluídas</p>
      </div>

      {pending.length === 0 && completed.length === 0 && <p className="text-gray-500 text-sm">Nenhuma tarefa disponível.</p>}

      {pending.length > 0 && (
        <div className="space-y-3">
          {pending.map(task => (
            <Card key={task.id} className="bg-navy-light/30 border-gold/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(expanded === task.id ? null : task.id)}>
                  <Circle className="h-5 w-5 text-gray-600 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.moduleName}</p>
                  </div>
                  {expanded === task.id ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                </div>
                {expanded === task.id && (
                  <div className="mt-4 pl-8 space-y-4">
                    {task.instruction && <p className="text-sm text-gray-300 leading-relaxed">{task.instruction}</p>}
                    <Textarea
                      placeholder="Escreva sua reflexão aqui (opcional)..."
                      value={task.responseText}
                      onChange={e => updateResponse(task.id, e.target.value)}
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
      )}

      {completed.length > 0 && (
        <>
          <h2 className="font-heading font-bold text-sm text-gray-400 uppercase tracking-wider mt-8">Concluídas</h2>
          <div className="space-y-2">
            {completed.map(task => (
              <Card key={task.id} className="bg-navy-light/30 border-gold/5 opacity-60">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-gold shrink-0" />
                  <div>
                    <p className="text-sm text-white font-medium">{task.title}</p>
                    <p className="text-xs text-gray-500">{task.moduleName}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientTasks;
