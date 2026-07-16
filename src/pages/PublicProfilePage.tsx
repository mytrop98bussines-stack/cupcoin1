import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ReportUserModal } from "@/components/ReportUserModal";
import {
  Star, ArrowLeftRight, Shield, Calendar,
  CheckCircle2, AlertTriangle, Flag, Clock,
} from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/data/data";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function PublicProfilePage() {
  const { selectedPublicUserId, navigate, user } = useAppStore();

  const [profile, setProfile]           = useState<any>(null);
  const [ratings, setRatings]           = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showReport, setShowReport]     = useState(false);

  useEffect(() => {
    if (!selectedPublicUserId) {
      navigate("p2p");
      return;
    }

    const loadProfile = async () => {
      try {
        const res  = await fetch(
          `${BACKEND_URL}/users/${selectedPublicUserId}/profile`
        );
        const data = await res.json();
        if (data.success) {
          setProfile(data.profile);
          setRatings(data.ratings);
          setActiveOrders(data.activeOrders);
        }
      } catch (err) {
        console.error("❌ Error cargando perfil:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [selectedPublicUserId]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-400">Cargando perfil...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
        <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">
          Usuario no encontrado
        </p>
        <Button size="sm" onClick={() => navigate("p2p")}>
          Volver al P2P
        </Button>
      </div>
    );
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("es-CU", {
        month: "long",
        year:  "numeric",
      })
    : "—";

  const kycConfig = {
    verified:             { label: "Verificado ✓", variant: "success" as const },
    pending_verification: { label: "En revisión",  variant: "info"    as const },
    unverified:           { label: "Sin verificar", variant: "warning" as const },
    rejected:             { label: "Rechazado",    variant: "danger"  as const },
  };

  const kyc = kycConfig[profile.kycStatus as keyof typeof kycConfig]
    || kycConfig.unverified;

  const stars = Math.round(profile.rating);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* ═══ PERFIL PRINCIPAL ════════════════════════════════ */}
      <Card padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 h-24 w-24 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <Avatar
            name={profile.displayName}
            src={profile.photoURL}
            size="lg"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                {profile.displayName}
              </h2>
              {profile.role === "admin" && (
                <Badge variant="danger" size="sm">Admin</Badge>
              )}
            </div>

            {/* Rating con estrellas */}
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`text-sm ${
                    s <= stars ? "opacity-100" : "opacity-20"
                  }`}
                >
                  ⭐
                </span>
              ))}
              <span className="text-xs font-bold text-gray-900 dark:text-white ml-1">
                {profile.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-400">
                ({ratings.length} reseñas)
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant={kyc.variant} size="sm">
                {kyc.label}
              </Badge>
              {profile.suspended && (
                <Badge variant="danger" size="sm">🚫 Suspendido</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
            <p className="text-lg font-black text-brand-500">
              {profile.totalTrades}
            </p>
            <p className="text-[10px] text-gray-400">Trades</p>
          </div>
          <div className="text-center p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
            <p className="text-lg font-black text-amber-500">
              {profile.rating.toFixed(1)}
            </p>
            <p className="text-[10px] text-gray-400">Rating</p>
          </div>
          <div className="text-center p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
            <p className="text-lg font-black text-emerald-500">
              {activeOrders.length}
            </p>
            <p className="text-[10px] text-gray-400">Órdenes</p>
          </div>
        </div>

        {/* Miembro desde */}
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          <span>Miembro desde {memberSince}</span>
        </div>

        {/* Botón de reporte — solo si no es el propio perfil */}
        {user?.uid !== profile.uid && (
          <button
            onClick={() => setShowReport(true)}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-red-200 dark:border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-500/5 transition-colors"
          >
            <Flag className="h-3.5 w-3.5" />
            Reportar usuario
          </button>
        )}
      </Card>

      {/* ═══ ÓRDENES ACTIVAS ═════════════════════════════════ */}
      {activeOrders.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
            Órdenes activas ({activeOrders.length})
          </h3>
          <div className="space-y-2">
            {activeOrders.map((order) => (
              <Card key={order.id} padding="md" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {order.asset === "USDT" ? "💵" :
                       order.asset === "BTC"  ? "₿"  :
                       order.asset === "ETH"  ? "Ξ"  : "🪙"}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {order.type === "sell" ? "Vende" : "Compra"} {order.asset}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {order.minAmount} – {order.maxAmount} {order.asset}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-brand-500">
                      {order.pricePerUnit.toLocaleString("es-CU")}
                    </p>
                    <p className="text-[10px] text-gray-400">{order.currency}</p>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {order.paymentMethods.map((m: string) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-500/10 text-brand-500"
                    >
                      {PAYMENT_METHOD_LABELS[m] || m}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ═══ RESEÑAS ═════════════════════════════════════════ */}
      <div>
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
          Reseñas ({ratings.length})
        </h3>

        {ratings.length === 0 ? (
          <Card padding="lg" className="text-center">
            <Star className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              Sin reseñas todavía
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {ratings.map((rating) => (
              <Card key={rating.id} padding="md" className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span
                        key={s}
                        className={`text-sm ${
                          s <= rating.rating ? "opacity-100" : "opacity-20"
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="h-3 w-3" />
                    {new Date(rating.createdAt).toLocaleDateString("es-CU")}
                  </div>
                </div>
                {rating.comment && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 italic">
                    "{rating.comment}"
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de reporte */}
      {showReport && (
        <ReportUserModal
          reportedUserId={profile.uid}
          reportedUserName={profile.displayName}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
    }
