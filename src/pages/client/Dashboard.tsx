import { CheckSquare, Bell, UserCheck, FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => (
  <div className="space-y-8 max-w-6xl animate-pulse">
    <div><Skeleton className="h-8 w-64 bg-secondary" /><Skeleton className="h-4 w-48 mt-2 bg-secondary" /></div>
    <Skeleton className="h-32 w-full bg-secondary" />
    <div className="grid sm:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 bg-secondary" />)}
    </div>
  </div>
);

const ClientDashboard = () => {
  const { data, isLoading } = useDashboardData();

  if (isLoading || !data) return <DashboardSkeleton />;

  const { profileName, announcements, stats, encontroSummaries, pillarInsights } = data;
  const overallPct = stats.materialsTotal > 0 ? Math.round((stats.materialsCompleted / stats.materialsTotal) * 100) : 0;
  const attendancePct = stats.totalEncontros > 0 ? Math.round((stats.attended / stats.totalEncontros) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-white">Olá, {profileName} 👋</h1>
        <p className="text-gray-400 mt-1">Bem-vindo à sua jornada de transformação.</p>
      </div>

      {/* Overall Progress */}
      <Card className="bg-navy-light/50 border-gold/10">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-400">Progresso Geral</p>
              <p className="font-heading font-bold text-3xl text-gold">{overallPct}%</p>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <div className="text-center"><p className="font-bold text-white text-lg">{stats.attended}/{stats.totalEncontros}</p><p>Presenças</p></div>
              <div className="text-center"><p className="font-bold text-white text-lg">{stats.checkDone}/{stats.checkTotal}</p><p>Checklist</p></div>
              <div className="text-center"><p className="font-bold text-white text-lg">{stats.materialsCompleted}/{stats.materialsTotal}</p><p>Materiais</p></div>
            </div>
          </div>
          <Progress value={overallPct} className="h-2 bg-navy-dark [&>div]:bg-gradient-gold" />
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-navy-light/30 border-gold/5">
          <CardContent className="p-5 text-center">
            <UserCheck className="h-6 w-6 text-emerald-400 mx-auto mb-2" />
            <p className="font-heading font-bold text-xl text-white">{attendancePct}%</p>
            <p className="text-xs text-gray-500 mt-1">Taxa de Presença</p>
            <Progress value={attendancePct} className="h-1 bg-navy-dark [&>div]:bg-emerald-500 mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-navy-light/30 border-gold/5">
          <CardContent className="p-5 text-center">
            <CheckSquare className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="font-heading font-bold text-xl text-white">{stats.checkDone}/{stats.checkTotal}</p>
            <p className="text-xs text-gray-500 mt-1">Ações Aplicadas</p>
            <Progress value={stats.checkTotal > 0 ? Math.round((stats.checkDone / stats.checkTotal) * 100) : 0} className="h-1 bg-navy-dark [&>div]:bg-gradient-gold mt-2" />
          </CardContent>
        </Card>
        <Card className="bg-navy-light/30 border-gold/5">
          <CardContent className="p-5 text-center">
            <FileText className="h-6 w-6 text-gold mx-auto mb-2" />
            <p className="font-heading font-bold text-xl text-white">{stats.materialsCompleted}/{stats.materialsTotal}</p>
            <p className="text-xs text-gray-500 mt-1">Materiais Concluídos</p>
            <Progress value={stats.materialsTotal > 0 ? Math.round((stats.materialsCompleted / stats.materialsTotal) * 100) : 0} className="h-1 bg-navy-dark [&>div]:bg-gradient-gold mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {pillarInsights.length > 0 && (
          <Card className="bg-navy-light/50 border-gold/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-heading text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-gold" /> Insights da IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pillarInsights.slice(0, 4).map((pi, i) => (
                <div key={i} className="bg-navy-dark/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white font-medium">{pi.title}</span>
                    <span className="text-[10px] text-gold font-heading font-semibold">{pi.score}%</span>
                  </div>
                  <p className="text-[11px] text-gray-400">{pi.insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card className="bg-navy-light/50 border-gold/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-heading text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Bell className="h-4 w-4 text-gold" /> Avisos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhum aviso no momento.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((a, i) => (
                  <div key={i} className="border-l-2 border-gold/30 pl-3">
                    <p className="text-sm text-white font-medium">{a.title}</p>
                    <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale: ptBR })}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {encontroSummaries.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg text-white">Encontros Recentes</h2>
            <Link to="/client/encontros">
              <Button size="sm" variant="ghost" className="text-gold text-xs hover:bg-gold/10">Ver todos →</Button>
            </Link>
          </div>
          <div className="space-y-2">
            {encontroSummaries.slice(0, 5).map(enc => (
              <Link key={enc.id} to={`/client/encontros/${enc.id}`}>
                <Card className="bg-navy-light/30 border-gold/5 hover:border-gold/20 transition-all cursor-pointer mb-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-white font-medium">{enc.title}</p>
                      <div className="flex items-center gap-2">
                        {enc.attendance === "present" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">✓ Presente</span>}
                        {enc.attendance === "absent" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">✗ Faltou</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-500">
                      {enc.date && <span>{new Date(enc.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>}
                      <span>{enc.materialsCompleted}/{enc.materialsTotal} materiais</span>
                      {enc.checkTotal > 0 && <span>{enc.checkDone}/{enc.checkTotal} checklist</span>}
                    </div>
                    <Progress value={enc.materialsTotal > 0 ? Math.round((enc.materialsCompleted / enc.materialsTotal) * 100) : 0} className="h-1 bg-navy-dark [&>div]:bg-gradient-gold mt-2" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
