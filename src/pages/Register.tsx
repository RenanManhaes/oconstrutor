import { useState } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, Phone, ArrowLeft, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      toast.error("Preencha nome, email e senha.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await supabase.functions.invoke("manage-users", {
        body: { action: "self_register", email, password, full_name: fullName, phone },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      setSuccess(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(41,65%,47%) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
        <div className="w-full max-w-md relative z-10 text-center">
          <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
          <h1 className="font-heading font-bold text-2xl text-white mb-2">Cadastro Enviado!</h1>
          <p className="text-gray-400 mb-6">
            Seu cadastro foi recebido com sucesso. Aguarde a aprovação do administrador para acessar a plataforma.
          </p>
          <Link to="/auth">
            <Button variant="outline" className="border-gold/20 text-gold hover:bg-gold/10">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(41,65%,47%) 1px, transparent 0)", backgroundSize: "40px 40px" }} />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/auth" className="inline-flex items-center gap-2 text-gray-400 hover:text-gold transition-colors text-sm mb-8">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo-badge.svg" alt="O Construtor" className="h-12 w-12 object-contain" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-white">CADASTRE-SE</h1>
          <p className="text-gray-400 text-sm mt-1">Preencha seus dados para solicitar acesso à mentoria</p>
        </div>

        <div className="bg-navy-light/50 border border-gold/10 rounded-xl p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-gray-300 text-sm">Nome completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input id="fullName" placeholder="Seu nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600 focus:border-gold/30" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm">E-mail *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600 focus:border-gold/30" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-300 text-sm">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input id="phone" placeholder="(00) 00000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10 bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600 focus:border-gold/30" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm">Senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10 bg-navy-dark/50 border-gold/10 text-white placeholder:text-gray-600 focus:border-gold/30" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-gold text-navy-dark font-heading font-bold shadow-gold hover:opacity-90" disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Solicitar Acesso"}
            </Button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Após o cadastro, o administrador precisará aprovar seu acesso.
        </p>
      </div>
    </div>
  );
};

export default Register;
