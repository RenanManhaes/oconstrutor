import { useEffect, useState } from "react";
import { Search, ChevronDown, ChevronUp, Sparkles, UserCheck, UserX, FileText, CheckSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface UserProgressData {
  name: string;
  userId: string;
  lastAccess: string;
  encontrosCompleted: number;
  tasksCompleted: number;
  materialsCompleted: number;
  totalItems: number;
  completedItems: number;
  progress: number;
  attended: number;
  absent: number;
}

interface UserDetail {
  notes: { encontroTitle: string; notes: string; actions: string }[];
  checklist: { encontroTitle: string; items: { title: string; completed: boolean }[] }[];
  insights: { pillarTitle: string; insight: string; score: number }[];
}

const AdminProgress = () => {
  const [users, setUsers] = useState<UserProgressData[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ encontros: 0, tasks: 0, materials: 0 });
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, UserDetail>>({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [profilesRes, encontrosRes, emRes, tasksRes, progressRes, attRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, last_sign_in_at, status"),
        supabase.from("encontros").select("id, title").eq("status", "active"),
        supabase.from("encontro_materials").select("encontro_id, material_id"),
        supabase.from("tasks").select("id"),
        supabase.from("user_progress").select("user_id, task_id, material_id, completed"),
        supabase.from("encontro_attendance").select("user_id, encontro_id, status"),
      ]);

      const profiles = profilesRes.data || [];
      const encontros = encontrosRes.data || [];
      const em = emRes.data || [];
      const totalTasks = (tasksRes.data || []).length;

      const emMap: Record<string, string[]> = {};
      em.forEach(e => { if (!emMap[e.encontro_id]) emMap[e.encontro_id] = []; emMap[e.encontro_id].push(e.material_id); });

      const allMatIds = new Set(em.map(e => e.material_id));
      const totalMaterials = allMatIds.size;
      const totalEncontros = encontros.length;
      const totalItems = totalMaterials + totalTasks;
      setTotals({ encontros: totalEncontros, tasks: totalTasks, materials: totalMaterials });

      const progress = progressRes.data || [];
      const userMatCompleted: Record<string, Set<string>> = {};
      const userTaskCompleted: Record<string, Set<string>> = {};
      progress.forEach(p => {
        if (!p.completed) return;
        if (p.material_id) { if (!userMatCompleted[p.user_id]) userMatCompleted[p.user_id] = new Set(); userMatCompleted[p.user_id].add(p.material_id); }
        if (p.task_id) { if (!userTaskCompleted[p.user_id]) userTaskCompleted[p.user_id] = new Set(); userTaskCompleted[p.user_id].add(p.task_id); }
      });

      const attByUser: Record<string, { attended: number; absent: number }> = {};
      (attRes.data || []).forEach((a: any) => {
        if (!attByUser[a.user_id]) attByUser[a.user_id] = { attended: 0, absent: 0 };
        if (a.status === "present") attByUser[a.user_id].attended++;
        else attByUser[a.user_id].absent++;
      });

      const usersData: UserProgressData[] = profiles.map(p => {
        const mats = userMatCompleted[p.user_id] || new Set();
        const tasks = userTaskCompleted[p.user_id] || new Set();
        let encDone = 0;
        encontros.forEach(enc => { const matIds = emMap[enc.id] || []; if (matIds.length > 0 && matIds.every(mid => mats.has(mid))) encDone++; });
        const completedItems = mats.size + tasks.size;
        const att = attByUser[p.user_id] || { attended: 0, absent: 0 };
        return {
          name: p.full_name || "Sem nome", userId: p.user_id,
          lastAccess: p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleDateString("pt-BR") : "Nunca",
          encontrosCompleted: encDone, tasksCompleted: tasks.size, materialsCompleted: mats.size,
          totalItems, completedItems,
          progress: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
          attended: att.attended, absent: att.absent,
        };
      });

      setUsers(usersData.sort((a, b) => b.progress - a.progress));
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleExpand = async (userId: string) => {
    if (expandedUser === userId) { setExpandedUser(null); return; }
    setExpandedUser(userId);
    if (userDetails[userId]) return;

    setLoadingDetail(true);
    const [notesRes, checkRes, aiRes, encontrosRes, pillarsRes] = await Promise.all([
      supabase.from("encontro_notes").select("encontro_id, notes, actions").eq("user_id", userId),
      supabase.from("encontro_checklist").select("encontro_id, title, completed").eq("user_id", userId).order("sort_order"),
      supabase.from("encontro_ai_insights").select("pillar_id, insight, progress_score").eq("user_id", userId),
      supabase.from("encontros").select("id, title").eq("status", "active"),
      supabase.from("journey_stages").select("id, title").eq("status", "active").order("sort_order"),
    ]);

    const encMap = new Map((encontrosRes.data || []).map((e: any) => [e.id, e.title]));
    const pillarMap = new Map((pillarsRes.data || []).map((p: any) => [p.id, p.title]));

    const notes = (notesRes.data || []).filter((n: any) => n.notes || n.actions).map((n: any) => ({
      encontroTitle: encMap.get(n.encontro_id) || "Encontro",
      notes: n.notes || "", actions: n.actions || "",
    }));

    const checkByEnc: Record<string, { encontroTitle: string; items: { title: string; completed: boolean }[] }> = {};
    (checkRes.data || []).forEach((c: any) => {
      if (!checkByEnc[c.encontro_id]) checkByEnc[c.encontro_id] = { encontroTitle: encMap.get(c.encontro_id) || "Encontro", items: [] };
      checkByEnc[c.encontro_id].items.push({ title: c.title, completed: c.completed });
    });

    const insights = (aiRes.data || []).map((ai: any) => ({
      pillarTitle: pillarMap.get(ai.pillar_id) || "Pilar",
      insight: ai.insight, score: ai.progress_score,
    }));

    setUserDetails(prev => ({
      ...prev,
      [userId]: { notes, checklist: Object.values(checkByEnc), insights },
    }));
    setLoadingDetail(false);
  };

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Progresso dos Alunos</h1>
        <p className="text-gray-400 text-sm mt-1">Acompanhe o progresso, presença e ações de cada cliente.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-navy-light/50 border-gold/10 text-white placeholder:text-gray-600" />
      </div>

      {filtered.length === 0 && <p className="text-gray-500 text-sm">Nenhum usuário encontrado.</p>}

      <div className="space-y-3">
        {filtered.map((u) => {
          const isExpanded = expandedUser === u.userId;
          const detail = userDetails[u.userId];
          return (
            <Card key={u.userId} className="bg-navy-light/30 border-gold/5">
              <CardContent className="p-5">
                <button className="w-full text-left" onClick={() => toggleExpand(u.userId)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-bold">
                        {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm text-white font-medium">{u.name}</p>
                        <p className="text-xs text-gray-500">Último acesso: {u.lastAccess}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-heading font-bold text-xl text-gold">{u.progress}%</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
                    </div>
                  </div>
                  <Progress value={u.progress} className="h-1.5 bg-navy-dark [&>div]:bg-gradient-gold mb-3" />
                  <div className="flex gap-4 text-xs text-gray-500 flex-wrap">
                    <span>Encontros: <span className="text-white">{u.encontrosCompleted}/{totals.encontros}</span></span>
                    <span>Materiais: <span className="text-white">{u.materialsCompleted}/{totals.materials}</span></span>
                    <span className="flex items-center gap-1"><UserCheck className="h-3 w-3 text-emerald-400" /> {u.attended}</span>
                    <span className="flex items-center gap-1"><UserX className="h-3 w-3 text-red-400" /> {u.absent}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gold/10 space-y-4">
                    {loadingDetail && !detail && <p className="text-gray-500 text-xs">Carregando detalhes...</p>}

                    {detail && (
                      <>
                        {/* AI Insights */}
                        {detail.insights.length > 0 && (
                          <div>
                            <p className="text-xs font-heading font-semibold text-gold flex items-center gap-1 mb-2"><Sparkles className="h-3 w-3" /> Insights da IA</p>
                            <div className="space-y-2">
                              {detail.insights.map((ins, i) => (
                                <div key={i} className="bg-navy-dark/30 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-white font-medium">{ins.pillarTitle}</span>
                                    <span className="text-[10px] text-gold font-heading font-semibold">{ins.score}%</span>
                                  </div>
                                  <p className="text-[11px] text-gray-400">{ins.insight}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {detail.notes.length > 0 && (
                          <div>
                            <p className="text-xs font-heading font-semibold text-white flex items-center gap-1 mb-2"><FileText className="h-3 w-3 text-gold" /> Anotações</p>
                            <div className="space-y-2">
                              {detail.notes.map((n, i) => (
                                <div key={i} className="bg-navy-dark/30 rounded-lg p-3">
                                  <p className="text-[10px] text-gold mb-1">{n.encontroTitle}</p>
                                  {n.notes && <p className="text-[11px] text-gray-300 mb-1">📝 {n.notes.slice(0, 200)}{n.notes.length > 200 ? "..." : ""}</p>}
                                  {n.actions && <p className="text-[11px] text-gray-300">🎯 {n.actions.slice(0, 200)}{n.actions.length > 200 ? "..." : ""}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Checklists */}
                        {detail.checklist.length > 0 && (
                          <div>
                            <p className="text-xs font-heading font-semibold text-white flex items-center gap-1 mb-2"><CheckSquare className="h-3 w-3 text-gold" /> Checklists</p>
                            <div className="space-y-2">
                              {detail.checklist.map((cl, i) => (
                                <div key={i} className="bg-navy-dark/30 rounded-lg p-3">
                                  <p className="text-[10px] text-gold mb-1">{cl.encontroTitle}</p>
                                  {cl.items.map((item, j) => (
                                    <p key={j} className={`text-[11px] ${item.completed ? "text-gray-500 line-through" : "text-gray-300"}`}>
                                      {item.completed ? "☑" : "☐"} {item.title}
                                    </p>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {detail.notes.length === 0 && detail.checklist.length === 0 && detail.insights.length === 0 && (
                          <p className="text-gray-500 text-xs">Nenhuma anotação, checklist ou insight registrado.</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminProgress;
