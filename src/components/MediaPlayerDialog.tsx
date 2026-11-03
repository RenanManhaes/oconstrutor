import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack, SkipForward, Music, Volume2, VolumeX, X, Lock, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface PlaylistItem {
  id: string;
  title: string;
  type: "video" | "audio";
  url: string;
  duration_minutes: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: PlaylistItem[];
  startIndex?: number;
  onItemComplete?: (itemId: string) => void;
}

const MediaPlayerDialog = ({ open, onOpenChange, playlist, startIndex = 0, onItemComplete }: Props) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const current = playlist[currentIndex];

  useEffect(() => {
    setCurrentIndex(startIndex);
  }, [startIndex, open]);

  // Reset buffering/error state when track changes
  useEffect(() => {
    setBuffering(true);
    setLoadError(false);
    setProgress(0);
    setDuration(0);
  }, [currentIndex, current?.id]);

  const getRef = useCallback(() => {
    return current?.type === "video" ? videoRef.current : audioRef.current;
  }, [current?.type]);

  useEffect(() => {
    const el = getRef();
    if (!el || !open) return;
    if (playing) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [playing, currentIndex, open, getRef]);

  const handleTimeUpdate = () => {
    const el = getRef();
    if (!el) return;
    setProgress(el.currentTime);
    setDuration(el.duration || 0);
  };

  const handleEnded = () => {
    if (current) onItemComplete?.(current.id);
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setPlaying(true);
    } else {
      setPlaying(false);
    }
  };

  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = getRef();
    if (!el || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    el.currentTime = pct * duration;
  };

  const goTo = (idx: number) => {
    setCurrentIndex(idx);
    setPlaying(true);
    setProgress(0);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-navy-dark border-gold/10 max-w-7xl w-[96vw] h-[92vh] p-0 gap-0 overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
        <div className="flex h-full flex-col">
          {/* Copy protection banner */}
          <div className="flex items-center gap-2 px-4 py-1.5 bg-red-900/20 border-b border-red-500/10">
            <Lock className="h-3 w-3 text-red-400" />
            <span className="text-[10px] text-red-400/80 tracking-wider uppercase">Material exclusivo — Reprodução proibida</span>
          </div>
          <div className="flex flex-1 min-h-0">
          {/* Main player area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Close */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gold/5">
              <div className="min-w-0">
                <p className="text-white font-heading font-semibold text-sm truncate">{current.title}</p>
                <p className="text-gray-500 text-xs">{currentIndex + 1} de {playlist.length}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-500 hover:text-white shrink-0" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Media */}
            <div className="flex-1 flex items-center justify-center bg-black/40 relative overflow-hidden">
              {current.type === "video" ? (
                <>
                  <video
                    ref={videoRef}
                    key={current.id}
                    src={current.url}
                    className="w-full h-full object-contain"
                    muted={muted}
                    autoPlay
                    preload="auto"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    onPlay={() => { setPlaying(true); setBuffering(false); }}
                    onPause={() => setPlaying(false)}
                    onWaiting={() => setBuffering(true)}
                    onPlaying={() => setBuffering(false)}
                    onCanPlay={() => setBuffering(false)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                    onError={() => { setBuffering(false); setLoadError(true); }}
                  />
                  {buffering && !loadError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                      <Loader2 className="h-10 w-10 text-gold animate-spin" />
                    </div>
                  )}
                  {loadError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none px-4 text-center">
                      <p className="text-sm text-red-300">Não foi possível carregar a mídia. Verifique sua conexão.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="h-32 w-32 rounded-2xl bg-gold/10 flex items-center justify-center relative">
                    {buffering && !loadError ? (
                      <Loader2 className="h-12 w-12 text-gold animate-spin" />
                    ) : (
                      <Music className="h-16 w-16 text-gold" />
                    )}
                  </div>
                  <p className="text-white font-heading font-semibold text-lg text-center px-4">{current.title}</p>
                  {loadError ? (
                    <p className="text-xs text-red-300 px-4 text-center">Não foi possível carregar o áudio. Verifique sua conexão.</p>
                  ) : buffering ? (
                    <p className="text-xs text-gray-400">Carregando áudio...</p>
                  ) : null}
                  <audio
                    ref={audioRef}
                    key={current.id}
                    src={current.url}
                    muted={muted}
                    autoPlay
                    preload="auto"
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    onPlay={() => { setPlaying(true); setBuffering(false); }}
                    onPause={() => setPlaying(false)}
                    onWaiting={() => setBuffering(true)}
                    onPlaying={() => setBuffering(false)}
                    onCanPlay={() => setBuffering(false)}
                    onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
                    onError={() => { setBuffering(false); setLoadError(true); }}
                  />
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="px-4 py-3 border-t border-gold/5 space-y-2">
              {/* Progress bar */}
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span className="w-10 text-right">{formatTime(progress)}</span>
                <div className="flex-1 h-1.5 bg-navy-light rounded-full cursor-pointer group" onClick={seekTo}>
                  <div
                    className="h-full bg-gradient-gold rounded-full relative transition-all"
                    style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="w-10">{formatTime(duration)}</span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-center gap-3">
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white" disabled={currentIndex === 0} onClick={() => goTo(currentIndex - 1)}>
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-gold text-navy-dark hover:bg-gold/80"
                  onClick={() => setPlaying(!playing)}
                >
                  {buffering ? <Loader2 className="h-5 w-5 animate-spin" /> : playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white" disabled={currentIndex >= playlist.length - 1} onClick={() => goTo(currentIndex + 1)}>
                  <SkipForward className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-white ml-4" onClick={() => setMuted(!muted)}>
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Playlist sidebar */}
          {playlist.length > 1 && (
            <div className="w-64 border-l border-gold/5 flex flex-col bg-navy-light/20">
              <div className="px-4 py-3 border-b border-gold/5">
                <p className="text-xs font-heading font-semibold text-gray-400 uppercase tracking-wider">Playlist</p>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {playlist.map((item, idx) => (
                    <button
                      key={item.id}
                      onClick={() => goTo(idx)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-all",
                        idx === currentIndex
                          ? "bg-gold/10 border border-gold/20"
                          : "hover:bg-white/5 border border-transparent"
                      )}
                    >
                      <div className={cn(
                        "h-7 w-7 rounded flex items-center justify-center shrink-0",
                        idx === currentIndex ? "bg-gold text-navy-dark" : "bg-navy-light text-gray-500"
                      )}>
                        {idx === currentIndex && playing ? (
                          <div className="flex items-center gap-0.5">
                            <div className="w-0.5 h-2 bg-navy-dark animate-pulse" />
                            <div className="w-0.5 h-3 bg-navy-dark animate-pulse delay-75" />
                            <div className="w-0.5 h-2 bg-navy-dark animate-pulse delay-150" />
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold">{idx + 1}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-medium truncate", idx === currentIndex ? "text-gold" : "text-gray-300")}>
                          {item.title}
                        </p>
                        {item.duration_minutes && (
                          <p className="text-[10px] text-gray-600">{item.duration_minutes} min</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaPlayerDialog;
