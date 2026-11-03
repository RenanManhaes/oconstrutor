import { CheckCircle, Lock, Circle, Calendar, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useJourneyData } from "@/hooks/useJourneyData";

const ClientJourney = () => {
  const { data, isLoading } = useJourneyData();
  const stages = data?.stages || [];
  const encontros = data?.encontros || [];

  if (isLoading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Minha Jornada</h1>
        <p className="text-gray-400 text-sm mt-1">Acompanhe cada etapa da sua transformação.</p>
      </div>

      {stages.length > 0 && (
        <div>
          <h2 className="font-heading font-bold text-lg text-white mb-4">Pilares</h2>
          <div className="space-y-0">
            {stages.map((stage, i) => (
              <div key={stage.id} className="flex gap-4 md:gap-6">
                <div className="flex flex-col items-center">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    stage.status === "completed" ? "bg-gold text-navy-dark" :
                    stage.status === "in_progress" ? "bg-gold/20 border-2 border-gold text-gold" :
                    "bg-navy-light border border-gray-700 text-gray-600"
                  }`}>
                    {stage.status === "completed" ? <CheckCircle className="h-5 w-5" /> :
                     stage.status === "locked" ? <Lock className="h-4 w-4" /> :
                     <Circle className="h-4 w-4" />}
                  </div>
                  {i < stages.length - 1 && <div className={`w-px min-h-[60px] flex-1 ${stage.status === "completed" ? "bg-gold/40" : "bg-gray-700/50"}`} />}
                </div>
                <div className={`pb-8 flex-1 ${stage.status === "locked" ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-bold text-lg text-white">{stage.title}</h3>
                    {stage.status === "in_progress" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20 font-heading font-semibold uppercase">Atual</span>}
                  </div>
                  <p className="text-gray-400 text-sm mb-1">{stage.description || ""}</p>
                  {stage.status !== "locked" && (
                    <>
                      <Progress value={stage.progress} className="h-1.5 bg-navy-dark [&>div]:bg-gradient-gold mb-1 max-w-xs" />
                      <span className="text-xs text-gray-500">{stage.progress}% concluído</span>
                      {stage.aiInsight && (
                        <div className="mt-2 flex items-start gap-2 bg-gold/5 border border-gold/10 rounded-lg p-3">
                          <Sparkles className="h-3.5 w-3.5 text-gold shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-300">{stage.aiInsight}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {encontros.length > 0 && (
        <div>
          <h2 className="font-heading font-bold text-lg text-white mb-4">Encontros</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {encontros.map(enc => (
              <Link key={enc.id} to={`/client/encontros/${enc.id}`}>
                <Card className="bg-navy-light/30 border-gold/5 hover:border-gold/20 transition-all cursor-pointer group">
                  <CardContent className="p-0">
                    {enc.thumbnail_url ? (
                      <img src={enc.thumbnail_url} alt="" loading="lazy" decoding="async" className="w-full h-36 object-cover rounded-t-lg" />
                    ) : (
                      <div className="w-full h-36 bg-navy-dark/50 rounded-t-lg flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-gray-700" />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-heading font-bold text-sm text-white group-hover:text-gold transition-colors">{enc.title}</h3>
                      {enc.date && <p className="text-[10px] text-gray-500 mt-0.5">{new Date(enc.date + "T12:00:00").toLocaleDateString("pt-BR")}</p>}
                      <div className="mt-2">
                        <Progress value={enc.progress} className="h-1 bg-navy-dark [&>div]:bg-gradient-gold" />
                        <p className="text-[10px] text-gray-500 mt-1">{enc.completedMaterials}/{enc.totalMaterials} materiais • {enc.progress}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {stages.length === 0 && encontros.length === 0 && <p className="text-gray-500 text-sm">Nenhuma etapa disponível no momento.</p>}
    </div>
  );
};

export default ClientJourney;
