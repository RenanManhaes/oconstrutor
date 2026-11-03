import { useState, lazy, Suspense } from "react";
import { BookOpen, FileText, Headphones, Play, Search, ImageIcon, ArrowUpRight, Grid2X2, List, Clock3, Layers3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import type { PlaylistItem } from "@/components/MediaPlayerDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useMaterialsData, type MaterialView } from "@/hooks/useMaterialsData";
import { usePagination } from "@/hooks/usePagination";

const MediaPlayerDialog=lazy(()=>import("@/components/MediaPlayerDialog"));
const MaterialPreviewDialog=lazy(()=>import("@/components/MaterialPreviewDialog"));
type MediaType="all"|"video"|"audio"|"pdf"|"image";
const filterOptions:{id:MediaType;label:string}[]=[
  {id:"all",label:"Todos"},{id:"video",label:"Vídeos"},{id:"audio",label:"Áudios"},{id:"pdf",label:"PDFs"},{id:"image",label:"Imagens"},
];
const icons:Record<string,typeof Play>={video:Play,audio:Headphones,pdf:FileText,image:ImageIcon};
const mediaLabels:Record<string,string>={video:"Vídeo",audio:"Áudio",pdf:"PDF",image:"Imagem"};

export default function ClientMaterials() {
  const {user}=useAuth();
  const {data:materials=[],isLoading,isError,refetch}=useMaterialsData();
  const [filter,setFilter]=useState<MediaType>("all");
  const [search,setSearch]=useState("");
  const [view,setView]=useState<"grid"|"list">("grid");
  const [playerOpen,setPlayerOpen]=useState(false);
  const [playlist,setPlaylist]=useState<PlaylistItem[]>([]);
  const [playerStartIndex,setPlayerStartIndex]=useState(0);
  const [previewOpen,setPreviewOpen]=useState(false);
  const [previewMat,setPreviewMat]=useState<{title:string;url:string;type:"pdf"|"image"}|null>(null);

  const filtered=materials.filter(m=>
    (filter==="all"||m.type===filter)&&
    (m.title.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))||
      m.moduleName.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")))
  );
  const {visible,hasMore,loadMore,total,shown}=usePagination(filtered,24,filter+"|"+search);

  function openPlayer(mat:MaterialView) {
    if(!mat.url||(mat.type!=="video"&&mat.type!=="audio"))return;
    const moduleMats=materials.filter(m=>m.module_id===mat.module_id&&(m.type==="video"||m.type==="audio")&&m.url)
      .map(m=>({id:m.id,title:m.title,type:m.type as "video"|"audio",url:m.url!,duration_minutes:m.duration_minutes}));
    if(moduleMats.length===0)return;
    const index=moduleMats.findIndex(m=>m.id===mat.id);
    setPlaylist(moduleMats);setPlayerStartIndex(index>=0?index:0);setPlayerOpen(true);
  }
  function openMaterial(mat:MaterialView) {
    if(!mat.url)return;
    if(mat.type==="video"||mat.type==="audio")openPlayer(mat);
    else if(mat.type==="pdf"||mat.type==="image"){
      setPreviewMat({title:mat.title,url:mat.url,type:mat.type});
      setPreviewOpen(true);
    }
  }
  async function handleItemComplete(id:string) {
    if(!user)return;
    const mat=materials.find(m=>m.id===id);
    if(!mat)return;
    await supabase.from("user_progress").insert({user_id:user.id,material_id:id,module_id:mat.module_id,completed:true});
    await supabase.from("access_logs").insert({user_id:user.id,content_type:mat.type,content_id:id});
  }
  return <div className="space-y-7">
    <div className="studio-intro">
      <div><div className="studio-eyebrow mb-3">Sua biblioteca</div><h1 className="studio-title text-[31px] sm:text-[40px]">Conteúdos que constroem<span className="text-[#dcb08f]">.</span></h1><p className="studio-subtitle mt-2">Explore vídeos, áudios e materiais para acompanhar sua evolução.</p></div>
      {!isLoading&&<span className="studio-pill self-start"><Layers3 size={14} className="mr-2"/>{materials.length} materiais disponíveis</span>}
    </div>
    <div className="studio-panel !overflow-visible p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <label className="relative block w-full max-w-[400px]">
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#94a297]"/>
          <span className="sr-only">Buscar material</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Busque por assunto ou material..."
            className="h-[44px] w-full rounded-lg border border-[#425046] bg-[#18221e] pl-10 pr-4 text-[12px] text-[#f0eee4] outline-none placeholder:text-[#85968b] focus:border-[#d1aa88]"/>
        </label>
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap gap-2" role="group" aria-label="Filtrar materiais">
            {filterOptions.map(f=><button type="button" key={f.id} onClick={()=>setFilter(f.id)} aria-pressed={filter===f.id}
              className={"rounded-lg border px-3 py-[9px] text-[11px] font-bold transition-colors "+(filter===f.id?"border-[#b38c69] bg-[#423a31] text-[#f0cbac]":"border-[#3a4a3e] text-[#aebbae] hover:bg-[#2e3930]")}>{f.label}</button>)}
          </div>
          <div className="hidden shrink-0 items-center gap-1 rounded-lg border border-[#414e44] p-1 sm:flex" role="group" aria-label="Visualização da biblioteca">
            <button type="button" aria-label="Visualizar em grade" aria-pressed={view==="grid"} onClick={()=>setView("grid")} className={"rounded p-1.5 "+(view==="grid"?"bg-[#384940] text-[#e8c3a3]":"text-[#93a093]")}><Grid2X2 size={16}/></button>
            <button type="button" aria-label="Visualizar em lista" aria-pressed={view==="list"} onClick={()=>setView("list")} className={"rounded p-1.5 "+(view==="list"?"bg-[#384940] text-[#e8c3a3]":"text-[#93a093]")}><List size={17}/></button>
          </div>
        </div>
      </div>
    </div>

    {isLoading?<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0,1,2,3,4,5].map(i=><Skeleton key={i} className="h-48 bg-[#2c3932]"/>)}</div>:
    isError?<div className="studio-panel p-8"><h2 className="studio-panel__title">Não foi possível carregar a biblioteca.</h2><button type="button" className="studio-cta mt-5" onClick={()=>refetch()}>Tentar novamente</button></div>:
    filtered.length===0?<div className="studio-panel flex flex-col items-center justify-center gap-3 p-14 text-center"><BookOpen size={29} className="text-[#bcaa8f]"/><h2 className="text-[14px] font-bold text-[#f0eee4]">Nenhum material encontrado</h2><p className="studio-subtitle">{materials.length===0?"A biblioteca será preenchida quando houver conteúdos publicados.":"Tente uma pesquisa diferente ou remova os filtros."}</p>{materials.length>0&&<button type="button" onClick={()=>{setSearch("");setFilter("all");}} className="studio-muted-button mt-2">Limpar filtros</button>}</div>:
    <>
      <div className={"grid gap-4 "+(view==="grid"?"sm:grid-cols-2 xl:grid-cols-3":"grid-cols-1")}>
        {visible.map(mat=>{
          const Icon=icons[mat.type]||FileText;
          const canOpen=!!mat.url&&["video","audio","pdf","image"].includes(mat.type);
          return <article key={mat.id} className={"studio-panel group flex min-w-0 transition-[border-color,transform] duration-200 hover:border-[#8a7159] "+(view==="grid"?"min-h-[200px] flex-col p-5":"items-center gap-4 p-4")}>
            <div className={"flex shrink-0 items-center justify-between "+(view==="grid"?"mb-8":"")}>
              <div className="grid h-[47px] w-[47px] place-items-center rounded-xl border border-[#51604d] bg-[#28392f] text-[#e0b894]"><Icon size={21} strokeWidth={1.7}/></div>
              {view==="grid"&&<span className="studio-pill">{mediaLabels[mat.type]||mat.type}</span>}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="line-clamp-2 text-[14px] font-bold leading-[1.5] text-[#f0eee6]">{mat.title}</h2>
              <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#95a599]">{mat.moduleName||"Biblioteca geral"}{mat.duration_minutes!==null&&<> <span aria-hidden="true">·</span><Clock3 size={12}/>{mat.duration_minutes} min</>}</p>
            </div>
            <div className={view==="grid"?"mt-6 flex items-center justify-between border-t border-[#39463c] pt-4":"ml-auto shrink-0"}>
              {view==="grid"&&<span className="text-[11px] text-[#899b8d]">{canOpen?"Disponível para acessar":"Aguardando arquivo"}</span>}
              <button type="button" disabled={!canOpen} onClick={()=>openMaterial(mat)}
                className="studio-link disabled:cursor-not-allowed disabled:opacity-40" aria-label={"Abrir "+mat.title}>
                <span>{view==="grid"?"Abrir material":"Abrir"}</span><ArrowUpRight size={15}/>
              </button>
            </div>
          </article>;
        })}
      </div>
      {hasMore&&<div className="flex flex-col items-center gap-3 pt-5"><p className="text-[11px] text-[#98a99a]">Mostrando {shown} de {total} materiais</p><button type="button" className="studio-muted-button" onClick={loadMore}>Carregar mais <ArrowUpRight size={14}/></button></div>}
    </>}

    <Suspense fallback={null}>
      {playerOpen&&<MediaPlayerDialog open={playerOpen} onOpenChange={setPlayerOpen} playlist={playlist} startIndex={playerStartIndex} onItemComplete={handleItemComplete}/>}
      {previewMat&&previewOpen&&<MaterialPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} title={previewMat.title} url={previewMat.url} type={previewMat.type}/>}
    </Suspense>
  </div>;
}
