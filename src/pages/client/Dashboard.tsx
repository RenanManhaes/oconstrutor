import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, CheckCircle2, CircleDashed, Clock3, Megaphone, Sparkles, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const percentage = (done: number, total: number) => total > 0 ? Math.round(done / total * 100) : 0;
const formatDate = (date: string | null) => {
  if (!date) return "Data a definir";
  const parsed = new Date(date.slice(0,10) + "T12:00:00");
  return Number.isNaN(parsed.valueOf()) ? "Data a definir" : parsed.toLocaleDateString("pt-BR", { day:"2-digit", month:"short", year:"numeric" });
};

function ProgressRing({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 56;
  return (
    <div className="relative mx-auto w-[190px] shrink-0" role="img" aria-label={value + "% dos materiais concluídos"}>
      <svg viewBox="0 0 144 144" className="w-full -rotate-90" aria-hidden="true">
        <circle cx="72" cy="72" r="56" fill="none" stroke="#33413b" strokeWidth="9"/>
        <circle cx="72" cy="72" r="56" fill="none" stroke="#d9ad88" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1-value/100)} className="transition-[stroke-dashoffset] duration-700"/>
        <circle cx="72" cy="72" r="42" fill="#222e29" stroke="#344039" strokeWidth="1"/>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-[43px] font-bold leading-none tracking-[-.07em] text-[#f6f0e6]">{value}<span className="text-lg text-[#d3a481]">%</span></span>
        <span className="mt-2 text-[10px] font-semibold tracking-wide text-[#a8b3a8]">concluído</span>
      </div>
    </div>
  );
}

function LoadingState() {
  return <div className="max-w-[1400px] space-y-6" aria-label="Carregando sua área">
    <Skeleton className="h-7 w-36 bg-[#26332e]"/><Skeleton className="h-12 w-1/2 bg-[#26332e]"/>
    <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]"><Skeleton className="h-64 bg-[#26332e]"/><Skeleton className="h-64 bg-[#26332e]"/></div>
    <div className="grid gap-5 sm:grid-cols-3">{[0,1,2].map(i=><Skeleton key={i} className="h-36 bg-[#26332e]"/>)}</div>
  </div>;
}

export default function ClientDashboard() {
  const { data, isLoading, isError, refetch } = useDashboardData();
  const reducedMotion = useReducedMotion();
  if (isLoading) return <LoadingState/>;
  if (isError || !data) return (
    <div className="studio-panel p-8">
      <h1 className="studio-title text-xl">Não foi possível carregar sua jornada.</h1>
      <p className="studio-subtitle mt-2">Verifique sua conexão e tente novamente.</p>
      <button type="button" onClick={() => refetch()} className="studio-cta mt-6">Tentar novamente <ArrowRight size={15}/></button>
    </div>
  );

  const { profileName, announcements, stats, encontroSummaries, pillarInsights } = data;
  const name = profileName.trim().split(/\s+/)[0] || "Construtor";
  const materialPct = percentage(stats.materialsCompleted, stats.materialsTotal);
  const presencePct = percentage(stats.attended, stats.totalEncontros);
  const actionPct = percentage(stats.checkDone, stats.checkTotal);
  const nextStep = encontroSummaries.find(item => item.materialsCompleted < item.materialsTotal || item.checkDone < item.checkTotal);
  const metrics = [
    { label: "Presença nos encontros", value: stats.attended + " / " + stats.totalEncontros, pct: presencePct, icon: CalendarDays, note:"dos encontros disponíveis" },
    { label: "Ações realizadas", value: stats.checkDone + " / " + stats.checkTotal, pct: actionPct, icon: CheckCircle2, note:"compromissos concluídos" },
    { label: "Biblioteca concluída", value: stats.materialsCompleted + " / " + stats.materialsTotal, pct: materialPct, icon: BookOpen, note:"materiais estudados" },
  ];
  const appear = reducedMotion ? {} : { initial:{ opacity:0,y:12 }, animate:{ opacity:1,y:0 }, transition:{ duration:.4 } };

  return (
    <div className="space-y-7">
      <motion.div {...appear} className="studio-intro">
        <div>
          <div className="studio-eyebrow mb-3">O seu espaço de evolução</div>
          <h1 className="studio-title text-[30px] leading-tight sm:text-[39px]">Bom ter você aqui, {name}<span className="text-[#ddb18f]">.</span></h1>
          <p className="studio-subtitle mt-2">Seu progresso é construído um encontro e uma ação de cada vez.</p>
        </div>
        <Link to="/client/journey" className="studio-muted-button">Explorar minha jornada <ArrowUpRight size={15}/></Link>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(315px,1fr)]">
        <motion.section {...appear} transition={{ duration:.43,delay:.08 }} className="studio-focus-card">
          <div className="studio-eyebrow">O seu próximo movimento</div>
          <h2 className="mt-5 max-w-[560px] font-heading text-[clamp(27px,3.2vw,41px)] font-bold leading-[1.15] tracking-[-.06em]">
            {nextStep ? nextStep.title : (encontroSummaries.length > 0 ? "Você está em dia com seus encontros." : "Uma nova etapa começa com uma decisão.")}
          </h2>
          <p className="mt-3 max-w-[440px] text-[13px] leading-[1.7] text-[#68776e]">
            {nextStep
              ? "Retome os estudos, registre suas reflexões e avance no seu ritmo."
              : "Assim que seus encontros forem publicados, você encontrará os próximos passos aqui."}
          </p>
          <div className="mt-auto pt-8">
            <Link to={nextStep ? "/client/encontros/" + nextStep.id : "/client/journey"} className="studio-cta">
              {nextStep ? "Continuar encontro" : "Conhecer minha jornada"} <ArrowRight size={16}/>
            </Link>
          </div>
          {nextStep && <div className="absolute bottom-7 right-8 hidden text-right text-[11px] font-semibold text-[#708076] sm:block">
            {nextStep.materialsCompleted}/{nextStep.materialsTotal} materiais
            <div className="mt-1 text-[#a37e60]">{formatDate(nextStep.date)}</div>
          </div>}
        </motion.section>

        <motion.section {...appear} transition={{ duration:.43,delay:.14 }} className="studio-panel flex flex-col">
          <div className="studio-panel__head">
            <div>
              <p className="studio-eyebrow">Em construção</p>
              <h2 className="studio-panel__title mt-2">Seu avanço nos estudos</h2>
            </div>
            <TrendingUp size={18} className="text-[#d2a886]"/>
          </div>
          <div className="studio-panel__body flex flex-1 flex-col items-center justify-center gap-4">
            <ProgressRing value={materialPct}/>
            <div className="w-full text-center text-[12px] leading-6 text-[#a0aba2]">
              {stats.materialsTotal > 0
                ? stats.materialsCompleted + " de " + stats.materialsTotal + " materiais concluídos"
                : "Os materiais aparecerão aqui quando forem publicados."}
            </div>
          </div>
        </motion.section>
      </div>

      <section aria-label="Resumo da sua atividade" className="grid gap-4 sm:grid-cols-3">
        {metrics.map((metric,i) => (
          <motion.div {...appear} transition={{ duration:.4, delay:.18 + i*.07 }} key={metric.label} className="studio-stat">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-semibold text-[#a8b2a7]">{metric.label}</span>
              <metric.icon size={17} strokeWidth={1.8} className="text-[#d9aa82]"/>
            </div>
            <div className="studio-stat__value">{metric.value}</div>
            <div className="mt-4 studio-progress"><span className="studio-progress__bar" style={{ width:metric.pct + "%" }}/></div>
            <p className="mt-2 text-[11px] text-[#87958b]">{metric.note}</p>
          </motion.div>
        ))}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,1fr)]">
        <section className="studio-panel" aria-labelledby="recent-heading">
          <div className="studio-panel__head">
            <div><h2 id="recent-heading" className="studio-panel__title">Sua linha de encontros</h2><p className="studio-panel__sub mt-1">Retome de onde parou</p></div>
            <Link to="/client/encontros" className="studio-link">Ver todos <ArrowUpRight size={15}/></Link>
          </div>
          <div className="studio-panel__body !pt-1 !pb-2">
            {encontroSummaries.length === 0 ? <div className="studio-empty"><CircleDashed size={24}/><p>Você ainda não tem encontros disponíveis.</p><Link className="studio-link" to="/client/journey">Conhecer a jornada <ArrowRight size={14}/></Link></div> :
              encontroSummaries.slice(0,5).map((enc,i)=>{
                const pct=percentage(enc.materialsCompleted,enc.materialsTotal);
                return <Link to={"/client/encontros/"+enc.id} key={enc.id} className="studio-list-row group">
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#475147] bg-[#26332d] text-[12px] font-bold text-[#d2b098]">{String(i+1).padStart(2,"0")}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-[#efece4] group-hover:text-[#f0c6a2] transition-colors">{enc.title}</span>
                      <span className="mt-1 flex items-center gap-2 text-[11px] text-[#91a097]"><Clock3 size={12}/>{formatDate(enc.date)}<span aria-hidden="true">·</span>{enc.materialsCompleted}/{enc.materialsTotal} materiais</span>
                    </span>
                  </span>
                  <span className="hidden w-[76px] shrink-0 items-center gap-2 text-right text-[11px] font-bold text-[#b9c2b6] sm:flex"><span className="studio-progress flex-1"><span className="studio-progress__bar" style={{width:pct+"%"}}/></span>{pct}%</span>
                  <ArrowUpRight size={16} className="shrink-0 text-[#a5ad9c] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/>
                </Link>;
              })
            }
          </div>
        </section>
        <div className="space-y-5">
          <section className="studio-panel" aria-labelledby="announcements-heading">
            <div className="studio-panel__head"><h2 id="announcements-heading" className="studio-panel__title">Comunicados</h2><Megaphone size={17} className="text-[#c7a184]"/></div>
            <div className="studio-panel__body !pt-2">
              {announcements.length === 0 ? <p className="py-5 text-[12px] text-[#9ca69d]">Nenhum comunicado por enquanto.</p> :
              announcements.slice(0,3).map((item,i)=> <div key={i} className="studio-list-row items-start">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#dfad85]"/>
                <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-[#e7e6dc]">{item.title}</p><p className="mt-1 text-[11px] text-[#94a096]">{formatDistanceToNow(new Date(item.created_at),{addSuffix:true,locale:ptBR})}</p></div>
              </div>)}
              <Link to="/client/announcements" className="studio-link mt-5">Todos os comunicados <ArrowRight size={14}/></Link>
            </div>
          </section>
          <section className="studio-panel" aria-labelledby="insights-heading">
            <div className="studio-panel__head"><h2 id="insights-heading" className="studio-panel__title">Reflexões da jornada</h2><Sparkles size={17} className="text-[#c7a184]"/></div>
            <div className="studio-panel__body space-y-4">
              {pillarInsights.length === 0 ? <div className="studio-empty !min-h-[80px] !p-0">As análises aparecerão à medida que você registrar suas reflexões.</div> :
                pillarInsights.slice(0,3).map((item,i)=><div key={i}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-[12px]"><span className="font-bold text-[#e9e7df]">{item.title}</span><span className="font-bold text-[#d6a785]">{item.score}%</span></div>
                  <div className="studio-progress mb-2"><span className="studio-progress__bar" style={{width:item.score+"%"}}/></div>
                  <p className="line-clamp-3 text-[11px] leading-[1.7] text-[#aab3a9]">{item.insight}</p>
                </div>)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
