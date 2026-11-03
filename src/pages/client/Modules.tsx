import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Play, Clock, ChevronDown, ChevronRight, Brain, User, Map, Home, TrendingUp, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ModuleView {
  id: string;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  thumbnail_url: string | null;
  progress: number;
  locked: boolean;
}

interface PillarView {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  modules: ModuleView[];
  progress: number;
  totalModules: number;
  completedModules: number;
}

const pillarIcons: Record<number, typeof Brain> = {
  0: Brain, 1: User, 2: Map, 3: Home, 4: TrendingUp, 5: Users,
};

const ClientModules = () => {
  const { user } = useAuth();
  const [pillars, setPillars] = useState<PillarView[]>([]);
  const [expandedPillars, setExpandedPillars] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [stagesRes, modulesRes, materialsRes, tasksRes, progressRes] = await Promise.all([
        supabase.from("journey_stages").select("*").eq("status", "active").order("sort_order"),
        supabase.from("modules").select("*").eq("status", "active").order("sort_order"),
        supabase.from("materials").select("id, module_id").eq("status", "active"),
        supabase.from("tasks").select("id, module_id"),
        supabase.from("user_progress").select("module_id, material_id, task_id, completed").eq("user_id", user.id),
      ]);

      const stages = stagesRes.data || [];
      const mods = modulesRes.data || [];
      const materials = materialsRes.data || [];
      const tasks = tasksRes.data || [];
      const progress = progressRes.data || [];

      const completedIds = new Set(progress.filter(p => p.completed).map(p => p.module_id || p.material_id || p.task_id));
      const completedModuleIds = new Set(progress.filter(p => p.completed && p.module_id).map(p => p.module_id));

      let prevPillarCompleted = true;

      const pillarViews: PillarView[] = stages.map((stage) => {
        const stageMods = mods.filter(m => m.stage_id === stage.id);

        let prevModCompleted = prevPillarCompleted;
        const moduleViews: ModuleView[] = stageMods.map(m => {
          const modMaterials = materials.filter(mt => mt.module_id === m.id);
          const modTasks = tasks.filter(t => t.module_id === m.id);
          const totalItems = modMaterials.length + modTasks.length;
          const completedItems = modMaterials.filter(mt => completedIds.has(mt.id)).length + modTasks.filter(t => completedIds.has(t.id)).length;
          const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : (completedModuleIds.has(m.id) ? 100 : 0);

          const locked = !prevModCompleted;
          if (pct === 100 || completedModuleIds.has(m.id)) {
            // keep prevModCompleted true
          } else {
            prevModCompleted = false;
          }

          return {
            id: m.id, title: m.title, description: m.description,
            duration_minutes: m.duration_minutes, thumbnail_url: m.thumbnail_url,
            progress: pct, locked,
          };
        });

        const totalMods = moduleViews.length;
        const completedMods = moduleViews.filter(m => m.progress === 100).length;
        const pillarPct = totalMods > 0 ? Math.round((completedMods / totalMods) * 100) : 0;

        if (pillarPct < 100) prevPillarCompleted = false;

        return {
          id: stage.id, title: stage.title, description: stage.description,
          sort_order: stage.sort_order, modules: moduleViews,
          progress: pillarPct, totalModules: totalMods, completedModules: completedMods,
        };
      });

      // Also include modules without a stage
      const orphanMods = mods.filter(m => !m.stage_id);
      if (orphanMods.length > 0) {
        let prevModCompleted = true;
        const orphanViews: ModuleView[] = orphanMods.map(m => {
          const modMaterials = materials.filter(mt => mt.module_id === m.id);
          const modTasks = tasks.filter(t => t.module_id === m.id);
          const totalItems = modMaterials.length + modTasks.length;
          const completedItems = modMaterials.filter(mt => completedIds.has(mt.id)).length + modTasks.filter(t => completedIds.has(t.id)).length;
          const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : (completedModuleIds.has(m.id) ? 100 : 0);
          const locked = !prevModCompleted;
          if (pct < 100) prevModCompleted = false;
          return { id: m.id, title: m.title, description: m.description, duration_minutes: m.duration_minutes, thumbnail_url: m.thumbnail_url, progress: pct, locked };
        });
        const completedOrphans = orphanViews.filter(m => m.progress === 100).length;
        pillarViews.push({
          id: "outros", title: "Outros Módulos", description: null,
          sort_order: 999, modules: orphanViews,
          progress: orphanViews.length > 0 ? Math.round((completedOrphans / orphanViews.length) * 100) : 0,
          totalModules: orphanViews.length, completedModules: completedOrphans,
        });
      }

      setPillars(pillarViews);
      // Auto-expand the first pillar that has in-progress modules
      const firstActive = pillarViews.find(p => p.progress < 100 && p.modules.length > 0);
      if (firstActive) setExpandedPillars(new Set([firstActive.id]));
      setLoading(false);
    };
    fetch();
  }, [user]);

  const togglePillar = (id: string) => {
    setExpandedPillars(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Pilares & Módulos</h1>
        <p className="text-gray-400 text-sm mt-1">Explore os 6 pilares e seus módulos de transformação.</p>
      </div>

      {pillars.length === 0 && <p className="text-gray-500 text-sm">Nenhum pilar disponível no momento.</p>}

      <div className="space-y-4">
        {pillars.map((pillar, pIndex) => {
          const Icon = pillarIcons[pIndex] || Brain;
          const isExpanded = expandedPillars.has(pillar.id);

          return (
            <div key={pillar.id} className="rounded-xl border border-gold/10 bg-navy-light/30 overflow-hidden">
              {/* Pillar Header */}
              <button
                onClick={() => togglePillar(pillar.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gold/5 transition-colors"
              >
                <div className="h-11 w-11 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gold/60 font-heading font-bold">PILAR {pIndex + 1}</span>
                  </div>
                  <h2 className="font-heading font-bold text-white text-base truncate">{pillar.title}</h2>
                  {pillar.description && <p className="text-gray-500 text-xs mt-0.5 truncate">{pillar.description}</p>}
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-500">{pillar.completedModules}/{pillar.totalModules} módulos</p>
                    <Progress value={pillar.progress} className="h-1 w-20 bg-navy-dark [&>div]:bg-gradient-gold mt-1" />
                  </div>
                  <span className="text-xs font-heading font-bold text-gold">{pillar.progress}%</span>
                  {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                </div>
              </button>

              {/* Modules Grid */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1">
                  {pillar.modules.length === 0 && <p className="text-gray-600 text-xs">Nenhum módulo neste pilar ainda.</p>}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pillar.modules.map(mod => (
                      <Card key={mod.id} className={`bg-navy-dark/50 border-gold/5 overflow-hidden ${mod.locked ? "opacity-50" : "hover:border-gold/20"} transition-all`}>
                        <div className="h-24 bg-gradient-to-br from-navy to-navy-dark flex items-center justify-center overflow-hidden">
                          {mod.thumbnail_url ? (
                            <img src={mod.thumbnail_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                          ) : mod.locked ? (
                            <Lock className="h-6 w-6 text-gray-600" />
                          ) : (
                            <Play className="h-6 w-6 text-gold" />
                          )}
                        </div>
                        <CardContent className="p-3">
                          <h3 className="font-heading font-bold text-white text-sm mb-1 truncate">{mod.title}</h3>
                          <p className="text-gray-500 text-xs mb-2 line-clamp-1">{mod.description || ""}</p>
                          {mod.duration_minutes && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                              <Clock className="h-3 w-3" /> {mod.duration_minutes} min
                            </div>
                          )}
                          {!mod.locked && (
                            <>
                              <Progress value={mod.progress} className="h-1 bg-navy-dark [&>div]:bg-gradient-gold mb-1.5" />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-600">{mod.progress}%</span>
                                <Link to={`/client/modules/${mod.id}`}>
                                  <Button size="sm" variant="ghost" className="text-gold text-xs hover:bg-gold/10 h-6 px-2">
                                    {mod.progress === 100 ? "Revisar" : "Acessar"}
                                  </Button>
                                </Link>
                              </div>
                            </>
                          )}
                          {mod.locked && <p className="text-[10px] text-gray-600">🔒 Complete o anterior</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ClientModules;
