import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { db } from "@/lib/firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  Shield,
  Check,
  X,
  Eye,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  FileText,
  MapPin,
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface KYCUser {
  id:          string;
  fullName:    string;
  idNumber:    string;
  address:     string;
  email:       string;
  displayName: string;
  photoURL:    string | null;
  kycStatus:   string;
  kycSubmittedAt?: any;
  kycDocuments?: {
    idFront?: string;
    selfie?:  string;
  };
  kycData?: {
    fullName: string;
    idNumber: string;
    address:  string;
  };
}

export function AdminKYCPage() {
  const { user } = useAppStore();

  const [pendingUsers, setPendingUsers]   = useState<KYCUser[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterStatus, setFilterStatus]   = useState<"pending_verification" | "all">("pending_verification");
  const [error, setError]                 = useState<string | null>(null);
  const [successMsg, setSuccessMsg]       = useState<string | null>(null);
  const [rejectReason, setRejectReason]   = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);

  // ─── Listener en tiempo real ──────────────────────────────
  useEffect(() => {
    setLoading(true);

    const statusFilter = filterStatus === "all"
      ? ["pending_verification", "verified", "rejected"]
      : ["pending_verification"];

    const q = query(
      collection(db, "users"),
      where("kycStatus", "in", statusFilter)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const users: KYCUser[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as KYCUser[];

        // Ordenar por fecha de envío (más reciente primero)
        users.sort((a, b) => {
          const aTime = a.kycSubmittedAt?.seconds || 0;
          const bTime = b.kycSubmittedAt?.seconds || 0;
          return bTime - aTime;
        });

        setPendingUsers(users);
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando KYC:", err);
        setError("Error al cargar solicitudes. Verifica tus permisos de administrador.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [filterStatus]);

  // ─── Aprobar KYC ──────────────────────────────────────────
  const handleApprove = async (kycUser: KYCUser) => {
    setActionLoading(kycUser.id);
    setError(null);

    try {
      await updateDoc(doc(db, "users", kycUser.id), {
        kycStatus:    "verified",
        kycReviewedAt: serverTimestamp(),
        kycReviewedBy: user?.uid,
      });

      // ✅ Notificar al usuario
      await addDoc(collection(db, "notifications"), {
  userId:    kycUser.id,
  title:     "✅ Verificación aprobada",
  body:      "Tu identidad ha sido verificada. Ahora puedes operar sin restricciones en CubaX.", // ✅ body
  type:      "kyc",
  read:      false,
  createdAt: Date.now(),
});

      setSuccessMsg(`✅ ${kycUser.fullName || kycUser.displayName} verificado correctamente.`);
      setTimeout(() => setSuccessMsg(null), 4000);

    } catch (err: any) {
      setError("Error al aprobar: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Rechazar KYC ─────────────────────────────────────────
  const handleReject = async (kycUser: KYCUser) => {
    const reason = rejectReason[kycUser.id] || "Documentos no válidos o ilegibles.";

    setActionLoading(kycUser.id);
    setError(null);

    try {
      await updateDoc(doc(db, "users", kycUser.id), {
        kycStatus:      "rejected",
        kycRejectedAt:  serverTimestamp(),
        kycRejectedBy:  user?.uid,
        kycRejectReason: reason,
      });

      // ✅ Notificar al usuario con el motivo
      await addDoc(collection(db, "notifications"), {
  userId:    kycUser.id,
  title:     "❌ Verificación rechazada",
  body:      `Tu solicitud KYC fue rechazada. Motivo: ${reason}. Puedes volver a intentarlo.`, // ✅ body
  type:      "kyc",
  read:      false,
  createdAt: Date.now(),
});

      setShowRejectForm(null);
      setRejectReason((prev) => ({ ...prev, [kycUser.id]: "" }));
      setSuccessMsg(`❌ Solicitud de ${kycUser.fullName || kycUser.displayName} rechazada.`);
      setTimeout(() => setSuccessMsg(null), 4000);

    } catch (err: any) {
      setError("Error al rechazar: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Filtrado local ───────────────────────────────────────
  const filteredUsers = pendingUsers.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q)    ||
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)       ||
      u.idNumber?.includes(q)                  ||
      u.id.toLowerCase().includes(q)
    );
  });

  // ─── Stats ────────────────────────────────────────────────
  const totalPending  = pendingUsers.filter((u) => u.kycStatus === "pending_verification").length;
  const totalVerified = pendingUsers.filter((u) => u.kycStatus === "verified").length;
  const totalRejected = pendingUsers.filter((u) => u.kycStatus === "rejected").length;

  // ─── Formatear fecha ──────────────────────────────────────
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";
    try {
      const date = timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
      return date.toLocaleString("es-CU");
    } catch {
      return "—";
    }
  };

  // ─── RENDER ───────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Panel KYC Admin
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Administración interna de CubaX
            </p>
          </div>
        </div>

        {/* Indicador en vivo */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          En tiempo real
        </div>
      </div>

      {/* Error / Éxito */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 flex-1">
            {successMsg}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            label: "Pendientes",
            value: totalPending,
            color: "text-amber-500",
            bg:    "bg-amber-500/10",
            icon:  <Clock className="h-4 w-4" />,
          },
          {
            label: "Verificados",
            value: totalVerified,
            color: "text-emerald-500",
            bg:    "bg-emerald-500/10",
            icon:  <CheckCircle2 className="h-4 w-4" />,
          },
          {
            label: "Rechazados",
            value: totalRejected,
            color: "text-red-500",
            bg:    "bg-red-500/10",
            icon:  <X className="h-4 w-4" />,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`p-3 rounded-xl ${stat.bg} text-center`}
          >
            <div
              className={`flex items-center justify-center gap-1 ${stat.color} mb-1`}
            >
              {stat.icon}
            </div>
            <p className={`text-2xl font-black ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {/* Búsqueda */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, CI o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
          />
        </div>

        {/* Filtro de estado */}
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as typeof filterStatus)
          }
          className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-amber-500 outline-none"
        >
          <option value="pending_verification">Pendientes</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cargando solicitudes...
          </p>
        </div>

      ) : filteredUsers.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="h-7 w-7 text-emerald-500" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            {searchQuery
              ? "Sin resultados"
              : "Sin solicitudes pendientes"}
          </p>
          <p className="text-xs text-gray-400">
            {searchQuery
              ? "Prueba con otro término de búsqueda."
              : "¡Todas las solicitudes han sido procesadas!"}
          </p>
        </Card>

      ) : (
        <div className="space-y-3">
          {filteredUsers.map((kycUser) => {
            const isExpanded  = expandedId === kycUser.id;
            const isActioning = actionLoading === kycUser.id;
            const isPending   = kycUser.kycStatus === "pending_verification";
            const isVerified  = kycUser.kycStatus === "verified";
            const isRejected  = kycUser.kycStatus === "rejected";
            const name        = kycUser.kycData?.fullName || kycUser.fullName || kycUser.displayName || "Sin nombre";

            return (
              <Card
                key={kycUser.id}
                padding="md"
                className={`space-y-0 transition-all ${
                  isPending
                    ? "border-amber-500/20 bg-amber-500/[0.01]"
                    : isVerified
                    ? "border-emerald-500/20 bg-emerald-500/[0.01]"
                    : "border-red-500/20 bg-red-500/[0.01]"
                }`}
              >
                {/* Header de la tarjeta */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : kycUser.id)
                  }
                  className="w-full flex items-center gap-3 text-left"
                >
                  {/* Avatar */}
                  <Avatar
                    name={name}
                    src={kycUser.photoURL || undefined}
                    size="md"
                  />

                  {/* Info básica */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {name}
                      </p>
                      <Badge
                        variant={
                          isPending ? "warning" :
                          isVerified ? "success" : "danger"
                        }
                        size="sm"
                      >
                        {isPending
                          ? "Pendiente"
                          : isVerified
                          ? "Verificado"
                          : "Rechazado"}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">
                      {kycUser.email}
                    </p>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      Enviado: {formatDate(kycUser.kycSubmittedAt)}
                    </p>
                  </div>

                  {/* Chevron */}
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Contenido expandido */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06] space-y-4">

                    {/* Datos del KYC */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          icon:  <User     className="h-3.5 w-3.5 text-brand-500" />,
                          label: "Nombre completo",
                          value: kycUser.kycData?.fullName || kycUser.fullName || "—",
                        },
                        {
                          icon:  <FileText className="h-3.5 w-3.5 text-amber-500" />,
                          label: "Carné de identidad",
                          value: kycUser.kycData?.idNumber || kycUser.idNumber || "—",
                        },
                        {
                          icon:  <MapPin   className="h-3.5 w-3.5 text-red-500" />,
                          label: "Dirección",
                          value: kycUser.kycData?.address || kycUser.address || "—",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="bg-gray-50 dark:bg-white/5 rounded-xl p-3"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            {item.icon}
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              {item.label}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {item.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* UID */}
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2">
                      <p className="text-[10px] text-gray-400 font-mono flex-1 truncate">
                        UID: {kycUser.id}
                      </p>
                    </div>

                    {/* Documentos */}
                    <div>
                      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                        Documentos adjuntos
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Vista previa Selfie */}
                        {kycUser.kycDocuments?.selfie ? (
                          <div className="space-y-2">
                            <p className="text-[10px] font-semibold text-gray-400">
                              Selfie con CI
                            </p>
                            <div className="relative group">
                              <img
                                src={kycUser.kycDocuments.selfie}
                                alt="Selfie"
                                className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                              />
                              <a
                                href={kycUser.kycDocuments.selfie}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                              >
                                <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                                  <Eye className="h-4 w-4" />
                                  Ver completo
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </div>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="h-32 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                            <p className="text-xs text-gray-400">Sin selfie</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Formulario de rechazo */}
                    {showRejectForm === kycUser.id && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Motivo del rechazo
                        </label>
                        <textarea
                          value={rejectReason[kycUser.id] || ""}
                          onChange={(e) =>
                            setRejectReason((prev) => ({
                              ...prev,
                              [kycUser.id]: e.target.value,
                            }))
                          }
                          placeholder="Ej: El CI no es legible, la foto está borrosa..."
                          rows={3}
                          className="w-full text-sm bg-gray-50 dark:bg-white/5 border border-red-300 dark:border-red-500/30 rounded-xl px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none"
                        />
                      </div>
                    )}

                    {/* Botones de acción */}
                    {isPending && (
                      <div className="flex gap-2 pt-2">
                        {/* Rechazar */}
                        {showRejectForm === kycUser.id ? (
                          <>
                            <button
                              onClick={() => setShowRejectForm(null)}
                              className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleReject(kycUser)}
                              disabled={isActioning}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
                            >
                              {isActioning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                              Confirmar rechazo
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setShowRejectForm(kycUser.id)}
                              disabled={isActioning}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-500/20 text-red-500 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-500/5 transition-all disabled:opacity-50"
                            >
                              <X className="h-4 w-4" />
                              Rechazar
                            </button>

                            {/* Aprobar */}
                            <button
                              onClick={() => handleApprove(kycUser)}
                              disabled={isActioning}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                            >
                              {isActioning ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Aprobar KYC
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Ya procesado */}
                    {!isPending && (
                      <div
                        className={`flex items-center gap-2 p-3 rounded-xl ${
                          isVerified
                            ? "bg-emerald-500/10 border border-emerald-500/20"
                            : "bg-red-500/10 border border-red-500/20"
                        }`}
                      >
                        {isVerified ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <p
                          className={`text-xs font-semibold ${
                            isVerified
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isVerified
                            ? "Este usuario ha sido verificado correctamente."
                            : "Esta solicitud fue rechazada."}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
