import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MaterialView {
  id: string;
  title: string;
  type: string;
  moduleName: string;
  module_id: string | null;
  duration_minutes: number | null;
  url: string | null;
}

async function fetchMaterials(): Promise<MaterialView[]> {
  const [matsRes, modsRes] = await Promise.all([
    supabase.from("materials").select("*").eq("status", "active").order("sort_order"),
    supabase.from("modules").select("id, title"),
  ]);
  const moduleMap: Record<string, string> = {};
  (modsRes.data || []).forEach(m => { moduleMap[m.id] = m.title; });

  return (matsRes.data || []).map(m => ({
    id: m.id, title: m.title, type: m.type,
    moduleName: m.module_id ? moduleMap[m.module_id] || "" : "",
    module_id: m.module_id,
    duration_minutes: m.duration_minutes, url: m.url,
  }));
}

export function useMaterialsData() {
  return useQuery({
    queryKey: ["client-materials"],
    queryFn: fetchMaterials,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
