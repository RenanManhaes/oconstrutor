import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export default function Auth() {
  const navigate=useNavigate();
  const {user,role,isLoading}=useAuth();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [visible,setVisible]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const [mode,setMode]=useState<"login"|"forgot">("login");
  useEffect(()=>{
    if(!isLoading && user && role)navigate(role==="admin"?"/admin":"/client",{replace:true});
  },[isLoading,user,role,navigate]);

  async function handleLogin(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const {error}=await supabase.auth.signInWithPassword({email:email.trim(),password});
      if(error) toast.error(error.message==="Invalid login credentials"?"E-mail ou senha incorretos.":error.message);
    }catch{toast.error("Não foi possível acessar sua conta. Tente novamente.");}
    finally{setSubmitting(false);}
  }
  async function handleRecovery(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setSubmitting(true);
    try {
      const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/reset-password"});
      if(error)toast.error(error.message);
      else toast.success("Enviamos um link de recuperação, caso o endereço esteja cadastrado.");
    }catch{toast.error("Não foi possível enviar o link. Tente novamente.");}
    finally{setSubmitting(false);}
  }
  return <div className="grid min-h-screen bg-[#f1eee7] text-[#26372c] lg:grid-cols-[minmax(0,1fr)_minmax(480px,.86fr)]">
    <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#1b2b24] p-12 text-[#f0ece2] lg:flex xl:p-16">
      <div className="absolute -right-44 top-[22%] h-[690px] w-[690px] rounded-full border border-[#c7a889]/30" aria-hidden="true"/>
      <div className="absolute -right-20 top-[30%] h-[510px] w-[510px] rounded-full border border-[#c7a889]/25" aria-hidden="true"/>
      <div className="absolute right-8 top-[38%] h-[325px] w-[325px] rounded-full border border-[#c7a889]/20" aria-hidden="true"/>
      <Link to="/" className="relative z-10 flex items-center gap-3 self-start" aria-label="O Construtor, voltar à página inicial">
        <span className="grid h-10 w-10 place-items-center border border-[#d3ae8d] text-[28px] text-[#f0cba8]" style={{fontFamily:"Instrument Serif,Georgia,serif"}}>C</span>
        <span className="font-heading text-[14px] font-extrabold tracking-[.13em]">O CONSTRUTOR</span>
      </Link>
      <div className="relative z-10 max-w-[620px]">
        <p className="mb-9 text-[11px] font-extrabold uppercase tracking-[.22em] text-[#d6ae8b]">Seu espaço. Seu processo. Seu tempo.</p>
        <h1 className="text-[clamp(45px,5.5vw,85px)] font-bold leading-[1.04] tracking-[-.074em]">Sua evolução começa <span className="block font-normal italic leading-none text-[#e0b692]" style={{fontFamily:"Instrument Serif,Georgia,serif"}}>quando você decide.</span></h1>
        <p className="mt-9 max-w-[450px] text-[15px] leading-[1.9] text-[#bdc8bc]">Acesse encontros, conteúdos e reflexões em uma experiência construída para acompanhar o seu desenvolvimento.</p>
      </div>
      <div className="relative z-10 flex items-center justify-between border-t border-[#506253]/60 pt-6 text-[12px] text-[#b4c2b6]"><span>Consciência. Direção. Legado.</span><ShieldCheck size={18} className="text-[#deba96]"/></div>
    </aside>
    <main className="flex min-h-screen flex-col px-6 py-6 sm:px-12 sm:py-10 xl:px-20">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#66746a] hover:text-[#314a37]"><ArrowLeft size={16}/> Voltar ao site</Link>
        <span className="text-[10px] font-bold uppercase tracking-[.17em] text-[#9c7e63]">Acesso exclusivo</span>
      </div>
      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col justify-center py-12">
        <div className="mb-10">
          <div className="mb-5 inline-grid h-12 w-12 place-items-center rounded-xl bg-[#dce3d8] text-[#365143]"><LockKeyhole size={21}/></div>
          <p className="mb-4 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#9b7759]">{mode==="login"?"Bem-vindo de volta":"Recupere seu acesso"}</p>
          <h2 className="text-[38px] font-extrabold tracking-[-.07em] text-[#26372c] sm:text-[44px]">{mode==="login"?"Entre na sua jornada.":"Esqueceu sua senha?"}</h2>
          <p className="mt-3 text-[14px] leading-[1.8] text-[#6f7a6e]">{mode==="login"?"Suas próximas conquistas estão logo adiante.":"Informe seu e-mail para receber as instruções de recuperação."}</p>
        </div>
        <form onSubmit={mode==="login"?handleLogin:handleRecovery} className="space-y-5">
          <div>
            <label htmlFor="oc-email" className="mb-2 block text-[12px] font-bold text-[#3d5142]">E-mail</label>
            <div className="relative"><Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829082]"/>
              <input id="oc-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"
              className="h-[52px] w-full rounded-lg border border-[#cbd2c6] bg-[#faf9f4] pl-12 pr-4 text-[14px] text-[#25392b] outline-none placeholder:text-[#aab4a7] focus:border-[#a77a57] focus:ring-2 focus:ring-[#b88d66]/20" /></div>
          </div>
          {mode==="login"&&<div>
            <div className="mb-2 flex items-center justify-between"><label htmlFor="oc-password" className="text-[12px] font-bold text-[#3d5142]">Senha</label><button type="button" onClick={()=>setMode("forgot")} className="text-[11px] font-bold text-[#936b4d] hover:underline underline-offset-4">Esqueceu a senha?</button></div>
            <div className="relative"><LockKeyhole size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#829082]"/>
              <input id="oc-password" type={visible?"text":"password"} autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Digite sua senha"
              className="h-[52px] w-full rounded-lg border border-[#cbd2c6] bg-[#faf9f4] pl-12 pr-12 text-[14px] text-[#25392b] outline-none placeholder:text-[#aab4a7] focus:border-[#a77a57] focus:ring-2 focus:ring-[#b88d66]/20" />
              <button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?"Ocultar senha":"Mostrar senha"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7d887b] hover:text-[#314835]">{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button>
            </div>
          </div>}
          <button type="submit" disabled={submitting} className="flex h-[54px] w-full items-center justify-center gap-3 rounded-lg bg-[#263b2f] text-[13px] font-extrabold text-[#f8f2e7] transition-colors hover:bg-[#3a5541] disabled:cursor-not-allowed disabled:opacity-60">
            {submitting?"Aguarde...":mode==="login"?"Entrar na minha conta":"Enviar link de recuperação"} <ArrowRight size={17}/>
          </button>
          {mode==="forgot"&&<button type="button" onClick={()=>setMode("login")} className="mt-3 w-full text-center text-[12px] font-bold text-[#936b4d] hover:underline">Voltar ao login</button>}
        </form>
        <div className="mt-10 border-t border-[#c7d0c3] pt-7">
          <p className="text-center text-[12px] text-[#778477]">Ainda não tem acesso? <Link to="/register" className="font-extrabold text-[#805c43] hover:underline">Solicitar cadastro <ArrowRight size={13} className="inline"/></Link></p>
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[430px] items-center justify-between border-t border-[#d6dcd0] pt-5 text-[11px] text-[#8c978b]"><span>O Construtor · Plataforma de mentoria</span><Sparkles size={16} className="text-[#b38d6c]"/></div>
    </main>
  </div>;
}
