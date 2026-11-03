import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    if (type === "recovery") {
      setIsValidSession(true);
    } else {
      // Also check if user already has a session (clicked reset link)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setIsValidSession(true);
      });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha redefinida com sucesso!");
      navigate("/auth");
    }
    setIsLoading(false);
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
        <div className="text-center">
          <Crown className="h-8 w-8 text-gold mx-auto mb-4" />
          <p className="text-gray-400">Link inválido ou expirado.</p>
          <Link to="/auth" className="text-gold/70 hover:text-gold text-sm mt-4 inline-block">Voltar ao login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Crown className="h-8 w-8 text-gold mx-auto mb-2" />
          <h1 className="font-heading font-bold text-2xl text-white">Redefinir Senha</h1>
          <p className="text-gray-400 text-sm mt-1">Crie uma nova senha para sua conta.</p>
        </div>
        <div className="bg-navy-light/50 border border-gold/10 rounded-xl p-8">
          <form onSubmit={handleReset} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-navy-dark/50 border-gold/10 text-white" required minLength={6} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="pl-10 bg-navy-dark/50 border-gold/10 text-white" required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-gold text-navy-dark font-heading font-bold" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Redefinir Senha"}
            </Button>
          </form>
        </div>
        <p className="text-center mt-4">
          <Link to="/auth" className="text-gold/70 hover:text-gold text-sm">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
