import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const navigate=useNavigate();
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [show,setShow]=useState(false);
  const [status,setStatus]=useState<"checking"|"valid"|"invalid">("checking");
  const [submitting,setSubmitting]=useState(false);
  useEffect(()=>{
    let active=true;
    const hash=new URLSearchParams(window.location.hash.substring(1));
    if(hash.get("type")==="recovery"){setStatus("valid");return;}
    supabase.auth.getSession().then(({data:{session}})=>{
      if(active)setStatus(session?"valid":"invalid");
    }).catch(()=>{if(active)setStatus("invalid");});
    return()=>{active=false;};
  },[]);
  async function reset(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(password!==confirm){toast.error("As senhas não coincidem.");return;}
    if(password.length<6){toast.error("Use pelo menos 6 caracteres.");return;}
    setSubmitting(true);
    try{
      const {error}=await supabase.auth.updateUser({password});
      if(error)throw error;
      toast.success("Sua senha foi atualizada.");
      navigate("/auth",{replace:true});
    }catch(e){toast.error(e instanceof Error?e.message:"Não foi possível redefinir a senha.");}
    finally{setSubmitting(false);}
  }
  return <div className="flex min-h-screen flex-col bg-[#efede6] text-[#283a2e]">
    <header className="border-b border-[#d5dacd]"><div className="mx-auto flex h-[74px] w-[min(calc(100%-40px),1150px)] items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center bg-[#283d2f] text-[26px] text-[#e6bd9a]" style={{fontFamily:"Instrument Serif,Georgia,serif"}}>C</span><span className="font-heading text-[12px] font-extrabold tracking-[.12em]">O CONSTRUTOR</span></Link>
      <Link to="/auth" className="flex items-center gap-2 text-[12px] font-semibold text-[#71806f] hover:text-[#304b34]"><ArrowLeft size={16}/> Voltar ao login</Link>
    </div></header>
    <main className="mx-auto flex w-full max-w-[510px] flex-1 flex-col justify-center px-5 py-16">
      <div className="rounded-[18px] border border-[#d0d7ca] bg-[#faf9f4] px-7 py-10 shadow-[0_25px_75px_-48px_rgba(24,44,27,.3)] sm:px-10 sm:py-12">
        <div className="mb-7 grid h-12 w-12 place-items-center rounded-xl bg-[#e6ecdf] text-[#476e50]"><LockKeyhole size={21}/></div>
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.2em] text-[#a17c5d]">Segurança da conta</p>
        {status==="checking"?<div role="status"><h1 className="text-[29px] font-bold tracking-[-.06em]">Validando seu acesso...</h1><p className="mt-3 text-[13px] text-[#718072]">Verificando o link de recuperação.</p></div>:
        status==="invalid"?<>
          <h1 className="text-[30px] font-bold tracking-[-.06em]">Este link não está mais disponível.</h1>
          <p className="mt-4 text-[13px] leading-[1.85] text-[#6f7d70]">Para sua segurança, solicite um novo link de redefinição de senha.</p>
          <Link to="/auth" className="mt-7 inline-flex h-[49px] items-center gap-3 rounded-lg bg-[#2b4432] px-5 text-[12px] font-bold text-white">Voltar ao acesso <ArrowRight size={16}/></Link>
        </>:<>
          <h1 className="text-[32px] font-bold tracking-[-.06em]">Defina uma nova senha.</h1>
          <p className="mt-3 text-[13px] leading-[1.75] text-[#738074]">Escolha uma senha segura e confirme para continuar.</p>
          <form onSubmit={reset} className="mt-8 space-y-5">
            <div><label htmlFor="new-password" className="mb-2 block text-[12px] font-bold text-[#455847]">Nova senha</label><div className="relative"><input id="new-password" type={show?"text":"password"} autoComplete="new-password" required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" className="h-[50px] w-full rounded-lg border border-[#cbd4c7] bg-[#fffefa] px-4 pr-12 text-[13px] text-[#293e2e] outline-none placeholder:text-[#9ba89c] focus:border-[#a77a57] focus:ring-2 focus:ring-[#b88d66]/20"/><button type="button" onClick={()=>setShow(!show)} aria-label={show?"Ocultar senha":"Mostrar senha"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#899a8a]">{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
            <div><label htmlFor="confirm-password" className="mb-2 block text-[12px] font-bold text-[#455847]">Confirme sua nova senha</label><input id="confirm-password" type={show?"text":"password"} autoComplete="new-password" required minLength={6} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repita sua senha" className="h-[50px] w-full rounded-lg border border-[#cbd4c7] bg-[#fffefa] px-4 text-[13px] text-[#293e2e] outline-none placeholder:text-[#9ba89c] focus:border-[#a77a57] focus:ring-2 focus:ring-[#b88d66]/20"/></div>
            <button disabled={submitting} type="submit" className="flex h-[52px] w-full items-center justify-center gap-3 rounded-lg bg-[#2b4432] text-[12px] font-extrabold text-white transition-colors hover:bg-[#3f5c44] disabled:opacity-60">{submitting?"Salvando...":"Salvar nova senha"}<CheckCircle2 size={17}/></button>
          </form>
        </>}
      </div>
      <p className="mt-7 text-center text-[11px] text-[#839082]">O Construtor · Seu desenvolvimento em um só lugar</p>
    </main>
  </div>;
}
