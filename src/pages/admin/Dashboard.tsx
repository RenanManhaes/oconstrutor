import { useEffect, useState } from "react";
import { Users, Calendar, BookOpen, BarChart3, TrendingUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Metrics {
  totalUsers: number;
  totalEncontros: number;
  activeEncontros: number;
  totalMaterials: number;
  attendanceRate: number;
  checklistRate: number;
  recentEncontros: { title: string; date: string; attendees: number }[];
  lowEngagement: { name: string; lastAccess: string; attendance: number }[];
}

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [profilesRes, encontrosRes, materialsRes, attendanceRes, checklistRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, last_sign_in_at, status"),
        supabase.from("encontros").select("id, title, date, status"),
        supabase.from("materials").select("id"),
        supabase.from("encontro_attendance").select("user_id, encontro_id, status"),
        supabase.from("encontro_checklist").select("user_id, completed"),
      ]);

      const profiles = profilesRes.data || [];
      const encontros = encontrosRes.data || [];
      const materials = materialsRes.data || [];
      const attendance = attendanceRes.data || [];
      const checklist = checklistRes.data || [];

      const activeEncontros = encontros.filter(e => e.status === "active").length;
      const presentCount = attendance.filter(a => a.status === "present").length;
      const attendanceRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
      const completedChecklist = checklist.filter(c => c.completed).length;
      const checklistRate = checklist.length > 0 ? Math.round((completedChecklist / checklist.length) * 100) : 0;

      // Recent encontros with attendee count
      const recentEncontros = encontros
        .filter(e => e.date)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
        .slice(0, 5)
        .map(e => ({
          title: e.title,
          date: e.date ? new Date(e.date).toLocaleDateString("pt-BR") : "—",
          attendees: attendance.filter(a => a.encontro_id === e.id && a.status === "present").length,
        }));

      // Low engagement by attendance
      const userAttendance: Record<string, number> = {};
      attendance.filter(a => a.status === "present").forEach(a => {
        userAttendance[a.user_id] = (userAttendance[a.user_id] || 0) + 1;
      });

      const lowEngagement = profiles
        .filter(p => p.status === "active")
        .map(p => ({
          name: p.full_name || "Sem nome",
          lastAccess: p.last_sign_in_at ? new Date(p.last_sign_in_at).toLocaleDateString("pt-BR") : "Nunca",
          attendance: userAttendance[p.user_id] || 0,
        }))
        .sort((a, b) => a.attendance - b.attendance)
        .slice(0, 5);

      setMetrics({
        totalUsers: profiles.length,
        totalEncontros: encontros.length,
        activeEncontros,
        totalMaterials: materials.length,
        attendanceRate,
        checklistRate,
        recentEncontros,
        lowEngagement,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="text-muted-foreground p-8">Carregando dashboard...</div>;
  if (!metrics) return null;

  const cards = [
    { icon: Users, label: "Usuários", value: metrics.totalUsers.toString() },
    { icon: Calendar, label: "Encontros", value: `${metrics.activeEncontros}/${metrics.totalEncontros}` },
    { icon: BookOpen, label: "Materiais", value: metrics.totalMaterials.toString() },
    { icon: BarChart3, label: "Taxa de Presença", value: `${metrics.attendanceRate}%` },
    { icon: CheckCircle2, label: "Checklist Aplicado", value: `${metrics.checklistRate}%` },
  ];

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral da plataforma.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((m, i) => (
          <Card key={i} className="bg-card/50 border-accent/10">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <m.icon className="h-5 w-5 text-accent" />
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="font-heading font-bold text-2xl text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-accent/10">
          <CardHeader><CardTitle className="text-sm font-heading text-muted-foreground uppercase tracking-wider">Últimos Encontros</CardTitle></CardHeader>
          <CardContent>
            {metrics.recentEncontros.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum encontro registrado.</p>
            ) : (
              <div className="space-y-3">
                {metrics.recentEncontros.map((e, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-foreground font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.date}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{e.attendees} presentes</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-accent/10">
          <CardHeader><CardTitle className="text-sm font-heading text-muted-foreground uppercase tracking-wider">Baixo Engajamento</CardTitle></CardHeader>
          <CardContent>
            {metrics.lowEngagement.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum usuário encontrado.</p>
            ) : (
              <div className="space-y-3">
                {metrics.lowEngagement.map((u, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-foreground font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">Último acesso: {u.lastAccess}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{u.attendance} presenças</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
