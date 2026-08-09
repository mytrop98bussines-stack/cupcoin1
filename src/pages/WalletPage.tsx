import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Wallet, Copy, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Shield, Loader2, Check,
  Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, X, Sparkles, ArrowRight,
  Info, CheckCircle2, Lock,
} from "lucide-react";
import {
  getWalletBalances,
  getTokenPrices,
  sendToken,
  estimateGas,
} from "@/lib/wallet/walletService";
import {
  getStoredWalletAddress,
  hasStoredWallet,
} from "@/lib/wallet/walletStorage";
import type { TokenBalance } from "@/lib/wallet/walletTypes";

const ASSET_COLORS: Record<
  string,
  { bg: string; text: string; gradient: string; border: string }
> = {
  MATIC: { bg: "bg-purple-500/10",  text: "text-purple-500",  gradient: "from-purple-500/20 to-purple-600/5",   border: "border-purple-500/20" },
  USDT:  { bg: "bg-emerald-500/10", text: "text-emerald-500", gradient: "from-emerald-500/20 to-emerald-600/5", border: "border-emerald-500/20" },
  USDC:  { bg: "bg-blue-500/10",    text: "text-blue-500",    gradient: "from-blue-500/20 to-blue-600/5",       border: "border-blue-500/20" },
  BTC:   { bg: "bg-orange-500/10",  text: "text-orange-500",  gradient: "from-orange-500/20 to-orange-600/5",   border: "border-orange-500/20" },
  ETH:   { bg: "bg-violet-500/10",  text: "text-violet-500",  gradient: "from-violet-500/20 to-violet-600/5",   border: "border-violet-500/20" },
};

type ActionType = "deposit" | "withdraw" | null;

export function WalletPage() {
  const { user, setModalOpen, navigate } = useAppStore();

  // ─── Wallet state ─────────────────────────────────────────
  const [walletAddress, setWalletAddress]   = useState<string | null>(null);
  const [balances, setBalances]             = useState<TokenBalance[]>([]);
  const [prices, setPrices]                 = useState<Record<string, { usd: number; usd_24h_change: number }>>({});
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [refreshing, setRefreshing]         = useState(false);

  // ─── UI state ─────────────────────────────────────────────
  const [hideBalances, setHideBalances]     = useState(false);
  const [copied, setCopied]                 = useState(false);
  const [expandedAsset, setExpandedAsset]   = useState<string | null>(null);

  // ─── Action modals ────────────────────────────────────────
  const [activeAction, setActiveAction]     = useState<{ type: ActionType; asset: string | null }>({ type: null, asset: null });
  const [depositAsset, setDepositAsset]     = useState("USDT");

  // ─── Withdraw state ───────────────────────────────────────
  const [withdrawAddress, setWithdrawAddress]   = useState("");
  const [withdrawAmount, setWithdrawAmount]     = useState("");
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [showWithdrawPwd, setShowWithdrawPwd]   = useState(false);
  const [withdrawStep, setWithdrawStep]         = useState<1 | 2 | 3>(1);
  const [withdrawSuccess, setWithdrawSuccess]   = useState(false);
  const [withdrawTxId, setWithdrawTxId]         = useState("");
  const [withdrawError, setWithdrawError]       = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [gasEstimate, setGasEstimate]           = useState<{ gasEstimate: string; gasCostUSD: string } | null>(null);

  // =========================================================
  // CARGAR WALLET Y SALDOS
  // =========================================================
  // ✅ Y en loadWalletData agregar guard
const loadWalletData = useCallback(async () => {
  const address = getStoredWalletAddress();
  if (!address) {
    setLoadingBalances(false);
    return;
  }

  setWalletAddress(address);
  setLoadingBalances(true);

  try {
    const [tokenBalances, tokenPrices] = await Promise.all([
      getWalletBalances(address),
      getTokenPrices(),
    ]);

    // ✅ Guards
    if (!Array.isArray(tokenBalances)) {
      setBalances([]);
      return;
    }

    const safePrices = tokenPrices || {};

    const enriched = tokenBalances
      .filter((b) => b && b.symbol) // ✅ Filtrar items inválidos
      .map((b) => {
        const price = safePrices[b.symbol];
        return {
          ...b,
          usdValue: price ? (b.amount || 0) * price.usd : 0,
        };
      });

    setBalances(enriched);
    setPrices(safePrices);

  } catch (err) {
    console.error("❌ [Wallet] Error:", err);
    setBalances([]); // ✅ Siempre dejar array vacío, nunca undefined
  } finally {
    setLoadingBalances(false);
  }
}, []);
  
  // ─── Cargar al montar ─────────────────────────────────────
  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  // ─── Refrescar precios cada 30s ───────────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newPrices = await getTokenPrices();
        setPrices(newPrices);

        setBalances((prev) =>
          prev.map((b) => {
            const price = newPrices[b.symbol];
            return {
              ...b,
              usdValue: price ? b.amount * price.usd : b.usdValue,
            };
          })
        );
      } catch {}
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // ─── Sincronizar modal open ───────────────────────────────
  useEffect(() => {
    setModalOpen(activeAction.type !== null);
    return () => setModalOpen(false);
  }, [activeAction.type, setModalOpen]);

  // =========================================================
  // CÁLCULOS
  // =========================================================
  const totalUSD = balances.reduce((sum, b) => sum + b.usdValue, 0);
  const btcPrice = prices.BTC?.usd || 67500;
  const totalBTC = totalUSD / btcPrice;

  // =========================================================
  // HANDLERS
  // =========================================================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWalletData();
    setTimeout(() => setRefreshing(false), 1000);
  }, [loadWalletData]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenDeposit = (asset: string) => {
    setDepositAsset(asset.toUpperCase());
    setActiveAction({ type: "deposit", asset: asset.toUpperCase() });
  };

  const handleOpenWithdraw = (asset: string) => {
    setActiveAction({ type: "withdraw", asset: asset.toUpperCase() });
    setWithdrawStep(1);
    setWithdrawSuccess(false);
    setWithdrawAddress("");
    setWithdrawAmount("");
    setWithdrawPassword("");
    setWithdrawTxId("");
    setWithdrawError(null);
    setGasEstimate(null);
  };

  const handleCloseAction = () => {
    setActiveAction({ type: null, asset: null });
    setWithdrawStep(1);
    setWithdrawSuccess(false);
    setWithdrawAddress("");
    setWithdrawAmount("");
    setWithdrawPassword("");
    setWithdrawError(null);
    setGasEstimate(null);
  };

  const handleSetMaxAmount = () => {
    if (!activeAction.asset) return;
    const token = balances.find((b) => b.symbol === activeAction.asset);
    if (!token) return;

    if (activeAction.asset === "MATIC") {
      // Dejar algo para gas
      const max = Math.max(0, token.amount - 0.05);
      setWithdrawAmount(max.toFixed(6));
    } else {
      setWithdrawAmount(token.amount.toString());
    }
  };

  // ─── Estimar gas cuando cambia el monto ───────────────────
  useEffect(() => {
    if (
      !activeAction.asset ||
      !withdrawAddress ||
      !withdrawAmount ||
      withdrawStep !== 2
    )
      return;

    const timer = setTimeout(async () => {
      const estimate = await estimateGas(
        activeAction.asset!,
        withdrawAddress,
        withdrawAmount
      );
      setGasEstimate(estimate);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeAction.asset, withdrawAddress, withdrawAmount, withdrawStep]);

  // ─── Ejecutar retiro ──────────────────────────────────────
  const handleExecuteWithdrawal = async () => {
    if (
      !activeAction.asset ||
      !withdrawAddress ||
      !withdrawAmount ||
      !withdrawPassword
    )
      return;

    // Validar dirección Polygon (0x...)
    if (
      !withdrawAddress.startsWith("0x") ||
      withdrawAddress.length !== 42
    ) {
      setWithdrawError(
        "Dirección inválida. Debe empezar con 0x y tener 42 caracteres."
      );
      return;
    }

    const monto = parseFloat(withdrawAmount);
    const token = balances.find((b) => b.symbol === activeAction.asset);

    if (!token || monto <= 0 || monto > token.amount) {
      setWithdrawError("Monto inválido o insuficiente");
      return;
    }

    // Verificar que tiene MATIC para gas
    const maticBalance = balances.find((b) => b.symbol === "MATIC");
    if (!maticBalance || maticBalance.amount < 0.001) {
      setWithdrawError(
        "Necesitas MATIC para pagar el gas. Deposita al menos 0.01 MATIC."
      );
      return;
    }

    setIsSubmitting(true);
    setWithdrawError(null);

    const result = await sendToken({
      toAddress: withdrawAddress,
      amount: withdrawAmount,
      symbol: activeAction.asset,
      password: withdrawPassword,
    });

    if (result.success) {
      setWithdrawSuccess(true);
      setWithdrawTxId(result.txHash || "");
      setWithdrawStep(3);
      // Recargar saldos
      await loadWalletData();
    } else {
      setWithdrawError(result.error || "Error procesando el retiro");
    }

    setIsSubmitting(false);
  };

  // ─── Helper: ícono de asset ───────────────────────────────
  const getAssetIcon = (asset: string) => {
    const icons: Record<string, string> = {
      USDT:  "/crypto/usdt.svg",
      USDC:  "/crypto/usdc.svg",
      BTC:   "/crypto/btc.svg",
      ETH:   "/crypto/eth.svg",
      MATIC: "/crypto/matic.svg",
    };
    return icons[asset.toUpperCase()] || "/crypto/usd.svg";
  };
    // =========================================================
  // RENDER: Sin wallet
  // =========================================================
  if (!hasStoredWallet()) {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Mi Wallet
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">
              No custodia · Polygon
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <Wallet className="h-8 w-8 text-brand-500" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              No tienes wallet todavía
            </h2>
            <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
              Cierra sesión y vuelve a entrar para generar
              tu wallet no custodia automáticamente.
            </p>
          </div>
          <button
            onClick={() => navigate("dashboard")}
            className="px-6 py-3 rounded-xl bg-brand-500 text-white text-sm font-bold"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER: Principal
  // =========================================================
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4 animate-fade-in">

      {/* ─── HEADER ─────────────────────────────────────── */}
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
              No custodia · Polygon
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl bg-gray-100 dark:bg-white/5"
        >
          <RefreshCw
            className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${
              refreshing ? "animate-spin" : ""
            }`}
          />
        </button>
      </div>

      {/* ─── BALANCE CARD ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.02] p-5 border border-gray-800 dark:border-white/[0.08] shadow-2xl">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="relative z-10">
          {/* Título y toggle */}
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
              {hideBalances
                ? <><Eye    className="h-3.5 w-3.5" /> Mostrar</>
                : <><EyeOff className="h-3.5 w-3.5" /> Ocultar</>
              }
            </button>
          </div>

          {/* Monto total */}
          <div className="mb-5">
            {loadingBalances ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <span className="text-sm text-gray-400">
                  Cargando desde blockchain...
                </span>
              </div>
            ) : (
              <>
                <p className="text-4xl font-black text-white tracking-tight leading-none">
                  {hideBalances
                    ? "••••••"
                    : `$${totalUSD.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                  }
                </p>
                <p className="text-sm text-gray-400 mt-1.5 font-medium">
                  ≈{" "}
                  {hideBalances
                    ? "••••"
                    : `${totalBTC.toFixed(6)} BTC`
                  }
                </p>
              </>
            )}
          </div>

          {/* Botones depósito/retiro */}
          <div className="flex gap-2.5">
            <button
              onClick={() => handleOpenDeposit("USDT")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-colors"
            >
              <ArrowDownLeft className="h-4 w-4" />
              Depositar
            </button>
            <button
              onClick={() => handleOpenWithdraw("USDT")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold backdrop-blur-sm transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" />
              Retirar
            </button>
          </div>
        </div>
      </div>

      {/* ─── DIRECCIÓN PÚBLICA ──────────────────────────── */}
      {walletAddress && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
          <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
            <Wallet className="h-4 w-4 text-brand-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">
              Tu dirección Polygon
            </p>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              {walletAddress}
            </p>
          </div>
          <button
            onClick={() => handleCopyAddress(walletAddress)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 ${
              copied
                ? "bg-emerald-500 text-white"
                : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"
            }`}
          >
            {copied
              ? <><Check className="h-3 w-3" /> Copiada</>
              : <><Copy  className="h-3 w-3" /> Copiar</>
            }
          </button>
        </div>
      )}

      {/* ─── BANNER GAS ─────────────────────────────────── */}
      {!loadingBalances && balances.find(
        (b) => b.symbol === "MATIC" && b.amount < 0.01
      ) && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">
              Necesitas MATIC para operar
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
              El gas en Polygon se paga con MATIC.
              Deposita al menos <strong>0.05 MATIC</strong> para
              poder enviar tokens. El costo es menor a $0.01 USD.
            </p>
          </div>
        </div>
      )}

      {/* ─── LISTA DE ACTIVOS ───────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Mis Activos
          </h2>
          <span className="text-[10px] text-gray-400 font-medium">
            Polygon Network
          </span>
        </div>

        {loadingBalances ? (
          <div className="space-y-2">
            {["MATIC", "USDT", "USDC", "ETH", "BTC"].map((asset) => (
              <div
                key={asset}
                className="h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.03] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {balances.map((balance) => {
              const colors     = ASSET_COLORS[balance.symbol] || ASSET_COLORS.USDT;
              const priceData  = prices[balance.symbol];
              const change24h  = priceData?.usd_24h_change || 0;
              const isUp       = change24h >= 0;
              const isExpanded = expandedAsset === balance.symbol;

              return (
                <div
                  key={balance.symbol}
                  className={`rounded-2xl border transition-all ${
                    isExpanded
                      ? `${colors.border} bg-gradient-to-r ${colors.gradient}`
                      : "border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.02]"
                  }`}
                >
                  {/* Fila principal */}
                  <button
                    onClick={() =>
                      setExpandedAsset(isExpanded ? null : balance.symbol)
                    }
                    className="w-full flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center overflow-hidden`}
                      >
                        <img
                          src={getAssetIcon(balance.symbol)}
                          alt={balance.symbol}
                          className="h-6 w-6 object-contain"
                          onError={(e) => {
                            e.currentTarget.src = "/crypto/usd.svg";
                          }}
                        />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {balance.symbol}
                          </p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-semibold">
                            Polygon
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {hideBalances
                            ? "••••"
                            : `${balance.amount.toFixed(
                                balance.symbol === "BTC"
                                  ? 6
                                  : balance.symbol === "ETH" ||
                                    balance.symbol === "MATIC"
                                  ? 4
                                  : 2
                              )} ${balance.symbol}`
                          }
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
                                maximumFractionDigits: 2,
                              })}`
                          }
                        </p>
                        <div
                          className={`flex items-center justify-end gap-0.5 text-[10px] font-semibold ${
                            isUp ? "text-emerald-500" : "text-red-500"
                          }`}
                        >
                          {isUp
                            ? <TrendingUp   className="h-2.5 w-2.5" />
                            : <TrendingDown className="h-2.5 w-2.5" />
                          }
                          {Math.abs(change24h).toFixed(2)}%
                        </div>
                      </div>
                      {isExpanded
                        ? <ChevronUp   className="h-4 w-4 text-gray-400" />
                        : <ChevronDown className="h-4 w-4 text-gray-400" />
                      }
                    </div>
                  </button>

                  {/* Botones expandidos */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 flex gap-2 animate-fade-in">
                      <button
                        onClick={() => handleOpenDeposit(balance.symbol)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold ${colors.bg} ${colors.text}`}
                      >
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                        Depositar
                      </button>
                      <button
                        onClick={() => handleOpenWithdraw(balance.symbol)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        Retirar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── INFO BANNER ────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4">
        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
          <Info className="h-4 w-4 text-purple-500" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-900 dark:text-white mb-0.5">
            Wallet No Custodia · Polygon
          </p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Solo tú controlas tus fondos. Las llaves privadas
            están cifradas en tu dispositivo. Nadie más puede
            acceder a ellas. Comisiones menores a $0.01 USD.
          </p>
        </div>
      </div>
            {/* ═══ MODAL DEPÓSITO ══════════════════════════════ */}
      {activeAction.type === "deposit" && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">

            {/* Header modal */}
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
                    Recibe fondos en tu wallet no custodia
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
              <div className="grid grid-cols-5 gap-2">
                {["MATIC", "USDT", "USDC", "ETH", "BTC"].map((asset) => {
                  const colors   = ASSET_COLORS[asset] || ASSET_COLORS.USDT;
                  const selected = depositAsset === asset;

                  return (
                    <button
                      key={asset}
                      onClick={() => setDepositAsset(asset)}
                      className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                        selected
                          ? `${colors.bg} ${colors.text} ring-2 ring-current`
                          : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <img
                        src={getAssetIcon(asset)}
                        alt={asset}
                        className="h-6 w-6 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/crypto/usd.svg";
                        }}
                      />
                      {asset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Banner de red */}
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
              depositAsset === "MATIC"
                ? "bg-purple-500/10 border-purple-500/20"
                : depositAsset === "USDT"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : depositAsset === "USDC"
                ? "bg-blue-500/10 border-blue-500/20"
                : depositAsset === "ETH"
                ? "bg-violet-500/10 border-violet-500/20"
                : "bg-orange-500/10 border-orange-500/20"
            }`}>
              <span className="text-lg">
                {depositAsset === "MATIC" ? "🟣"
                  : depositAsset === "USDT" ? "🟢"
                  : depositAsset === "USDC" ? "🔵"
                  : depositAsset === "ETH"  ? "🟣"
                  : "🟠"}
              </span>
              <div>
                <p className={`text-xs font-bold ${
                  ASSET_COLORS[depositAsset]?.text || "text-brand-500"
                }`}>
                  Red: Polygon (MATIC)
                </p>
                <p className="text-[10px] text-gray-400">
                  {depositAsset === "MATIC"
                    ? "Token nativo de Polygon"
                    : depositAsset === "USDT"
                    ? "USDT ERC-20 en Polygon"
                    : depositAsset === "USDC"
                    ? "USDC ERC-20 en Polygon"
                    : depositAsset === "ETH"
                    ? "ETH Bridged en Polygon"
                    : "BTC Bridged en Polygon"
                  }
                </p>
              </div>
            </div>

            {/* Advertencia importante */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-red-700 dark:text-red-400 mb-0.5">
                  ⚠️ Solo envía desde Polygon
                </p>
                <p className="text-[10px] text-red-600 dark:text-red-500 leading-relaxed">
                  Esta dirección es de la red <strong>Polygon</strong>.
                  No envíes desde Ethereum, Tron, BSC u otras redes
                  o perderás tus fondos permanentemente.
                </p>
              </div>
            </div>

            {/* QR y dirección */}
            {walletAddress ? (
              <div className="space-y-4">

                {/* QR */}
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                        walletAddress
                      )}&format=svg`}
                      alt="QR Code"
                      className="w-44 h-44"
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tu dirección Polygon
                  </p>
                  <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 border border-gray-200 dark:border-white/10">
                    <span className="text-[11px] font-mono text-gray-600 dark:text-gray-300 flex-1 break-all select-all">
                      {walletAddress}
                    </span>
                    <button
                      onClick={() => handleCopyAddress(walletAddress)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 ${
                        copied
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {copied
                        ? <><Check className="h-3 w-3" /> Copiada</>
                        : <><Copy  className="h-3 w-3" /> Copiar</>
                      }
                    </button>
                  </div>
                </div>

                {/* Link explorador */}
                <a
                  href={`https://polygonscan.com/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center text-[11px] text-purple-500 font-bold hover:text-purple-600 transition-colors"
                >
                  Ver en PolygonScan →
                </a>

                {/* Info de confirmaciones */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Comisión",      value: "< $0.01" },
                    { label: "Confirmación",  value: "~2 min" },
                    { label: "Red",           value: "Polygon" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="text-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10"
                    >
                      <p className="text-[10px] text-gray-400 mb-0.5">
                        {item.label}
                      </p>
                      <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Si es MATIC explica para qué sirve */}
                {depositAsset === "MATIC" && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <Info className="h-4 w-4 text-purple-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 leading-relaxed">
                      <strong>MATIC es el gas de Polygon.</strong> Necesitas
                      al menos <strong>0.05 MATIC</strong> (~$0.03) para
                      poder enviar cualquier token. Es un pago único muy pequeño.
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-8 text-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  No se encontró tu dirección de wallet.
                  Cierra sesión y vuelve a entrar.
                </p>
              </div>
            )}

          </div>
        </div>
      )}
            {/* ═══ MODAL RETIRO ════════════════════════════════ */}
      {activeAction.type === "withdraw" && activeAction.asset && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">

            {/* Header modal */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${
                  ASSET_COLORS[activeAction.asset]?.bg || "bg-red-500/10"
                } flex items-center justify-center`}>
                  <ArrowUpRight className={`h-4 w-4 ${
                    ASSET_COLORS[activeAction.asset]?.text || "text-red-500"
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Retirar {activeAction.asset}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Enviar a wallet externa · Polygon
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

            {/* Steps indicator */}
            {!withdrawSuccess && (
              <div className="flex items-center gap-2">
                {[
                  { step: 1, label: "Dirección" },
                  { step: 2, label: "Monto" },
                  { step: 3, label: "Confirmar" },
                ].map(({ step, label }, idx) => (
                  <div key={step} className="flex items-center gap-1.5 flex-1">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0 ${
                      withdrawStep >= step
                        ? `${ASSET_COLORS[activeAction.asset!]?.bg || "bg-brand-500/10"} ${ASSET_COLORS[activeAction.asset!]?.text || "text-brand-500"} ring-2 ring-current`
                        : "bg-gray-100 dark:bg-white/5 text-gray-400"
                    }`}>
                      {step}
                    </div>
                    <span className={`text-[10px] font-semibold ${
                      withdrawStep >= step
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-400"
                    }`}>
                      {label}
                    </span>
                    {idx < 2 && (
                      <div className={`flex-1 h-0.5 rounded-full transition-colors ${
                        withdrawStep > step
                          ? ASSET_COLORS[activeAction.asset!]?.bg?.replace("bg-", "bg-") || "bg-brand-500"
                          : "bg-gray-200 dark:bg-white/10"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── STEP 1: Dirección ── */}
            {withdrawStep === 1 && (
              <div className="space-y-4">

                {/* Red info */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  ASSET_COLORS[activeAction.asset]?.border || "border-brand-500/20"
                } ${ASSET_COLORS[activeAction.asset]?.bg || "bg-brand-500/5"}`}>
                  <span className="text-xl">🟣</span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      Red Polygon (ERC-20)
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Comisión: &lt;$0.01 · Tiempo: ~2 min
                    </p>
                  </div>
                  <CheckCircle2 className={`h-4 w-4 ${
                    ASSET_COLORS[activeAction.asset]?.text || "text-brand-500"
                  }`} />
                </div>

                {/* Input dirección */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Dirección Polygon de destino
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono transition-all"
                  />

                  {/* Validación en tiempo real */}
                  {withdrawAddress.length > 0 && (
                    <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-semibold ${
                      withdrawAddress.startsWith("0x") &&
                      withdrawAddress.length === 42
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}>
                      {withdrawAddress.startsWith("0x") &&
                      withdrawAddress.length === 42 ? (
                        <><CheckCircle2 className="h-3 w-3" /> Dirección válida</>
                      ) : (
                        <><AlertTriangle className="h-3 w-3" /> Debe empezar con 0x y tener 42 caracteres ({withdrawAddress.length}/42)</>
                      )}
                    </div>
                  )}
                </div>

                {/* Advertencia no enviar a TRC20 */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    Solo envía a direcciones de la red <strong>Polygon</strong>.
                    No uses direcciones de Tron (T...), Ethereum puro u otras redes.
                  </p>
                </div>

                <button
                  disabled={
                    !withdrawAddress.startsWith("0x") ||
                    withdrawAddress.length !== 42
                  }
                  onClick={() => setWithdrawStep(2)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-40 ${
                    ASSET_COLORS[activeAction.asset]?.bg?.replace(
                      "/10",
                      ""
                    ) || "bg-brand-500"
                  } bg-gray-900 dark:bg-white/10`}
                >
                  Continuar <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ── STEP 2: Monto ── */}
            {withdrawStep === 2 && (
              <div className="space-y-4">

                {/* Resumen dirección */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10">
                  <span className="text-lg">🟣</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                      Polygon Network
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">
                      {withdrawAddress}
                    </p>
                  </div>
                  <button
                    onClick={() => setWithdrawStep(1)}
                    className="text-[10px] text-brand-500 font-bold flex-shrink-0"
                  >
                    Editar
                  </button>
                </div>

                {/* Input monto */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Monto a enviar
                    </label>
                    <button
                      onClick={handleSetMaxAmount}
                      className={`text-[10px] font-bold ${
                        ASSET_COLORS[activeAction.asset]?.text || "text-brand-500"
                      }`}
                    >
                      MAX:{" "}
                      {activeAction.asset === "MATIC"
                        ? Math.max(
                            0,
                            (balances.find((b) => b.symbol === "MATIC")?.amount || 0) - 0.05
                          ).toFixed(4)
                        : balances
                            .find((b) => b.symbol === activeAction.asset)
                            ?.amount.toFixed(
                              activeAction.asset === "BTC" ? 6 : 2
                            ) || "0"
                      }{" "}
                      {activeAction.asset}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full text-2xl font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-4 pr-20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                      {activeAction.asset}
                    </span>
                  </div>

                  {/* USD equivalente */}
                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      ≈ $
                      {(
                        parseFloat(withdrawAmount) *
                        (prices[activeAction.asset]?.usd || 1)
                      ).toFixed(2)}{" "}
                      USD
                    </p>
                  )}
                </div>

                {/* Gas estimate */}
                {gasEstimate && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-500/5 border border-purple-500/20">
                    <Info className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        Gas estimado
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {gasEstimate.gasEstimate} · {gasEstimate.gasCostUSD}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  disabled={
                    !withdrawAmount || parseFloat(withdrawAmount) <= 0
                  }
                  onClick={() => setWithdrawStep(3)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-xs font-bold disabled:opacity-40 transition-all"
                >
                  Continuar <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ── STEP 3: Confirmar con password ── */}
            {withdrawStep === 3 && !withdrawSuccess && (
              <div className="space-y-4">

                {/* Resumen transacción */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resumen de transacción
                  </p>
                  {[
                    { label: "Activo",      value: activeAction.asset || "" },
                    { label: "Monto",       value: `${withdrawAmount} ${activeAction.asset}` },
                    {
                      label: "Valor USD",
                      value: `$${(
                        parseFloat(withdrawAmount || "0") *
                        (prices[activeAction.asset!]?.usd || 1)
                      ).toFixed(2)}`
                    },
                    { label: "Red",         value: "Polygon" },
                    { label: "Comisión",    value: gasEstimate?.gasCostUSD || "< $0.01" },
                    {
                      label: "Destino",
                      value: `${withdrawAddress.slice(0, 6)}...${withdrawAddress.slice(-4)}`
                    },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center">
                      <span className="text-[11px] text-gray-400">{label}</span>
                      <span className="text-[11px] font-bold text-gray-900 dark:text-white">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Input contraseña */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Confirma tu contraseña
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type={showWithdrawPwd ? "text" : "password"}
                      value={withdrawPassword}
                      onChange={(e) => {
                        setWithdrawPassword(e.target.value);
                        if (withdrawError) setWithdrawError(null);
                      }}
                      placeholder="Tu contraseña de CubaX"
                      className="w-full text-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-12 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowWithdrawPwd(!showWithdrawPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showWithdrawPwd
                        ? <EyeOff className="h-4 w-4" />
                        : <Eye    className="h-4 w-4" />
                      }
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Necesaria para descifrar tu llave privada y firmar la transacción
                  </p>
                </div>

                {/* Error */}
                {withdrawError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-700 dark:text-red-400">
                      {withdrawError}
                    </p>
                  </div>
                )}

                {/* Botones */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setWithdrawStep(2)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    disabled={isSubmitting || !withdrawPassword}
                    onClick={handleExecuteWithdrawal}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition-all ${
                      ASSET_COLORS[activeAction.asset]?.bg?.replace(
                        "/10", ""
                      ) || "bg-purple-500"
                    } bg-purple-500`}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Firmando...</>
                    ) : (
                      <><Shield className="h-3.5 w-3.5" /> Confirmar y Enviar</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP SUCCESS ── */}
            {withdrawSuccess && (
              <div className="py-6 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    ¡Transacción enviada!
                  </h3>
                  <p className="text-xs text-gray-400">
                    Tu transacción fue firmada y enviada a la red Polygon
                  </p>
                </div>

                {withdrawTxId && (
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/10 space-y-2">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                      Hash de transacción
                    </p>
                    <p className="text-[11px] font-mono text-gray-600 dark:text-gray-300 break-all">
                      {withdrawTxId}
                    </p>
                    <a
                      href={`https://polygonscan.com/tx/${withdrawTxId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 text-[11px] font-bold text-purple-500 hover:text-purple-600 transition-colors"
                    >
                      Ver en PolygonScan <ArrowRight className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {/* Info tiempo */}
                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                  <Info className="h-3.5 w-3.5" />
                  La transacción tardará ~2 minutos en confirmarse
                </div>

                <button
                  onClick={handleCloseAction}
                  className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-xs font-bold transition-colors"
                >
                  Volver a Wallet
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
                }
