import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Star, X, Loader2 } from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

interface RatingModalProps {
  tradeId:      string;
  targetName:   string;
  targetRole:   "buyer" | "seller";
  onClose:      () => void;
  onSubmitted?: () => void;
}

export function RatingModal({
  tradeId,
  targetName,
  targetRole,
  onClose,
  onSubmitted,
}: RatingModalProps) {
  const [rating, setRating]     = useState(0);
  const [hover, setHover]       = useState(0);
  const [comment, setComment]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Selecciona una calificación");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/trades/${tradeId}/rate`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSubmitted?.();
          onClose();
        }, 1500);
      } else {
        setError(data.error || "Error al calificar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            ¿Cómo fue tu experiencia?
          </h3>
          <button onClick={onClose} disabled={loading}>
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="text-5xl">🎉</div>
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              ¡Gracias por tu calificación!
            </p>
            <p className="text-xs text-gray-400">
              Tu opinión ayuda a construir confianza.
            </p>
          </div>
        ) : (
          <>
            {/* Info del target */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 text-center">
              <p className="text-xs text-gray-400">Estás calificando a</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {targetName}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {targetRole === "seller" ? "Vendedor" : "Comprador"}
              </p>
            </div>

            {/* Estrellas */}
            <div className="text-center space-y-2">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tu calificación
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`h-10 w-10 transition-colors ${
                        (hover || rating) >= star
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-300 dark:text-gray-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-sm font-bold text-amber-500 mt-2">
                  {rating === 5 ? "¡Excelente!"    :
                   rating === 4 ? "Muy bueno"      :
                   rating === 3 ? "Regular"        :
                   rating === 2 ? "Malo"           : "Muy malo"}
                </p>
              )}
            </div>

            {/* Comentario */}
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Comentario (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Cuenta cómo fue tu experiencia..."
                rows={3}
                maxLength={500}
                className="w-full px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              <p className="text-[10px] text-gray-400 text-right mt-1">
                {comment.length}/500
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                fullWidth
                onClick={onClose}
                disabled={loading}
              >
                Saltar
              </Button>
              <Button
                fullWidth
                loading={loading}
                disabled={rating === 0}
                onClick={handleSubmit}
                icon={<Star className="h-4 w-4" />}
              >
                Enviar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
      }
