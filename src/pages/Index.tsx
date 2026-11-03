import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, ChevronDown,
  Compass, MoveUpRight, Play, ShieldCheck, Menu, X, MoveRight, CircleDot,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type PublicInvite = {
  slug:string; invite_title:string; encontro_title:string;
  encontro_date:string|null; encontro_start_time:string|null;
  spots_remaining:number|null;
};
const pillars=[
  { index:"01",tag:"Autoconhecimento",title:"Consciência e governo da própria história",description:"Reconheça sua origem, ressignifique experiências e assuma responsabilidade pela própria trajetória." },
  { index:"02",tag:"Identidade",title:"Reconstrução da identidade masculina",description:"Rompa padrões inconscientes e integre força e sensibilidade. Construa quem você decide ser." },
  { index:"03",tag:"Direção",title:"Estrutura de vida e direção",description:"Clareza de metas, disciplina, constância e execução. Consciência sem estrutura não gera transformação." },
  { index:"04",tag:"Relações",title:"Presença familiar e liderança relacional",description:"Seja emocionalmente presente, proteja sem dominar, ame sem se anular. Lidere pelo exemplo." },
  { index:"05",tag:"Legado",title:"Prosperidade com propósito e legado",description:"Alinhe prosperidade à sua essência, viva com visão de longo prazo e construa algo que permanece." },
  { index:"06",tag:"Comunidade",title:"Irmandade, ambiente e evolução contínua",description:"Nenhum homem se reconstrói sozinho. Aliança masculina, ambiente de expansão e evolução permanente." },
];
const testimonials=[
  { name:"Paulo Montandon",role:"Empresário",text:"O Vagner é um profissional que todo mundo precisa conhecer, eu como homem que tenha olhar para dentro, me surpreendi e continuo me surpreendendo do quanto é necessário e que deveria ter conhecido ele antes. Além de recomendar de olho fechado eu indico a todos." },
  { name:"Rogério",role:"Empresário e mentor",text:"A gente sempre acha que consegue resolver muito das questões da nossa vida sozinho ou aprendendo com a internet, mas quando eu realmente quis mexer com emoções e comportamentos que não conseguia, entender o trabalho do Vagner tem me ajudado muito com essas percepções e ações." },
  { name:"Gaius Armando",role:"Empreendedor e palestrante",text:"O Vagner tem trazido uma transformação pessoal e profissional na minha vida e da minha família, me tornou um pai, marido e empresário melhor com os direcionamentos, recomendo sempre os serviços por entender o bom que todos precisamos e grato do meu amigo." },
];

function Reveal({children,className="",delay=0}:{children:ReactNode;className?:string;delay?:number}) {
  const reduce=useReducedMotion();
  return <motion.div className={className}
    initial={reduce?false:{opacity:0,y:21}}
    whileInView={{opacity:1,y:0}}
    viewport={{once:true,amount:.12}}
    transition={{duration:.57,ease:[.2,.75,.3,1],delay:reduce?0:delay}}
  >{children}</motion.div>;
}
function formatInviteDate(date:string|null,time:string|null) {
  if(!date)return "Data a confirmar";
  const parsed=new Date(date.slice(0,10)+"T12:00:00");
  const formatted=Number.isNaN(parsed.getTime())?"Data a confirmar":parsed.toLocaleDateString("pt-BR",{day:"2-digit",month:"long"});
  return time?formatted+" · "+time.slice(0,5):formatted;
}
function useInvitation() {
  return useQuery({
    queryKey:["next-public-invite"],
    queryFn:async()=>{
      const {data,error}=await supabase.rpc("get_next_public_invite");
      if(error)return null;
      return (data?.[0] as PublicInvite | undefined)||null;
    },
    staleTime:5*60*1000,gcTime:10*60*1000,refetchOnWindowFocus:false,
  });
}

export default function Index() {
  const [menuOpen,setMenuOpen]=useState(false);
  const {data:invite}=useInvitation();
  const reduce=useReducedMotion();
  const primaryLink=invite?"/convite/"+invite.slug:"/auth";
  const primaryLabel=invite?"Participar do próximo encontro":"Acessar a mentoria";

  return <div className="oc-public min-h-screen">
    <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:left-4 focus:top-4 focus:bg-white focus:p-4 focus:text-[#20302a]">Ir para o conteúdo</a>
    <header className="sticky top-0 z-50 border-b border-[#26342e]/15 bg-[#efede5]/95 backdrop-blur-xl">
      <nav aria-label="Navegação principal" className="oc-container flex h-[78px] items-center justify-between gap-6">
        <a href="#inicio" className="flex items-center gap-3 shrink-0" aria-label="O Construtor, voltar ao início">
          <span className="grid h-10 w-10 place-items-center border border-[#20302a] bg-[#21332c] text-[26px] leading-none text-[#eac3a2]" style={{fontFamily:"Instrument Serif,Georgia,serif"}}>C</span>
          <span className="font-heading text-[13px] font-extrabold tracking-[.12em] text-[#1d2d26]">O CONSTRUTOR</span>
        </a>
        <div className="hidden items-center gap-8 lg:flex">
          {[["#metodo","O método"],["#pilares","Os pilares"],["#experiencia","A experiência"],["#depoimentos","Histórias reais"]].map(([href,label])=>
            <a key={href} href={href} className="text-[12px] font-bold text-[#5f6b62] transition-colors hover:text-[#263a2e]">{label}</a>)}
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <Link to="/auth" className="px-4 py-3 text-[12px] font-bold text-[#39483f] hover:underline underline-offset-4">Área do aluno</Link>
          <Link to={primaryLink} className="oc-button !min-h-10 !px-4">Começar <ArrowUpRight size={15}/></Link>
        </div>
        <button type="button" onClick={()=>setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="oc-mobile-nav" aria-label={menuOpen?"Fechar menu":"Abrir menu"} className="grid h-10 w-10 place-items-center border border-[#26342e]/20 lg:hidden">{menuOpen?<X size={21}/>:<Menu size={21}/>}</button>
      </nav>
      {menuOpen && <div id="oc-mobile-nav" className="border-t border-[#26342e]/15 bg-[#efede5] px-6 py-5 lg:hidden">
        <div className="flex flex-col gap-4 text-[13px] font-semibold">
          {[["#metodo","O método"],["#pilares","Os pilares"],["#experiencia","A experiência"],["#depoimentos","Histórias reais"]].map(([href,label])=>
            <a href={href} key={href} onClick={()=>setMenuOpen(false)}>{label}</a>)}
          <Link to="/auth" onClick={()=>setMenuOpen(false)}>Área do aluno</Link>
          <Link className="oc-button w-full" to={primaryLink} onClick={()=>setMenuOpen(false)}>Começar <ArrowRight size={16}/></Link>
        </div>
      </div>}
    </header>

    <main id="conteudo">
      <section id="inicio" className="oc-hero overflow-hidden">
        <div className="oc-container grid min-h-[670px] items-stretch gap-7 py-10 md:gap-12 md:py-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)] lg:gap-14">
          <div className="flex flex-col justify-center pb-5 pt-6 md:py-12">
            <Reveal><div className="mb-8 flex items-center gap-3">
              <span className="h-px w-9 bg-[#a87953]"/>
              <span className="oc-eyebrow text-[#7f654c]">Mentoria masculina · Vagner Vieira</span>
            </div></Reveal>
            <Reveal delay={.06}><h1 className="max-w-[760px] text-[clamp(48px,6.45vw,103px)] leading-[.95] tracking-[-.075em] text-[#23342b]" style={{fontFamily:"Manrope,sans-serif",fontWeight:750}}>
              A vida que você quer <span className="oc-display block mt-2 italic text-[#aa7d5b]">precisa ser construída.</span>
            </h1></Reveal>
            <Reveal delay={.14}><p className="mt-8 max-w-[520px] text-[15px] leading-[1.85] text-[#5f6a60] md:text-[16px]">
              Uma jornada de autoconhecimento, responsabilidade e direção para homens que decidiram construir caráter, relações e legado.
            </p></Reveal>
            <Reveal delay={.2}><div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to={primaryLink} className="oc-button">{primaryLabel}<ArrowUpRight size={17}/></Link>
              <a href="#metodo" className="inline-flex min-h-[50px] items-center gap-3 border border-[#26342e]/20 px-5 text-[12px] font-bold text-[#304239] transition-colors hover:bg-[#e1ddd2]">Conheça o método <ArrowDown size={15}/></a>
            </div>
            {invite && <p className="mt-4 flex flex-wrap items-center gap-2 text-[12px] font-medium text-[#667469]"><CalendarDays size={15}/>{formatInviteDate(invite.encontro_date,invite.encontro_start_time)}{invite.spots_remaining!==null && <span className="ml-1 border-l border-[#bbc2b5] pl-3">{invite.spots_remaining} {invite.spots_remaining===1?"vaga restante":"vagas restantes"}</span>}</p>}
            </Reveal>
            <div className="mt-12 flex items-center gap-5 border-t border-[#9faaa0]/35 pt-5 text-[11px] font-semibold text-[#707b70]">
              <span className="flex items-center gap-2"><CircleDot size={14} className="text-[#ad805e]"/> Consciência</span>
              <span className="flex items-center gap-2"><CircleDot size={14} className="text-[#ad805e]"/> Disciplina</span>
              <span className="flex items-center gap-2"><CircleDot size={14} className="text-[#ad805e]"/> Direção</span>
            </div>
          </div>
          <Reveal className="relative flex min-h-[440px] items-stretch pb-4 md:min-h-[560px] lg:min-h-[610px]">
            <div className="oc-portrait-frame relative w-full overflow-hidden">
              <img src="/vagner-hero.svg" alt="Composição arquitetônica de O Construtor" className="h-full w-full object-cover" loading="eager"/>
              <div className="absolute bottom-8 left-7 z-10 flex items-end justify-between gap-6 text-[#f4eddf] md:bottom-12 md:left-10">
                <div><p className="oc-eyebrow mb-3 text-[#e5c4a4]">Método O Construtor</p><p className="oc-display text-[clamp(38px,5vw,66px)]">Governe a si mesmo.<br/>Construa o seu legado.</p></div>
              </div>
            </div>
            <div className="absolute -bottom-2 -left-4 z-20 flex h-[91px] w-[175px] flex-col justify-center border border-[#c8bdaa] bg-[#f0ede4] px-5 md:-left-8 md:h-[110px] md:w-[210px]">
              <span className="oc-eyebrow text-[#8d7968]">Uma jornada</span><span className="oc-display mt-1 text-[38px] text-[#273a2e]">06 <span className="font-heading text-[13px] font-semibold tracking-normal">pilares</span></span>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="metodo" className="oc-section bg-[#f4f2eb]">
        <div className="oc-container grid items-start gap-10 lg:grid-cols-[.45fr_1fr] lg:gap-16">
          <Reveal><p className="oc-eyebrow mb-5 text-[#9b795b]">01 / O método</p><div className="h-px w-14 bg-[#9b795b]"/><p className="mt-7 max-w-[290px] text-[13px] leading-[1.8] text-[#748073]">Uma proposta de transformação que coloca responsabilidade pessoal antes de qualquer resultado externo.</p></Reveal>
          <Reveal delay={.1}><h2 className="max-w-[880px] text-[clamp(34px,4.7vw,68px)] font-bold leading-[1.14] tracking-[-.065em] text-[#21342a]">
            O trabalho mais importante que você pode fazer <span className="oc-display italic text-[#ad7b55]">começa por dentro.</span>
          </h2>
          <p className="mt-8 max-w-[700px] text-[15px] leading-[1.9] text-[#6c766b]">Não é um atalho, uma fórmula pronta ou uma promessa de mudança instantânea. É um processo de consciência, prática e acompanhamento — para transformar escolhas em consistência.</p>
          <div className="mt-12 grid gap-7 border-t border-[#314235]/20 pt-8 sm:grid-cols-3">
            {[
              {num:"I.",title:"Clareza",desc:"Olhar para a própria história com consciência."},
              {num:"II.",title:"Estrutura",desc:"Dar direção aos valores, metas e decisões."},
              {num:"III.",title:"Continuidade",desc:"Criar hábitos e vínculos que sustentam a evolução."},
            ].map(item=><div key={item.num}><span className="oc-display text-[40px] text-[#a97c58]">{item.num}</span><h3 className="mt-3 text-[14px] font-extrabold text-[#2b3a2e]">{item.title}</h3><p className="mt-2 text-[12px] leading-[1.7] text-[#68776b]">{item.desc}</p></div>)}
          </div>
          </Reveal>
        </div>
      </section>

      <section id="pilares" className="oc-section bg-[#e9e6dc]">
        <div className="oc-container">
          <Reveal className="mb-12 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
            <div><p className="oc-eyebrow mb-5 text-[#917356]">02 / A estrutura</p><h2 className="text-[clamp(38px,5vw,75px)] font-bold leading-[1.04] tracking-[-.075em] text-[#27362b]">Os seis pilares <span className="oc-display block italic text-[#a37756]">da construção.</span></h2></div>
            <p className="max-w-[310px] text-[13px] leading-[1.8] text-[#647064]">Uma visão integrada: do governo da própria vida à construção de relações, prosperidade e comunidade.</p>
          </Reveal>
          <div className="border-b border-[#253c30]/20">
            {pillars.map((pillar,i)=><Reveal key={pillar.index} delay={Math.min(i*.04,.18)}>
              <div className="oc-pillar grid items-start gap-3 md:grid-cols-[80px_minmax(0,1fr)_minmax(240px,.8fr)] md:items-center md:gap-9">
                <span className="oc-index">{pillar.index}</span>
                <div><span className="oc-eyebrow mb-2 block text-[#957659]">{pillar.tag}</span><h3 className="max-w-[580px] text-[clamp(20px,2.15vw,29px)] font-bold leading-[1.25] tracking-[-.045em] text-[#28392d]">{pillar.title}</h3></div>
                <div className="flex items-start justify-between gap-5"><p className="max-w-[350px] text-[13px] leading-[1.8] text-[#687367]">{pillar.description}</p><ArrowUpRight size={17} className="shrink-0 text-[#947257]"/></div>
              </div>
            </Reveal>)}
          </div>
        </div>
      </section>

      <section id="experiencia" className="oc-section bg-[#1b2a25] text-[#e9e7da]">
        <div className="oc-container">
          <Reveal className="grid gap-10 lg:grid-cols-[1fr_.85fr] lg:items-end">
            <div><p className="oc-eyebrow mb-6 text-[#ceaa87]">03 / A experiência</p><h2 className="text-[clamp(38px,5vw,71px)] font-bold leading-[1.06] tracking-[-.07em]">A transformação não é um evento. <span className="oc-display block italic text-[#d7b18f]">É uma prática.</span></h2></div>
            <p className="max-w-[490px] text-[14px] leading-[1.9] text-[#acb8ad]">Encontros, conteúdos, reflexões e ações que se conectam em uma jornada contínua. O seu espaço digital reúne tudo o que você precisa para acompanhar esse processo.</p>
          </Reveal>
          <div className="mt-16 grid gap-px border border-[#45584c] bg-[#45584c] md:grid-cols-3">
            {[
              {number:"01",title:"Encontros",desc:"Acompanhe as sessões, registre aprendizados e leve decisões concretas para a sua rotina.",icon:CalendarDays},
              {number:"02",title:"Conteúdo",desc:"Acesse materiais e módulos organizados para sustentar sua evolução em cada etapa.",icon:Compass},
              {number:"03",title:"Acompanhamento",desc:"Visualize o que foi concluído, reflita sobre suas ações e retome de onde parou.",icon:ShieldCheck},
            ].map((step,i)=><Reveal key={step.number} delay={i*.08} className="flex h-full flex-col bg-[#203129] p-8 md:min-h-[325px] md:p-10">
              <div className="flex items-center justify-between text-[#d0a986]"><span className="oc-eyebrow">{step.number} / 03</span><step.icon size={23} strokeWidth={1.5}/></div>
              <h3 className="mt-16 text-[25px] font-bold tracking-[-.05em] text-[#f1eee4]">{step.title}</h3>
              <p className="mt-3 max-w-[310px] text-[13px] leading-[1.8] text-[#aab6aa]">{step.desc}</p>
            </Reveal>)}
          </div>
        </div>
      </section>

      <section className="oc-section bg-[#f2f0e7]">
        <div className="oc-container grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,.8fr)] lg:gap-20">
          <Reveal className="min-h-[410px] bg-[#1e3029] p-8 text-[#f0e7d8] md:p-12">
            <div className="oc-eyebrow text-[#d6b493]">04 / O mentor</div>
            <div className="mt-14 border-l border-[#be9e7f]/50 pl-7"><p className="oc-quote max-w-[580px] text-[clamp(34px,4vw,57px)]">Consciência, coragem e continuidade: uma construção que começa dentro.</p></div>
            <div className="mt-16 flex items-center gap-3"><span className="h-10 w-10 border border-[#b89c7d] grid place-items-center text-[#e8c6a8] font-serif text-2xl">V</span><div><p className="text-[13px] font-bold">Vagner Vieira</p><p className="mt-1 text-[11px] text-[#b9b8ac]">Mentor · O Construtor</p></div></div>
          </Reveal>
          <Reveal delay={.1} className="flex flex-col justify-center">
            <p className="oc-eyebrow mb-5 text-[#a07c5b]">Sobre a mentoria</p><h2 className="text-[clamp(35px,4vw,57px)] font-bold leading-[1.15] tracking-[-.065em] text-[#24372c]">Construa uma história da qual você quer fazer parte.</h2>
            <p className="mt-7 max-w-[530px] text-[14px] leading-[1.9] text-[#67756a]">Com Vagner Vieira, o processo propõe uma conversa mais profunda sobre identidade, responsabilidades, relações e escolhas que se transformam em legado.</p>
            <a href="#depoimentos" className="mt-7 inline-flex items-center gap-3 self-start text-[12px] font-bold text-[#4a614e] underline underline-offset-[7px]">Conheça algumas experiências <MoveRight size={17}/></a>
          </Reveal>
        </div>
      </section>

      <section id="depoimentos" className="oc-section bg-[#e9e6dc]">
        <div className="oc-container">
          <Reveal className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div><p className="oc-eyebrow mb-5 text-[#9f7858]">05 / Histórias reais</p><h2 className="text-[clamp(36px,4.5vw,64px)] font-bold leading-[1.12] tracking-[-.06em] text-[#293b2e]">A experiência <span className="oc-display italic text-[#a47b59]">de quem viveu.</span></h2></div>
            <span className="text-[12px] text-[#718071]">Depoimentos presentes na mentoria</span>
          </Reveal>
          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((item,i)=><Reveal delay={i*.08} key={item.name} className="flex min-h-[330px] flex-col border border-[#c7c8ba] bg-[#f5f3ec] p-7 md:p-9">
              <span className="oc-display text-[52px] leading-none text-[#bd9674]">“</span><p className="mt-4 flex-1 text-[14px] leading-[1.9] text-[#4a5b4d]">{item.text}</p>
              <div className="mt-10 flex items-center gap-3 border-t border-[#bbc2b4] pt-5"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#d8ddd0] text-[12px] font-bold text-[#384d3d]">{item.name.split(" ").map(n=>n.slice(0,1)).join("").slice(0,2)}</span><div><p className="text-[12px] font-extrabold text-[#293b2e]">{item.name}</p><p className="mt-1 text-[11px] text-[#819082]">{item.role}</p></div></div>
            </Reveal>)}
          </div>
        </div>
      </section>

      <section className="bg-[#293a2f] py-20 text-[#f3f1e7] md:py-28">
        <Reveal className="oc-container flex flex-col items-start justify-between gap-9 lg:flex-row lg:items-end">
          <div><p className="oc-eyebrow mb-6 text-[#debc99]">Sua próxima etapa</p><h2 className="max-w-[890px] text-[clamp(39px,5.8vw,78px)] font-bold leading-[1.06] tracking-[-.07em]">O futuro não se espera. <span className="oc-display block italic text-[#e2bc9a]">Se constrói.</span></h2>
            {invite && <p className="mt-5 flex items-center gap-2 text-[13px] text-[#b8c3b7]"><CalendarDays size={15}/>{formatInviteDate(invite.encontro_date,invite.encontro_start_time)}</p>}
          </div>
          <Link to={primaryLink} className="oc-button oc-button-light !min-h-[58px] shrink-0">{primaryLabel}<ArrowUpRight size={17}/></Link>
        </Reveal>
      </section>
    </main>
    <footer className="bg-[#192a23] py-10 text-[#f5f0e7]">
      <div className="oc-container flex flex-col justify-between gap-7 border-b border-[#58665a]/30 pb-9 md:flex-row md:items-start">
        <div><p className="font-heading text-[13px] font-extrabold tracking-[.14em]">O CONSTRUTOR</p><p className="mt-3 text-[12px] text-[#a2b1a6]">Consciência. Direção. Legado.</p></div>
        <div className="flex flex-wrap gap-x-7 gap-y-3 text-[12px] font-semibold text-[#d5dcd1]"><a href="#metodo" className="hover:text-[#e7b995]">O método</a><a href="#pilares" className="hover:text-[#e7b995]">Pilares</a><a href="#depoimentos" className="hover:text-[#e7b995]">Histórias</a><Link to="/auth" className="hover:text-[#e7b995]">Área do aluno</Link></div>
      </div>
      <div className="oc-container mt-6 flex flex-wrap justify-between gap-3 text-[11px] text-[#8fa095]"><span>© {new Date().getFullYear()} O Construtor. Todos os direitos reservados.</span><span>Uma jornada de construção contínua.</span></div>
    </footer>
  </div>;
}
