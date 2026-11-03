import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Calendar, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface InviteData {
  invite_id: string;
  invite_title: string;
  invite_description: string | null;
  invite_cover_url: string | null;
  encontro_title: string;
  encontro_description: string | null;
  encontro_date: string | null;
  encontro_start_time: string | null;
  encontro_end_time: string | null;
  encontro_thumbnail_url: string | null;
  spots_remaining: number | null;
}

const PublicInvite = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data, error } = await supabase.rpc("get_public_invite_secure", { _slug: slug });
      if (error || !data || data.length === 0) {
        setNotFound(true);
      } else {
        setInvite(data[0] as InviteData);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    if (!name.trim() || !email.trim()) {
      toast.error("Preencha nome e email");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("submit_guest_signup_secure", {
      _slug: slug,
      _full_name: name.trim(),
      _email: email.trim(),
      _phone: phone.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message || "Erro ao enviar inscrição");
      return;
    }
    const result = data as { success: boolean; error?: string };
    if (!result?.success) {
      toast.error(result?.error || "Erro ao enviar inscrição");
      return;
    }
    setDone(true);
  };

  const formatDate = (d: string | null) => {
    if (!d) return null;
    try {
      return new Date(d + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    } catch { return d; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-gold animate-spin" />
      </div>
    );
  }

  if (notFound || !invite) {
    return (
      <div className="min-h-screen bg-navy-dark flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-graphite/40 border-graphite">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-gold mx-auto" />
            <h1 className="font-heading text-2xl text-white">Convite indisponível</h1>
            <p className="text-gray-400 font-body">
              Este link não está mais ativo, expirou ou as vagas foram preenchidas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-dark py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3 justify-center mb-6">
          <img src="/logo-badge.svg" alt="O Construtor" className="h-10 w-10 object-contain" />
          <div>
            <span className="font-heading font-bold text-base tracking-wide text-white block">O CONSTRUTOR</span>
            <span className="text-[10px] text-gold uppercase tracking-widest">Convite especial</span>
          </div>
        </div>

        {(invite.invite_cover_url || invite.encontro_thumbnail_url) && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-graphite">
            <img
              src={invite.invite_cover_url || invite.encontro_thumbnail_url || ""}
              alt={invite.invite_title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <Card className="bg-graphite/40 border-graphite">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl text-white mb-2">{invite.invite_title}</h1>
              <p className="text-gold font-body text-sm uppercase tracking-wider">{invite.encontro_title}</p>
            </div>

            {(invite.encontro_date || invite.encontro_start_time) && (
              <div className="flex flex-wrap gap-4 text-gray-300 font-body text-sm">
                {invite.encontro_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gold" />
                    <span>{formatDate(invite.encontro_date)}</span>
                  </div>
                )}
                {invite.encontro_start_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gold" />
                    <span>
                      {invite.encontro_start_time.slice(0, 5)}
                      {invite.encontro_end_time ? ` – ${invite.encontro_end_time.slice(0, 5)}` : ""}
                    </span>
                  </div>
                )}
              </div>
            )}

            {invite.invite_description && (
              <p className="text-gray-300 font-body whitespace-pre-line">{invite.invite_description}</p>
            )}
            {invite.encontro_description && !invite.invite_description && (
              <p className="text-gray-300 font-body whitespace-pre-line">{invite.encontro_description}</p>
            )}

            {invite.spots_remaining !== null && invite.spots_remaining <= 10 && (
              <p className="text-gold text-sm font-body">
                Restam apenas {invite.spots_remaining} {invite.spots_remaining === 1 ? "vaga" : "vagas"}.
              </p>
            )}
          </CardContent>
        </Card>

        {done ? (
          <Card className="bg-graphite/40 border-graphite">
            <CardContent className="p-8 text-center space-y-4">
              <CheckCircle2 className="h-14 w-14 text-gold mx-auto" />
              <h2 className="font-heading text-2xl text-white">Inscrição confirmada!</h2>
              <p className="text-gray-300 font-body">
                Recebemos seus dados. Em breve entraremos em contato com as informações do encontro.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-graphite/40 border-graphite">
            <CardContent className="p-6 md:p-8">
              <h2 className="font-heading text-xl text-white mb-4">Garanta sua vaga</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Nome completo *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} required className="bg-navy-dark border-graphite text-white mt-1" />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email *</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255} required className="bg-navy-dark border-graphite text-white mt-1" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-300">Telefone (opcional)</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder="(11) 99999-9999" className="bg-navy-dark border-graphite text-white mt-1" />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gold hover:bg-gold/90 text-navy-dark font-medium">
                  {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</> : "Quero participar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicInvite;
