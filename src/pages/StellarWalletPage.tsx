import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import {
  Star, Send, Copy, Check, ExternalLink,
  Loader2, AlertTriangle, CheckCircle2, X,
  Plus, ArrowDownToLine,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function StellarWalletPage() {
  const { user } = useAppStore();

  const [publicKey, setPublicKey] = useState("");
  const [balances, setBalances]   = useState<Record<string, number>>({ XLM: 0 });
  const [network, setNetwork]     = useState("testnet");
  const [loading, setLoading]     = useState(true);
  const [creating, setCreating]   = useState(false);

  const [showSend, setShowSend]           = useState(false);
  const [showReceive, setShowReceive]     = useState(false);
  const [toAddress, setToAddress]         = useState("");
  const [amount, setAmount]               = useState("");
  const [memo, setMemo]                   = useState("");
  const [sending, setSending]             = useState(false);

  const [copied, setCopied]           = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [success, setSuccess]         = useState<string | null>(null);
  const [lastTxHash, setLastTxHash]   = useState<string | null>(null);
  const [lastExplorer, setLastExplorer] = useState<string | null>(null);

  // ─── Cargar balance ────────────────────────────────────────
  useEffect(() => {
    void loadBalance();
  }, []);

  const loadBalance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/stellar/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setPublicKey(data.publicKey);
        setBalances(data.balances);
        setNetwork(data.network || "testnet");
      } else if (data.code === "NO_STELLAR_ACCOUNT") {
        setPublicKey("");
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  // ─── Crear cuenta Stellar ─────────────────────────────────
  const handleCreateAccount = async () => {
    setCreating(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/stellar/create-account`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setPublicKey(data.publicKey);
        setSuccess("✅ Cuenta Stellar creada exitosamente");
        setTimeout(() => setSuccess(null), 3000);
        void loadBalance();
      } else {
        setError(data.error);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setCreating(false);
    }
  };

  // ─── Enviar XLM ───────────────────────────────────────────
  const handleSend = async () => {
    setError(null);
    setLastTxHash(null);
    setLastExplorer(null);

    if (!toAddress.startsWith("G") || toAddress.length !== 56) {
      setError("Dirección Stellar inválida (debe empezar con G y tener 56 caracteres)");
      return;
    }

    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Ingresa un monto válido");
      return;
    }

    if (amt > (balances.XLM || 0) - 1.5) {
      setError("Balance insuficiente (recuerda dejar ~1.5 XLM de reserva)");
      return;
    }

    setSending(true);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/stellar/send`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          toAddress: toAddress.trim(),
          amount:    amt,
          memo:      memo.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setLastTxHash(data.txHash);
        setLastExplorer(data.explorerUrl);
        setSuccess("✅ Pago enviado exitosamente");
        setToAddress("");
        setAmount("");
        setMemo("");
        setShowSend(false);
        setTimeout(() => setSuccess(null), 5000);
        void loadBalance();
      } else {
        setError(data.error || "Error al enviar");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSending(false);
    }
  };

  // ─── Copiar dirección ─────────────────────────────────────
  const handleCopyAddress = async () => {
    if (!publicKey) return;
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  // ─── PANTALLA: Sin cuenta Stellar ─────────────────────────
  if (!publicKey && !loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Star className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Wallet Stellar
            </h1>
            <p className="text-xs text-gray-400">
              Envía y recibe XLM al instante
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
            <button onClick={() => setError(null)}>
              <X className="h-3.5 w-3.5 text-red-400" />
            </button>
          </div>
        )}

        <Card padding="md" className="text-center space-y-4 py-8">
          <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto">
            <Star className="h-8 w-8 text-blue-500" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Crea tu wallet Stellar
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
              Envía y recibe XLM con comisiones ultra bajas
              ($0.00001 por transacción)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-xs mx-auto">
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              ⚡ Tu wallet se creará con 2 XLM de saldo inicial
              para operar la red.
            </p>
          </div>

          <Button
            size="lg"
            fullWidth
            loading={creating}
            onClick={handleCreateAccount}
            icon={<Plus className="h-4 w-4" />}
            className="max-w-xs mx-auto"
          >
            {creating ? "Creando..." : "Crear wallet Stellar"}
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // ─── PANTALLA PRINCIPAL ───────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Star className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Wallet Stellar
          </h1>
          <p className="text-xs text-gray-400">
            {network === "public" ? "Mainnet" : "Testnet"} · Red descentralizada
          </p>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          <button onClick={() => setError(null)}>
            <X className="h-3.5 w-3.5 text-red-400" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 flex-1">{success}</p>
        </div>
      )}

      {/* Balance principal */}
      <Card padding="md" className="text-center bg-gradient-to-br from-blue-500 to-blue-700 text-white">
        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
          Balance disponible
        </p>
        <div className="flex items-center justify-center gap-2 mb-1">
          <p className="text-4xl font-black">
            {(balances.XLM || 0).toFixed(4)}
          </p>
          <span className="text-lg font-bold text-white/80">XLM</span>
        </div>
        <p className="text-xs text-white/60">
          ≈ ${((balances.XLM || 0) * 0.12).toFixed(2)} USD
        </p>
      </Card>

      {/* Acciones */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => { setShowSend(true); setShowReceive(false); }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-brand-500/10 hover:bg-brand-500/20 transition-colors"
        >
          <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center">
            <Send className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-bold text-brand-600 dark:text-brand-400">
            Enviar
          </span>
        </button>

        <button
          onClick={() => { setShowReceive(true); setShowSend(false); }}
          className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
        >
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
            <ArrowDownToLine className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            Recibir
          </span>
        </button>
      </div>

      {/* Recibir XLM */}
      {showReceive && (
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Tu dirección Stellar
            </p>
            <button onClick={() => setShowReceive(false)}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
              {publicKey}
            </p>
          </div>

          <Button
            size="sm"
            fullWidth
            onClick={handleCopyAddress}
            icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          >
            {copied ? "Copiado" : "Copiar dirección"}
          </Button>

          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-[11px] text-blue-700 dark:text-blue-400 text-center">
              💡 Comparte esta dirección para recibir XLM.
              Los fondos aparecerán en segundos.
            </p>
          </div>
        </Card>
      )}

      {/* Enviar XLM */}
      {showSend && (
        <Card padding="md" className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Enviar XLM
            </p>
            <button onClick={() => setShowSend(false)}>
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>

          <Input
            label="Dirección de destino"
            placeholder="GXXXXXXXXX..."
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
          />

          <Input
            label="Cantidad (XLM)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            label="Memo (opcional, máx 28 caracteres)"
            placeholder="Ej: Pago factura #123"
            value={memo}
            maxLength={28}
            onChange={(e) => setMemo(e.target.value)}
          />

          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              ⚠️ Deja ~1.5 XLM de reserva mínima.
              La comisión de red es de ~0.00001 XLM.
            </p>
          </div>

          <Button
            size="lg"
            fullWidth
            loading={sending}
            onClick={handleSend}
            disabled={!toAddress || !amount}
            icon={<Send className="h-4 w-4" />}
          >
            Enviar {amount || "0"} XLM
          </Button>
        </Card>
      )}

      {/* Última tx */}
      {lastTxHash && lastExplorer && (
        <Card padding="md" className="bg-emerald-500/5 border-emerald-500/20">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
            ✅ Última transacción
          </p>
          <p className="font-mono text-[11px] text-gray-600 dark:text-gray-400 break-all mb-3">
            {lastTxHash}
          </p>
          <a
            href={lastExplorer}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:text-blue-600"
          >
            Ver en Stellar Expert
            <ExternalLink className="h-3 w-3" />
          </a>
        </Card>
      )}

      {/* Info red */}
      <Card padding="sm" className="text-center">
        <p className="text-[11px] text-gray-400">
          {network === "public"
            ? "🟢 Conectado a Stellar Mainnet"
            : "🧪 Conectado a Stellar Testnet (modo prueba)"}
        </p>
      </Card>
    </div>
  );
}
