import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { CRYPTO_ICONS } from "@/data/mock";
import {
  Wallet, Copy, QrCode, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Shield, Loader2, Check,
  Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, Clock, X, Sparkles, ArrowRight,
  Info, CheckCircle2,
} from "lucide-react";

type ActionType = "deposit" | "withdraw" | null;

interface BalanceItem {
  asset:    string;
  amount:   number;
  usdValue: number;
  change24h: number;
  price:    number;
}

// ✅ Solo TRC20 para USDT — TronGrid solo soporta TRON
const CHAIN_OPTIONS: Record<
  string,
  { label: string; value: string; icon: string; fee: string; time: string }[]
> = {
  USDT: [
    {
      label: "Tron (TRC-20)",
      value: "TRC20",
      icon:  "🔴",
      fee:   "~1 USDT",
      time:  "~1 min",
    },
  ],
  USDC: [
    {
      label: "Tron (TRC-20)",
      value: "TRC20",
      icon:  "🔴",
      fee:   "~1 USDT",
      time:  "~1 min",
    },
  ],
  BTC: [
    {
      label: "Bitcoin Network",
      value: "BTC",
      icon:  "🟠",
      fee:   "Variable",
      time:  "~10-30 min",
    },
  ],
  ETH: [
    {
      label: "Ethereum (ERC-20)",
      value: "ERC20",
      icon:  "🔵",
      fee:   "Variable",
      time:  "~3-5 min",
    },
  ],
};

const ASSET_COLORS: Record<
  string,
  { bg: string; text: string; gradient: string; border: string }
> = {
  USDT: {
    bg:       "bg-emerald-500/10",
    text:     "text-emerald-500",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    border:   "border-emerald-500/20",
  },
  USDC: {
    bg:       "bg-blue-500/10",
    text:     "text-blue-500",
    gradient: "from-blue-500/20 to-blue-600/5",
    border:   "border-blue-500/20",
  },
  BTC: {
    bg:       "bg-orange-500/10",
    text:     "text-orange-500",
    gradient: "from-orange-500/20 to-orange-600/5",
    border:   "border-orange-500/20",
  },
  ETH: {
    bg:       "bg-violet-500/10",
    text:     "text-violet-500",
    gradient: "from-violet-500/20 to-violet-600/5",
    border:   "border-violet-500/20",
  },
};

const BACKEND_URL = "https://cubax-backend.onrender.com";

export function WalletPage() {
  const {
    user, prices, fetchPrices,
    depositAddresses, setModalOpen,
  } = useAppStore();

  const [hideBalances, setHideBalances]     = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [activeAction, setActiveAction]     = useState<{
    type:  ActionType;
    asset: string | null;
  }>({ type: null, asset: null });

  const [depositAsset, setDepositAsset]         = useState("USDT");
  const [withdrawAddress, setWithdrawAddress]   = useState("");
  const [withdrawAmount, setWithdrawAmount]     = useState("");
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [selectedChain, setSelectedChain]       = useState("TRC20");
  const [refreshing, setRefreshing]             = useState(false);
  const [expandedAsset, setExpandedAsset]       = useState<string | null>(null);
  const [withdrawStep, setWithdrawStep]         = useState<1 | 2 | 3>(1);
  const [withdrawSuccess, setWithdrawSuccess]   = useState(false);
  const [withdrawTxId, setWithdrawTxId]         = useState("");
  const [withdrawError, setWithdrawError]       = useState<string | null>(null);
  const [depositAddress, setDepositAddress]     = useState<string | null>(null);

  const firestoreBalances = (user as any)?.balances || {
    USDT: 0, BTC: 0, ETH: 0, USDC: 0,
  };

  const balancesList: BalanceItem[] = ["USDT", "BTC", "ETH", "USDC"].map(
    (asset) => {
      const amount    = firestoreBalances[asset] || 0;
      const priceInfo = prices.find((p) => p.symbol.toUpperCase() === asset);
      const price     = priceInfo?.priceUSD ||
        (asset === "BTC" ? 67500 : asset === "ETH" ? 3500 : 1);
      const change    = priceInfo?.change24h || 0;
      return {
        asset,
        amount,
        usdValue:  amount * price,
        change24h: change,
        price,
      };
    }
  );

  const totalUSD = balancesList.reduce((sum, b) => sum + b.usdValue, 0);
  const btcPrice = prices.find((p) => p.symbol === "BTC")?.priceUSD || 67500;
  const totalBTC = totalUSD / btcPrice;

  // ─── Inicialización ───────────────────────────────────
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // ─── Controlar modalOpen en el store ─────────────────
  useEffect(() => {
    const isOpen = activeAction.type !== null;
    setModalOpen(isOpen);
    return () => setModalOpen(false);
  }, [activeAction.type, setModalOpen]);

  // ─── Chain por defecto según activo ──────────────────
  useEffect(() => {
    if (activeAction.asset && CHAIN_OPTIONS[activeAction.asset]) {
      setSelectedChain(CHAIN_OPTIONS[activeAction.asset][0].value);
    }
  }, [activeAction.asset, activeAction.type]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrices();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchPrices]);

  // ─── Obtener dirección de depósito desde TronGrid ────
  const handleOpenDeposit = async (asset: string) => {
    const assetUpper = asset.toUpperCase();
    setDepositAsset(assetUpper);
    setDepositAddress(null);
    setActiveAction({ type: "deposit", asset: assetUpper });

    if (!user?.uid) return;

    // ✅ Solo USDT soportado por TronGrid actualmente
    if (assetUpper !== "USDT") {
      // Para otros activos mostrar mensaje informativo
      return;
    }

    // ✅ Ver si ya tiene dirección guardada
    const cachedAddress =
      depositAddresses[assetUpper] ||
      (user as any)?.depositAddresses?.[assetUpper];

    if (cachedAddress) {
      setDepositAddress(cachedAddress);
      return;
    }

    // ✅ Pedir nueva dirección al backend TronGrid
    setIsLoadingAddress(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tron/deposit-address`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid: user.uid }),
      });

      const data = await res.json();

      if (data.success && data.coin_address) {
        setDepositAddress(data.coin_address);
        console.log(`✅ Dirección TRC20 obtenida: ${data.coin_address}`);
      } else {
        console.error("Error obteniendo dirección:", data.error);
      }
    } catch (err: any) {
      console.error("Error de red:", err.message);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleOpenWithdraw = (asset: string) => {
    setActiveAction({ type: "withdraw", asset: asset.toUpperCase() });
    setWithdrawStep(1);
    setWithdrawSuccess(false);
    setWithdrawAddress("");
    setWithdrawAmount("");
    setWithdrawTxId("");
    setWithdrawError(null);
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetMaxAmount = () => {
    if (activeAction.asset) {
      const max = firestoreBalances[activeAction.asset] || 0;
      setWithdrawAmount(String(max));
    }
  };

  // ─── Ejecutar retiro via TronGrid ────────────────────
  const handleExecuteWithdrawal = async () => {
    if (
      !activeAction.asset ||
      !withdrawAddress     ||
      !withdrawAmount      ||
      !user?.uid
    ) return;

    // ✅ Solo USDT/TRC20 soportado actualmente
    if (activeAction.asset !== "USDT") {
      setWithdrawError(
        "Solo USDT/TRC20 está disponible actualmente para retiros externos."
      );
      return;
    }

    // ✅ Validar dirección TRC20
    if (!withdrawAddress.startsWith("T")) {
      setWithdrawError(
        "La dirección debe ser TRC20 y empezar con T. Ejemplo: TXxx..."
      );
      return;
    }

    const disponible = firestoreBalances[activeAction.asset] || 0;
    const monto      = parseFloat(withdrawAmount);

    if (monto <= 0)          return;
    if (monto > disponible)  return;
    if (monto < 1) {
      setWithdrawError("El monto mínimo de retiro es 1 USDT.");
      return;
    }

    setIsSubmitting(true);
    setWithdrawError(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/tron/withdraw`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid:       user.uid,
          toAddress: withdrawAddress,
          amount:    monto,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setWithdrawSuccess(true);
        setWithdrawTxId(data.txHash || "");
        setWithdrawStep(3);
      } else {
        setWithdrawError(data.error || "Error procesando el retiro.");
      }
    } catch (err: any) {
      setWithdrawError("Error de conexión con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAction = () => {
    setActiveAction({ type: null, asset: null });
    setWithdrawStep(1);
    setWithdrawSuccess(false);
    setWithdrawAddress("");
    setWithdrawAmount("");
    setWithdrawError(null);
    setDepositAddress(null);
  };

  const selectedChainInfo = activeAction.asset
    ? CHAIN_OPTIONS[activeAction.asset]?.find((c) => c.value === selectedChain)
    : null;

  // ─── RENDER ───────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4 animate-fade-in">

      {/* ═══ HEADER ══════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Mi Wallet
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">
              Custodia segura CubaX
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
        >
          <RefreshCw
            className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* ═══ BALANCE CARD ════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.02] p-5 border border-gray-800 dark:border-white/[0.08] shadow-2xl">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8  h-32 w-32 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Balance Total
              </span>
            </div>
            <button
              onClick={() => setHideBalances(!hideBalances)}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors"
            >
              {hideBalances ? (
                <><Eye className="h-3.5 w-3.5" /> Mostrar</>
              ) : (
                <><EyeOff className="h-3.5 w-3.5" /> Ocultar</>
              )}
            </button>
          </div>

          <div className="mb-5">
            <p className="text-4xl font-black text-white tracking-tight leading-none">
              {hideBalances
                ? "••••••"
                : `$${totalUSD.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </p>
            <p className="text-sm text-gray-400 mt-1.5 font-medium">
              ≈ {hideBalances ? "••••" : `${totalBTC.toFixed(6)} BTC`}
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => handleOpenDeposit("USDT")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-lg shadow-brand-500/25 active:scale-[0.98]"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Depositar
            </button>
            <button
              onClick={() => handleOpenWithdraw("USDT")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all backdrop-blur-sm active:scale-[0.98]"
            >
              <ArrowUpRight className="h-4 w-4" />
              Retirar
            </button>
          </div>
        </div>
      </div>

      {/* ═══ MINI RESUMEN ════════════════════════════════ */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {balancesList.map((b) => {
          const colors = ASSET_COLORS[b.asset] || ASSET_COLORS.USDT;
          const isUp   = b.change24h >= 0;
          return (
            <div
              key={b.asset}
              className={`flex-shrink-0 w-[130px] rounded-xl p-3 bg-gradient-to-br ${colors.gradient} border ${colors.border} cursor-pointer hover:scale-[1.02] transition-all`}
              onClick={() =>
                setExpandedAsset(expandedAsset === b.asset ? null : b.asset)
              }
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-lg">{CRYPTO_ICONS[b.asset] || "🪙"}</span>
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {b.asset}
                </span>
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {hideBalances
                  ? "••••"
                  : `$${b.usdValue.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}`}
              </p>
              <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-semibold ${
                isUp ? "text-emerald-500" : "text-red-500"
              }`}>
                {isUp
                  ? <TrendingUp  className="h-2.5 w-2.5" />
                  : <TrendingDown className="h-2.5 w-2.5" />
                }
                {Math.abs(b.change24h).toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ MODAL DEPÓSITO ══════════════════════════════ */}
      {activeAction.type === "deposit" && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">

            {/* Cabecera */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${
                  ASSET_COLORS[depositAsset]?.bg || "bg-brand-500/10"
                } flex items-center justify-center`}>
                  <ArrowDownLeft className={`h-4 w-4 ${
                    ASSET_COLORS[depositAsset]?.text || "text-brand-500"
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Depositar Cripto
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Recibe fondos en tu wallet CubaX
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAction}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Selector de activo */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                Selecciona el Activo
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["USDT", "USDC", "BTC", "ETH"].map((asset) => {
                  const colors   = ASSET_COLORS[asset] || ASSET_COLORS.USDT;
                  const selected = depositAsset === asset;
                  return (
                    <button
                      key={asset}
                      onClick={() => handleOpenDeposit(asset)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        selected
                          ? `${colors.bg} ${colors.text} ring-2 ring-current`
                          : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <span className="text-base">
                        {CRYPTO_ICONS[asset] || "🪙"}
                      </span>
                      {asset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ✅ Badge de red TRC20 */}
            {depositAsset === "USDT" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="text-sm">🔴</span>
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">
                    Red: Tron (TRC-20)
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Envía únicamente USDT TRC20 a esta dirección
                  </p>
                </div>
              </div>
            )}

            {/* Contenido según estado */}
            {depositAsset !== "USDT" ? (
              // ✅ Activos no soportados aún
              <div className="py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                  <Info className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Próximamente
                </p>
                <p className="text-xs text-gray-400">
                  Por ahora solo los depósitos de{" "}
                  <strong>USDT/TRC20</strong> están disponibles.
                  Otros activos estarán disponibles pronto.
                </p>
              </div>

            ) : isLoadingAddress ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 rounded-full border-2 border-brand-500/20 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                </div>
                <p className="text-xs text-gray-400 font-medium animate-pulse">
                  Generando dirección segura...
                </p>
              </div>

            ) : depositAddress ? (
              <div className="space-y-4">
                {/* QR */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                        depositAddress
                      )}&format=svg`}
                      alt="QR"
                      className="w-40 h-40"
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 border border-gray-200 dark:border-white/10">
                  <span className="text-[11px] font-mono text-gray-600 dark:text-gray-300 flex-1 truncate select-all">
                    {depositAddress}
                  </span>
                  <button
                    onClick={() => handleCopyAddress(depositAddress)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      copied
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {copied ? (
                      <><Check className="h-3 w-3" /> Copiada</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copiar</>
                    )}
                  </button>
                </div>

                {/* Advertencia */}
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    Envía únicamente <strong>USDT TRC20</strong> a esta
                    dirección. Enviar otro activo o por una red incorrecta
                    puede resultar en pérdida permanente de fondos.
                  </p>
                </div>
              </div>

            ) : (
              <div className="py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  No se pudo obtener dirección
                </p>
                <p className="text-xs text-gray-400 mb-3">
                  Verifica tu conexión e intenta nuevamente
                </p>
                <button
                  onClick={() => handleOpenDeposit(depositAsset)}
                  className="text-xs font-bold text-brand-500 hover:text-brand-400"
                >
                  Reintentar →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL RETIRO ════════════════════════════════ */}
      {activeAction.type === "withdraw" && activeAction.asset && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">

            {/* Cabecera */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Retirar {activeAction.asset}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Enviar fondos a wallet externa
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAction}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* ✅ Aviso si no es USDT */}
            {activeAction.asset !== "USDT" && (
              <div className="py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                  <Info className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Próximamente
                </p>
                <p className="text-xs text-gray-400">
                  Por ahora solo los retiros de{" "}
                  <strong>USDT/TRC20</strong> están disponibles.
                </p>
              </div>
            )}

            {/* Pasos — solo para USDT */}
            {activeAction.asset === "USDT" && !withdrawSuccess && (
              <div className="flex items-center gap-2">
                {[1, 2].map((step) => (
                  <div key={step} className="flex items-center gap-2 flex-1">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      withdrawStep >= step
                        ? "bg-red-500 text-white"
                        : "bg-gray-100 dark:bg-white/5 text-gray-400"
                    }`}>
                      {step}
                    </div>
                    <span className={`text-[10px] font-semibold ${
                      withdrawStep >= step
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400"
                    }`}>
                      {step === 1 ? "Dirección" : "Monto"}
                    </span>
                    {step < 2 && (
                      <div className={`flex-1 h-0.5 rounded-full ${
                        withdrawStep > step
                          ? "bg-red-500"
                          : "bg-gray-200 dark:bg-white/10"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Paso 1 — Solo USDT */}
            {activeAction.asset === "USDT" && withdrawStep === 1 && (
              <div className="space-y-4">

                {/* ✅ Red fija TRC20 */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/30 bg-red-500/5">
                  <span className="text-xl">🔴</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Tron (TRC-20)
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Comisión: ~1 USDT · Tiempo: ~1 min
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-red-500" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Dirección TRC20 de destino
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="Empieza con T... (dirección TRC20)"
                    className="w-full text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                  />
                  {withdrawAddress && !withdrawAddress.startsWith("T") && (
                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      La dirección TRC20 debe empezar con T
                    </p>
                  )}
                </div>

                <button
                  disabled={
                    !withdrawAddress ||
                    !withdrawAddress.startsWith("T")
                  }
                  onClick={() => setWithdrawStep(2)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Paso 2 */}
            {activeAction.asset === "USDT" && withdrawStep === 2 && (
              <div className="space-y-4">

                {/* Resumen dirección */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10">
                  <span className="text-lg">🔴</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                      Tron (TRC-20)
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">
                      {withdrawAddress}
                    </p>
                  </div>
                  <button
                    onClick={() => setWithdrawStep(1)}
                    className="text-[10px] text-brand-500 font-bold"
                  >
                    Editar
                  </button>
                </div>

                {/* Monto */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Monto a enviar
                    </label>
                    <button
                      onClick={handleSetMaxAmount}
                      className="text-[10px] font-bold text-red-500 hover:text-red-400"
                    >
                      MAX: {firestoreBalances[activeAction.asset] || 0} USDT
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      min="1"
                      className="w-full text-2xl font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 pr-20 text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                      USDT
                    </span>
                  </div>

                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                    <p className="text-[11px] text-gray-400 mt-1.5 pl-1">
                      ≈ ${parseFloat(withdrawAmount).toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })} USD
                    </p>
                  )}

                  {withdrawAmount && parseFloat(withdrawAmount) < 1 && (
                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Mínimo 1 USDT
                    </p>
                  )}

                  {withdrawAmount &&
                    parseFloat(withdrawAmount) >
                    (firestoreBalances[activeAction.asset] || 0) && (
                    <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Saldo insuficiente
                    </p>
                  )}
                </div>

                {/* Comisión */}
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 space-y-2 border border-gray-200 dark:border-white/10">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Comisión de red</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ~1 USDT
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Tiempo estimado</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ~1 min
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-400">Red</span>
                    <span className="font-semibold text-red-500">
                      🔴 TRC20
                    </span>
                  </div>
                </div>

                {/* Error */}
                {withdrawError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 dark:text-red-400">
                      {withdrawError}
                    </p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setWithdrawStep(1)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold transition-all"
                  >
                    Atrás
                  </button>
                  <button
                    disabled={
                      isSubmitting                   ||
                      !withdrawAmount                ||
                      parseFloat(withdrawAmount) < 1 ||
                      parseFloat(withdrawAmount) >
                        (firestoreBalances[activeAction.asset] || 0)
                    }
                    onClick={handleExecuteWithdrawal}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Shield className="h-3.5 w-3.5" />
                        Confirmar Retiro
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Paso 3 — Éxito */}
            {withdrawStep === 3 && withdrawSuccess && (
              <div className="py-6 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    ¡Retiro Enviado!
                  </h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                    Tu USDT ha sido enviado por la red TRON. Puedes
                    verificarlo en TronScan con el hash de la transacción.
                  </p>
                </div>

                {withdrawTxId && (
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10 space-y-2">
                    <p className="text-[10px] text-gray-400">
                      Hash de transacción
                    </p>
                    <p className="text-[11px] font-mono text-gray-600 dark:text-gray-300 break-all">
                      {withdrawTxId}
                    </p>
                    {/* ✅ Link a TronScan */}
                    <a
                      href={`https://tronscan.org/#/transaction/${withdrawTxId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-brand-500 hover:text-brand-400 flex items-center justify-center gap-1 mt-1"
                    >
                      Ver en TronScan →
                    </a>
                  </div>
                )}

                <button
                  onClick={handleCloseAction}
                  className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-xs font-bold hover:bg-gray-800 dark:hover:bg-white/15 transition-all"
                >
                  Volver a Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ LISTA DE ACTIVOS ════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Mis Activos
          </h2>
          <span className="text-[10px] text-gray-400 font-medium">
            {balancesList.length} activos
          </span>
        </div>

        <div className="space-y-2">
          {balancesList.map((balance) => {
            const colors     = ASSET_COLORS[balance.asset] || ASSET_COLORS.USDT;
            const isUp       = balance.change24h >= 0;
            const isExpanded = expandedAsset === balance.asset;

            return (
              <div
                key={balance.asset}
                className={`rounded-2xl border transition-all ${
                  isExpanded
                    ? `${colors.border} bg-gradient-to-r ${colors.gradient}`
                    : "border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.02]"
                }`}
              >
                <button
                  onClick={() =>
                    setExpandedAsset(isExpanded ? null : balance.asset)
                  }
                  className="w-full flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center text-xl`}>
                      {CRYPTO_ICONS[balance.asset] || "🪙"}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {balance.asset}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {hideBalances
                          ? "••••"
                          : `${balance.amount.toFixed(
                              balance.asset === "BTC" ? 6 :
                              balance.asset === "ETH" ? 4 : 2
                            )} ${balance.asset}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {hideBalances
                          ? "••••"
                          : `$${balance.usdValue.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}`}
                      </p>
                      <div className={`flex items-center justify-end gap-0.5 text-[10px] font-semibold ${
                        isUp ? "text-emerald-500" : "text-red-500"
                      }`}>
                        {isUp
                          ? <TrendingUp  className="h-2.5 w-2.5" />
                          : <TrendingDown className="h-2.5 w-2.5" />
                        }
                        {Math.abs(balance.change24h).toFixed(2)}%
                      </div>
                    </div>
                    {isExpanded
                      ? <ChevronUp   className="h-4 w-4 text-gray-400" />
                      : <ChevronDown className="h-4 w-4 text-gray-400" />
                    }
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 flex gap-2 animate-fade-in">
                    <button
                      onClick={() => handleOpenDeposit(balance.asset)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${colors.bg} ${colors.text} hover:opacity-80`}
                    >
                      <ArrowDownLeft className="h-3.5 w-3.5" />
                      Depositar
                    </button>
                    <button
                      onClick={() => handleOpenWithdraw(balance.asset)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      Retirar
                    </button>
                    <button
                      onClick={() => handleOpenDeposit(balance.asset)}
                      className="flex items-center justify-center px-4 py-2.5 rounded-xl text-[11px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ INFO BANNER ═════════════════════════════════ */}
      <div className="flex items-start gap-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4">
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <Info className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-900 dark:text-white mb-0.5">
            Depósitos y retiros USDT TRC20
          </p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Los depósitos se detectan automáticamente cada 5 minutos.
            Los retiros se procesan en ~1 minuto via red TRON.
            Transferencias internas entre usuarios de CubaX son
            instantáneas y sin comisión.
          </p>
        </div>
      </div>
    </div>
  );
                      }
