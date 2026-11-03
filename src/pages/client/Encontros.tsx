import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Clock3, Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useEncontrosData } from "@/hooks/useEncontrosData";

type Filter = "all" | "in-progress" | "done";

export default function ClientEncontros() {
  const {data:encontros=[],isLoading,isError,refetch}=useEncontrosData();
  const [filter,setFilter]=useState<Filter>("all");
  const [search,setSearch]=useState("");
  const filtered=useMemo(()=>encontros.filter(e=>{
    const matches=e.title.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"));
    const done=e.materialCount>0 && e.completedCount>=e.materialCount;
    return matches && (filter==="all" || (filter==="done"?done:!done));
  }),[encontros,filter,search]);
  const complete=encontros.filter(e=>e.materialCount>0 && e.completedCount>=e.materialCount).length;
  return <div className="space-y-7">
    <div className="studio-intro">
      <div><p className="studio-eyebrow mb-3">Seu calendário de evolução</p><h1 className="studio-title text-[31px] sm:text-[40px]">Meus encontros<span className="text-[#dcb08f]">.</span></h1><p className="studio-subtitle mt-2">Acesse conteúdos, retome reflexões e acompanhe o que já realizou.</p></div>
      {!isLoading && <span className="studio-pill self-start sm:self-end"><CalendarDays size={13} className="mr-2"/>{encontros.length} encontros</span>}
    </div>

    {!isLoading && encontros.length>0 && <div className="grid gap-4 sm:grid-cols-3">
      {[
        {label:"Disponíveis",value:encontros.length,icon:CalendarDays},
        {label:"Concluídos",value:complete,icon:Check},
        {label:"Para continuar",value:encontros.length-complete,icon:Clock3},
      ].map(item=><div className="studio-stat !min-h-[105px] !p-5" key={item.label}><div className="flex items-center justify-between text-[12px] text-[#9aa99d]"><span>{item.label}</span><item.icon size={16} className="text-[#d6ab88]"/></div><p className="mt-3 text-[29px] font-bold leading-none tracking-[-.05em] text-[#f4eee6]">{item.value}</p></div>)}
    </div>}

    <div className="flex flex-col gap-4 border-b border-[#36433c] pb-5 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar encontros">
        {[{id:"all",label:"Todos"},{id:"in-progress",label:"Para continuar"},{id:"done",label:"Concluídos"}].map(f=><button key={f.id} type="button" onClick={()=>setFilter(f.id as Filter)} aria-pressed={filter===f.id}
          className={"rounded-lg border px-4 py-2.5 text-[12px] font-semibold transition-colors "+(filter===f.id?"border-[#b68b69] bg-[#3b3c32] text-[#f5d1b0]":"border-[#39483f] text-[#b2bcb1] hover:bg-[#25322c]")}>{f.label}</button>)}
      </div>
      <label className="relative block w-full max-w-[340px]"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9eafa0]" size={16}/><span className="sr-only">Buscar encontro</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar encontro pelo nome..." className="h-[42px] w-full rounded-lg border border-[#435045] bg-[#202b25] pl-10 pr-4 text-[12px] text-[#f0eee6] outline-none placeholder:text-[#809081] focus:border-[#d1a582]"/>
      </label>
    </div>

    {isLoading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0,1,2,3,4,5].map(i=><Skeleton key={i} className="h-72 bg-[#29362f]"/>)}</div>:
      isError ? <div className="studio-panel p-8"><p className="studio-title">Não foi possível carregar seus encontros.</p><button type="button" onClick={()=>refetch()} className="studio-cta mt-5">Tentar novamente</button></div>:
      filtered.length===0 ? <div className="studio-panel flex flex-col items-center justify-center px-7 py-16 text-center"><SlidersHorizontal className="mb-4 text-[#b8a18b]" size={25}/><h2 className="text-[15px] font-bold text-[#f0eee6]">{encontros.length===0?"Nenhum encontro disponível ainda.":"Nenhum encontro encontrado."}</h2><p className="studio-subtitle mt-2">{encontros.length===0?"Assim que a agenda for publicada, os encontros aparecerão aqui.":"Altere sua busca ou selecione outro filtro."}</p>{encontros.length>0&&<button type="button" className="studio-muted-button mt-5" onClick={()=>{setSearch("");setFilter("all");}}>Limpar filtros</button>}</div>:
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((enc,i)=>{
          const hasMaterials=enc.materialCount>0;
          const pct=hasMaterials?Math.round(enc.completedCount/enc.materialCount*100):0;
          const done=hasMaterials&&pct===100;
          return <Link to={"/client/encontros/"+enc.id} key={enc.id} className="studio-panel group flex flex-col transition-[transform,border-color] duration-200 hover:-translate-y-[3px] hover:border-[#ab896c]">
            <div className="relative h-[190px] overflow-hidden bg-[#2b3d32]">
              {enc.thumbnail_url?<img src={enc.thumbnail_url} loading="lazy" decoding="async" alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]"/>:
                <div className="absolute inset-0 grid place-items-center"><div className="absolute -right-12 -bottom-20 h-[260px] w-[260px] rounded-full border border-[#66806b]/40"/><div className="absolute -right-3 -bottom-14 h-[205px] w-[205px] rounded-full border border-[#66806b]/40"/><span className="font-heading text-[68px] font-bold tracking-[-.08em] text-[#99ae94]/40">{String(i+1).padStart(2,"0")}</span></div>}
              <span className={"absolute left-4 top-4 rounded-md border px-2.5 py-1.5 text-[10px] font-bold "+(done?"border-[#507c58] bg-[#243f31] text-[#b8e5bc]":"border-[#57634f] bg-[#26372b] text-[#e2c2a1]")}>{done?"Concluído":hasMaterials?"Em desenvolvimento":"Disponível"}</span>
              {enc.date&&<div className="absolute bottom-3 left-4 flex items-center gap-2 rounded-md bg-[#1a2822]/90 px-3 py-1.5 text-[11px] text-[#e1e6d9]"><CalendarDays size={13}/>{new Date(enc.date.slice(0,10)+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})}</div>}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="line-clamp-2 text-[16px] font-bold leading-[1.35] tracking-[-.03em] text-[#eeeae0] group-hover:text-[#edc5a5]">{enc.title}</h2>
              {enc.description&&<p className="mt-2 line-clamp-2 text-[12px] leading-[1.7] text-[#a1ada2]">{enc.description}</p>}
              <div className="mt-auto pt-6">
                <div className="studio-progress"><span className="studio-progress__bar" style={{width:pct+"%"}}/></div>
                <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[11px] text-[#9ba69b]">{enc.completedCount}/{enc.materialCount} materiais · {pct}%</span><span className="studio-link">Abrir <ArrowUpRight size={15}/></span></div>
              </div>
            </div>
          </Link>;
        })}
      </div>}
  </div>;
}
