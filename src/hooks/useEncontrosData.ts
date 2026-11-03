import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EncontroView {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  date: string | null;
  materialCount: number;
  completedCount: number;
}

async function fetchEncontros(userId: string): Promise<EncontroView[]> {
  const [encRes, emRes, progressRes] = await Promise.all([
    supabase.from("encontros").select("*").eq("status", "active").order("sort_order"),
    supabase.from("encontro_materials").select("encontro_id, material_id"),
    supabase.from("user_progress").select("material_id, completed").eq("user_id", userId).eq("completed", true).not("material_id", "is", null),
  ]);

  const encs = encRes.data || [];
  const emData = emRes.data || [];
  const completedMats = new Set((progressRes.data || []).map(p => p.material_id));

  return encs.map(enc => {
    const matIds = emData.filter(em => em.encontro_id === enc.id).map(em => em.material_id);
    const completedCount = matIds.filter(id => completedMats.has(id)).length;
    return {
      id: enc.id, title: enc.title, description: enc.description,
      thumbnail_url: enc.thumbnail_url, date: enc.date,
      materialCount: matIds.length, completedCount,
    };
  });
}

export function useEncontrosData() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["client-encontros", user?.id],
    queryFn: () => fetchEncontros(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
