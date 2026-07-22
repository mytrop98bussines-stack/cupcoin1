import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Star, Loader2, MessageSquare } from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

interface Review {
  id:         string;
  raterId:    string;
  raterName:  string;
  raterRole:  "buyer" | "seller";
  rating:     number;
  comment:    string;
  amount:     number;
  asset:      string;
  createdAt:  number;
}

interface ReviewsStats {
  total:   number;
  average: number;
  byStar:  Record<number, number>;
}

interface ReviewsListProps {
  userId: string;
}

export function ReviewsList({ userId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats]     = useState<ReviewsStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadReviews();
  }, [userId]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${BACKEND_URL}/users/${userId}/reviews?limit=20`);
      const data = await res.json();

      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("❌ Error cargando reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader2 className="h-6 w-6 text-brand-500 animate-spin mx-auto" />
      </div>
    );
  }

  if (!stats || stats.total === 0) {
    return (
      <Card padding="lg" className="text-center">
        <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          Sin calificaciones aún
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Las reseñas aparecerán aquí después de completar trades.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">

      {/* Resumen de rating */}
      <Card padding="md">
        <div className="flex items-center gap-4">
          {/* Nota promedio */}
          <div className="text-center">
            <p className="text-4xl font-black text-gray-900 dark:text-white">
              {stats.average.toFixed(1)}
            </p>
            <div className="flex justify-center mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${
                    s <= Math.round(stats.average)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              {stats.total} reseña{stats.total !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Distribución */}
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count      = stats.byStar[star] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 w-3">{star}</span>
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Lista de reviews */}
      <div className="space-y-2">
        {reviews.map((review) => (
          <Card key={review.id} padding="md">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {review.raterName}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-3 w-3 ${
                          s <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300 dark:text-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400">
                    · {review.raterRole === "buyer" ? "Comprador" : "Vendedor"}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400">
                {new Date(review.createdAt).toLocaleDateString("es-CU", {
                  day:   "numeric",
                  month: "short",
                  year:  "numeric",
                })}
              </p>
            </div>

            {review.comment && (
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mt-2">
                "{review.comment}"
              </p>
            )}

            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
              <p className="text-[10px] text-gray-400">
                Trade de {review.amount} {review.asset}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
