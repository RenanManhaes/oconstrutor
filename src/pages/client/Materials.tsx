import { useState, lazy, Suspense } from "react";
import { FileText, Music, Play, Search, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { PlaylistItem } from "@/components/MediaPlayerDialog";
const MediaPlayerDialog = lazy(() => import("@/components/MediaPlayerDialog"));
const MaterialPreviewDialog = lazy(() => import("@/components/MaterialPreviewDialog"));
import { useAuth } from "@/contexts/AuthContext";
import { useMaterialsData, MaterialView } from "@/hooks/useMaterialsData";
import { usePagination } from "@/hooks/usePagination";

const typeIcon: Record<string, typeof Play> = { video: Play, audio: Music, pdf: FileText, image: Image };

const ClientMaterials = () => {
  const { user } = useAuth();
  const { data: materials = [], isLoading } = useMaterialsData();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [playerOpen, setPlayerOpen] = useState(false);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playerStartIndex, setPlayerStartIndex] = useState(0);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMat, setPreviewMat] = useState<{ title: string; url: string; type: "pdf" | "image" } | null>(null);

  const filtered = materials.filter(m =>
    (filter === "all" || m.type === filter) &&
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const { visible, hasMore, loadMore, total, shown } = usePagination(filtered, 24, `${filter}|${search}`);

  const openPlayer = (mat: MaterialView) => {
    if (!mat.url || (mat.type !== "video" && mat.type !== "audio")) return;
    const moduleMats = materials
      .filter(m => m.module_id === mat.module_id && (m.type === "video" || m.type === "audio") && m.url)
      .map(m => ({ id: m.id, title: m.title, type: m.type as "video" | "audio", url: m.url!, duration_minutes: m.duration_minutes }));
    
    if (moduleMats.length === 0) return;
    const idx = moduleMats.findIndex(m => m.id === mat.id);
    setPlaylist(moduleMats);
    setPlayerStartIndex(idx >= 0 ? idx : 0);
    setPlayerOpen(true);
  };

  const handleItemComplete = async (itemId: string) => {
    if (!user) return;
    const mat = materials.find(m => m.id === itemId);
    if (!mat) return;
    await supabase.from("user_progress").insert({
      user_id: user.id, material_id: itemId, module_id: mat.module_id, completed: true,
    });
    await supabase.from("access_logs").insert({
      user_id: user.id, content_type: mat.type, content_id: itemId,
    });
  };

  if (isLoading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-white">Materiais</h1>
        <p className="text-gray-400 text-sm mt-1">Biblioteca completa de conteúdos da mentoria.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input placeholder="Buscar material..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-navy-light/50 border-gold/10 text-white placeholder:text-gray-600" />
        </div>
        <div className="flex gap-2">
          {[{ key: "all", label: "Todos" }, { key: "video", label: "Vídeos" }, { key: "audio", label: "Áudios" }, { key: "pdf", label: "PDFs" }, { key: "image", label: "Imagens" }].map(f => (
            <Button key={f.key} size="sm" variant={filter === f.key ? "default" : "outline"}
              className={filter === f.key ? "bg-gradient-gold text-navy-dark font-semibold" : "border-gold/20 text-gray-400 hover:text-gold hover:bg-gold/10"}
              onClick={() => setFilter(f.key)}>
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <p className="text-gray-500 text-sm">Nenhum material encontrado.</p>}

      <div className="grid sm:grid-cols-2 gap-3">
        {visible.map(mat => {
          const Icon = typeIcon[mat.type] || FileText;
          const isMedia = mat.type === "video" || mat.type === "audio";
          const isPreviewable = (mat.type === "pdf" || mat.type === "image") && mat.url;
          const handleClick = () => {
            if (isMedia) openPlayer(mat);
            else if (isPreviewable) {
              setPreviewMat({ title: mat.title, url: mat.url!, type: mat.type as "pdf" | "image" });
              setPreviewOpen(true);
            }
          };
          return (
            <Card key={mat.id} className="bg-navy-light/30 border-gold/5 hover:border-gold/20 transition-all cursor-pointer" onClick={handleClick}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{mat.title}</p>
                  <p className="text-xs text-gray-500">{mat.moduleName} {mat.duration_minutes ? `• ${mat.duration_minutes} min` : ""}</p>
                </div>
                {(isMedia || isPreviewable) && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-gold" onClick={(e) => { e.stopPropagation(); handleClick(); }}>
                    <Play className="h-4 w-4" />
                  </Button>
                )}
                <span className="text-[10px] uppercase tracking-wider text-gray-500 border border-gray-700 rounded px-1.5 py-0.5">{mat.type}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-xs text-gray-500">Mostrando {shown} de {total}</p>
          <Button variant="outline" size="sm" className="border-gold/20 text-gold hover:bg-gold/10" onClick={loadMore}>
            Carregar mais
          </Button>
        </div>
      )}

      <Suspense fallback={null}>
        {playerOpen && (
          <MediaPlayerDialog
            open={playerOpen}
            onOpenChange={setPlayerOpen}
            playlist={playlist}
            startIndex={playerStartIndex}
            onItemComplete={handleItemComplete}
          />
        )}

        {previewMat && previewOpen && (
          <MaterialPreviewDialog
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            title={previewMat.title}
            url={previewMat.url}
            type={previewMat.type}
          />
        )}
      </Suspense>
    </div>
  );
};

export default ClientMaterials;
