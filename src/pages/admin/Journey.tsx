import { useState, useEffect } from "react";
import { Plus, GripVertical, Edit, ToggleLeft, Trash2, Save, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Journey {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  status: string;
}

interface Stage {
  id: string;
  journey_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  status: string;
}

const AdminJourney = () => {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [stages, setStages] = useState<Record<string, Stage[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);

  // Journey dialog
  const [journeyDialog, setJourneyDialog] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [journeyForm, setJourneyForm] = useState({ title: "", description: "" });

  // Stage dialog
  const [stageDialog, setStageDialog] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [stageForm, setStageForm] = useState({ title: "", description: "", journey_id: "" });

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ type: "journey" | "stage"; id: string; title: string } | null>(null);

  const fetchJourneys = async () => {
    const { data, error } = await supabase.from("journeys").select("*").order("sort_order");
    if (error) { toast.error("Erro ao carregar jornadas"); return; }
    setJourneys(data || []);
  };

  const fetchStages = async (journeyId: string) => {
    const { data, error } = await supabase.from("journey_stages").select("*").eq("journey_id", journeyId).order("sort_order");
    if (error) { toast.error("Erro ao carregar etapas"); return; }
    setStages(prev => ({ ...prev, [journeyId]: data || [] }));
  };

  useEffect(() => { fetchJourneys().then(() => setLoading(false)); }, []);

  const toggleExpand = (id: string) => {
    if (expandedJourney === id) { setExpandedJourney(null); return; }
    setExpandedJourney(id);
    if (!stages[id]) fetchStages(id);
  };

  // Journey CRUD
  const openNewJourney = () => { setEditingJourney(null); setJourneyForm({ title: "", description: "" }); setJourneyDialog(true); };
  const openEditJourney = (j: Journey) => { setEditingJourney(j); setJourneyForm({ title: j.title, description: j.description || "" }); setJourneyDialog(true); };

  const saveJourney = async () => {
    if (!journeyForm.title.trim()) { toast.error("Título obrigatório"); return; }
    if (editingJourney) {
      const { error } = await supabase.from("journeys").update({ title: journeyForm.title, description: journeyForm.description || null }).eq("id", editingJourney.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Jornada atualizada!");
    } else {
      const maxOrder = journeys.length > 0 ? Math.max(...journeys.map(j => j.sort_order)) + 1 : 0;
      const { error } = await supabase.from("journeys").insert({ title: journeyForm.title, description: journeyForm.description || null, sort_order: maxOrder });
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Jornada criada!");
    }
    setJourneyDialog(false);
    fetchJourneys();
  };

  const toggleJourneyStatus = async (j: Journey) => {
    const newStatus = j.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("journeys").update({ status: newStatus }).eq("id", j.id);
    if (error) { toast.error("Erro ao alterar status"); return; }
    toast.success(`Jornada ${newStatus === "active" ? "ativada" : "desativada"}`);
    fetchJourneys();
  };

  // Stage CRUD
  const openNewStage = (journeyId: string) => { setEditingStage(null); setStageForm({ title: "", description: "", journey_id: journeyId }); setStageDialog(true); };
  const openEditStage = (s: Stage) => { setEditingStage(s); setStageForm({ title: s.title, description: s.description || "", journey_id: s.journey_id }); setStageDialog(true); };

  const saveStage = async () => {
    if (!stageForm.title.trim()) { toast.error("Título obrigatório"); return; }
    if (editingStage) {
      const { error } = await supabase.from("journey_stages").update({ title: stageForm.title, description: stageForm.description || null }).eq("id", editingStage.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Etapa atualizada!");
    } else {
      const existing = stages[stageForm.journey_id] || [];
      const maxOrder = existing.length > 0 ? Math.max(...existing.map(s => s.sort_order)) + 1 : 0;
      const { error } = await supabase.from("journey_stages").insert({ title: stageForm.title, description: stageForm.description || null, journey_id: stageForm.journey_id, sort_order: maxOrder });
      if (error) { toast.error("Erro ao criar"); return; }
      toast.success("Etapa criada!");
    }
    setStageDialog(false);
    fetchStages(stageForm.journey_id);
  };

  const toggleStageStatus = async (s: Stage) => {
    const newStatus = s.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("journey_stages").update({ status: newStatus }).eq("id", s.id);
    if (error) { toast.error("Erro ao alterar status"); return; }
    toast.success(`Etapa ${newStatus === "active" ? "ativada" : "desativada"}`);
    fetchStages(s.journey_id);
  };

  // Delete
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const table = deleteTarget.type === "journey" ? "journeys" : "journey_stages";
    const { error } = await supabase.from(table).delete().eq("id", deleteTarget.id);
    if (error) { toast.error("Erro ao excluir"); setDeleteTarget(null); return; }
    toast.success("Excluído com sucesso!");
    if (deleteTarget.type === "journey") fetchJourneys();
    else {
      // find journey_id for refresh
      const stage = Object.values(stages).flat().find(s => s.id === deleteTarget.id);
      if (stage) fetchStages(stage.journey_id);
    }
    setDeleteTarget(null);
  };

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="studio-eyebrow mb-3">Estrutura da mentoria</p>
          <h1 className="studio-title text-[30px] leading-tight sm:text-[38px]">Jornadas e pilares<span className="text-[#d6aa86]">.</span></h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie as jornadas e suas etapas.</p>
        </div>
        <Button size="sm" className="bg-gradient-gold text-navy-dark font-heading font-semibold" onClick={openNewJourney}>
          <Plus className="h-4 w-4 mr-1" /> Nova Jornada
        </Button>
      </div>

      {journeys.length === 0 && <p className="text-gray-500 text-sm">Nenhuma jornada criada ainda.</p>}

      <div className="space-y-3">
        {journeys.map((journey) => (
          <div key={journey.id}>
            <Card className="bg-[#1e2a25] border-[#36473d]">
              <CardContent className="p-4 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-gray-600 shrink-0" />
                <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center text-gold text-sm font-heading font-bold shrink-0">
                  {journey.sort_order + 1}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleExpand(journey.id)}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-medium">{journey.title}</p>
                    <Badge className={journey.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]" : "bg-gray-500/10 text-gray-500 border-gray-500/20 text-[10px]"}>
                      {journey.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">{journey.description || "Sem descrição"} • {(stages[journey.id] || []).length} etapas</p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => toggleExpand(journey.id)}>
                    {expandedJourney === journey.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => openEditJourney(journey)}><Edit className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => toggleJourneyStatus(journey)}><ToggleLeft className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeleteTarget({ type: "journey", id: journey.id, title: journey.title })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>

            {expandedJourney === journey.id && (
              <div className="ml-12 mt-2 space-y-2 border-l-2 border-gold/10 pl-4">
                {(stages[journey.id] || []).map((stage) => (
                  <Card key={stage.id} className="bg-navy-dark/50 border-gold/5">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-gold/5 flex items-center justify-center text-gold text-xs font-heading font-bold shrink-0">
                        {stage.sort_order + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-white">{stage.title}</p>
                          <Badge className={stage.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]" : "bg-gray-500/10 text-gray-500 border-gray-500/20 text-[10px]"}>
                            {stage.status === "active" ? "Ativa" : "Inativa"}
                          </Badge>
                        </div>
                        {stage.description && <p className="text-xs text-gray-500">{stage.description}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => openEditStage(stage)}><Edit className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500 hover:text-gold hover:bg-gold/10" onClick={() => toggleStageStatus(stage)}><ToggleLeft className="h-3 w-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => setDeleteTarget({ type: "stage", id: stage.id, title: stage.title })}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button size="sm" variant="ghost" className="text-gold/60 hover:text-gold text-xs" onClick={() => openNewStage(journey.id)}>
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Etapa
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Journey Dialog */}
      <Dialog open={journeyDialog} onOpenChange={setJourneyDialog}>
        <DialogContent className="bg-navy-light border-gold/10">
          <DialogHeader><DialogTitle className="text-white font-heading">{editingJourney ? "Editar Jornada" : "Nova Jornada"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Título</Label>
              <Input value={journeyForm.title} onChange={e => setJourneyForm(p => ({ ...p, title: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" placeholder="Ex: Jornada do Construtor" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Descrição</Label>
              <Textarea value={journeyForm.description} onChange={e => setJourneyForm(p => ({ ...p, description: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" placeholder="Descrição da jornada..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setJourneyDialog(false)} className="text-gray-400">Cancelar</Button>
            <Button onClick={saveJourney} className="bg-gradient-gold text-navy-dark font-heading font-semibold"><Save className="h-4 w-4 mr-1" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage Dialog */}
      <Dialog open={stageDialog} onOpenChange={setStageDialog}>
        <DialogContent className="bg-navy-light border-gold/10">
          <DialogHeader><DialogTitle className="text-white font-heading">{editingStage ? "Editar Etapa" : "Nova Etapa"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Título</Label>
              <Input value={stageForm.title} onChange={e => setStageForm(p => ({ ...p, title: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" placeholder="Ex: Fundação" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Descrição</Label>
              <Textarea value={stageForm.description} onChange={e => setStageForm(p => ({ ...p, description: e.target.value }))} className="bg-navy-dark/50 border-gold/10 text-white" placeholder="Descrição da etapa..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStageDialog(false)} className="text-gray-400">Cancelar</Button>
            <Button onClick={saveStage} className="bg-gradient-gold text-navy-dark font-heading font-semibold"><Save className="h-4 w-4 mr-1" /> Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-navy-light border-gold/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Excluir {deleteTarget?.type === "journey" ? "jornada" : "etapa"}?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">Tem certeza que deseja excluir "{deleteTarget?.title}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-400 border-gold/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminJourney;
