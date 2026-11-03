import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const fields="h-[50px] w-full rounded-lg border border-[#cbd2c6] bg-[#fbfaf6] px-4 text-[13px] text-[#273a2d] outline-none placeholder:text-[#a2ada2] focus:border-[#a77a57] focus:ring-2 focus:ring-[#b88d66]/20";
const label="mb-2 block text-[12px] font-bold text-[#3e5141]";
export default function Register() {
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [password,setPassword]=useState("");
  const [visible,setVisible]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [success,setSuccess]=useState(false);
  async function register(e:FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(password.length<6){toast.error("A senha deve ter pelo menos 6 caracteres.");return;}
    setSubmitting(true);
    try {
      const {data,error}=await supabase.functions.invoke("manage-users",{
        body:{action:"self_register",email:email.trim(),password,full_name:name.trim(),phone:phone.trim()},
      });
      if(error)throw new Error(error.message);
      if(data?.error)throw new Error(data.error);
      setSuccess(true);
    }catch(e){toast.error(e instanceof Error?e.message:"Não foi possível enviar seu cadastro.");}
    finally{setSubmitting(false);}
  }
  return <div className="min-h-screen bg-[#f0ede5] text-[#293a2e]">
    <header className="border-b border-[#d2d7cc]"><div className="mx-auto flex h-[74px] w-[min(calc(100%-40px),1200px)] items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center bg-[#273a2e] text-[25px] text-[#dfb795]" style={{fontFamily:"Instrument Serif,Georgia,serif"}}>C</span><span className="font-heading text-[12px] font-extrabold tracking-[.12em]">O CONSTRUTOR</span></Link>
      <Link to="/auth" className="inline-flex items-center gap-2 text-[12px] font-bold text-[#647362] hover:text-[#2a4232]"><ArrowLeft size={15}/> Voltar ao login</Link>
    </div></header>
    <main className="mx-auto grid w-[min(calc(100%-36px),1120px)] gap-12 pb-20 pt-12 lg:grid-cols-[minmax(0,.8fr)_minmax(380px,1fr)] lg:gap-24 lg:pt-20">
      <div className="lg:pt-10"><p className="mb-7 text-[11px] font-extrabold uppercase tracking-[.22em] text-[#ab815e]">Faça parte da jornada</p>
        <h1 className="text-[clamp(37px,4.5vw,62px)] font-bold leading-[1.11] tracking-[-.065em]">O primeiro passo é <span className="block font-normal italic text-[#a98160]" style={{fontFamily:"Instrument Serif,Georgia,serif"}}>decidir começar.</span></h1>
        <p className="mt-7 max-w-[400px] text-[14px] leading-[1.9] text-[#6e7d6d]">Solicite seu acesso à plataforma para acompanhar encontros, materiais, etapas e ações da sua mentoria.</p>
        <div className="mt-12 hidden space-y-4 border-t border-[#cdd5c8] pt-8 lg:block">
          {["Seus conteúdos organizados em um só lugar","Evolução acompanhada ao longo da jornada","Acesso liberado após aprovação"].map(s=><p key={s} className="flex items-center gap-3 text-[12px] font-semibold text-[#5c715f]"><Check size={16} className="text-[#997052]"/>{s}</p>)}
        </div>
      </div>
      <div className="rounded-[18px] border border-[#d2d5c9] bg-[#faf9f4] p-7 shadow-[0_24px_80px_-50px_rgba(22,44,28,.35)] sm:p-10">
        {success?<div className="flex min-h-[400px] flex-col items-start justify-center">
          <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-[#e2eddf] text-[#456f50]"><CheckCircle2 size={30}/></div>
          <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#97765b]">Solicitação enviada</p>
          <h2 className="text-[31px] font-bold tracking-[-.06em] text-[#273b2d]">Cadastro recebido.</h2>
          <p className="mt-4 max-w-[390px] text-[14px] leading-[1.9] text-[#708072]">Sua solicitação foi enviada. Aguarde a aprovação do administrador para acessar sua área de mentoria.</p>
          <Link to="/auth" className="mt-8 inline-flex h-[50px] items-center gap-3 rounded-lg bg-[#2c4433] px-6 text-[12px] font-bold text-white">Voltar ao login <ArrowRight size={16}/></Link>
        </div>:
        <>
          <div className="mb-8"><p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#97765b]">Solicitação de acesso</p><h2 className="mt-3 text-[24px] font-extrabold tracking-[-.045em]">Seus dados</h2><p className="mt-2 text-[12px] text-[#7e897a]">Os campos com * são obrigatórios.</p></div>
          <form onSubmit={register} className="space-y-5">
            <div><label className={label} htmlFor="reg-name">Nome completo *</label><div className="relative"><UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929e90]"/><input id="reg-name" autoComplete="name" required value={name} onChange={e=>setName(e.target.value)} placeholder="Como devemos chamar você?" className={fields+" pl-11"}/></div></div>
            <div><label className={label} htmlFor="reg-email">E-mail *</label><div className="relative"><Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929e90]"/><input id="reg-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" className={fields+" pl-11"}/></div></div>
            <div><label className={label} htmlFor="reg-phone">Telefone</label><div className="relative"><Phone size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929e90]"/><input id="reg-phone" type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(00) 00000-0000" className={fields+" pl-11"}/></div></div>
            <div><label className={label} htmlFor="reg-password">Crie uma senha *</label><div className="relative"><LockKeyhole size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929e90]"/><input id="reg-password" type={visible?"text":"password"} autoComplete="new-password" minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" className={fields+" pl-11 pr-11"}/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?"Ocultar senha":"Mostrar senha"} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#788b79]">{visible?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>
            <div className="rounded-lg bg-[#edf0e7] px-4 py-3 text-[12px] leading-[1.7] text-[#748172]">O envio do cadastro não libera acesso imediato. A equipe realizará a aprovação.</div>
            <button type="submit" disabled={submitting} className="flex h-[52px] w-full items-center justify-center gap-3 rounded-lg bg-[#283f30] text-[12px] font-extrabold text-[#f5f1e9] transition-colors hover:bg-[#3b5b43] disabled:opacity-60">{submitting?"Enviando cadastro...":"Solicitar acesso"}<ArrowRight size={17}/></button>
          </form>
        </>}
      </div>
    </main>
  </div>;
}
