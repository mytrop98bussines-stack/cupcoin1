import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";
const ROTATION_INTERVAL = 5000; // 5 segundos
const SWIPE_THRESHOLD = 50; // píxeles mínimos para considerar swipe

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
  const [isPaused, setIsPaused]     = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const intervalRef  = useRef<NodeJS.Timeout | null>(null);
  const touchStartX  = useRef(0);
  const touchCurrentX = useRef(0);

  useEffect(() => {
    void loadPromos();
  }, []);

  // Auto-rotación
  useEffect(() => {
    if (!show || promos.length <= 1 || isPaused || isDragging) return;

    intervalRef.current = setInterval(() => {
      goToNext();
    }, ROTATION_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [show, promos.length, isPaused, isDragging, currentIdx]);

  const loadPromos = async () => {
    try {
      const res  = await fetch(`${BACKEND_URL}/promos`);
      const data = await res.json();

      if (!data.success || data.promos.length === 0) {
        setLoading(false);
        return;
      }

      // ✅ Mostramos TODAS las promos activas del backend
      setPromos(data.promos);
      setShow(true);
    } catch (err) {
      console.error("❌ Error cargando promos:", err);
    } finally {
      setLoading(false);
    }
  };

  // ❌ Ya no guardamos en localStorage, solo cerramos temporalmente
  const handleDismiss = () => {
    setShow(false);
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

  const goToNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % promos.length);
      setIsAnimating(false);
    }, 200);
  };

  const goToPrev = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIdx((prev) => (prev - 1 + promos.length) % promos.length);
      setIsAnimating(false);
    }, 200);
  };

  // ==================== SWIPE ====================
  const handleTouchStart = (e: React.TouchEvent) => {
    if (promos.length <= 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchCurrentX.current = e.touches[0].clientX;
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || promos.length <= 1) return;
    touchCurrentX.current = e.touches[0].clientX;
    const offset = touchCurrentX.current - touchStartX.current;
    setDragOffset(offset * 0.5);
  };

  const handleTouchEnd = () => {
    if (!isDragging || promos.length <= 1) {
      setIsDragging(false);
      return;
    }

    const diff = touchStartX.current - touchCurrentX.current;

    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    setDragOffset(0);
    setIsDragging(false);

    setTimeout(() => setIsPaused(false), 3000);
  };

  // ==================== MOUSE (desktop) ====================
  const handleMouseDown = (e: React.MouseEvent) => {
    if (promos.length <= 1) return;
    touchStartX.current = e.clientX;
    touchCurrentX.current = e.clientX;
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || promos.length <= 1) return;
    touchCurrentX.current = e.clientX;
    const offset = touchCurrentX.current - touchStartX.current;
    setDragOffset(offset * 0.5);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    handleTouchEnd();
  };

  if (loading || !show || promos.length === 0) return null;

  const currentPromo = promos[currentIdx];

  return (
    <div className="px-4 py-2">
      <div
        className="relative bg-gray-100 dark:bg-gray-800/60 rounded-2xl px-4 py-3 flex items-center gap-3 overflow-hidden select-none cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => {
          setIsPaused(false);
          if (isDragging) handleMouseUp();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Barra de progreso auto-rotación */}
        {promos.length > 1 && !isPaused && !isDragging && (
          <div
            className="absolute bottom-0 left-0 h-0.5 bg-brand-500/60"
            key={currentIdx}
            style={{ animation: `progressBar ${ROTATION_INTERVAL}ms linear` }}
          />
        )}

        {/* Contador + cerrar (arriba derecha) */}
        <div className="absolute top-2 right-3 flex items-center gap-2 z-10">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {currentIdx + 1}/{promos.length}
          </span>
          <button
            onClick={handleDismiss}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenido con animación fade + arrastre */}
        <div
          className={`flex items-center gap-3 flex-1 ${
            isAnimating ? "opacity-0" : "opacity-100"
          } ${isDragging ? "" : "transition-all duration-200"}`}
          style={{
            transform: `translateX(${dragOffset}px)`,
          }}
        >
          {/* Imagen o emoji a la izquierda */}
          <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center pointer-events-none">
            {currentPromo.imageUrl ? (
              <img
                src={currentPromo.imageUrl}
                alt={currentPromo.title}
                draggable={false}
                className="w-full h-full object-contain"
              />
            ) : (
              <span className="text-4xl">{currentPromo.emoji}</span>
            )}
          </div>

          {/* Título */}
          <div className="flex-1 min-w-0 pr-16 pointer-events-none">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
              {currentPromo.title}
            </h3>
          </div>

          {/* Botón CTA */}
          {currentPromo.buttonText && (
            <button
              onClick={() => handleButtonClick(currentPromo)}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              {currentPromo.buttonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
