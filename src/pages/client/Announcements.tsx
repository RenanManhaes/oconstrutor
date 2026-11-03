import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Announcement { id: string; title: string; message: string; created_at: string; }

const ClientAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false })
      .then(({ data }) => { setAnnouncements(data || []); setLoading(false); });
  }, []);

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <p className="studio-eyebrow mb-3">Acompanhe as novidades</p>
          <h1 className="studio-title text-[30px] leading-tight sm:text-[38px]">Comunicados<span className="text-[#d6aa86]">.</span></h1>
        <p className="text-gray-400 text-sm mt-1">Fique por dentro das novidades da mentoria.</p>
      </div>

      {announcements.length === 0 && <p className="text-gray-500 text-sm">Nenhum aviso no momento.</p>}

      <div className="space-y-3">
        {announcements.map(a => (
          <Card key={a.id} className="bg-navy-light/30 border-gold/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-heading font-bold text-white">{a.title}</h3>
                  <p className="text-sm text-gray-400 mt-1">{a.message}</p>
                  <p className="text-xs text-gray-600 mt-2">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ClientAnnouncements;
