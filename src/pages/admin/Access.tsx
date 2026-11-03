import { useEffect, useState } from "react";
import { Search, Eye, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccessLog {
  id: string;
  userName: string;
  contentType: string;
  contentId: string;
  accessedAt: string;
}

const AdminAccess = () => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [logsRes, profilesRes] = await Promise.all([
        supabase.from("access_logs").select("*").order("accessed_at", { ascending: false }).limit(50),
        supabase.from("profiles").select("user_id, full_name"),
      ]);

      const profiles = profilesRes.data || [];
      const userMap: Record<string, string> = {};
      profiles.forEach(p => { userMap[p.user_id] = p.full_name || "Sem nome"; });

      setLogs((logsRes.data || []).map(l => ({
        id: l.id,
        userName: userMap[l.user_id] || "Usuário",
        contentType: l.content_type,
        contentId: l.content_id,
        accessedAt: l.accessed_at,
      })));
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = logs.filter(l => l.userName.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Acessos</h1>
        <p className="text-gray-400 text-sm mt-1">Histórico de acessos dos clientes.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input placeholder="Buscar por usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-navy-light/50 border-gold/10 text-white placeholder:text-gray-600" />
      </div>

      {filtered.length === 0 && <p className="text-gray-500 text-sm">Nenhum acesso registrado.</p>}

      <div className="space-y-2">
        {filtered.map((log) => (
          <Card key={log.id} className="bg-navy-light/30 border-gold/5">
            <CardContent className="p-4 flex items-center gap-4">
              <Eye className="h-4 w-4 text-gold shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white"><span className="font-medium">{log.userName}</span> acessou</p>
                <p className="text-xs text-gray-400">{log.contentType} — {log.contentId.slice(0, 8)}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" /> {formatDistanceToNow(new Date(log.accessedAt), { addSuffix: true, locale: ptBR })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminAccess;
