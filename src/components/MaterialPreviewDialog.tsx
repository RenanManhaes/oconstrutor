import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, X, ZoomIn, ZoomOut, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { supabase } from "@/integrations/supabase/client";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const extractMediaPath = (url: string): string | null => {
  const markers = ["/storage/v1/object/public/media/", "/storage/v1/object/sign/media/", "/media/"];
  for (const m of markers) {
    const idx = url.indexOf(m);
    if (idx !== -1) {
      const rest = url.slice(idx + m.length);
      // remove query string
      return rest.split("?")[0];
    }
  }
  return null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string;
  type: "pdf" | "image";
}

const LazyPage = ({
  pageNumber,
  width,
  rootRef,
}: {
  pageNumber: number;
  width: number;
  rootRef: RefObject<HTMLDivElement>;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const root = rootRef.current;
    if (!el || !root) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
          }
        });
      },
      {
        root,
        rootMargin: "600px 0px",
        threshold: 0.01,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [rootRef, width]);

  const placeholderHeight = Math.round(width * 1.414);

  return (
    <div
      ref={ref}
      style={{ width, minHeight: visible ? undefined : placeholderHeight }}
      className="bg-white/5 rounded shadow-lg flex items-center justify-center overflow-hidden"
    >
      {visible ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          loading={<Loader2 className="h-6 w-6 text-gold animate-spin" />}
        />
      ) : (
        <div className="flex h-full min-h-[120px] w-full items-center justify-center bg-white/5">
          <Loader2 className="h-6 w-6 text-gold/40 animate-spin" />
        </div>
      )}
    </div>
  );
};

const MaterialPreviewDialog = ({ open, onOpenChange, title, url, type }: Props) => {
  const [zoom, setZoom] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [pdfFailed, setPdfFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const measureRafRef = useRef<number | null>(null);
  const lastMeasuredWidthRef = useRef(0);

  useEffect(() => {
    if (open) {
      setPdfFailed(false);
      setNumPages(0);
      setLoading(true);
      setZoom(1);
      setContainerWidth(0);
      setPdfData(null);
      lastMeasuredWidthRef.current = 0;
    }
  }, [open, url]);

  // Manual download of PDF -> Uint8Array (avoids react-pdf internal fetch issues)
  useEffect(() => {
    if (!open || type !== "pdf" || !url) return;

    let cancelled = false;

    const load = async () => {
      try {
        let bytes: Uint8Array | null = null;
        const mediaPath = extractMediaPath(url);

        if (mediaPath) {
          const { data, error } = await supabase.storage.from("media").download(mediaPath);
          if (error || !data) throw error ?? new Error("Falha ao baixar do storage");
          const buf = await data.arrayBuffer();
          bytes = new Uint8Array(buf);
        } else {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const buf = await res.arrayBuffer();
          bytes = new Uint8Array(buf);
        }

        if (!cancelled && bytes) {
          console.log(`[PDF] downloaded ${bytes.byteLength} bytes — pdfjs v${pdfjs.version}`);
          setPdfData(bytes);
        }
      } catch (err) {
        console.error("PDF download error:", err);
        if (!cancelled) {
          setPdfFailed(true);
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, type, url]);

  // Safety timeout: if PDF doesn't load in 20s, show error fallback
  useEffect(() => {
    if (!open || type !== "pdf" || !loading || pdfFailed) return;
    const timer = setTimeout(() => {
      if (loading) {
        console.error("PDF load timeout after 20s");
        setPdfFailed(true);
        setLoading(false);
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, [open, type, loading, pdfFailed, url]);

  const fileProp = useMemo(() => (pdfData ? { data: pdfData } : null), [pdfData]);
  const documentOptions = useMemo(
    () => ({
      cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
      cMapPacked: true,
    }),
    []
  );

  useEffect(() => {
    if (!open || type !== "pdf") return;

    const el = scrollRef.current;
    if (!el) return;

    const measure = () => {
      if (measureRafRef.current) {
        cancelAnimationFrame(measureRafRef.current);
      }

      measureRafRef.current = requestAnimationFrame(() => {
        const nextWidth = Math.max(280, Math.floor(el.clientWidth - 32));
        if (Math.abs(nextWidth - lastMeasuredWidthRef.current) > 1) {
          lastMeasuredWidthRef.current = nextWidth;
          setContainerWidth(nextWidth);
        }
      });
    };

    measure();

    const observer = new ResizeObserver(() => {
      measure();
    });

    observer.observe(el);
    window.addEventListener("orientationchange", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", measure);
      if (measureRafRef.current) {
        cancelAnimationFrame(measureRafRef.current);
      }
    };
  }, [open, type]);

  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "i" || e.key === "I")) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === "PrintScreen") {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [open]);

  const blockContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const pageWidth = containerWidth > 0 ? Math.min(Math.round(containerWidth * zoom), 1400) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-navy-dark border-gold/10 max-w-6xl w-[95vw] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col"
        onContextMenu={blockContextMenu}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-2.5 bg-red-900/30 border-b border-red-500/20 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400 shrink-0" />
            <span className="text-[10px] sm:text-xs text-red-300 font-heading font-semibold tracking-wide truncate">
              MATERIAL EXCLUSIVO — REPRODUÇÃO PROIBIDA
            </span>
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-white shrink-0" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="px-3 sm:px-4 py-2 border-b border-gold/5 flex items-center justify-between gap-2 shrink-0">
          <p className="text-white font-heading font-semibold text-xs sm:text-sm truncate min-w-0">{title}</p>
          <div className="flex items-center gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] text-gray-500 w-9 text-center">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => setZoom((z) => Math.min(3, z + 0.25))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain [-webkit-overflow-scrolling:touch] bg-black/30 select-none p-2 sm:p-4 relative"
          style={{ userSelect: "none", WebkitUserSelect: "none", touchAction: "pan-y" }}
          onDragStart={(e) => e.preventDefault()}
        >
          {type === "pdf" ? (
            !pdfFailed ? (
              <>
                {(loading || pageWidth === 0) && (
                  <div className="flex items-center justify-center w-full h-full absolute inset-0 z-10 pointer-events-none">
                    <Loader2 className="h-8 w-8 text-gold animate-spin" />
                  </div>
                )}
                {pageWidth > 0 && fileProp && (
                  <Document
                    file={fileProp}
                    options={documentOptions}
                    onLoadSuccess={({ numPages: total }) => {
                      setNumPages(total);
                      setLoading(false);
                    }}
                    onLoadError={(err) => {
                      console.error("PDF parse/render error:", err);
                      setPdfFailed(true);
                      setLoading(false);
                    }}
                    onSourceError={(err) => {
                      console.error("PDF source error:", err);
                      setPdfFailed(true);
                      setLoading(false);
                    }}
                    loading=""
                  >
                    <div className="flex flex-col items-center gap-4 pb-1" style={{ pointerEvents: "none" }}>
                      {Array.from({ length: numPages }, (_, i) => (
                        <LazyPage key={`${pageWidth}-${i + 1}`} pageNumber={i + 1} width={pageWidth} rootRef={scrollRef} />
                      ))}
                    </div>
                  </Document>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 p-8 m-auto min-h-full">
                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                <p className="text-muted-foreground text-sm text-center">
                  Não foi possível carregar o PDF no preview.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                >
                  Abrir em nova aba
                </Button>
                <p className="text-muted-foreground/60 text-xs text-center">
                  Se o problema persistir, entre em contato com o administrador.
                </p>
              </div>
            )
          ) : (
            <div className="flex min-h-full items-center justify-center">
              <img
                src={url}
                alt={title}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoom})`, pointerEvents: "none" }}
                draggable={false}
              />
            </div>
          )}
        </div>

        <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-900/20 border-t border-red-500/10 text-center shrink-0">
          <p className="text-[9px] sm:text-[10px] text-red-400/70 tracking-wider uppercase">
            Material protegido — uso exclusivo dos membros da mentoria O Construtor
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaterialPreviewDialog;
