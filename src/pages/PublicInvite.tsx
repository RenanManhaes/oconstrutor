import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock3, MapPin, ShieldCheck, Ticket, UsersRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InviteData {
  invite_id:string; invite_title:string; invite_description:string|null; invite_cover_url:string|null;
  encontro_title:string; encontro_description:string|null; encontro_date:string|null;
  encontro_start_time:string|null; encontro_end_time:string|null;
  encontro_thumbnail_url:string|null; spots_remaining:number|null;
}
const field="h-[51px] w-full rounded-lg border border-[#cdd6cb] bg-[#fffefa] px-4 text-[13px] text-[#2d4230] outline-none placeholder:text-[#9eac9e] focus:border-[#a57a58] focus:ring-2 focus:ring-[#bc936e]/20";
const label="mb-2 block text-[12px] font-bold text-[#39513e]";
const formatDate=(date:string|null)=>{
  if(!date)return null;
  const parsed=new Date(date.slice(0,10)+"T12:00:00");
  return Number.isNaN(parsed.getTime())?date:parsed.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});
};

export default function PublicInvite() {
  const {slug}=useParams<{slug:string}>();
  const [invite,setInvite]=useState<InviteData|null>(null);
  const [loading,setLoading]=useState(true);
  const [notFound,setNotFound]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [done,setDone]=useState(false);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");

  useEffect(()=>{
    let active=true;
    async function load(){
      if(!slug){if(active){setNotFound(true);setLoading(false);}return;}
      try{
        const {data,error}=await supabase.rpc("get_public_invite_secure",{_slug:slug});
        if(!active)return;
        if(error||!data?.length)setNotFound(true);
        else setInvite(data[0] as InviteData);
      }catch{if(active)setNotFound(true);}
      finally{if(active)setLoading(false);}
    }
    load();
    return()=>{active=false;};
  },[slug]);

  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(!slug||!name.trim()||!email.trim())return;
    setSubmitting(true);
    try {
      const {data,error}=await supabase.rpc("submit_guest_signup_secure",{
        _slug:slug,_full_name:name.trim(),_email:email.trim(),_phone:phone.trim()||null,
      });
      if(error)throw new Error(error.message);
      const result=data as {success:boolean;error?:string};
      if(!result?.success)throw new Error(result?.error||"Não foi possível concluir a inscrição.");
      setDone(true);
    }catch(err){toast.error(err instanceof Error?err.message:"Tente novamente.");}
    finally{setSubmitting(false);}
  }
  return <div className="min-h-screen bg-[#eeece3] text-[#27392d]">
    <header className="border-b border-[#ccd5c9] bg-[#f3f1e9]"><div className="mx-auto flex h-[74px] w-[min(calc(100%-40px),1180px)] items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-3" aria-label="O Construtor, voltar ao início"><span className="grid h-9 w-9 place-items-center bg-[#283d2f] text-[26px] text-[#e1b995]" style={{fontFamily:"Instrument Serif,Georgia,serif"}}>C</span><span className="font-heading text-[12px] font-extrabold tracking-[.12em]">O CONSTRUTOR</span></Link>
      <span className="inline-flex items-center gap-2 text-[11px] font-bold text-[#a07a5a]"><Ticket size={15}/> Convite especial</span>
    </div></header>
    <main className="mx-auto w-[min(calc(100%-36px),1180px)] py-10 md:py-16">
      {loading?<div className="grid min-h-[470px] place-items-center" role="status"><div className="text-center"><div className="mx-auto h-10 w-10 animate-pulse rounded-full border-2 border-[#b6aa97] bg-[#e0d6c5]"/><p className="mt-5 text-[13px] font-semibold text-[#6d7a6d]">Verificando seu convite...</p></div></div>:
      notFound||!invite?<div className="mx-auto my-12 max-w-[570px] rounded-2xl border border-[#d2d8cc] bg-[#faf9f3] p-9 sm:p-12"><div className="mb-5 grid h-14 w-14 place-items-center rounded-xl bg-[#e8ebe1] text-[#7d957e]"><Ticket size={24}/></div><p className="mb-4 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#a17d5c]">Convite indisponível</p><h1 className="text-[31px] font-bold leading-[1.2] tracking-[-.06em]">Esse encontro não está mais recebendo inscrições.</h1><p className="mt-5 text-[13px] leading-[1.9] text-[#68766b]">O convite pode ter expirado, sido encerrado ou atingido o limite de participantes.</p><Link to="/" className="mt-8 inline-flex h-12 items-center gap-3 rounded-lg bg-[#2b4232] px-5 text-[12px] font-bold text-white"><ArrowLeft size={16}/> Voltar ao site</Link></div>:
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,.93fr)] lg:gap-12">
        <section className="flex flex-col">
          <div className="mb-5"><p className="mb-4 text-[11px] font-extrabold uppercase tracking-[.22em] text-[#a07d5e]">Você foi convidado</p><h1 className="text-[clamp(34px,4vw,59px)] font-bold leading-[1.1] tracking-[-.065em]">{invite.invite_title}</h1><p className="mt-5 max-w-[550px] text-[16px] font-bold text-[#886747]">{invite.encontro_title}</p></div>
          <div className="relative mt-4 aspect-[1.35] overflow-hidden bg-[#28392e]"><img src={invite.invite_cover_url||invite.encontro_thumbnail_url||"/vagner-hero.svg"} alt={invite.invite_cover_url||invite.encontro_thumbnail_url?invite.invite_title:"Identidade visual de O Construtor"} className="h-full w-full object-cover"/></div>
          <div className="mt-6 flex flex-wrap gap-x-7 gap-y-4 border-b border-[#c7d1c3] pb-6">
            {invite.encontro_date&&<div className="flex items-center gap-3 text-[13px] font-semibold text-[#405647]"><CalendarDays size={17} className="text-[#a57a58]"/>{formatDate(invite.encontro_date)}</div>}
            {invite.encontro_start_time&&<div className="flex items-center gap-3 text-[13px] font-semibold text-[#405647]"><Clock3 size={17} className="text-[#a57a58]"/>{invite.encontro_start_time.slice(0,5)}{invite.encontro_end_time?" – "+invite.encontro_end_time.slice(0,5):""}</div>}
            {invite.spots_remaining!==null&&<div className="flex items-center gap-3 text-[13px] font-semibold text-[#405647]"><UsersRound size={17} className="text-[#a57a58]"/>{invite.spots_remaining} {invite.spots_remaining===1?"vaga disponível":"vagas disponíveis"}</div>}
          </div>
          {(invite.invite_description||invite.encontro_description)&&<p className="mt-6 max-w-[600px] whitespace-pre-line text-[13px] leading-[1.9] text-[#68786a]">{invite.invite_description||invite.encontro_description}</p>}
        </section>
        <aside className="lg:pt-7">
          <div className="rounded-[17px] border border-[#d2d8c9] bg-[#fbfaf5] p-7 shadow-[0_30px_80px_-60px_rgba(28,45,30,.42)] sm:p-10">
            {done?<div className="flex min-h-[370px] flex-col justify-center">
              <div className="mb-7 grid h-14 w-14 place-items-center rounded-xl bg-[#dfeaDB] text-[#517555]"><CheckCircle2 size={28}/></div>
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#a17d5c]">Inscrição realizada</p>
              <h2 className="text-[30px] font-bold tracking-[-.065em]">Sua inscrição foi recebida.</h2>
              <p className="mt-5 text-[13px] leading-[1.9] text-[#758373]">Recebemos seus dados. A equipe entrará em contato com as informações do encontro.</p>
              <Link to="/" className="mt-9 inline-flex h-12 items-center gap-3 self-start rounded-lg bg-[#2b4232] px-5 text-[12px] font-bold text-white">Conhecer O Construtor <ArrowRight size={16}/></Link>
            </div>:
            <>
              <div className="border-b border-[#d6dbcf] pb-7"><p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.19em] text-[#987452]">Garanta sua participação</p><h2 className="text-[25px] font-bold tracking-[-.05em]">Confirme sua inscrição.</h2><p className="mt-3 text-[13px] leading-[1.8] text-[#7b8a7b]">Preencha seus dados para solicitar a participação neste encontro.</p></div>
              <form onSubmit={submit} className="mt-7 space-y-5">
                <div><label className={label} htmlFor="invite-name">Nome completo *</label><input id="invite-name" autoComplete="name" maxLength={200} required value={name} onChange={e=>setName(e.target.value)} placeholder="Seu nome completo" className={field}/></div>
                <div><label className={label} htmlFor="invite-email">E-mail *</label><input id="invite-email" type="email" autoComplete="email" maxLength={255} required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" className={field}/></div>
                <div><label className={label} htmlFor="invite-phone">Telefone (opcional)</label><input id="invite-phone" type="tel" autoComplete="tel" maxLength={30} value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(00) 00000-0000" className={field}/></div>
                <button type="submit" disabled={submitting} className="mt-2 flex h-[52px] w-full items-center justify-center gap-3 rounded-lg bg-[#2b4232] text-[13px] font-extrabold text-[#f9f4ea] transition-colors hover:bg-[#416249] disabled:opacity-50">{submitting?"Enviando...":"Quero participar"} <ArrowRight size={16}/></button>
              </form>
              <p className="mt-6 flex items-start gap-2 border-t border-[#d9dfd3] pt-5 text-[11px] leading-[1.75] text-[#829082]"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#a78668]"/>Seus dados serão utilizados para organizar sua participação no encontro.</p>
            </>}
          </div>
        </aside>
      </div>}
    </main>
  </div>;
}
