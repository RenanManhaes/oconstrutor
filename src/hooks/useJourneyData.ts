import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface StageView {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  status: "completed" | "in_progress" | "locked";
  progress: number;
  aiInsight: string | null;
  aiScore: number | null;
}

export interface EncontroView {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  date: string | null;
  progress: number;
  totalMaterials: number;
  completedMaterials: number;
}

async function fetchJourney(userId: string) {
  const [stagesRes, encontrosRes, emRes, progressRes, aiRes] = await Promise.all([
    supabase.from("journey_stages").select("*").eq("status", "active").order("sort_order"),
    supabase.from("encontros").select("*").eq("status", "active").order("sort_order"),
    supabase.from("encontro_materials").select("encontro_id, material_id").order("sort_order"),
    supabase.from("user_progress").select("material_id, completed").eq("user_id", userId).not("material_id", "is", null),
    supabase.from("encontro_ai_insights").select("pillar_id, insight, progress_score").eq("user_id", userId),
  ]);

  const completedMats = new Set((progressRes.data || []).filter(p => p.completed).map(p => p.material_id));

  const emMap: Record<string, string[]> = {};
  (emRes.data || []).forEach(em => {
    if (!emMap[em.encontro_id]) emMap[em.encontro_id] = [];
    emMap[em.encontro_id].push(em.material_id);
  });

  const aiByPillar: Record<string, { scores: number[]; insights: string[] }> = {};
  (aiRes.data || []).forEach((ai: any) => {
    if (!ai.pillar_id) return;
    if (!aiByPillar[ai.pillar_id]) aiByPillar[ai.pillar_id] = { scores: [], insights: [] };
    aiByPillar[ai.pillar_id].scores.push(ai.progress_score);
    aiByPillar[ai.pillar_id].insights.push(ai.insight);
  });

  const encontros: EncontroView[] = (encontrosRes.data || []).map(enc => {
    const matIds = emMap[enc.id] || [];
    const completed = matIds.filter(mid => completedMats.has(mid)).length;
    const total = matIds.length;
    return {
      id: enc.id, title: enc.title, description: enc.description,
      thumbnail_url: enc.thumbnail_url, date: enc.date,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalMaterials: total, completedMaterials: completed,
    };
  });

  const allMaterialIds = Object.values(emMap).flat();
  const totalAllMats = allMaterialIds.length;
  const completedAllMats = allMaterialIds.filter(mid => completedMats.has(mid)).length;
  const materialPct = totalAllMats > 0 ? Math.round((completedAllMats / totalAllMats) * 100) : 0;

  const stagesData = stagesRes.data || [];
  const stageCount = stagesData.length;
  let foundCurrent = false;

  const stages: StageView[] = stagesData.map((s, i) => {
    const aiData = aiByPillar[s.id];
    const aiAvg = aiData ? Math.round(aiData.scores.reduce((a, b) => a + b, 0) / aiData.scores.length) : 0;
    const latestInsight = aiData ? aiData.insights[aiData.insights.length - 1] : null;

    const stageThreshold = stageCount > 0 ? ((i + 1) / stageCount) * 100 : 0;
    const stagePrevThreshold = stageCount > 0 ? (i / stageCount) * 100 : 0;

    let matProgress: number;
    if (materialPct >= stageThreshold) matProgress = 100;
    else if (materialPct > stagePrevThreshold) {
      const range = stageThreshold - stagePrevThreshold;
      matProgress = range > 0 ? Math.round(((materialPct - stagePrevThreshold) / range) * 100) : 0;
    } else matProgress = 0;

    const hasAI = aiData && aiData.scores.length > 0;
    const combinedProgress = hasAI ? Math.round(matProgress * 0.4 + aiAvg * 0.6) : matProgress;

    let status: StageView["status"];
    if (combinedProgress >= 100) status = "completed";
    else if (combinedProgress > 0 || (!foundCurrent && i === 0)) { status = "in_progress"; foundCurrent = true; }
    else status = "locked";

    return { id: s.id, title: s.title, description: s.description, sort_order: s.sort_order, status, progress: Math.min(combinedProgress, 100), aiInsight: latestInsight, aiScore: hasAI ? aiAvg : null };
  });

  if (stages.length > 0 && !stages.some(s => s.status === "in_progress" || s.status === "completed")) {
    stages[0].status = "in_progress";
  }

  return { stages, encontros };
}

export function useJourneyData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["client-journey", user?.id],
    queryFn: () => fetchJourney(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
