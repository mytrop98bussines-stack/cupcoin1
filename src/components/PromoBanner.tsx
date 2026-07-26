import { useState, useEffect, useRef } from "react";
import { X, ArrowRight, ChevronRight } from "lucide-react";
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
  const [isAnimating, setIsAnimating] = useState(false);
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

      const seenIds = JSON.parse(
        localStorage.getItem("promos_seen") || "[]"
      ) as string[];

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
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIdx(currentIdx + 1);
        setIsAnimating(false);
      }, 150);
    } else {
      handleDismiss();
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
    } else {
      handleNext();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) < 50) return;

    if (diff > 0 && currentIdx < promos.length - 1) {
      handleNext();
    } else if (diff < 0 && currentIdx > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIdx(currentIdx - 1);
        setIsAnimating(false);
      }, 150);
    }
  };

  if (loading || !show || promos.length === 0) return null;

  const currentPromo = promos[currentIdx];
  const isLast       = currentIdx === promos.length - 1;
  const progress     = ((currentIdx + 1) / promos.length) * 100;

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-black/95 via-black/90 to-black/95 backdrop-blur-xl flex items-end sm:items-center justify-center animate-fade-in">

      {/* Header con progreso */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 pt-safe">
        <div className="max-w-md mx-auto">

          {/* Barra de progreso (segmentos) */}
          <div className="flex gap-1 mb-4">
            {promos.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden"
              >
                <div
                  className={`h-full bg-white transition-all duration-500 ${
                    i < currentIdx
                      ? "w-full"
                      : i === currentIdx
                      ? "w-full animate-pulse"
                      : "w-0"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Botón Saltar */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white text-xs font-bold transition-all"
            >
              Saltar
            </button>

            <span className="text-white/60 text-xs font-bold">
              {currentIdx + 1} / {promos.length}
            </span>

            <button
              onClick={handleDismiss}
              className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor del slide */}
      <div
        className="w-full max-w-md h-full sm:h-auto sm:max-h-[85vh] flex flex-col animate-slide-up"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

        {/* Contenido principal con imagen full */}
        <div className={`flex-1 flex flex-col justify-end sm:justify-center transition-opacity duration-150 ${
          isAnimating ? "opacity-0" : "opacity-100"
        }`}>

          {/* Imagen o emoji grande */}
          <div className="relative flex-1 sm:flex-none flex items-center justify-center px-8 pt-24 pb-8 sm:py-12">

            {currentPromo.imageUrl ? (
              <div className="relative w-full aspect-square max-w-[280px] max-h-[280px] mx-auto">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/30 to-purple-500/30 rounded-full blur-3xl animate-pulse" />
                <img
                  src={currentPromo.imageUrl}
                  alt={currentPromo.title}
                  className="relative w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/40 to-purple-500/40 rounded-full blur-3xl animate-pulse" />
                <div className="relative w-56 h-56 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
                  <span className="text-8xl">{currentPromo.emoji}</span>
                </div>
              </div>
            )}
          </div>

          {/* Card blanca con contenido */}
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl px-6 pt-8 pb-8 shadow-2xl safe-bottom">

            {/* Emoji pequeño si hay imagen */}
            {currentPromo.imageUrl && (
              <div className="flex justify-center mb-3">
                <span className="text-3xl">{currentPromo.emoji}</span>
              </div>
            )}

            {/* Título */}
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white text-center mb-3 leading-tight tracking-tight">
              {currentPromo.title}
            </h2>

            {/* Descripción */}
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center leading-relaxed mb-6 max-w-xs mx-auto">
              {currentPromo.description}
            </p>

            {/* Botón CTA principal */}
            {currentPromo.buttonText && currentPromo.buttonLink ? (
              <button
                onClick={() => handleButtonClick(currentPromo)}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-bold shadow-xl shadow-brand-500/30 transition-all active:scale-[0.98]"
              >
                {currentPromo.buttonText}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-sm font-bold shadow-xl shadow-brand-500/30 transition-all active:scale-[0.98]"
              >
                {isLast ? "Entendido" : "Siguiente"}
                {!isLast && <ChevronRight className="h-4 w-4" />}
              </button>
            )}

            {/* Indicadores (puntos elegantes) */}
            {promos.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {promos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setIsAnimating(true);
                      setTimeout(() => {
                        setCurrentIdx(i);
                        setIsAnimating(false);
                      }, 150);
                    }}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentIdx
                        ? "w-8 bg-brand-500"
                        : "w-2 bg-gray-300 dark:bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
