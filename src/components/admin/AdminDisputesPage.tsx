import { useEffect, useState } from "react";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import {
  Scale, Loader2, AlertTriangle, CheckCircle2,
  Clock, MessageSquare, ImageIcon, X, ZoomIn,
  Timer, User, TrendingUp, Star, Shield,
  Send, ChevronDown, ChevronUp,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function AdminDisputesPage() {
  const [disputes, setDisputes]                 = useState<any[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [selectedTradeId, setSelectedTradeId]   = useState<string | null>(null);
  const [details, setDetails]                   = useState<any>(null);
  const [loadingDetails, setLoadingDetails]     = useState(false);
  const [resolving, setResolving]               = useState(false);
  const [adminNote, setAdminNote]               = useState("");
  const [lightboxUrl, setLightboxUrl]           = useState<string | null>(null);
  const [showChat, setShowChat]                 = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [success, setSuccess]                   = useState<string | null>(null);

  // ─── Cargar lista de disputas ─────────────────────────────
  useEffect(() => {
    let stopped = false;

    const loadDisputes = async () => {
      if (stopped) return;
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(`${BACKEND_URL}/admin/disputes`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && !stopped) {
          setDisputes(data.disputes || []);
        }
      } catch (err) {
        console.error("❌ Error cargando disputas:", err);
      } finally {
        if (!stopped) setLoading(false);
      }
    };

    void loadDisputes();
    const intervalId = window.setInterval(loadDisputes, 30000);

    return () => {
      stopped = true;
      window.clearInterval(intervalId);
    };
  }, []);

  // ─── Cargar detalles cuando se selecciona una disputa ────
  useEffect(() => {
    if (!selectedTradeId) {
      setDetails(null);
      return;
    }

    const loadDetails = async () => {
      setLoadingDetails(true);
      setError(null);
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(
          `${BACKEND_URL}/admin/disputes/${selectedTradeId}/details`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();

        if (data.success) {
          setDetails(data);
        } else {
          setError(data.error);
        }
      } catch {
        setError("Error cargando detalles");
      } finally {
        setLoadingDetails(false);
      }
    };

    void loadDetails();
  }, [selectedTradeId]);

  // ─── Resolver disputa ────────────────────────────────────
  const handleResolve = async (winner: "buyer" | "seller") => {
    if (!details) return;

    const winnerName = winner === "buyer" ? details.trade.buyerName : details.trade.sellerName;
    if (!confirm(`¿Resolver a favor de ${winnerName}? Esta acción es irreversible.`)) return;

    setResolving(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/admin/disputes/resolve`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          tradeId:   details.trade.id,
          winner,
          adminNote: adminNote.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`✅ Disputa resuelta a favor de ${winnerName}`);
        setTimeout(() => {
          setSelectedTradeId(null);
          setSuccess(null);
          setDisputes((prev) => prev.filter((d) => d.tradeId !== details.trade.id));
        }, 2000);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setResolving(false);
    }
  };

  // ─── Renderizar tiempo restante ──────────────────────────
  const formatTimeLeft = (expiresAt: number) => {
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) return "Expirado";
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto mb-4" />
        <p className="text-sm text-gray-400">Cargando disputas...</p>
      </div>
    );
  }

  // ═══ VISTA DE DETALLES ═══════════════════════════════════
  if (selectedTradeId && details) {
    const { trade, timer, evidence, messages, buyer, seller } = details;

    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedTradeId(null)}
            className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Disputa #{trade.id.slice(-6)}
            </h1>
            <p className="text-xs text-gray-400">
              {trade.amount} {trade.asset} · {trade.totalFiat?.toLocaleString("es-CU")} CUP
            </p>
          </div>
        </div>

        {/* Alertas */}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 text-xs text-emerald-700 dark:text-emerald-400">
            {success}
          </div>
        )}

        {/* Timer */}
        {timer && !timer.resolved && (
          <Card padding="md" className="bg-amber-500/5 border-amber-500/20">
            <div className="flex items-center justify-center gap-2">
              <Timer className="h-4 w-4 text-amber-500" />
              <span className="text-lg font-black text-amber-500">
                {formatTimeLeft(timer.expiresAt)}
              </span>
              <span className="text-xs text-gray-400">tiempo restante</span>
            </div>
          </Card>
        )}

        {/* Motivo de la disputa */}
        <Card padding="md" className="border-red-500/20 bg-red-500/5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-bold text-red-700 dark:text-red-400 mb-1">
                Iniciada por {trade.disputedByRole === "buyer" ? "Comprador" : "Vendedor"}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                {trade.disputeReason}
              </p>
              {trade.disputeDescription && (
                <p className="text-xs text-gray-600 dark:text-gray-300 italic mt-2">
                  "{trade.disputeDescription}"
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Partes involucradas */}
        <div className="grid grid-cols-2 gap-2">
          {/* Comprador */}
          <Card padding="md" className={trade.disputedByRole === "buyer" ? "border-red-500/30" : ""}>
            <div className="flex items-center gap-2 mb-2">
              <Avatar name={buyer?.displayName} src={buyer?.photoURL} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {buyer?.displayName || "N/A"}
                </p>
                <p className="text-[10px] text-brand-500 font-bold">COMPRADOR</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Rating</span>
                <span className="font-bold flex items-center gap-0.5">
                  {(buyer?.rating || 5).toFixed(1)}
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Trades</span>
                <span className="font-bold">{buyer?.totalTrades || 0}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Disputas</span>
                <span className={`font-bold ${
                  (buyer?.totalDisputes || 0) > 3 ? "text-red-500" : ""
                }`}>
                  {buyer?.totalDisputes || 0}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">KYC</span>
                <span className={`font-bold ${
                  buyer?.kycStatus === "verified" ? "text-emerald-500" : "text-amber-500"
                }`}>
                  {buyer?.kycStatus === "verified" ? "✓" : "✗"}
                </span>
              </div>
            </div>
          </Card>

          {/* Vendedor */}
          <Card padding="md" className={trade.disputedByRole === "seller" ? "border-red-500/30" : ""}>
            <div className="flex items-center gap-2 mb-2">
              <Avatar name={seller?.displayName} src={seller?.photoURL} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {seller?.displayName || "N/A"}
                </p>
                <p className="text-[10px] text-red-500 font-bold">VENDEDOR</p>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Rating</span>
                <span className="font-bold flex items-center gap-0.5">
                  {(seller?.rating || 5).toFixed(1)}
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Trades</span>
                <span className="font-bold">{seller?.totalTrades || 0}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">Disputas</span>
                <span className={`font-bold ${
                  (seller?.totalDisputes || 0) > 3 ? "text-red-500" : ""
                }`}>
                  {seller?.totalDisputes || 0}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-gray-400">KYC</span>
                <span className={`font-bold ${
                  seller?.kycStatus === "verified" ? "text-emerald-500" : "text-amber-500"
                }`}>
                  {seller?.kycStatus === "verified" ? "✓" : "✗"}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Evidencias */}
        <div>
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5" />
            Evidencias ({evidence.length})
          </h3>

          {evidence.length === 0 ? (
            <Card padding="md" className="text-center">
              <p className="text-xs text-gray-400">Sin evidencias subidas</p>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {evidence.map((ev: any) => {
                const isBuyerEvidence = ev.uploadedBy === trade.buyerId;
                return (
                  <div
                    key={ev.id}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer ${
                      isBuyerEvidence
                        ? "border-brand-500/30"
                        : "border-red-500/30"
                    }`}
                    onClick={() => setLightboxUrl(ev.imageUrl)}
                  >
                    <img
                      src={ev.imageUrl}
                      alt="Evidencia"
                      className="w-full h-24 object-cover"
                    />
                    <div className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${
                      isBuyerEvidence ? "bg-brand-500" : "bg-red-500"
                    }`}>
                      {isBuyerEvidence ? "Comprador" : "Vendedor"}
                    </div>
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn className="h-5 w-5 text-white opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat completo (expandible) */}
        <div>
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Chat completo ({messages.length} mensajes)
              </span>
            </div>
            {showChat
              ? <ChevronUp   className="h-4 w-4 text-gray-400" />
              : <ChevronDown className="h-4 w-4 text-gray-400" />
            }
          </button>

          {showChat && (
            <Card padding="md" className="mt-2 max-h-80 overflow-y-auto space-y-2">
              {messages.map((msg: any) => {
                const isSystem = msg.senderId === "SYSTEM";
                const isBuyer  = msg.senderId === trade.buyerId;

                if (isSystem) {
                  return (
                    <div key={msg.id} className="text-center">
                      <p className="text-[10px] text-gray-400 italic bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg inline-block">
                        {msg.text}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-lg ${
                      isBuyer
                        ? "bg-brand-500/10 ml-0 mr-8"
                        : "bg-red-500/10 ml-8 mr-0"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold ${
                        isBuyer ? "text-brand-500" : "text-red-500"
                      }`}>
                        {msg.senderName} · {isBuyer ? "Comprador" : "Vendedor"}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        {new Date(msg.createdAt).toLocaleTimeString("es-CU", {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {msg.text && (
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {msg.text}
                      </p>
                    )}
                    {msg.type === "image" && msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Chat img"
                        className="w-full max-w-[200px] rounded mt-1 cursor-pointer"
                        onClick={() => setLightboxUrl(msg.imageUrl)}
                      />
                    )}
                  </div>
                );
              })}
            </Card>
          )}
        </div>

        {/* Nota admin */}
        <div>
          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
            Nota administrativa (opcional)
          </label>
          <textarea
            value={adminNote}
            onChange={(e) => setAdminNote(e.target.value)}
            placeholder="Explica tu decisión (será visible para ambos usuarios)..."
            rows={3}
            maxLength={300}
            className="w-full px-4 py-3 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5"
          />
        </div>

        {/* Botones de resolución */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            fullWidth
            loading={resolving}
            onClick={() => handleResolve("buyer")}
            className="bg-brand-500 hover:bg-brand-600"
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            A favor Comprador
          </Button>
          <Button
            fullWidth
            loading={resolving}
            onClick={() => handleResolve("seller")}
            className="bg-red-500 hover:bg-red-600"
            icon={<CheckCircle2 className="h-4 w-4" />}
          >
            A favor Vendedor
          </Button>
        </div>

        {/* Lightbox */}
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center">
              <X className="h-5 w-5" />
            </button>
            <img
              src={lightboxUrl}
              alt="Evidencia ampliada"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }

  // ═══ VISTA DE LISTA ══════════════════════════════════════
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Scale className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Panel de Disputas
          </h1>
          <p className="text-xs text-gray-400">
            {disputes.length} disputa{disputes.length !== 1 ? "s" : ""} activa{disputes.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {loadingDetails && (
        <div className="text-center py-4">
          <Loader2 className="h-5 w-5 text-brand-500 animate-spin mx-auto" />
        </div>
      )}

      {disputes.length === 0 ? (
        <Card padding="lg" className="text-center
