import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EncontroSummary {
  id: string;
  title: string;
  date: string | null;
  attendance: string | null;
  materialsCompleted: number;
  materialsTotal: number;
  checkDone: number;
  checkTotal: number;
}

export interface PillarInsight {
  title: string;
  insight: string;
  score: number;
}

export interface DashboardStats {
  totalEncontros: number;
  attended: number;
  checkDone: number;
  checkTotal: number;
  materialsCompleted: number;
  materialsTotal: number;
}

async function fetchDashboard(userId: string, userEmail?: string) {
  // Batch 1: Static/public data (cacheable longer)
  // Batch 2: User-specific data
  const [
    profileRes, announcementsRes,
    encontrosRes, emRes,
    progressRes, attRes, checkRes,
    aiRes, pillarsRes,
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("user_id", userId).maybeSingle(),
    supabase.from("announcements").select("title, created_at").eq("active", true).order("created_at", { ascending: false }).limit(3),
    supabase.from("encontros").select("id, title, date").eq("status", "active").order("sort_order"),
    supabase.from("encontro_materials").select("encontro_id, material_id"),
    supabase.from("user_progress").select("material_id, completed").eq("user_id", userId).eq("completed", true).not("material_id", "is", null),
    supabase.from("encontro_attendance").select("encontro_id, status").eq("user_id", userId),
    supabase.from("encontro_checklist").select("encontro_id, completed").eq("user_id", userId),
    supabase.from("encontro_ai_insights").select("pillar_id, insight, progress_score").eq("user_id", userId),
    supabase.from("journey_stages").select("id, title").eq("status", "active").order("sort_order"),
  ]);

  const profileName = profileRes.data?.full_name || userEmail?.split("@")[0] || "Construtor";
  const announcements = announcementsRes.data || [];
  const encontros = encontrosRes.data || [];

  // Build lookup maps
  const completedMats = new Set((progressRes.data || []).map(p => p.material_id));

  const attMap: Record<string, string> = {};
  (attRes.data || []).forEach((a: any) => { attMap[a.encontro_id] = a.status; });

  const emMap: Record<string, string[]> = {};
  (emRes.data || []).forEach((e: any) => {
    if (!emMap[e.encontro_id]) emMap[e.encontro_id] = [];
    emMap[e.encontro_id].push(e.material_id);
  });

  const checkByEnc: Record<string, { done: number; total: number }> = {};
  (checkRes.data || []).forEach((c: any) => {
    if (!checkByEnc[c.encontro_id]) checkByEnc[c.encontro_id] = { done: 0, total: 0 };
    checkByEnc[c.encontro_id].total++;
    if (c.completed) checkByEnc[c.encontro_id].done++;
  });

  let attended = 0, checkDone = 0, checkTotal = 0, materialsCompleted = 0, materialsTotal = 0;

  const encontroSummaries: EncontroSummary[] = encontros.map(enc => {
    const matIds = emMap[enc.id] || [];
    const done = matIds.filter(mid => completedMats.has(mid)).length;
    const att = attMap[enc.id] || null;
    if (att === "present") attended++;
    const chk = checkByEnc[enc.id] || { done: 0, total: 0 };
    checkDone += chk.done;
    checkTotal += chk.total;
    materialsCompleted += done;
    materialsTotal += matIds.length;
    return { id: enc.id, title: enc.title, date: enc.date, attendance: att, materialsCompleted: done, materialsTotal: matIds.length, checkDone: chk.done, checkTotal: chk.total };
  });

  const stats: DashboardStats = { totalEncontros: encontros.length, attended, checkDone, checkTotal, materialsCompleted, materialsTotal };

  // AI insights
  const pillarsMap = new Map((pillarsRes.data || []).map((p: any) => [p.id, p.title]));
  const pillarLatest: Record<string, { insight: string; score: number }> = {};
  (aiRes.data || []).forEach((ai: any) => {
    if (ai.pillar_id) pillarLatest[ai.pillar_id] = { insight: ai.insight, score: ai.progress_score };
  });
  const pillarInsights: PillarInsight[] = [];
  pillarsMap.forEach((title, id) => {
    if (pillarLatest[id]) pillarInsights.push({ title, insight: pillarLatest[id].insight, score: pillarLatest[id].score });
  });

  return { profileName, announcements, stats, encontroSummaries, pillarInsights };
}

export function useDashboardData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client-dashboard", user?.id],
    queryFn: () => fetchDashboard(user!.id, user!.email ?? undefined),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 min cache — navigating back is instant
    gcTime: 5 * 60 * 1000,
  });
}
