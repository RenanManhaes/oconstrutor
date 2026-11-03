import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const Auth = () => {
  const navigate = useNavigate();
  const { user, role, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  // Auto-redirect when authenticated and role is resolved
  useEffect(() => {
    if (!isLoading && user && role) {
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/client", { replace: true });
      }
    }
  }, [isLoading, user, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      }
      // Navigation is handled by the useEffect above once AuthContext resolves
    } catch {
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("E-mail de recuperação enviado! Verifique sua caixa de entrada.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(41,65%,47%) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-gold transition-colors text-sm mb-8">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo-badge.svg" alt="O Construtor" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-white">O CONSTRUTOR</h1>
          <p className="text-gray-400 text-sm mt-1">
            {mode === "login" ? "Acesse sua área de mentoria" : "Recupere sua senha"}
          </p>
        </div>

        <div className="bg-navy-light/50 border border-gold/10 rounded-xl p-8">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 text-sm">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600 focus:border-gold/30" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300 text-sm">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600 focus:border-gold/30" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-navy-dark font-heading font-bold shadow-gold hover:opacity-90" disabled={isSubmitting}>
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
              <button type="button" onClick={() => setMode("forgot")} className="w-full text-center text-sm text-gold/70 hover:text-gold transition-colors">
                Esqueci minha senha
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <p className="text-gray-400 text-sm">Informe seu e-mail para receber as instruções de recuperação.</p>
              <div className="space-y-2">
                <Label htmlFor="email-forgot" className="text-gray-300 text-sm">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input id="email-forgot" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600 focus:border-gold/30" required />
                </div>
              </div>
              <Button type="submit" className="w-full bg-gradient-gold text-navy-dark font-heading font-bold shadow-gold hover:opacity-90" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Link"}
              </Button>
              <button type="button" onClick={() => setMode("login")} className="w-full text-center text-sm text-gold/70 hover:text-gold transition-colors">
                Voltar ao login
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Ainda não tem conta?{" "}
          <Link to="/register" className="text-gold hover:text-gold/80 transition-colors font-medium">
            Cadastre-se aqui
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
