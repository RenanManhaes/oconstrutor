import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  userId: string;
  onAccepted: () => void;
}

const LgpdConsentDialog = ({ open, userId, onAccepted }: Props) => {
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAccept = async () => {
    if (!accepted) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ lgpd_accepted_at: new Date().toISOString() } as any)
      .eq("user_id", userId);
    if (error) {
      toast.error("Erro ao salvar consentimento.");
      setSaving(false);
      return;
    }
    toast.success("Consentimento registrado!");
    onAccepted();
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="bg-navy-dark border-gold/10 max-w-lg p-0 gap-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="p-6 border-b border-gold/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-lg text-white">Política de Privacidade</h2>
            <p className="text-xs text-gray-400">Lei Geral de Proteção de Dados (LGPD)</p>
          </div>
        </div>

        <ScrollArea className="max-h-[50vh] px-6 py-4">
          <div className="text-sm text-gray-300 space-y-4 leading-relaxed">
            <p>
              Ao utilizar a plataforma <strong className="text-white">O Construtor</strong>, você concorda com a coleta
              e o tratamento dos seus dados pessoais conforme descrito abaixo, em conformidade com a
              Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).
            </p>

            <h3 className="font-heading font-semibold text-white text-sm">1. Dados Coletados</h3>
            <p>
              Coletamos dados de identificação (nome, e-mail, telefone), dados de navegação e interação
              com a plataforma (progresso, anotações, presença em encontros), e dados financeiros
              relacionados aos pagamentos da mentoria.
            </p>

            <h3 className="font-heading font-semibold text-white text-sm">2. Finalidade</h3>
            <p>
              Os dados são utilizados exclusivamente para: prestação dos serviços da mentoria,
              acompanhamento do seu progresso, comunicação entre mentor e mentorado,
              e gestão financeira dos pagamentos.
            </p>

            <h3 className="font-heading font-semibold text-white text-sm">3. Compartilhamento</h3>
            <p>
              Seus dados não serão compartilhados com terceiros, exceto quando necessário para
              o funcionamento da plataforma (ex.: provedor de hospedagem) ou por determinação legal.
            </p>

            <h3 className="font-heading font-semibold text-white text-sm">4. Armazenamento e Segurança</h3>
            <p>
              Os dados são armazenados em servidores seguros com criptografia e controle de acesso.
              Mantemos seus dados pelo período necessário para a prestação do serviço.
            </p>

            <h3 className="font-heading font-semibold text-white text-sm">5. Seus Direitos</h3>
            <p>
              Você tem direito a acessar, corrigir, eliminar seus dados, revogar o consentimento
              e solicitar a portabilidade, conforme previsto na LGPD. Para exercer seus direitos,
              entre em contato com o administrador da plataforma.
            </p>

            <h3 className="font-heading font-semibold text-white text-sm">6. Materiais Exclusivos</h3>
            <p>
              Todo o conteúdo disponibilizado na plataforma (vídeos, áudios, PDFs, imagens) é de uso
              exclusivo dos membros da mentoria. A reprodução, cópia ou compartilhamento é
              expressamente proibida.
            </p>
          </div>
        </ScrollArea>

        <div className="p-6 border-t border-gold/10 space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="lgpd-accept"
              checked={accepted}
              onCheckedChange={(v) => setAccepted(v === true)}
              className="mt-0.5 border-gold/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
            />
            <label htmlFor="lgpd-accept" className="text-sm text-gray-300 cursor-pointer leading-snug">
              Li e concordo com a <strong className="text-white">Política de Privacidade</strong> e os{" "}
              <strong className="text-white">Termos de Uso</strong> da plataforma O Construtor.
            </label>
          </div>
          <Button
            onClick={handleAccept}
            disabled={!accepted || saving}
            className="w-full bg-gradient-gold text-navy-dark font-heading font-bold hover:opacity-90"
          >
            {saving ? "Salvando..." : "Aceitar e Continuar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LgpdConsentDialog;
