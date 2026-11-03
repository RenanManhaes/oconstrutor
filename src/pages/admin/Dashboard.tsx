import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  UsersRound, CalendarDays, BookOpen, ClipboardCheck, ArrowRight, ArrowUpRight,
  Activity, UserRoundPlus, CalendarPlus, Library, ChartNoAxesCombined,
  CircleAlert, Clock3, CheckCircle2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface Metrics {
  totalUsers: number;
  totalEncontros: number;
  activeEncontros: number;
  totalMaterials: number;
  attendanceRate: number;
  checklistRate: number;
  presenceRecords: number;
  completedActions: number;
  actionsTotal: number;
  recentEncontros: { id: string; title: string; date: string | null; attendees: number }[];
  lowEngagement: { id: string; name: string; lastAccess: string; attendance: number }[];
}
const formatDate = (date: string | null) => date
  ? new Date(date.slice(0,10) + "T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"})
  : "A definir";

export default function AdminDashboard() {
  const [metrics,setMetrics] = useState<Metrics | null>(null);
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError(false);
      try {
        const [profilesRes,encontrosRes,materialsRes,attendanceRes,checklistRes] = await Promise.all([
          supabase.from("profiles").select("user_id, full_name, last_sign_in_at, status"),
          supabase.from("encontros").select("id, title, date, status"),
          supabase.from("materials").select("id"),
          supabase.from("encontro_attendance").select("user_id, encontro_id, status"),
          supabase.from("encontro_checklist").select("user_id, completed"),
        ]);
        if ([profilesRes,encontrosRes,materialsRes,attendanceRes,checklistRes].some(r=>r.error)) throw new Error("Não foi possível carregar os dados.");
        const profiles=profilesRes.data || [];
        const encontros=encontrosRes.data || [];
        const attendance=attendanceRes.data || [];
        const checklist=checklistRes.data || [];
        const present=attendance.filter(a=>a.status==="present");
        const completed=checklist.filter(a=>a.completed).length;
        const counts=new Map<string,number>();
        present.forEach(a=>counts.set(a.encontro_id,(counts.get(a.encontro_id)||0)+1));
        const userCounts=new Map<string,number>();
        present.forEach(a=>userCounts.set(a.user_id,(userCounts.get(a.user_id)||0)+1));
        const data: Metrics={
          totalUsers:profiles.length,
          totalEncontros:encontros.length,
          activeEncontros:encontros.filter(e=>e.status==="active").length,
          totalMaterials:(materialsRes.data||[]).length,
          attendanceRate:attendance.length ? Math.round(present.length / attendance.length * 100) : 0,
          checklistRate:checklist.length ? Math.round(completed / checklist.length * 100) : 0,
          presenceRecords:present.length,
          completedActions:completed,
          actionsTotal:checklist.length,
          recentEncontros:[...encontros].filter(e=>e.date).sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5).map(e=>({
            id:e.id,title:e.title,date:e.date,attendees:counts.get(e.id)||0,
          })),
          lowEngagement:profiles.filter(p=>p.status==="active")
            .map(p=>({ id:p.user_id,name:p.full_name||"Sem nome",lastAccess:p.last_sign_in_at?new Date(p.last_sign_in_at).toLocaleDateString("pt-BR"):"Nunca",attendance:userCounts.get(p.user_id)||0 }))
            .sort((a,b)=>a.attendance-b.attendance).slice(0,5),
        };
        if(active)setMetrics(data);
      }catch{if(active)setError(true);}
      finally{if(active)setLoading(false);}
    }
    load();
    return ()=>{active=false;};
  },[]);

  if(loading)return <div className="space-y-6" aria-label="Carregando indicadores">
    <Skeleton className="h-6 w-40 bg-[#28352f]"/><Skeleton className="h-11 w-72 bg-[#28352f]"/>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0,1,2,3].map(i=><Skeleton key={i} className="h-40 bg-[#28352f]"/>)}</div>
    <div className="grid gap-5 xl:grid-cols-2"><Skeleton className="h-72 bg-[#28352f]"/><Skeleton className="h-72 bg-[#28352f]"/></div>
  </div>;
  if(error || !metrics)return <div className="studio-panel p-8"><CircleAlert className="text-[#d5a887]"/><h1 className="studio-title mt-3 text-xl">Não foi possível carregar os indicadores</h1><p className="studio-subtitle mt-2">Verifique a conexão e as permissões do banco antes de continuar.</p></div>;

  const cards=[
    { label:"Mentorados cadastrados",value:String(metrics.totalUsers),note:"Pessoas no sistema",icon:UsersRound,href:"/admin/users" },
    { label:"Encontros ativos",value:String(metrics.activeEncontros),note:metrics.totalEncontros+" encontros no total",icon:CalendarDays,href:"/admin/encontros" },
    { label:"Materiais na biblioteca",value:String(metrics.totalMaterials),note:"Conteúdos cadastrados",icon:BookOpen,href:"/admin/materials" },
    { label:"Presença registrada",value:metrics.attendanceRate+"%",note:metrics.presenceRecords+" registros de presença",icon:ClipboardCheck,href:"/admin/progress" },
  ];
  const shortcuts=[
    {label:"Gerenciar encontros",sub:"Agenda, conteúdo e presença",href:"/admin/encontros",icon:CalendarPlus},
    {label:"Ver mentorados",sub:"Acesso e acompanhamento",href:"/admin/users",icon:UserRoundPlus},
    {label:"Organizar biblioteca",sub:"Materiais de apoio",href:"/admin/materials",icon:Library},
  ];
  const appear=reduceMotion?{}:{initial:{opacity:0,y:12},animate:{opacity:1,y:0},transition:{duration:.45}};
  return <div className="space-y-7">
    <motion.div {...appear} className="studio-intro">
      <div><div className="studio-eyebrow mb-3">Painel administrativo</div><h1 className="studio-title text-[30px] leading-tight sm:text-[40px]">Visão geral<span className="text-[#d5a784]">.</span></h1><p className="studio-subtitle mt-2">Acompanhe a comunidade, identifique prioridades e conduza os próximos passos.</p></div>
      <Link to="/admin/encontros" className="studio-cta">Gerenciar encontros <ArrowUpRight size={16}/></Link>
    </motion.div>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores da plataforma">
      {cards.map((card,i)=><motion.div {...appear} transition={{duration:.42,delay:.06+i*.06}} key={card.label}>
        <Link to={card.href} className="studio-stat group block h-full" aria-label={card.label+": "+card.value}>
          <div className="flex items-center justify-between gap-2"><span className="studio-stat__label">{card.label}</span><card.icon size={17} className="text-[#d5a784]"/></div>
          <div className="studio-stat__value">{card.value}</div>
          <div className="mt-3 flex items-center justify-between gap-3"><span className="text-[11px] text-[#87958b]">{card.note}</span><ArrowUpRight size={14} className="text-[#8e9d8d] group-hover:text-[#e1b58e] transition-colors"/></div>
        </Link>
      </motion.div>)}
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.8fr)]">
      <section className="studio-panel">
        <div className="studio-panel__head"><div><h2 className="studio-panel__title">Atividade dos encontros</h2><p className="studio-panel__sub mt-1">Os registros mais recentes da sua agenda</p></div><Link to="/admin/encontros" className="studio-link">Ver agenda <ArrowRight size={14}/></Link></div>
        <div className="studio-panel__body !pt-1 !pb-2">
          {metrics.recentEncontros.length===0 ? <div className="studio-empty"><CalendarDays size={24}/><p>Os encontros cadastrados aparecerão aqui.</p><Link to="/admin/encontros" className="studio-link">Organizar encontros <ArrowRight size={14}/></Link></div>:
          metrics.recentEncontros.map((e,i)=><Link to="/admin/encontros" key={e.id} className="studio-list-row group">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#445349] bg-[#26332d] text-[12px] font-bold text-[#d8b292]">{String(i+1).padStart(2,"0")}</div>
              <div className="min-w-0"><p className="truncate text-[13px] font-bold text-[#f0eee7] group-hover:text-[#f3c3a1]">{e.title}</p><p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#96a298]"><Clock3 size={12}/>{formatDate(e.date)}</p></div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-[11px] text-[#b5c0b6]"><UsersRound size={14}/>{e.attendees} presentes<ArrowUpRight size={14} className="ml-2 text-[#d5a784]"/></div>
          </Link>)}
        </div>
      </section>
      <section className="studio-panel">
        <div className="studio-panel__head"><div><h2 className="studio-panel__title">Engajamento</h2><p className="studio-panel__sub mt-1">Indicadores com base nos registros</p></div><Activity size={18} className="text-[#d7ab88]"/></div>
        <div className="studio-panel__body space-y-8 pt-7">
          <div><div className="mb-3 flex justify-between gap-3"><span className="text-[12px] font-semibold text-[#d9dfd5]">Taxa de presença</span><span className="text-[19px] font-bold text-[#f0eee5]">{metrics.attendanceRate}%</span></div><div className="studio-progress !h-2"><span className="studio-progress__bar" style={{width:metrics.attendanceRate+"%"}}/></div><p className="mt-2 text-[11px] text-[#92a096]">Presenças sobre os registros de frequência</p></div>
          <div><div className="mb-3 flex justify-between gap-3"><span className="text-[12px] font-semibold text-[#d9dfd5]">Ações concluídas</span><span className="text-[19px] font-bold text-[#f0eee5]">{metrics.checklistRate}%</span></div><div className="studio-progress !h-2"><span className="studio-progress__bar !bg-[#a7b9a7]" style={{width:metrics.checklistRate+"%"}}/></div><p className="mt-2 text-[11px] text-[#92a096]">{metrics.completedActions} de {metrics.actionsTotal} compromissos registrados</p></div>
          <Link to="/admin/progress" className="studio-muted-button">Analisar evolução <ChartNoAxesCombined size={15}/></Link>
        </div>
      </section>
    </div>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,1fr)]">
      <section className="studio-panel">
        <div className="studio-panel__head"><div><h2 className="studio-panel__title">Atenção aos mentorados</h2><p className="studio-panel__sub mt-1">Participantes com menos presenças registradas</p></div><UsersRound size={17} className="text-[#c9a585]"/></div>
        <div className="studio-panel__body !pt-1 !pb-2">
          {metrics.lowEngagement.length===0 ? <p className="py-8 text-[12px] text-[#96a398]">Nenhum mentorado ativo encontrado.</p>:
          metrics.lowEngagement.map((u,i)=><Link to="/admin/progress" key={u.id} className="studio-list-row group">
            <div className="flex min-w-0 items-center gap-3"><span className="studio-avatar !h-9 !w-9 !text-[11px]">{u.name.slice(0,1).toUpperCase()}</span><div className="min-w-0"><p className="truncate text-[12px] font-bold text-[#e9ebe2]">{u.name}</p><p className="mt-1 text-[11px] text-[#96a398]">Último acesso: {u.lastAccess}</p></div></div>
            <span className={"studio-pill " + (u.attendance===0?"studio-pill--warn":"")}>{u.attendance} presenças</span>
          </Link>)}
        </div>
      </section>
      <section className="studio-panel">
        <div className="studio-panel__head"><h2 className="studio-panel__title">Acesso rápido</h2><CheckCircle2 size={17} className="text-[#d7ab88]"/></div>
        <div className="studio-panel__body !pt-1">
          {shortcuts.map(s=><Link to={s.href} key={s.href} className="studio-list-row group">
            <div className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#283630] text-[#d5a784]"><s.icon size={18}/></span><span className="min-w-0"><span className="block text-[12px] font-bold text-[#e9ebe2]">{s.label}</span><span className="mt-1 block text-[11px] text-[#96a398]">{s.sub}</span></span></div>
            <ArrowUpRight size={16} className="text-[#8e9c91] group-hover:text-[#e1b68e]"/>
          </Link>)}
        </div>
      </section>
    </div>
  </div>;
}
