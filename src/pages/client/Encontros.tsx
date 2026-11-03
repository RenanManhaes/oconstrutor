import { Link } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useEncontrosData } from "@/hooks/useEncontrosData";

const ClientEncontros = () => {
  const { data: encontros = [], isLoading } = useEncontrosData();

  if (isLoading) return <div className="text-muted-foreground p-8">Carregando...</div>;

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Encontros</h1>
        <p className="text-muted-foreground text-sm mt-1">Acesse os encontros e seus materiais.</p>
      </div>

      {encontros.length === 0 && <p className="text-muted-foreground text-sm">Nenhum encontro disponível no momento.</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {encontros.map(enc => {
          const pct = enc.materialCount > 0 ? Math.round((enc.completedCount / enc.materialCount) * 100) : 0;
          const isComplete = pct === 100;
          return (
            <Link
              key={enc.id}
              to={`/client/encontros/${enc.id}`}
              className="group block"
            >
              <div className="rounded-xl overflow-hidden border border-border/30 bg-card/40 backdrop-blur-sm hover:border-accent/30 transition-all duration-300 hover:shadow-lg hover:shadow-accent/5">
                <div className="relative aspect-video w-full bg-gradient-to-br from-secondary to-background overflow-hidden">
                  {enc.thumbnail_url ? (
                    <img
                      src={enc.thumbnail_url}
                      alt={enc.title}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Calendar className="h-12 w-12 text-accent/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {enc.materialCount > 0 && (
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md ${
                      isComplete
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-black/40 text-white/90 border border-white/10"
                    }`}>
                      {isComplete ? "✓ Concluído" : `${pct}%`}
                    </div>
                  )}

                  {enc.date && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white/80 text-xs font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(enc.date + "T12:00:00").toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-heading font-bold text-foreground text-base leading-tight group-hover:text-accent transition-colors duration-200">
                      {enc.title}
                    </h3>
                    {enc.description && (
                      <p className="text-muted-foreground text-xs mt-1.5 line-clamp-2 leading-relaxed">
                        {enc.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Progress value={pct} className="h-1 bg-secondary [&>div]:bg-gradient-gold" />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {enc.completedCount}/{enc.materialCount} {enc.materialCount === 1 ? "material" : "materiais"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-accent font-medium group-hover:gap-2 transition-all duration-200">
                        Acessar
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default ClientEncontros;
