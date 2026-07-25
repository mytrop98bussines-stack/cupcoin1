import { useState, useEffect, useRef } from "react";
import { X, ChevronRight, ChevronLeft, ArrowRight } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

interface Promo {
  id:          string;
  title:       string;
  description: string;
  imageUrl:    string | null;
  emoji:       string;
  buttonText:  string | null;
  buttonLink:  string | null;
}

export function PromoBanner() {
  const { navigate } = useAppStore();

  const [promos, setPromos]         = useState<Promo[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [show, setShow]             = useState(false);
  const [loading, setLoading]       = useState(true);
  const touchStartX                 = useRef(0);
  const touchEndX                   = useRef(0);

  useEffect(() => {
    void loadPromos();
  }, []);

  const loadPromos = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/promos`);
      const data = await res.json();

      if (!data.success || data.promos.length === 0) {
        setLoading(false);
        return;
      }

      // ✅ Verificar cuáles promos ya se vieron
      const seenIds = JSON.parse(
        localStorage.getItem("promos_seen") || "[]"
      ) as string[];

      // Filtrar solo las que NO se han visto
      const newPromos = data.promos.filter(
        (p: Promo) => !seenIds.includes(p.id)
      );

      if (newPromos.length > 0) {
        setPromos(newPromos);
        setShow(true);
      }
    } catch (err) {
      console.error("❌ Error cargando promos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    // ✅ Guardar los IDs de las promos vistas
    const seenIds = JSON.parse(
      localStorage.getItem("promos_seen") || "[]"
    ) as string[];

    const newSeenIds = [
      ...new Set([...seenIds, ...promos.map((p) => p.id)]),
    ];

    localStorage.setItem("promos_seen", JSON.stringify(newSeenIds));
    setShow(false);
  };

  const handleNext = () => {
    if (currentIdx < promos.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      handleDismiss();
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleButtonClick = (promo: Promo) => {
    if (promo.buttonLink) {
      if (promo.buttonLink.startsWith("http")) {
        window.open(promo.buttonLink, "_blank");
      } else {
        navigate(promo.buttonLink as any);
        handleDismiss();
      }
    }
  };

  // ─── Swipe touch ─────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) < 50) return;

    if (diff > 0) handleNext();
    else          handlePrev();
  };

  if (loading || !show || promos.length === 0) return null;

  const currentPromo = promos[currentIdx];

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">

      {/* Botón cerrar (X) */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Botón "Saltar" */}
      <button
        onClick={handleDismiss}
        className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors z-10"
      >
        Saltar
      </button>

      {/* Contenedor del carrusel */}
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl animate-slide-up"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Imagen */}
        <div className="relative aspect-video bg-gradient-to-br from-brand-500 to-brand-700 overflow-hidden">
          {currentPromo.imageUrl ? (
            <img
              src={currentPromo.imageUrl}
              alt={currentPromo.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl">{currentPromo.emoji}</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-4">

          {/* Emoji + Título */}
          <div className="text-center space-y-2">
            {currentPromo.imageUrl && (
              <span className="text-4xl">{currentPromo.emoji}</span>
            )}
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              {currentPromo.title}
            </h2>
          </div>

          {/* Descripción */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center leading-relaxed">
            {currentPromo.description}
          </p>

          {/* Botón CTA */}
          {currentPromo.buttonText && currentPromo.buttonLink && (
            <button
              onClick={() => handleButtonClick(currentPromo)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98]"
            >
              {currentPromo.buttonText}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {/* Indicadores (puntos) */}
          {promos.length > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              {promos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentIdx
                      ? "w-6 bg-brand-500"
                      : "w-1.5 bg-gray-300 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Navegación */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>

            <p className="text-[11px] text-gray-400 font-medium">
              {currentIdx + 1} de {promos.length}
            </p>

            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white transition-colors"
            >
              {currentIdx === promos.length - 1
                ? <X className="h-4 w-4" />
                : <ChevronRight className="h-5 w-5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
