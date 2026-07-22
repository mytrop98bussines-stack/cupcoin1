import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowDownUp, Loader2, CheckCircle2,
  AlertTriangle, X, ExternalLink, Info, RefreshCw,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

type SwapAsset = "XLM" | "USDC";

const ASSET_INFO: Record<SwapAsset, { name: string; icon: string; color: string; decimals: number }> = {
  XLM:  { name: "Stellar Lumens", icon: "/crypto/xlm.svg",  color: "text-indigo-500", decimals: 4 },
  USDC: { name: "USD Coin",       icon: "/crypto/usdc.svg", color: "text-blue-500",   decimals: 2 },
};

export function SwapPage() {
  const { user } = useAppStore();

  const [fromAsset, setFromAsset] = useState<SwapAsset>("USDC");
  const [toAsset, setToAsset]     = useState<SwapAsset>("XLM");
  const [amount, setAmount]       = useState("");

  const [quote, setQuote]         = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [executing, setExecuting] = useState(false);
  const [success, setSuccess]     = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [txHash, setTxHash]       = useState<string | null>(null);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const [balances, setBalances] = useState<{ XLM: number; USDC: number }>({ XLM: 0, USDC: 0 });
  const [loadingBalances, setLoadingBalances] = useState(true);

  // ─── Cargar balances ───────────────────────────────────
  useEffect(() => {
    void loadBalances();
  }, []);

  const loadBalances = async () => {
    setLoadingBalances(true);
    try {
      const token = localStorage.getItem("cubax_token");

      const [xlmRes, usdcRes] = await Promise.all([
        fetch(`${BACKEND_URL}/stellar/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${BACKEND_URL}/stellar/usdc/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const xlmData  = await xlmRes.json();
      const usdcData = await usdcRes.json();

      setBalances({
        XLM:  xlmData.success  ? (xlmData.balances?.XLM || 0) : 0,
        USDC: usdcData.success ? (usdcData.balance || 0)      : 0,
      });
    } catch (err) {
      console.error("❌ Error cargando balances:", err);
    } finally {
      setLoadingBalances(false);
    }
  };

  // ─── Obtener quote automático (con debounce) ──────────
  const fetchQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }

    setLoadingQuote(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/stellar/swap/quote`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ fromAsset, toAsset, amount }),
      });

      const data = await res.json();

      if (data.success) {
        setQuote(data);
      } else {
        setError(data.error || "No se pudo obtener la cotización");
        setQuote(null);
      }
    } catch {
      setError("Error de conexión");
      setQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  }, [amount, fromAsset, toAsset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchQuote();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  // ─── Invertir activos ─────────────────────────────────
  const handleSwapAssets = () => {
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
    setAmount("");
    setQuote(null);
  };

  // ─── Ejecutar swap ────────────────────────────────────
  const handleExecuteSwap = async () => {
    if (!quote) return;

    // Verificar balance
    if (parseFloat(amount) > balances[fromAsset]) {
      setError(`Balance insuficiente. Tienes ${balances[fromAsset]} ${fromAsset}`);
      return;
    }

    // Verificar reserva XLM
    if (fromAsset === "XLM" && (balances.XLM - parseFloat(amount)) < 1.5) {
      setError("Debes dejar al menos 1.5 XLM de reserva en tu wallet");
      return;
    }

    setExecuting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("cubax_token");

      // Aplicar slippage del 1% para minReceive
      const minReceive = (parseFloat(quote.destinationAmount) * 0.99).toFixed(7);

      const res = await fetch(`${BACKEND_URL}/stellar/swap/execute`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromAsset,
          toAsset,
          amount:     quote.sourceAmount,
          minReceive,
          path:       quote.path,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`✅ Swap completado: recibiste ~${quote.destinationAmount} ${toAsset}`);
        setTxHash(data.txHash);
        setExplorerUrl(data.explorerUrl);
        setAmount("");
        setQuote(null);
        await loadBalances();
      } else {
        setError(data.error || "Error ejecutando swap");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setExecuting(false);
    }
  };

  const handleSetMax = () => {
    let max = balances[fromAsset];
    if (fromAsset === "XLM") {
      max = Math.max(0, max - 1.5);
    }
    setAmount(max.toFixed(ASSET_INFO[fromAsset].decimals));
  };

  const fromInfo = ASSET_INFO[fromAsset];
  const toInfo   = ASSET_INFO[toAsset];

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
          <ArrowDownUp className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Swap Stellar</h1>
          <p className="text-xs text-gray-400">Intercambia XLM ↔ USDC al instante</p>
        </div>
        <button
          onClick={loadBalances}
          className="p-2 rounded-xl bg-gray-100 dark:bg-white/5"
        >
          <RefreshCw className={`h-4 w-4 text-gray-400 ${loadingBalances ? "animate-spin" : ""}`} />
        </button>
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

      {/* Card FROM */}
      <Card padding="md" className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pagas</span>
          <button
            onClick={handleSetMax}
            className="text-[10px] font-bold text-indigo-500"
          >
            Balance: {balances[fromAsset].toFixed(ASSET_INFO[fromAsset].decimals)} · MAX
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="flex-1 text-3xl font-bold bg-transparent text-gray-900 dark:text-white focus:outline-none"
          />
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5">
            <img src={fromInfo.icon} alt={fromAsset} className="h-6 w-6" />
            <span className="font-bold text-sm text-gray-900 dark:text-white">{fromAsset}</span>
          </div>
        </div>
      </Card>

      {/* Botón invertir */}
      <div className="flex justify-center -my-2">
        <button
          onClick={handleSwapAssets}
          className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-all z-10"
        >
          <ArrowDownUp className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Card TO */}
      <Card padding="md" className="space-y-2 bg-indigo-500/5 border-indigo-500/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recibes (aprox.)</span>
          <span className="text-[10px] text-gray-400">
            Balance: {balances[toAsset].toFixed(ASSET_INFO[toAsset].decimals)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 text-3xl font-bold text-gray-900 dark:text-white">
            {loadingQuote ? (
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
            ) : quote ? (
              parseFloat(quote.destinationAmount).toFixed(ASSET_INFO[toAsset].decimals)
            ) : (
              <span className="text-gray-300 dark:text-gray-600">0.00</span>
            )}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5">
            <img src={toInfo.icon} alt={toAsset} className="h-6 w-6" />
            <span className="font-bold text-sm text-gray-900 dark:text-white">{toAsset}</span>
          </div>
        </div>
      </Card>

      {/* Detalles del swap */}
      {quote && (
        <Card padding="sm" className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Tasa</span>
            <span className="font-bold text-gray-900 dark:text-white">
              1 {fromAsset} ≈ {quote.rate.toFixed(4)} {toAsset}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Fee CupCoin (0.5%)</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {parseFloat(quote.fee).toFixed(4)} {toAsset}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Slippage máximo</span>
            <span className="font-bold text-gray-900 dark:text-white">1%</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-400">Comisión red</span>
            <span className="font-bold text-gray-900 dark:text-white">~0.00001 XLM</span>
          </div>
        </Card>
      )}

      {/* Botón swap */}
      <Button
        size="lg"
        fullWidth
        loading={executing}
        disabled={!quote || !amount || parseFloat(amount) <= 0}
        onClick={handleExecuteSwap}
        className="bg-indigo-500 hover:bg-indigo-600 shadow-lg"
        icon={<ArrowDownUp className="h-4 w-4" />}
      >
        {executing ? "Procesando..." : "Confirmar Swap"}
      </Button>

      {/* Tx hash */}
      {txHash && explorerUrl && (
        <Card padding="md" className="bg-emerald-500/5 border-emerald-500/20">
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2">
            ✅ Última transacción
          </p>
          <p className="font-mono text-[11px] text-gray-600 dark:text-gray-400 break-all mb-2">
            {txHash}
          </p>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-500"
          >
            Ver en Stellar Expert
            <ExternalLink className="h-3 w-3" />
          </a>
        </Card>
      )}

      {/* Info */}
      <Card padding="sm">
        <div className="flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
            El swap usa el DEX descentralizado de Stellar. La tasa se calcula en tiempo real y puede variar ligeramente al ejecutar (slippage máximo 1%).
          </p>
        </div>
      </Card>
    </div>
  );
}
