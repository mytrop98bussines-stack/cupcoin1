import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { db } from "@/lib/firebase/config";
import {
  collection, query, where, onSnapshot,
  doc, updateDoc, serverTimestamp, addDoc,
  getDoc, orderBy,
  setDoc, // ✅ añadir esto
} from "firebase/firestore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { useCallback } from "react";
import {
  Shield, Check, X, Eye, ExternalLink,
  AlertTriangle, CheckCircle2, Clock, User,
  FileText, MapPin, Search, ChevronDown,
  ChevronUp, Loader2, Crown, Gavel,
  RefreshCw, DollarSign, Edit2, Save,
} from "lucide-react";
import type { Dispute, MembershipPayment } from "@/types";
import { MessageSquare, Zap } from "lucide-react"; // ✅ añadir

type AdminTab = "kyc" | "disputes" | "memberships";

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
  kycDocuments?: { idFront?: string; selfie?: string };
  kycData?:    { fullName: string; idNumber: string; address: string };
  membership?: {
    status:    string;
    expiresAt: number;
  };
}

export function AdminKYCPage() {
  const { user } = useAppStore();

  const [activeTab, setActiveTab]         = useState<AdminTab>("kyc");
  const [pendingUsers, setPendingUsers]   = useState<KYCUser[]>([]);
  const [disputes, setDisputes]           = useState<Dispute[]>([]);
  const [payments, setPayments]           = useState<MembershipPayment[]>([]);
  const [loading, setLoading]             = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [filterStatus, setFilterStatus]   = useState("pending_verification");
  const [error, setError]                 = useState<string | null>(null);
  const [successMsg, setSuccessMsg]       = useState<string | null>(null);
  const [rejectReason, setRejectReason]   = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState<string | null>(null);
  // ✅ Mensajes del chat por tradeId
  const [disputeMessages, setDisputeMessages] = useState<
  Record<string, Array<{
    id:         string;
    senderId:   string;
    senderName: string;
    text:       string;
    createdAt:  number;
    type:       string;
  }>>
>({});

  // ─── Config editable ──────────────────────────────────────
  const [config, setConfig]               = useState({
    priceCUP:       100,
    priceUSDT:      0.25,
    freeTrialDays:  30,
    graceDays:      3,
    warnDaysBefore: 3,
  });
  const [editingConfig, setEditingConfig] = useState(false);
  const [savingConfig, setSavingConfig]   = useState(false);

  // ─── Cargar config ────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "membership"), (snap) => {
      if (snap.exists()) setConfig(snap.data() as typeof config);
    });
    return () => unsub();
  }, []);

  // ─── Cargar KYC users ─────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "kyc") return;
    setLoading(true);

    const statusFilter = filterStatus === "all"
      ? ["pending_verification", "verified", "rejected"]
      : [filterStatus];

    const q = query(
      collection(db, "users"),
      where("kycStatus", "in", statusFilter)
    );

    const unsub = onSnapshot(q, (snap) => {
      const users: KYCUser[] = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as KYCUser[];

      users.sort((a, b) => {
        const aTime = a.kycSubmittedAt?.seconds || 0;
        const bTime = b.kycSubmittedAt?.seconds || 0;
        return bTime - aTime;
      });

      setPendingUsers(users);
      setLoading(false);
    }, (err) => {
      setError("Error al cargar solicitudes: " + err.message);
      setLoading(false);
    });

    return () => unsub();
  }, [activeTab, filterStatus]);

  // ─── Cargar disputas ──────────────────────────────────────
  useEffect(() => {
    if (activeTab !== "disputes") return;
    setLoading(true);

    const q = query(
      collection(db, "system_alerts"),
      where("tipo", "==", "trade_disputado"),
      where("resuelto", "==", false),
      orderBy("timestamp", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id:          d.id,
        tradeId:     d.data().tradeId,
        buyerId:     d.data().buyerId,
        buyerName:   d.data().buyerName  || "Comprador",
        sellerId:    d.data().sellerId,
        sellerName:  d.data().sellerName || "Vendedor",
        asset:       d.data().asset,
        amount:      d.data().amount,
        initiatedBy: d.data().disputadoPor || "",
        status:      "open" as const,
        createdAt:   d.data().timestamp,
      })) as Dispute[];
      setDisputes(list);
      setLoading(false);
    });

    return () => unsub();
  }, [activeTab]);

  // ─── Cargar pagos de membresía ────────────────────────────
  useEffect(() => {
    if (activeTab !== "memberships") return;
    setLoading(true);

    const q = query(
      collection(db, "membership_payments"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as MembershipPayment[];
      setPayments(list);
      setLoading(false);
    });

    return () => unsub();
  }, [activeTab]);

  // ─── Guardar config ───────────────────────────────────────
  // ✅ Después — crea o actualiza sin importar si existe
const handleSaveConfig = async () => {
  setSavingConfig(true);
  try {
    // setDoc con merge:true crea el documento si no existe
    // y actualiza si ya existe
    await setDoc(
      doc(db, "config", "membership"),
      config,
      { merge: true }
    );
    setEditingConfig(false);
    setSuccessMsg("✅ Configuración guardada.");
    setTimeout(() => setSuccessMsg(null), 3000);
  } catch (err: any) {
    setError("Error guardando config: " + err.message);
  } finally {
    setSavingConfig(false);
  }
};

  // ─── Aprobar KYC ──────────────────────────────────────────
  const handleApprove = async (kycUser: KYCUser) => {
    setActionLoading(kycUser.id);
    try {
      await updateDoc(doc(db, "users", kycUser.id), {
        kycStatus:     "verified",
        kycReviewedAt: serverTimestamp(),
        kycReviewedBy: user?.uid,
      });

      await addDoc(collection(db, "notifications"), {
        userId:    kycUser.id,
        title:     "✅ Verificación aprobada",
        body:      "Tu identidad ha sido verificada. Ahora puedes operar sin restricciones en CubaX.",
        type:      "kyc",
        read:      false,
        createdAt: Date.now(),
      });

      setSuccessMsg(`✅ ${kycUser.kycData?.fullName || kycUser.displayName} verificado.`);
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
    try {
      await updateDoc(doc(db, "users", kycUser.id), {
        kycStatus:       "rejected",
        kycRejectedAt:   serverTimestamp(),
        kycRejectedBy:   user?.uid,
        kycRejectReason: reason,
      });

      await addDoc(collection(db, "notifications"), {
        userId:    kycUser.id,
        title:     "❌ Verificación rechazada",
        body:      `Tu solicitud KYC fue rechazada. Motivo: ${reason}.`,
        type:      "kyc",
        read:      false,
        createdAt: Date.now(),
      });

      setShowRejectForm(null);
      setSuccessMsg(`❌ Solicitud rechazada.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError("Error al rechazar: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Resolver disputa ─────────────────────────────────────
  const handleResolveDispute = async (
  disputeId: string,
  tradeId:   string,
  favor:     "buyer" | "seller"
) => {
  setActionLoading(disputeId);
  try {
    // ✅ Leer el trade para obtener los UIDs
    const tradeSnap = await getDoc(doc(db, "trades", tradeId));
    if (!tradeSnap.exists()) throw new Error("Trade no encontrado");

    const tradeData = tradeSnap.data();
    const winnerId  = favor === "buyer" ? tradeData.buyerId  : tradeData.sellerId;
    const loserId   = favor === "buyer" ? tradeData.sellerId : tradeData.buyerId;
    const winnerName = favor === "buyer" ? tradeData.buyerName : tradeData.sellerName;
    const loserName  = favor === "buyer" ? tradeData.sellerName : tradeData.buyerName;

    // ✅ Marcar alerta como resuelta
    await updateDoc(doc(db, "system_alerts", disputeId), {
      resuelto:   true,
      resolvedBy: user?.uid,
      resolvedAt: Date.now(),
      resolution: favor,
    });

    // ✅ Actualizar estado del trade
    await updateDoc(doc(db, "trades", tradeId), {
      status:     favor === "buyer" ? "crypto_released" : "cancelled",
      resolvedBy: user?.uid,
      resolvedAt: Date.now(),
      updatedAt:  Date.now(),
    });

    // ✅ Si gana el comprador — transferir fondos
    if (favor === "buyer" && tradeData.escrowAmount > 0) {
      const buyerRef  = doc(db, "users", tradeData.buyerId);
      const buyerSnap = await getDoc(buyerRef);
      if (buyerSnap.exists()) {
        const currentBalance = buyerSnap.data().balances?.[tradeData.asset] || 0;
        await updateDoc(buyerRef, {
          [`balances.${tradeData.asset}`]: currentBalance + tradeData.amount,
        });
      }
    }

    // ✅ Si gana el vendedor — devolver fondos al vendedor
    if (favor === "seller" && tradeData.escrowAmount > 0) {
      const sellerRef  = doc(db, "users", tradeData.sellerId);
      const sellerSnap = await getDoc(sellerRef);
      if (sellerSnap.exists()) {
        const currentBalance = sellerSnap.data().balances?.[tradeData.asset] || 0;
        await updateDoc(sellerRef, {
          [`balances.${tradeData.asset}`]: currentBalance + tradeData.amount,
        });
      }
    }

    // ✅ Notificar al ganador
    await addDoc(collection(db, "notifications"), {
      userId:    winnerId,
      title:     "✅ Disputa resuelta a tu favor",
      body:      `El moderador resolvió la disputa del trade #${tradeId.slice(-6)} a tu favor. Los fondos han sido procesados.`,
      type:      "trade",
      read:      false,
      createdAt: Date.now(),
      data:      { tradeId, resolution: "won" },
    });

    // ✅ Notificar al perdedor
    await addDoc(collection(db, "notifications"), {
      userId:    loserId,
      title:     "❌ Disputa resuelta",
      body:      `El moderador resolvió la disputa del trade #${tradeId.slice(-6)} a favor de ${winnerName}.`,
      type:      "trade",
      read:      false,
      createdAt: Date.now(),
      data:      { tradeId, resolution: "lost" },
    });

    // ✅ Mensaje del sistema en el chat
    await addDoc(collection(db, "trades", tradeId, "messages"), {
      senderId:   "SYSTEM",
      senderName: "CubaX Admin",
      text:       `⚖️ RESOLUCIÓN: El moderador resolvió la disputa a favor del ${
        favor === "buyer" ? "comprador" : "vendedor"
      }. ${favor === "buyer"
        ? `${tradeData.buyerName} recibe los fondos.`
        : `Los fondos son devueltos a ${tradeData.sellerName}.`}`,
      createdAt:  Date.now(),
      type:       "system",
    });

    setSuccessMsg(
      `✅ Disputa resuelta a favor del ${favor === "buyer" ? "comprador" : "vendedor"}.`
    );
    setTimeout(() => setSuccessMsg(null), 4000);

  } catch (err: any) {
    setError("Error resolviendo disputa: " + err.message);
  } finally {
    setActionLoading(null);
  }
};

  // ─── Aprobar pago de membresía ────────────────────────────
  const handleApprovePayment = async (payment: MembershipPayment) => {
    setActionLoading(payment.id);
    try {
      const now       = Date.now();
      const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

      // Actualizar membresía del usuario
      await updateDoc(doc(db, "users", payment.userId), {
        membership: {
          status:      "active",
          startedAt:   now,
          expiresAt,
          plan:        "monthly",
          lastPayment: now,
        },
      });

      // Marcar pago como completado
      await updateDoc(doc(db, "membership_payments", payment.id), {
        status:     "completed",
        reviewedAt: now,
        reviewedBy: user?.uid,
      });

      // Notificar al usuario
      await addDoc(collection(db, "notifications"), {
        userId:    payment.userId,
        title:     "✅ Membresía activada",
        body:      `Tu pago fue aprobado. Membresía activa hasta ${new Date(expiresAt).toLocaleDateString("es-CU")}.`,
        type:      "membership",
        read:      false,
        createdAt: now,
      });

      setSuccessMsg("✅ Membresía activada para el usuario.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError("Error aprobando pago: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Rechazar pago de membresía ───────────────────────────
  const handleRejectPayment = async (payment: MembershipPayment) => {
    setActionLoading(payment.id);
    try {
      await updateDoc(doc(db, "membership_payments", payment.id), {
        status:     "rejected",
        reviewedAt: Date.now(),
        reviewedBy: user?.uid,
      });

      await addDoc(collection(db, "notifications"), {
        userId:    payment.userId,
        title:     "❌ Pago rechazado",
        body:      "Tu comprobante de pago fue rechazado. Verifica el monto y vuelve a intentarlo.",
        type:      "membership",
        read:      false,
        createdAt: Date.now(),
      });

      setSuccessMsg("❌ Pago rechazado.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError("Error rechazando pago: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Dar membresía manual ─────────────────────────────────
  const handleGiveManualMembership = async (userId: string, userName: string) => {
    setActionLoading(userId);
    try {
      const now       = Date.now();
      const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

      await updateDoc(doc(db, "users", userId), {
        membership: {
          status:      "manual",
          startedAt:   now,
          expiresAt,
          plan:        "monthly",
          lastPayment: now,
        },
      });

      await addDoc(collection(db, "notifications"), {
        userId,
        title:     "🎁 Membresía de cortesía",
        body:      "El administrador te ha dado una membresía gratuita por 30 días.",
        type:      "membership",
        read:      false,
        createdAt: now,
      });

      setSuccessMsg(`✅ Membresía manual dada a ${userName}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError("Error dando membresía: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

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

  const totalPending  = pendingUsers.filter((u) => u.kycStatus === "pending_verification").length;
  const totalVerified = pendingUsers.filter((u) => u.kycStatus === "verified").length;
  const totalRejected = pendingUsers.filter((u) => u.kycStatus === "rejected").length;

  const filteredUsers = pendingUsers.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.kycData?.fullName?.toLowerCase().includes(q) ||
      u.displayName?.toLowerCase().includes(q)       ||
      u.email?.toLowerCase().includes(q)             ||
      u.id.toLowerCase().includes(q)
    );
  });

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
              Panel Admin
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Administración interna de CubaX
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          En tiempo real
        </div>
      </div>

      {/* Mensajes */}
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
          <p className="text-xs text-emerald-700 dark:text-emerald-400 flex-1">{successMsg}</p>
        </div>
      )}

      {/* ═══ PESTAÑAS ════════════════════════════════════════ */}
      <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1">
        {[
          { key: "kyc",         label: "KYC",        icon: <Shield  className="h-3.5 w-3.5" /> },
          { key: "disputes",    label: "Disputas",   icon: <Gavel   className="h-3.5 w-3.5" /> },
          { key: "memberships", label: "Membresías", icon: <Crown   className="h-3.5 w-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as AdminTab);
              setExpandedId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === tab.key
                ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "kyc" && totalPending > 0 && (
              <span className="h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                {totalPending}
              </span>
            )}
            {tab.key === "disputes" && disputes.length > 0 && (
              <span className="h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                {disputes.length}
              </span>
            )}
            {tab.key === "memberships" && payments.length > 0 && (
              <span className="h-4 w-4 rounded-full bg-blue-500 text-white text-[9px] font-black flex items-center justify-center">
                {payments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ═══ PESTAÑA KYC ════════════════════════════════════ */}
      {activeTab === "kyc" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Pendientes", value: totalPending,  color: "text-amber-500",   bg: "bg-amber-500/10",   icon: <Clock        className="h-4 w-4" /> },
              { label: "Verificados", value: totalVerified, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: <CheckCircle2 className="h-4 w-4" /> },
              { label: "Rechazados",  value: totalRejected, color: "text-red-500",     bg: "bg-red-500/10",     icon: <X            className="h-4 w-4" /> },
            ].map((stat) => (
              <div key={stat.label} className={`p-3 rounded-xl ${stat.bg} text-center`}>
                <div className={`flex items-center justify-center gap-1 ${stat.color} mb-1`}>
                  {stat.icon}
                </div>
                <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, CI o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-amber-500 outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-amber-500 outline-none"
            >
              <option value="pending_verification">Pendientes</option>
              <option value="verified">Verificados</option>
              <option value="rejected">Rechazados</option>
              <option value="all">Todos</option>
            </select>
          </div>

          {/* Lista KYC */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">Cargando...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card padding="lg" className="text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Sin solicitudes pendientes
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((kycUser) => {
                const isExpanded  = expandedId === kycUser.id;
                const isActioning = actionLoading === kycUser.id;
                const isPending   = kycUser.kycStatus === "pending_verification";
                const isVerified  = kycUser.kycStatus === "verified";
                const name        = kycUser.kycData?.fullName || kycUser.displayName || "Sin nombre";

                return (
                  <Card
                    key={kycUser.id}
                    padding="md"
                    className={`transition-all ${
                      isPending  ? "border-amber-500/20"  :
                      isVerified ? "border-emerald-500/20" :
                      "border-red-500/20"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : kycUser.id)}
                      className="w-full flex items-center gap-3 text-left"
                    >
                      <Avatar name={name} src={kycUser.photoURL || undefined} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {name}
                          </p>
                          <Badge
                            variant={isPending ? "warning" : isVerified ? "success" : "danger"}
                            size="sm"
                          >
                            {isPending ? "Pendiente" : isVerified ? "Verificado" : "Rechazado"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-400 truncate">{kycUser.email}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {formatDate(kycUser.kycSubmittedAt)}
                        </p>
                      </div>
                      {isExpanded
                        ? <ChevronUp   className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06] space-y-4">
                        {/* Datos */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { icon: <User     className="h-3.5 w-3.5 text-brand-500" />, label: "Nombre",    value: kycUser.kycData?.fullName || "—" },
                            { icon: <FileText className="h-3.5 w-3.5 text-amber-500" />, label: "CI",        value: kycUser.kycData?.idNumber || "—" },
                            { icon: <MapPin   className="h-3.5 w-3.5 text-red-500"   />, label: "Dirección", value: kycUser.kycData?.address  || "—" },
                          ].map((item) => (
                            <div key={item.label} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
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
                        <p className="text-[10px] text-gray-400 font-mono bg-gray-50 dark:bg-white/5 px-3 py-2 rounded-xl">
                          UID: {kycUser.id}
                        </p>

                        {/* Documentos */}
                        {kycUser.kycDocuments?.selfie && (
                          <div>
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                              Selfie con CI
                            </p>
                            <div className="relative group w-full">
                              <img
                                src={kycUser.kycDocuments.selfie}
                                alt="Selfie"
                                className="w-full h-40 object-cover rounded-xl border border-gray-200 dark:border-white/10"
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
                        )}

                        {/* Membresía manual */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                          <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              Membresía
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {kycUser.membership?.status === "active"
                                ? `Activa hasta ${new Date(kycUser.membership.expiresAt).toLocaleDateString("es-CU")}`
                                : "Sin membresía"}
                            </p>
                          </div>
                          <button
                            onClick={() => handleGiveManualMembership(kycUser.id, name)}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-500 text-xs font-bold hover:bg-brand-500/20 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === kycUser.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Dar membresía"
                            )}
                          </button>
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
                              placeholder="Ej: El CI no es legible..."
                              rows={3}
                              className="w-full text-sm bg-gray-50 dark:bg-white/5 border border-red-300 dark:border-red-500/30 rounded-xl px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none resize-none"
                            />
                          </div>
                        )}

                        {/* Botones KYC */}
                        {isPending && (
                          <div className="flex gap-2">
                            {showRejectForm === kycUser.id ? (
                              <>
                                <button
                                  onClick={() => setShowRejectForm(null)}
                                  className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-sm font-bold text-gray-600 dark:text-gray-300"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleReject(kycUser)}
                                  disabled={isActioning}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-50"
                                >
                                  {isActioning
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <X className="h-4 w-4" />
                                  }
                                  Confirmar rechazo
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setShowRejectForm(kycUser.id)}
                                  disabled={isActioning}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-500/20 text-red-500 text-sm font-bold"
                                >
                                  <X className="h-4 w-4" /> Rechazar
                                </button>
                                <button
                                  onClick={() => handleApprove(kycUser)}
                                  disabled={isActioning}
                                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-50"
                                >
                                  {isActioning
                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                    : <Check className="h-4 w-4" />
                                  }
                                  Aprobar KYC
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {!isPending && (
                          <div className={`flex items-center gap-2 p-3 rounded-xl ${
                            isVerified
                              ? "bg-emerald-500/10 border border-emerald-500/20"
                              : "bg-red-500/10 border border-red-500/20"
                          }`}>
                            {isVerified
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              : <X           className="h-4 w-4 text-red-500" />
                            }
                            <p className={`text-xs font-semibold ${
                              isVerified
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}>
                              {isVerified
                                ? "Usuario verificado correctamente."
                                : "Solicitud rechazada."}
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
      )}

      {/* ═══ PESTAÑA DISPUTAS ═══════════════════════════════ */}
      {activeTab === "disputes" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
              Disputas abiertas
            </h2>
            <Badge variant="danger" size="sm">
              {disputes.length} pendientes
            </Badge>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-gray-400">Cargando disputas...</p>
            </div>
          ) : disputes.length === 0 ? (
            <Card padding="lg" className="text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                Sin disputas activas
              </p>
              <p className="text-xs text-gray-400">
                No hay disputas pendientes de resolución.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {disputes.map((dispute) => {
                const isExpanded  = expandedId === dispute.id;
                const isActioning = actionLoading === dispute.id;

                return (
                  <Card
                    key={dispute.id}
                    padding="md"
                    className="border-red-500/20 bg-red-500/[0.01]"
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                      className="w-full flex items-center gap-3 text-left"
                    >
                      <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <Gavel className="h-5 w-5 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            Trade #{dispute.tradeId?.slice(-6)}
                          </p>
                          <Badge variant="danger" size="sm">En disputa</Badge>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {dispute.buyerName} vs {dispute.sellerName}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {dispute.amount} {dispute.asset} en juego
                        </p>
                      </div>
                      {isExpanded
                        ? <ChevronUp   className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06] space-y-4">
                        {/* Info del trade */}
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "Comprador",  value: dispute.buyerName  },
                            { label: "Vendedor",   value: dispute.sellerName },
                            { label: "Activo",     value: dispute.asset      },
                            { label: "Monto",      value: `${dispute.amount} ${dispute.asset}` },
                          ].map((item) => (
                            <div key={item.label} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                {item.label}
                              </p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {item.value}
                              </p>
                            </div>
                          ))}
                        </div>
{/* ═══ PESTAÑA DISPUTAS ═══════════════════════════════ */}
{activeTab === "disputes" && (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-bold text-gray-900 dark:text-white">
        Disputas abiertas
      </h2>
      <Badge variant="danger" size="sm">
        {disputes.length} pendientes
      </Badge>
    </div>

    {loading ? (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-400">Cargando disputas...</p>
      </div>
    ) : disputes.length === 0 ? (
      <Card padding="lg" className="text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          Sin disputas activas
        </p>
        <p className="text-xs text-gray-400">
          No hay disputas pendientes de resolución.
        </p>
      </Card>
    ) : (
      <div className="space-y-3">
        {disputes.map((dispute) => {
          const isExpanded  = expandedId === dispute.id;
          const isActioning = actionLoading === dispute.id;

          return (
            <Card
              key={dispute.id}
              padding="md"
              className="border-red-500/20 bg-red-500/[0.01]"
            >
              {/* ─── Cabecera de la disputa ─────────────── */}
              <button
                onClick={() => {
                  setExpandedId(isExpanded ? null : dispute.id);
                  // ✅ Cargar mensajes del chat cuando se expande
                  if (!isExpanded && dispute.tradeId) {
                    loadDisputeMessages(dispute.tradeId);
                  }
                }}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Gavel className="h-5 w-5 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      Trade #{dispute.tradeId?.slice(-6)}
                    </p>
                    <Badge variant="danger" size="sm">En disputa</Badge>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {dispute.buyerName} vs {dispute.sellerName}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {dispute.amount} {dispute.asset} en juego
                  </p>
                </div>
                {isExpanded
                  ? <ChevronUp   className="h-4 w-4 text-gray-400" />
                  : <ChevronDown className="h-4 w-4 text-gray-400" />
                }
              </button>

              {/* ─── Contenido expandido ─────────────────── */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06] space-y-4">

                  {/* Info del trade */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Comprador",  value: dispute.buyerName  },
                      { label: "Vendedor",   value: dispute.sellerName },
                      { label: "Activo",     value: dispute.asset      },
                      { label: "Monto",      value: `${dispute.amount} ${dispute.asset}` },
                    ].map((item) => (
                      <div key={item.label} className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Trade ID */}
                  <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl">
                    <p className="text-[10px] text-gray-400 font-mono flex-1 truncate">
                      Trade ID: {dispute.tradeId}
                    </p>
                  </div>

                  {/* ✅ CHAT DEL TRADE ─────────────────────── */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      Chat entre usuarios
                    </p>

                    <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">

                      {/* Mensajes */}
                      <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-white/[0.02]">
                        {disputeMessages[dispute.tradeId]?.length === 0 ? (
                          <div className="h-full flex items-center justify-center">
                            <p className="text-xs text-gray-400">
                              Sin mensajes en este trade
                            </p>
                          </div>
                        ) : disputeMessages[dispute.tradeId] ? (
                          disputeMessages[dispute.tradeId].map((msg, idx) => {
                            const isSystem = msg.senderId === "SYSTEM";
                            const isBuyer  = msg.senderId === dispute.buyerId;

                            if (isSystem) {
                              return (
                                <div key={idx} className="flex justify-center">
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-200 dark:bg-white/10 max-w-[90%]">
                                    <Zap className="h-3 w-3 text-brand-500 flex-shrink-0" />
                                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 text-center">
                                      {msg.text}
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div
                                key={idx}
                                className={`flex flex-col ${isBuyer ? "items-start" : "items-end"}`}
                              >
                                <div className="flex items-center gap-1 mb-0.5 px-1">
                                  <span className={`text-[10px] font-bold ${
                                    isBuyer
                                      ? "text-emerald-500"
                                      : "text-blue-500"
                                  }`}>
                                    {isBuyer
                                      ? `🟢 ${dispute.buyerName} (Comprador)`
                                      : `🔵 ${dispute.sellerName} (Vendedor)`}
                                  </span>
                                  <span className="text-[9px] text-gray-400 font-mono">
                                    {new Date(msg.createdAt).toLocaleTimeString([], {
                                      hour:   "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                                  isBuyer
                                    ? "bg-emerald-500/10 text-gray-800 dark:text-gray-200 rounded-tl-none border border-emerald-500/20"
                                    : "bg-blue-500/10 text-gray-800 dark:text-gray-200 rounded-tr-none border border-blue-500/20"
                                }`}>
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <div className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Footer del chat */}
                      <div className="px-3 py-2 bg-white dark:bg-navy-900 border-t border-gray-100 dark:border-white/[0.06]">
                        <p className="text-[10px] text-gray-400 text-center">
                          Vista de solo lectura — Chat del trade en disputa
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Aviso al admin */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">
                      ⚠️ Instrucciones para el moderador
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400">
                      Revisa el chat completo antes de resolver.
                      Considera quién tiene más evidencias.
                      La decisión es irreversible.
                    </p>
                  </div>

                  {/* Botones de resolución */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Resolver a favor de:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleResolveDispute(dispute.id, dispute.tradeId, "buyer")
                        }
                        disabled={isActioning}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold disabled:opacity-50 transition-colors"
                      >
                        {isActioning
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Check className="h-4 w-4" />
                        }
                        Comprador
                      </button>
                      <button
                        onClick={() =>
                          handleResolveDispute(dispute.id, dispute.tradeId, "seller")
                        }
                        disabled={isActioning}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold disabled:opacity-50 transition-colors"
                      >
                        {isActioning
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Check className="h-4 w-4" />
                        }
                        Vendedor
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    )}
  </div>
)}

      {/* ═══ PESTAÑA MEMBRESÍAS ══════════════════════════════ */}
      {activeTab === "memberships" && (
        <div className="space-y-4">

          {/* Config editable */}
          <Card padding="md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Configuración de precios
              </h3>
              <button
                onClick={() =>
                  editingConfig ? handleSaveConfig() : setEditingConfig(true)
                }
                disabled={savingConfig}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  editingConfig
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                }`}
              >
                {savingConfig ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : editingConfig ? (
                  <><Save className="h-3.5 w-3.5" /> Guardar</>
                ) : (
                  <><Edit2 className="h-3.5 w-3.5" /> Editar</>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "priceCUP",       label: "Precio CUP",          suffix: "CUP"  },
                { key: "priceUSDT",      label: "Precio USDT",          suffix: "USDT" },
                { key: "freeTrialDays",  label: "Días prueba gratis",   suffix: "días" },
                { key: "graceDays",      label: "Días de gracia",       suffix: "días" },
                { key: "warnDaysBefore", label: "Avisar antes de",      suffix: "días" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {field.label}
                  </label>
                  {editingConfig ? (
                    <div className="relative">
                      <input
                        type="number"
                        value={config[field.key as keyof typeof config]}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            [field.key]: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 pr-12 text-sm rounded-xl border border-brand-500 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">
                        {field.suffix}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {config[field.key as keyof typeof config]} {field.suffix}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Pagos pendientes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Comprobantes pendientes
              </h3>
              <Badge variant="info" size="sm">
                {payments.length} pendientes
              </Badge>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-400">Cargando...</p>
              </div>
            ) : payments.length === 0 ? (
              <Card padding="lg" className="text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  Sin comprobantes pendientes
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const isExpanded  = expandedId === payment.id;
                  const isActioning = actionLoading === payment.id;

                  return (
                    <Card key={payment.id} padding="md" className="border-blue-500/20">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : payment.id)}
                        className="w-full flex items-center gap-3 text-left"
                      >
                        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {payment.userName}
                            </p>
                            <Badge variant="info" size="sm">Pendiente</Badge>
                          </div>
                          <p className="text-[11px] text-gray-400">
                            {payment.amount} {payment.currency} · {payment.method}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            Ref: {payment.reference}
                          </p>
                        </div>
                        {isExpanded
                          ? <ChevronUp   className="h-4 w-4 text-gray-400" />
                          : <ChevronDown className="h-4 w-4 text-gray-400" />
                        }
                      </button>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/[0.06] space-y-3">
                          {/* Captura */}
                          {payment.screenshot && (
                            <div>
                              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                Comprobante de pago
                              </p>
                              <div className="relative group">
                                <img
                                  src={payment.screenshot}
                                  alt="Comprobante"
                                  className="w-full h-48 object-cover rounded-xl border border-gray-200 dark:border-white/10"
                                />
                                <a
                                  href={payment.screenshot}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"
                                >
                                  <div className="flex items-center gap-1.5 text-white text-xs font-bold">
                                    <Eye className="h-4 w-4" />
                                    Ver completo
                                  </div>
                                </a>
                              </div>
                            </div>
                          )}

                          {/* Detalles */}
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2.5">
                              <p className="text-[10px] text-gray-400 mb-0.5">Monto</p>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {payment.amount} {payment.currency}
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2.5">
                              <p className="text-[10px] text-gray-400 mb-0.5">Método</p>
                              <p className="font-bold text-gray-900 dark:text-white capitalize">
                                {payment.method}
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2.5">
                              <p className="text-[10px] text-gray-400 mb-0.5">Referencia</p>
                              <p className="font-bold text-gray-900 dark:text-white font-mono">
                                {payment.reference}
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-2.5">
                              <p className="text-[10px] text-gray-400 mb-0.5">Periodo</p>
                              <p className="font-bold text-gray-900 dark:text-white">
                                {payment.period}
                              </p>
                            </div>
                          </div>

                          {/* Botones */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRejectPayment(payment)}
                              disabled={isActioning}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 dark:border-red-500/20 text-red-500 text-sm font-bold disabled:opacity-50"
                            >
                              {isActioning
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <X className="h-4 w-4" />
                              }
                              Rechazar
                            </button>
                            <button
                              onClick={() => handleApprovePayment(payment)}
                              disabled={isActioning}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold disabled:opacity-50"
                            >
                              {isActioning
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Check className="h-4 w-4" />
                              }
                              Aprobar
                            </button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
