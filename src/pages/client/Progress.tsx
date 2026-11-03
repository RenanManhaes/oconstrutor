import { useEffect, useState } from "react";
import { Calendar, CheckSquare, FileText, UserCheck, UserX, Sparkles, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface EncontroStats {
  id: string;
  title: string;
  date: string | null;
  attendance: string | null;
  materialsCompleted: number;
  materialsTotal: number;
  checkDone: number;
  checkTotal: number;
  hasNotes: boolean;
}

interface PillarInsight {
  title: string;
  insight: string;
  score: number;
}

const ClientProgress = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalEncontros: 0, attended: 0, absent: 0, checkDone: 0, checkTotal: 0, materialsCompleted: 0, materialsTotal: 0 });
  const [encontroStats, setEncontroStats] = useState<EncontroStats[]>([]);
  const [pillarInsights, setPillarInsights] = useState<PillarInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [encontrosRes, emRes, progressRes, attRes, checkRes, notesRes, aiRes, pillarsRes] = await Promise.all([
        supabase.from("encontros").select("id, title, date, sort_order").eq("status", "active").order("sort_order"),
        supabase.from("encontro_materials").select("encontro_id, material_id"),
        supabase.from("user_progress").select("material_id, completed").eq("user_id", user.id).not("material_id", "is", null),
        supabase.from("encontro_attendance").select("encontro_id, status").eq("user_id", user.id),
        supabase.from("encontro_checklist").select("encontro_id, completed").eq("user_id", user.id),
        supabase.from("encontro_notes").select("encontro_id, notes, actions").eq("user_id", user.id),
        supabase.from("encontro_ai_insights").select("pillar_id, insight, progress_score").eq("user_id", user.id),
        supabase.from("journey_stages").select("id, title").eq("status", "active").order("sort_order"),
      ]);

      const encontros = encontrosRes.data || [];
      const em = emRes.data || [];
      const completedMats = new Set((progressRes.data || []).filter(p => p.completed).map(p => p.material_id));

      const attMap: Record<string, string> = {};
      (attRes.data || []).forEach((a: any) => { attMap[a.encontro_id] = a.status; });

      const emMap: Record<string, string[]> = {};
      em.forEach(e => { if (!emMap[e.encontro_id]) emMap[e.encontro_id] = []; emMap[e.encontro_id].push(e.material_id); });

      const checkByEnc: Record<string, { done: number; total: number }> = {};
      (checkRes.data || []).forEach((c: any) => {
        if (!checkByEnc[c.encontro_id]) checkByEnc[c.encontro_id] = { done: 0, total: 0 };
        checkByEnc[c.encontro_id].total++;
        if (c.completed) checkByEnc[c.encontro_id].done++;
      });

      const notesSet = new Set((notesRes.data || []).filter((n: any) => n.notes || n.actions).map((n: any) => n.encontro_id));

      let totalAttended = 0, totalAbsent = 0, totalCheckDone = 0, totalCheckTotal = 0, totalMatsDone = 0, totalMatsAll = 0;

      const encStats: EncontroStats[] = encontros.map(enc => {
        const matIds = emMap[enc.id] || [];
        const done = matIds.filter(mid => completedMats.has(mid)).length;
        const att = attMap[enc.id] || null;
        if (att === "present") totalAttended++;
        if (att === "absent") totalAbsent++;
        const chk = checkByEnc[enc.id] || { done: 0, total: 0 };
        totalCheckDone += chk.done;
        totalCheckTotal += chk.total;
        totalMatsDone += done;
        totalMatsAll += matIds.length;

        return {
          id: enc.id, title: enc.title, date: enc.date,
          attendance: att,
          materialsCompleted: done, materialsTotal: matIds.length,
          checkDone: chk.done, checkTotal: chk.total,
          hasNotes: notesSet.has(enc.id),
        };
      });

      setStats({
        totalEncontros: encontros.length, attended: totalAttended, absent: totalAbsent,
        checkDone: totalCheckDone, checkTotal: totalCheckTotal,
        materialsCompleted: totalMatsDone, materialsTotal: totalMatsAll,
      });
      setEncontroStats(encStats);

      // AI insights by pillar (latest per pillar)
      const pillarsMap = new Map((pillarsRes.data || []).map((p: any) => [p.id, p.title]));
      const pillarLatest: Record<string, { insight: string; score: number }> = {};
      (aiRes.data || []).forEach((ai: any) => {
        if (!ai.pillar_id) return;
        pillarLatest[ai.pillar_id] = { insight: ai.insight, score: ai.progress_score };
      });

      const insights: PillarInsight[] = [];
      pillarsMap.forEach((title, id) => {
        if (pillarLatest[id]) {
          insights.push({ title, insight: pillarLatest[id].insight, score: pillarLatest[id].score });
        }
      });
      setPillarInsights(insights);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  const attendancePct = stats.totalEncontros > 0 ? Math.round(((stats.attended) / stats.totalEncontros) * 100) : 0;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Dashboard de Ações</h1>
        <p className="text-gray-400 text-sm mt-1">Acompanhe sua participação e progresso nos encontros.</p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-navy-light/30 border-gold/5">
          <CardContent className="p-5 text-center">
            <UserCheck className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
            <p className="font-heading font-bold text-xl text-white">{stats.attended} / {stats.totalEncontros}</p>
            <p className="text-xs text-gray-500 mt-1">Presenças</p>
            <Progress value={attendancePct} className="h-1 bg-navy-dark [&>div]:bg-emerald-500 mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-navy-light/30 border-gold/5">
          <CardContent className="p-5 text-center">
            <CheckSquare className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="font-heading font-bold text-xl text-white">{stats.checkDone} / {stats.checkTotal}</p>
            <p className="text-xs text-gray-500 mt-1">Checklist Aplicados</p>
            <Progress value={stats.checkTotal > 0 ? Math.round((stats.checkDone / stats.checkTotal) * 100) : 0} className="h-1 bg-navy-dark [&>div]:bg-gradient-gold mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-navy-light/30 border-gold/5">
          <CardContent className="p-5 text-center">
            <FileText className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="font-heading font-bold text-xl text-white">{stats.materialsCompleted} / {stats.materialsTotal}</p>
            <p className="text-xs text-gray-500 mt-1">Materiais Concluídos</p>
            <Progress value={stats.materialsTotal > 0 ? Math.round((stats.materialsCompleted / stats.materialsTotal) * 100) : 0} className="h-1 bg-navy-dark [&>div]:bg-gradient-gold mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-navy-light/30 border-gold/5">
          <CardContent className="p-5 text-center">
            <Clock className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="font-heading font-bold text-xl text-white">Agora</p>
            <p className="text-xs text-gray-500 mt-1">Último Acesso</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      {pillarInsights.length > 0 && (
        <div>
          <h2 className="font-heading font-bold text-lg text-white mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-gold" /> Insights da IA por Pilar
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {pillarInsights.map((pi, i) => (
              <Card key={i} className="bg-navy-light/30 border-gold/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-heading font-bold text-white">{pi.title}</span>
                    <span className="text-xs text-gold font-heading font-semibold">{pi.score}%</span>
                  </div>
                  <Progress value={pi.score} className="h-1 bg-navy-dark [&>div]:bg-gradient-gold mb-2" />
                  <p className="text-xs text-gray-400">{pi.insight}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Per-encontro stats */}
      {encontroStats.length > 0 && (
        <div>
          <h2 className="font-heading font-bold text-lg text-white mb-4">Por Encontro</h2>
          <div className="space-y-3">
            {encontroStats.map(enc => (
              <Card key={enc.id} className="bg-navy-light/30 border-gold/5">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-white font-medium">{enc.title}</p>
                      {enc.date && <p className="text-[10px] text-gray-500">{new Date(enc.date + "T12:00:00").toLocaleDateString("pt-BR")}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {enc.attendance === "present" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1"><UserCheck className="h-3 w-3" /> Presente</span>}
                      {enc.attendance === "absent" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 flex items-center gap-1"><UserX className="h-3 w-3" /> Faltou</span>}
                      {!enc.attendance && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500">Não registrado</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-gray-500">
                    <span>{enc.materialsCompleted}/{enc.materialsTotal} materiais</span>
                    <span>{enc.checkDone}/{enc.checkTotal} checklist</span>
                    {enc.hasNotes && <span className="text-gold">📝 Anotações</span>}
                  </div>
                  <Progress value={enc.materialsTotal > 0 ? Math.round((enc.materialsCompleted / enc.materialsTotal) * 100) : 0} className="h-1 bg-navy-dark [&>div]:bg-gradient-gold mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProgress;
