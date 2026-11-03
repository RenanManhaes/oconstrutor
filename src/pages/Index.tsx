import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Shield, Target, Compass, CheckCircle, Lock, Flame, Mountain, ArrowRight, Brain, User, Map, Home, TrendingUp, Users, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type NextInvite = {
  slug: string;
  invite_title: string;
  encontro_title: string;
  encontro_date: string | null;
  encontro_start_time: string | null;
  spots_remaining: number | null;
};

const useNextPublicInvite = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["next-public-invite"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_next_public_invite");
      if (error) return null;
      return (data && data.length > 0 ? (data[0] as NextInvite) : null);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return { invite: data ?? null, loading: isLoading };
};

const formatEncontroDate = (date: string | null, time: string | null) => {
  if (!date) return null;
  try {
    const d = new Date(date + "T00:00:00");
    const datePart = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
    if (time) return `${datePart} às ${time.slice(0, 5)}`;
    return datePart;
  } catch {
    return null;
  }
};

const FreeInviteCTA = ({ invite, variant = "hero" }: { invite: NextInvite; variant?: "hero" | "final" }) => {
  const dateLabel = formatEncontroDate(invite.encontro_date, invite.encontro_start_time);
  return (
    <div className={variant === "hero" ? "mt-4" : "mt-6"}>
      <Link to={`/convite/${invite.slug}`}>
        <Button
          size="lg"
          variant="outline"
          className="border-2 border-accent/60 bg-accent/5 text-accent hover:bg-accent/10 hover:border-accent font-heading font-bold text-base md:text-lg px-8 py-6 backdrop-blur-sm"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          <span className="inline-flex items-center gap-2">
            Inscreva-se gratuitamente no próximo encontro
            <span className="hidden sm:inline-flex items-center rounded-full bg-accent text-accent-foreground text-[10px] font-bold tracking-wide px-2 py-0.5 ml-1">
              GRATUITO
            </span>
          </span>
        </Button>
      </Link>
      {(dateLabel || invite.spots_remaining !== null) && (
        <p className="mt-2 text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
          {dateLabel && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3 text-accent" />
              {dateLabel}
            </span>
          )}
          {dateLabel && invite.spots_remaining !== null && <span className="opacity-50">•</span>}
          {invite.spots_remaining !== null && (
            <span>{invite.spots_remaining} {invite.spots_remaining === 1 ? "vaga restante" : "vagas restantes"}</span>
          )}
        </p>
      )}
    </div>
  );
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const Index = () => {
  const { invite: nextInvite } = useNextPublicInvite();
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-2xl border-b border-accent/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-badge.svg" alt="O Construtor" className="h-8 w-8 object-contain" />
            <span className="font-heading font-bold text-lg tracking-wide">O CONSTRUTOR</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#verdade" className="hover:text-accent transition-colors">A Verdade</a>
            <a href="#pilares" className="hover:text-accent transition-colors">Pilares</a>
            <a href="#depoimentos" className="hover:text-accent transition-colors">Depoimentos</a>
          </div>
          <Link to="/auth">
            <Button size="sm" className="bg-accent text-accent-foreground font-heading font-bold hover:bg-accent/90 shadow-gold">
              Entrar
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-navy" />
        <div className="absolute inset-0 opacity-[0.02]" style={{backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--accent)) 1px, transparent 0)", backgroundSize: "50px 50px"}} />
        <div className="absolute top-1/4 right-[-10%] w-[600px] h-[600px] bg-accent/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 left-[-10%] w-[400px] h-[400px] bg-accent/3 rounded-full blur-[150px]" />
        
        {/* Geometric lines */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-accent/10 to-transparent" />
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-accent/5 to-transparent" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/5 backdrop-blur-sm text-accent text-sm font-medium mb-6">
                  <Flame className="h-4 w-4" />
                  Mentoria Masculina de Transformação
                </div>
              </motion.div>
              
              <motion.h1 
                className="font-heading font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              >
                <span className="text-gradient-gold">O CONSTRUTOR</span>
                <br />
                <span className="text-foreground">Ou você assume o controle da sua vida...</span>{" "}
                <span className="text-muted-foreground">ou continua terceirizando seu destino.</span>
              </motion.h1>
              
              <motion.p 
                className="text-base md:text-lg text-muted-foreground mb-4 leading-relaxed max-w-lg"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
              >
                Um programa para <span className="text-accent font-semibold">homens</span> que decidiram parar de reclamar, parar de se esconder e começar a construir — <span className="text-foreground font-medium">caráter, lar e legado.</span>
              </motion.p>
              
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Link to="/auth">
                  <Button size="lg" className="bg-accent text-accent-foreground font-heading font-bold text-lg px-10 py-6 shadow-gold hover:bg-accent/90 glow-gold">
                    Entrar
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                {nextInvite && <FreeInviteCTA invite={nextInvite} variant="hero" />}
              </motion.div>
            </div>

            {/* Hero Image */}
            <motion.div 
              className="hidden md:flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}
            >
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute -inset-4 rounded-2xl bg-accent/10 blur-2xl" />
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-accent/30 via-transparent to-accent/10 p-px">
                  <div className="w-full h-full rounded-2xl bg-background" />
                </div>
                <div className="relative w-80 h-[420px] rounded-2xl overflow-hidden border border-accent/20">
                  <img 
                    src="/vagner-hero.svg" 
                    alt="Ilustração editorial O Construtor" 
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
                  {/* Badge */}
                  <div className="absolute bottom-4 left-4 right-4 glass-card rounded-lg px-4 py-3 flex items-center gap-3">
                    <img src="/logo-badge.svg" alt="" className="h-8 w-8" />
                    <div>
                      <p className="font-heading font-bold text-sm text-foreground">Vagner Vieira</p>
                      <p className="text-xs text-muted-foreground">Mentor & Fundador</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* A VERDADE */}
      <section id="verdade" className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-card/50" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
            <motion.div {...fadeInUp}>
              <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl mb-4 leading-tight">A VERDADE QUE NINGUÉM TE FALA</h2>
              <p className="text-accent font-heading font-bold text-lg italic mb-8 border-l-4 border-accent pl-4">AVISO IMPORTANTE</p>
              
              <div className="space-y-5 text-muted-foreground leading-relaxed">
                <p>Isto não é um evento motivacional.</p>
                <div>
                  <p className="text-foreground font-medium">Não é palestra bonita.</p>
                  <p className="text-foreground font-medium">Não é terapia em grupo.</p>
                  <p className="text-foreground font-medium">Não é espiritualidade confortável.</p>
                </div>
                <p className="text-accent font-bold text-lg">É confronto.</p>
                <div>
                  <p>Se você quer aplauso, feche essa página agora.</p>
                  <p>Se você quer <span className="text-foreground font-medium">transformação real, contínua.</span></p>
                </div>
                <div>
                  <p>Você pode ter dinheiro.</p>
                  <p>Pode ter empresa.</p>
                  <p>Pode ter status.</p>
                </div>
                <p>Mas se você não governa as suas emoções, seus impulsos e suas decisões...</p>
                <p className="text-foreground font-bold text-xl">Você é fraco. Só que bem vestido.</p>
                <p>Sucesso sem governo interior é escravidão.</p>
                <p className="text-accent font-bold text-xl mt-4">E você sabe disso.</p>
              </div>
            </motion.div>

            <motion.div {...stagger} transition={{ delay: 0.3 }} className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-accent/10 blur-3xl rounded-full" />
                <div className="relative w-64 h-80 rounded-2xl overflow-hidden border border-accent/20 shadow-2xl">
                  <img 
                    src="/book-cover.svg" 
                    alt="O Construtor — Livro" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Para quem é / Para quem NÃO é */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">Para quem é essa mentoria?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Não é para qualquer um. É para quem está pronto para ser confrontado.</p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div {...stagger} transition={{ delay: 0.1 }} className="glass-card border border-accent/20 rounded-xl p-8 hover:border-accent/40 transition-all">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-heading font-bold text-xl text-accent">Para quem é</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Homens que querem assumir o governo de suas vidas",
                  "Quem está cansado de viver no piloto automático",
                  "Quem quer ser confrontado com a verdade sobre si mesmo",
                  "Quem busca construir caráter, lar e legado",
                  "Quem quer disciplina e consistência de verdade",
                  "Quem entende que sucesso sem governo interior é escravidão",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div {...stagger} transition={{ delay: 0.2 }} className="glass-card border border-border rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="font-heading font-bold text-xl text-muted-foreground">Para quem NÃO é</h3>
              </div>
              <ul className="space-y-4">
                {[
                  "Quem busca fórmulas mágicas ou atalhos",
                  "Quem quer aplauso e não confronto",
                  "Quem acha que já sabe tudo",
                  "Quem quer resultados sem esforço",
                  "Quem não tem coragem de olhar para dentro",
                  "Quem quer ficar na zona de conforto",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-muted-foreground/60">
                    <span className="text-destructive shrink-0 mt-0.5">✕</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6 Pilares */}
      <section id="pilares" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-card/50" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div {...fadeInUp} className="text-center mb-16">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">Os 6 Pilares da Construção</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">A arquitetura da expansão concêntrica — do indivíduo ao ecossistema.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Brain, title: "Consciência e Governo da Própria História", desc: "Reconheça sua origem, ressignifique suas dores e assuma responsabilidade pela própria trajetória.", num: "01" },
              { icon: User, title: "Reconstrução da Identidade Masculina", desc: "Rompa padrões inconscientes e integre força e sensibilidade. Construa quem você decide ser.", num: "02" },
              { icon: Map, title: "Estrutura de Vida e Direção", desc: "Clareza de metas, disciplina, constância e execução. Consciência sem estrutura não gera transformação.", num: "03" },
              { icon: Home, title: "Presença Familiar e Liderança Relacional", desc: "Seja emocionalmente presente, proteja sem dominar, ame sem se anular. Lidere pelo exemplo.", num: "04" },
              { icon: TrendingUp, title: "Prosperidade com Propósito e Legado", desc: "Alinhe prosperidade à sua essência. Viva com visão de longo prazo. Construa algo que permanece.", num: "05" },
              { icon: Users, title: "Irmandade, Ambiente e Evolução Contínua", desc: "Nenhum homem se reconstrói sozinho. Aliança masculina, ambiente de expansão e evolução permanente.", num: "06" },
            ].map((item, i) => (
              <motion.div key={i} {...stagger} transition={{ delay: i * 0.1 }} className="relative glass-card border border-accent/10 rounded-xl p-6 text-center group hover:border-accent/30 transition-all hover:glow-gold">
                <span className="absolute top-3 right-3 font-heading font-bold text-accent/15 text-2xl">{item.num}</span>
                <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/15 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 group-hover:border-accent/30 transition-all">
                  <item.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-heading font-bold text-base mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div {...fadeInUp} className="text-center mb-4">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">Veja o que as pessoas estão falando</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Transformação, mudança de vida, se constrói com base de conhecimento forte e maturidade.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12">
            {[
              { 
                name: "Paulo Montandon", 
                role: "Empresário",
                text: "O Vagner é um profissional que todo mundo precisa conhecer, eu como homem que tenha olhar para dentro, me surpreendi e continuo me surpreendendo do quanto é necessário e que deveria ter conhecido ele antes. Além de recomendar de olho fechado eu indico a todos.", 
                highlight: "Me surpreendi!!!!",
              },
              { 
                name: "Rogério", 
                role: "Empresário e mentor",
                text: "A gente sempre acha que consegue resolver muito das questões da nossa vida sozinho ou aprendendo com a internet, mas quando eu realmente quis mexer com emoções e comportamentos que não conseguia, entender o trabalho do Vagner tem me ajudado muito com essas percepções e ações.", 
                highlight: "Pessoal e Profissional lado a lado",
              },
              { 
                name: "Gaius Armando", 
                role: "Empreendedor e palestrante",
                text: "O Vagner tem trazido uma transformação pessoal e profissional na minha vida e da minha família, me tornou um pai, marido e empresário melhor com os direcionamentos, recomendo sempre os serviços por entender o bom que todos precisamos e grato do meu amigo.", 
                highlight: "Mudança de vida começa na decisão.",
              },
            ].map((item, i) => (
              <motion.div key={i} {...stagger} transition={{ delay: i * 0.15 }} className="glass-card border border-accent/10 rounded-xl p-6 flex flex-col hover:border-accent/25 transition-all">
                <p className="text-muted-foreground text-sm leading-relaxed flex-1 mb-6">{item.text}</p>
                <div className="border-t border-accent/10 pt-4">
                  <p className="font-heading font-bold text-accent text-sm italic mb-2">"{item.highlight}"</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-heading font-bold text-accent text-sm">
                      {item.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-card/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[200px]" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div {...fadeInUp}>
            <img src="/logo-badge.svg" alt="" className="h-16 w-16 mx-auto mb-6 object-contain" />
            <h2 className="font-heading font-black text-3xl md:text-4xl lg:text-5xl mb-4">
              Pronto para <span className="text-gradient-gold">construir</span>?
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-lg">
              Acesse a plataforma e comece sua jornada de transformação.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-accent text-accent-foreground font-heading font-bold text-lg px-12 py-7 shadow-gold hover:bg-accent/90 glow-gold">
                Entrar
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {nextInvite && (
              <div className="flex justify-center">
                <FreeInviteCTA invite={nextInvite} variant="final" />
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-accent/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} O Construtor — Vagner Vieira. Todos os Direitos Reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
