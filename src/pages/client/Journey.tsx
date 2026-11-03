import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, CircleDot, Compass, LockKeyhole, Sparkles } from "lucide-react";
import { useJourneyData } from "@/hooks/useJourneyData";
import { Skeleton } from "@/components/ui/skeleton";

export default function ClientJourney() {
  const {data,isLoading,isError,refetch}=useJourneyData();
  const reduceMotion=useReducedMotion();
  if(isLoading)return <div className="space-y-6"><Skeleton className="h-12 w-72 bg-[#2a3730]"/>{[0,1,2,3].map(i=><Skeleton className="h-28 bg-[#2a3730]" key={i}/>)}</div>;
  if(isError)return <div className="studio-panel p-7"><p>Não foi possível carregar sua jornada.</p><button onClick={()=>refetch()} className="studio-cta mt-4">Tentar novamente</button></div>;
  const stages=data?.stages||[];
  const encontros=data?.encontros||[];
  const complete=stages.filter(s=>s.status==="completed").length;
  const average=stages.length?Math.round(stages.reduce((sum,s)=>sum+s.progress,0)/stages.length):0;
  return <div className="space-y-8">
    <div className="studio-intro">
      <div><p className="studio-eyebrow mb-3">Seus pilares</p><h1 className="studio-title text-[31px] sm:text-[40px]">Minha jornada<span className="text-[#dcb08f]">.</span></h1><p className="studio-subtitle mt-2">O seu desenvolvimento, um passo de cada vez.</p></div>
      <Link to="/client/encontros" className="studio-muted-button">Ir para encontros <ArrowUpRight size={15}/></Link>
    </div>

    <div className="grid gap-5 md:grid-cols-[minmax(0,1.45fr)_minmax(300px,1fr)]">
      <section className="studio-focus-card !min-h-[220px]">
        <p className="studio-eyebrow">Sua construção</p>
        <h2 className="mt-4 font-heading text-[38px] font-extrabold leading-tight tracking-[-.07em] sm:text-[47px]">{complete} <span className="text-[20px] font-bold tracking-normal">de {stages.length}</span></h2>
        <p className="mt-2 text-[13px] font-semibold text-[#627467]">pilares concluídos</p>
        <div className="mt-auto w-full pt-6"><div className="h-2 overflow-hidden rounded-full bg-[#cdd3c6]"><span className="block h-full rounded-full bg-[#56735e] transition-[width] duration-700" style={{width:(stages.length?complete/stages.length*100:0)+"%"}}/></div></div>
      </section>
      <div className="studio-panel flex flex-col justify-center p-7"><p className="studio-eyebrow">Evolução das etapas</p><div className="mt-5 text-[54px] font-bold tracking-[-.08em] text-[#f1eee6]">{average}<span className="text-[23px] text-[#d8ab87]">%</span></div><p className="studio-subtitle mt-1">Média do progresso exibido nos pilares.</p><div className="studio-progress mt-5"><span className="studio-progress__bar" style={{width:average+"%"}}/></div></div>
    </div>

    <section className="studio-panel">
      <div className="studio-panel__head"><div><h2 className="studio-panel__title">Mapa da jornada</h2><p className="studio-panel__sub mt-1">Entenda onde você está e o que vem a seguir</p></div><Compass size={18} className="text-[#d1a987]"/></div>
      <div className="studio-panel__body">
        {stages.length===0?<div className="studio-empty"><Compass size={25}/><p>Os pilares estarão disponíveis quando a jornada for publicada.</p></div>:
        <div className="space-y-0">
          {stages.map((stage,i)=>{
            const completed=stage.status==="completed",locked=stage.status==="locked",current=stage.status==="in_progress";
            return <motion.article key={stage.id}
              initial={reduceMotion?false:{opacity:0,y:12}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.35,delay:Math.min(.22,i*.05)}}
              className="flex gap-4 md:gap-6">
              <div className="flex flex-col items-center">
                <span className={"relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-xl border "+
                  (completed?"border-[#5d8a68] bg-[#31513e] text-[#b2dfb8]":current?"border-[#d1a783] bg-[#493b32] text-[#e8c49e]":"border-[#415047] bg-[#26352e] text-[#819588]")}>
                  {completed?<Check size={21}/>:locked?<LockKeyhole size={17}/>:<CircleDot size={18}/>}
                </span>
                {i<stages.length-1&&<div className={"min-h-[48px] w-px flex-1 "+(completed?"bg-[#59725c]":"bg-[#3c4b41]")}/>}
              </div>
              <div className={"min-w-0 flex-1 pb-8 "+(locked?"opacity-65":"")}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[.15em] text-[#b99c83]">Etapa {String(i+1).padStart(2,"0")}</span>
                  {current&&<span className="studio-pill !bg-[#473a30] !text-[#ebc39f]">Em andamento</span>}
                  {completed&&<span className="studio-pill studio-pill--good">Concluído</span>}
                  {locked&&<span className="studio-pill">Aguardando</span>}
                </div>
                <h3 className="mt-2 text-[16px] font-bold leading-[1.4] tracking-[-.035em] text-[#f1eee6]">{stage.title}</h3>
                {stage.description&&<p className="mt-2 max-w-[650px] text-[12px] leading-[1.85] text-[#abb6ab]">{stage.description}</p>}
                {!locked&&<div className="mt-4 max-w-[520px]">
                  <div className="flex items-center justify-between text-[11px] text-[#b6c0b5]"><span>Progresso da etapa</span><span className="font-bold text-[#d7ad89]">{stage.progress}%</span></div>
                  <div className="studio-progress mt-2"><span className="studio-progress__bar" style={{width:stage.progress+"%"}}/></div>
                  {stage.aiInsight&&<div className="mt-4 flex items-start gap-3 rounded-xl border border-[#435147] bg-[#26332c] p-4 text-[12px] leading-[1.75] text-[#c1c9be]"><Sparkles size={16} className="mt-0.5 shrink-0 text-[#d6a783]"/><p>{stage.aiInsight}</p></div>}
                </div>}
              </div>
            </motion.article>;
          })}
        </div>}
      </div>
    </section>
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="studio-eyebrow mb-2">Na prática</p><h2 className="studio-title text-[22px]">Encontros da jornada</h2></div>
        <Link className="studio-link" to="/client/encontros">Ver todos <ArrowRight size={15}/></Link>
      </div>
      {encontros.length===0?<div className="studio-panel p-7 text-[12px] text-[#a7b5aa]">Ainda não há encontros vinculados à jornada.</div>:
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {encontros.slice(0,6).map((enc,i)=><Link to={"/client/encontros/"+enc.id} key={enc.id} className="studio-panel group block transition-[border-color,transform] duration-200 hover:-translate-y-1 hover:border-[#92765e]">
          <div className="relative h-36 overflow-hidden bg-[#2a382e]">
            {enc.thumbnail_url?<img src={enc.thumbnail_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"/>:
            <div className="flex h-full items-center justify-center"><CalendarDays size={31} className="text-[#687e6b]"/></div>}
            <span className="absolute bottom-3 left-3 rounded-md border border-[#536557] bg-[#1e2c25]/90 px-2 py-1 text-[10px] font-bold text-[#d8b698]">ENCONTRO {String(i+1).padStart(2,"0")}</span>
          </div>
          <div className="p-5"><h3 className="text-[13px] font-bold text-[#f1eee6] group-hover:text-[#e2b993]">{enc.title}</h3>
            <div className="mt-4 studio-progress"><span className="studio-progress__bar" style={{width:enc.progress+"%"}}/></div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-[#9faf9f]"><span>{enc.completedMaterials}/{enc.totalMaterials} materiais</span><span>{enc.progress}%</span></div>
          </div>
        </Link>)}
      </div>}
    </section>
  </div>;
}
