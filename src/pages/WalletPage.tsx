import { useState, useEffect, useCallback } from "react";
import { useAppStore }  from "@/store/useAppStore";
import {
  getWalletBalances,
  getTokenPrices,
  sendToken,
  estimateGas,
  getAddressForNetwork,
} from "@/lib/wallet/walletService";
import {
  getWalletAddresses,
  getStoredWalletAddress,
  hasStoredWallet,
  saveWalletAddresses,
} from "@/lib/wallet/walletStorage";
import type { TokenBalance, NetworkId, WalletAddresses } from "@/lib/wallet/walletTypes";
import { NETWORKS } from "@/lib/wallet/networkConfig";
import {
  Wallet, Copy, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Loader2, Check,
  Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, X, Sparkles, ArrowRight,
  Info, CheckCircle2, Lock, Shield,
} from "lucide-react";

// ─── Colores por red ──────────────────────────────────────
const NETWORK_COLORS: Record<string, {
  bg: string; text: string; border: string; gradient: string;
}> = {
  polygon:  { bg: "bg-purple-500/10",  text: "text-purple-500",  border: "border-purple-500/20",  gradient: "from-purple-500/20 to-purple-600/5"  },
  ethereum: { bg: "bg-blue-500/10",    text: "text-blue-500",    border: "border-blue-500/20",    gradient: "from-blue-500/20 to-blue-600/5"    },
  bsc:      { bg: "bg-yellow-500/10",  text: "text-yellow-500",  border: "border-yellow-500/20",  gradient: "from-yellow-500/20 to-yellow-600/5"  },
  tron:     { bg: "bg-red-500/10",     text: "text-red-500",     border: "border-red-500/20",     gradient: "from-red-500/20 to-red-600/5"     },
  bitcoin:  { bg: "bg-orange-500/10",  text: "text-orange-500",  border: "border-orange-500/20",  gradient: "from-orange-500/20 to-orange-600/5"  },
};

// ─── Colores por token ────────────────────────────────────
const TOKEN_COLORS: Record<string, {
  bg: string; text: string;
}> = {
  MATIC: { bg: "bg-purple-500/10",  text: "text-purple-500"  },
  USDT:  { bg: "bg-emerald-500/10", text: "text-emerald-500" },
  USDC:  { bg: "bg-blue-500/10",    text: "text-blue-500"    },
  ETH:   { bg: "bg-violet-500/10",  text: "text-violet-500"  },
  WBTC:  { bg: "bg-orange-500/10",  text: "text-orange-500"  },
  BNB:   { bg: "bg-yellow-500/10",  text: "text-yellow-500"  },
  BUSD:  { bg: "bg-yellow-400/10",  text: "text-yellow-400"  },
  TRX:   { bg: "bg-red-500/10",     text: "text-red-500"     },
  BTC:   { bg: "bg-orange-500/10",  text: "text-orange-500"  },
};

type ActionType = "deposit" | "withdraw" | null;

interface ActiveAction {
  type:      ActionType;
  asset:     string | null;
  networkId: NetworkId | null;
}

export function WalletPage() {
  const { user, setModalOpen, navigate } = useAppStore();

  // ─── Wallet state ─────────────────────────────────────
  const [addresses, setAddresses]         = useState<WalletAddresses | null>(null);
  const [balances, setBalances]           = useState<TokenBalance[]>([]);
  const [prices, setPrices]               = useState<Record<string, { usd: number; usd_24h_change: number }>>({});
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  // ─── UI state ─────────────────────────────────────────
  const [hideBalances, setHideBalances]   = useState(false);
  const [copied, setCopied]               = useState<string | null>(null);
  const [expandedKey, setExpandedKey]     = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

  // ─── Action modals ────────────────────────────────────
  const [activeAction, setActiveAction]   = useState<ActiveAction>({
    type: null, asset: null, networkId: null,
  });
  const [depositAsset, setDepositAsset]   = useState("USDT");
  const [depositNetwork, setDepositNetwork] = useState<NetworkId>("polygon");

  // ─── Withdraw state ───────────────────────────────────
  const [withdrawAddress, setWithdrawAddress]   = useState("");
  const [withdrawAmount, setWithdrawAmount]     = useState("");
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [showWithdrawPwd, setShowWithdrawPwd]   = useState(false);
  const [withdrawStep, setWithdrawStep]         = useState<1 | 2 | 3>(1);
  const [withdrawSuccess, setWithdrawSuccess]   = useState(false);
  const [withdrawTxId, setWithdrawTxId]         = useState("");
  const [withdrawError, setWithdrawError]       = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [gasEstimate, setGasEstimate]           = useState<{
    gasEstimate: string; gasCostUSD: string;
  } | null>(null);

  // =========================================================
  // CARGAR WALLET Y SALDOS
  // =========================================================
  const loadWalletData = useCallback(async () => {
  setLoadingBalances(true);

  try {
    // ✅ Intentar obtener direcciones guardadas
    let storedAddresses = getWalletAddresses();

    // ✅ Si no hay direcciones multi-red pero SÍ hay wallet EVM
    // (usuario registrado antes de la migración multi-red)
    if (!storedAddresses?.evm) {
      const evmAddress = getStoredWalletAddress();

      if (!evmAddress) {
        console.warn("⚠️ No hay wallet en este dispositivo");
        setLoadingBalances(false);
        return;
      }

      console.log("⚠️ Wallet antigua detectada, solo EVM disponible");

      // Crear objeto de direcciones solo con EVM
      storedAddresses = {
        evm:     evmAddress,
        tron:    "",
        bitcoin: "",
      };

      // Guardar para futuras cargas
      saveWalletAddresses(storedAddresses);
    }

    setAddresses(storedAddresses);

    console.log("🔍 Cargando saldos para:", storedAddresses);

    // ✅ Cargar precios primero (más rápido)
    const tokenPrices = await getTokenPrices();
    setPrices(tokenPrices || {});

    // ✅ Cargar saldos de cada red por separado
    // para que si una falla no bloquee las demás
    const allBalances: TokenBalance[] = [];

    // EVM siempre disponible
    try {
      const { getWalletBalances } = await import("@/lib/wallet/walletService");
      const evmBalances = await getWalletBalances(storedAddresses);

      if (Array.isArray(evmBalances)) {
        const enriched = evmBalances
          .filter((b) => b && b.symbol)
          .map((b) => ({
            ...b,
            usdValue: tokenPrices[b.symbol]
              ? (b.amount || 0) * tokenPrices[b.symbol].usd
              : 0,
          }));
        allBalances.push(...enriched);
      }
    } catch (err) {
      console.error("❌ Error cargando saldos:", err);
    }

    console.log("✅ Saldos cargados:", allBalances.length, "tokens");
    console.log("✅ Con balance:", allBalances.filter(b => b.amount > 0));

    setBalances(allBalances);

  } catch (err) {
    console.error("❌ [Wallet] Error general:", err);
    setBalances([]);
  } finally {
    setLoadingBalances(false);
  }
}, []);
  // ─── Refrescar precios cada 30s ───────────────────────
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const newPrices = await getTokenPrices();
        setPrices(newPrices);
        setBalances((prev) =>
          prev.map((b) => {
            const price = newPrices[b.symbol];
            return { ...b, usdValue: price ? b.amount * price.usd : b.usdValue };
          })
        );
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setModalOpen(activeAction.type !== null);
    return () => setModalOpen(false);
  }, [activeAction.type, setModalOpen]);

  // ─── Estimar gas ──────────────────────────────────────
  useEffect(() => {
    if (
      !activeAction.asset     ||
      !activeAction.networkId ||
      !withdrawAddress        ||
      !withdrawAmount         ||
      withdrawStep !== 2      ||
      activeAction.networkId === "bitcoin" ||
      activeAction.networkId === "tron"
    ) return;

    const timer = setTimeout(async () => {
      const estimate = await estimateGas(
        activeAction.asset!,
        activeAction.networkId!,
        withdrawAddress,
        withdrawAmount
      );
      setGasEstimate(estimate);
    }, 500);

    return () => clearTimeout(timer);
  }, [activeAction, withdrawAddress, withdrawAmount, withdrawStep]);

  // =========================================================
  // CÁLCULOS
  // =========================================================
  const totalUSD = balances.reduce((sum, b) => sum + (b.usdValue || 0), 0);
  const btcPrice = prices.BTC?.usd || 67500;
  const totalBTC = totalUSD / btcPrice;

  // Agrupar por red
  const balancesByNetwork = balances.reduce((acc, b) => {
    const key = b.networkId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {} as Record<string, TokenBalance[]>);

  // Calcular total por red
  const totalByNetwork = Object.entries(balancesByNetwork).reduce(
    (acc, [net, bals]) => {
      acc[net] = bals.reduce((sum, b) => sum + (b.usdValue || 0), 0);
      return acc;
    },
    {} as Record<string, number>
  );

  // =========================================================
  // HANDLERS
  // =========================================================
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWalletData();
    setTimeout(() => setRefreshing(false), 1000);
  }, [loadWalletData]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleOpenDeposit = (asset: string, networkId: NetworkId) => {
    setDepositAsset(asset);
    setDepositNetwork(networkId);
    setActiveAction({ type: "deposit", asset, networkId });
  };

  const handleOpenWithdraw = (asset: string, networkId: NetworkId) => {
    setActiveAction({ type: "withdraw", asset, networkId });
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
    setActiveAction({ type: null, asset: null, networkId: null });
    setWithdrawStep(1);
    setWithdrawSuccess(false);
    setWithdrawAddress("");
    setWithdrawAmount("");
    setWithdrawPassword("");
    setWithdrawError(null);
    setGasEstimate(null);
  };

  const handleSetMaxAmount = () => {
    if (!activeAction.asset || !activeAction.networkId) return;
    const token = balances.find(
      (b) => b.symbol    === activeAction.asset &&
             b.networkId === activeAction.networkId
    );
    if (!token) return;

    const nativeCoins = ["MATIC", "ETH", "BNB", "TRX"];
    if (nativeCoins.includes(activeAction.asset)) {
      const max = Math.max(0, token.amount - 0.05);
      setWithdrawAmount(max.toFixed(6));
    } else {
      setWithdrawAmount(token.amount.toString());
    }
  };

  const getAddressPlaceholder = (networkId: NetworkId): string => {
    if (networkId === "tron")   return "Empieza con T... (TRC20)";
    if (networkId === "bitcoin") return "Empieza con bc1...";
    return "0x... (dirección EVM)";
  };

  const validateAddress = (address: string, networkId: NetworkId): boolean => {
    if (networkId === "tron")    return address.startsWith("T") && address.length === 34;
    if (networkId === "bitcoin") return address.startsWith("bc1") || address.startsWith("1") || address.startsWith("3");
    return address.startsWith("0x") && address.length === 42;
  };

  const handleExecuteWithdrawal = async () => {
    if (
      !activeAction.asset     ||
      !activeAction.networkId ||
      !withdrawAddress        ||
      !withdrawAmount         ||
      !withdrawPassword
    ) return;

    if (!validateAddress(withdrawAddress, activeAction.networkId)) {
      setWithdrawError("Dirección inválida para esta red");
      return;
    }

    const monto = parseFloat(withdrawAmount);
    const token = balances.find(
      (b) => b.symbol    === activeAction.asset &&
             b.networkId === activeAction.networkId
    );

    if (!token || monto <= 0 || monto > token.amount) {
      setWithdrawError("Monto inválido o insuficiente");
      return;
    }

    // Verificar gas para redes EVM
    if (
      activeAction.networkId !== "bitcoin" &&
      activeAction.networkId !== "tron"
    ) {
      const nativeCoin = NETWORKS[activeAction.networkId]?.nativeCoin;
      const nativeBal  = balances.find(
        (b) => b.symbol    === nativeCoin &&
               b.networkId === activeAction.networkId
      );
      if (!nativeBal || nativeBal.amount < 0.001) {
        setWithdrawError(
          `Necesitas ${nativeCoin} para pagar el gas en ${NETWORKS[activeAction.networkId]?.name}`
        );
        return;
      }
    }

    setIsSubmitting(true);
    setWithdrawError(null);

    const result = await sendToken({
      toAddress:  withdrawAddress,
      amount:     withdrawAmount,
      symbol:     activeAction.asset,
      networkId:  activeAction.networkId,
      password:   withdrawPassword,
    });

    if (result.success) {
      setWithdrawSuccess(true);
      setWithdrawTxId(result.txHash || "");
      setWithdrawStep(3);
      await loadWalletData();
    } else {
      setWithdrawError(result.error || "Error procesando el retiro");
    }

    setIsSubmitting(false);
  };

  const getAssetIcon = (symbol: string) => {
    const icons: Record<string, string> = {
      USDT:  "/crypto/usdt.svg",
      USDC:  "/crypto/usdc.svg",
      BTC:   "/crypto/btc.svg",
      WBTC:  "/crypto/btc.svg",
      ETH:   "/crypto/eth.svg",
      MATIC: "/crypto/matic.svg",
      BNB:   "/crypto/bnb.svg",
      BUSD:  "/crypto/busd.svg",
      TRX:   "/crypto/trx.svg",
    };
    return icons[symbol] || "/crypto/usd.svg";
  };

  // =========================================================
  // RENDER: Sin wallet
  // =========================================================
  if (!hasStoredWallet()) {
    return (
      <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Mi Wallet</h1>
            <p className="text-[10px] text-gray-400">No custodia · Multi-red</p>
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
              No custodia · Multi-red
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-xl bg-gray-100 dark:bg-white/5"
        >
          <RefreshCw className={`h-4 w-4 text-gray-500 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* ─── BALANCE CARD ───────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.02] p-5 border border-gray-800 dark:border-white/[0.08] shadow-2xl">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />

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
              {hideBalances
                ? <><Eye    className="h-3.5 w-3.5" /> Mostrar</>
                : <><EyeOff className="h-3.5 w-3.5" /> Ocultar</>
              }
            </button>
          </div>

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
                  ≈ {hideBalances ? "••••" : `${totalBTC.toFixed(6)} BTC`}
                </p>
              </>
            )}
          </div>

          {/* Resumen por red */}
          {!loadingBalances && Object.keys(balancesByNetwork).length > 0 && (
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {Object.entries(totalByNetwork).map(([net, total]) => {
                const netInfo = NETWORKS[net];
                const colors  = NETWORK_COLORS[net];
                if (!netInfo) return null;
                return (
                  <button
                    key={net}
                    onClick={() =>
                      setSelectedNetwork(selectedNetwork === net ? null : net)
                    }
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      selectedNetwork === net || selectedNetwork === null
                        ? `${colors.bg} ${colors.text}`
                        : "bg-white/5 text-gray-500"
                    }`}
                  >
                    <span>{netInfo.shortName}</span>
                    <span className="opacity-70">
                      ${total.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={() => handleOpenDeposit("USDT", "polygon")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25 transition-colors"
            >
              <ArrowDownLeft className="h-4 w-4" /> Depositar
            </button>
            <button
              onClick={() => handleOpenWithdraw("USDT", "polygon")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold backdrop-blur-sm transition-colors"
            >
              <ArrowUpRight className="h-4 w-4" /> Retirar
            </button>
          </div>
        </div>
      </div>

      {/* ─── DIRECCIONES POR RED ────────────────────────── */}
      {addresses && (
        <div className="space-y-2">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Mis Direcciones
          </h2>

          {[
            {
              label:   "EVM (Polygon · ETH · BSC)",
              address: addresses.evm,
              key:     "evm",
              icon:    "🔷",
              color:   "text-purple-500",
              bg:      "bg-purple-500/10",
            },
            {
              label:   "Tron (TRC20)",
              address: addresses.tron,
              key:     "tron",
              icon:    "🔴",
              color:   "text-red-500",
              bg:      "bg-red-500/10",
            },
            {
              label:   "Bitcoin (Native SegWit)",
              address: addresses.bitcoin,
              key:     "bitcoin",
              icon:    "🟠",
              color:   "text-orange-500",
              bg:      "bg-orange-500/10",
            },
          ].map((item) => (
            item.address ? (
              <div
                key={item.key}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
              >
                <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 text-sm`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${item.color}`}>
                    {item.label}
                  </p>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
                    {item.address}
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(item.address, item.key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 ${
                    copied === item.key
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {copied === item.key
                    ? <><Check className="h-3 w-3" /> OK</>
                    : <><Copy className="h-3 w-3" /> Copiar</>
                  }
                </button>
              </div>
            ) : null
          ))}
        </div>
      )}
          {/* ─── BANNER GAS ─────────────────────────────────── */}
      {!loadingBalances && balances.find(
        (b) => b.symbol === "MATIC" && b.networkId === "polygon" && b.amount < 0.01
      ) && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-0.5">
              Necesitas MATIC para operar en Polygon
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
              Deposita al menos <strong>0.05 MATIC</strong> (~$0.03)
              para enviar tokens en Polygon.
            </p>
          </div>
        </div>
      )}

      {/* ─── ACTIVOS POR RED ────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Mis Activos
          </h2>
          <span className="text-[10px] text-gray-400 font-medium">
            {balances.filter((b) => b.amount > 0).length} con balance
          </span>
        </div>

        {loadingBalances ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(balancesByNetwork)
              .filter(([net]) => !selectedNetwork || selectedNetwork === net)
              .map(([net, netBalances]) => {
                const netInfo = NETWORKS[net];
                const netColors = NETWORK_COLORS[net];
                if (!netInfo) return null;

                return (
                  <div key={net} className="space-y-1.5">
                    {/* Header de red */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${netColors.bg}`}>
                      <span className="text-sm">
                        {net === "polygon"  ? "🟣"
                         : net === "ethereum" ? "🔵"
                         : net === "bsc"      ? "🟡"
                         : net === "tron"     ? "🔴"
                         : "🟠"}
                      </span>
                      <span className={`text-[11px] font-bold ${netColors.text}`}>
                        {netInfo.name}
                      </span>
                      <span className="text-[10px] text-gray-400 ml-auto">
                        ${(totalByNetwork[net] || 0).toFixed(2)}
                      </span>
                    </div>

                    {/* Tokens de esta red */}
                    {netBalances.map((balance) => {
                      const tokenColors = TOKEN_COLORS[balance.symbol] || TOKEN_COLORS.USDT;
                      const priceData   = prices[balance.symbol];
                      const change24h   = priceData?.usd_24h_change || 0;
                      const isUp        = change24h >= 0;
                      const expandKey   = `${balance.networkId}-${balance.symbol}`;
                      const isExpanded  = expandedKey === expandKey;

                      return (
                        <div
                          key={expandKey}
                          className={`rounded-2xl border transition-all ${
                            isExpanded
                              ? `${netColors.border} bg-gradient-to-r ${netColors.gradient}`
                              : "border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.02]"
                          }`}
                        >
                          <button
                            onClick={() =>
                              setExpandedKey(isExpanded ? null : expandKey)
                            }
                            className="w-full flex items-center justify-between p-4"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`h-10 w-10 rounded-xl ${tokenColors.bg} flex items-center justify-center overflow-hidden`}>
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
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${netColors.bg} ${netColors.text}`}>
                                    {netInfo.shortName}
                                  </span>
                                </div>
                                <p className="text-[11px] text-gray-400">
                                  {hideBalances
                                    ? "••••"
                                    : `${(balance.amount || 0).toFixed(
                                        balance.symbol === "BTC" || balance.symbol === "WBTC" ? 6 :
                                        ["ETH", "MATIC", "BNB", "TRX"].includes(balance.symbol) ? 4 : 2
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
                                    : `$${(balance.usdValue || 0).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}`
                                  }
                                </p>
                                <div className={`flex items-center justify-end gap-0.5 text-[10px] font-semibold ${
                                  isUp ? "text-emerald-500" : "text-red-500"
                                }`}>
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

                          {isExpanded && (
                            <div className="px-4 pb-4 pt-0 flex gap-2 animate-fade-in">
                              <button
                                onClick={() => handleOpenDeposit(
                                  balance.symbol,
                                  balance.networkId as NetworkId
                                )}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold ${tokenColors.bg} ${tokenColors.text}`}
                              >
                                <ArrowDownLeft className="h-3.5 w-3.5" />
                                Depositar
                              </button>
                              <button
                                onClick={() => handleOpenWithdraw(
                                  balance.symbol,
                                  balance.networkId as NetworkId
                                )}
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
                );
              })
            }
          </div>
        )}
      </div>

      {/* ─── INFO BANNER ────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4">
        <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
          <Info className="h-4 w-4 text-brand-500" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-900 dark:text-white mb-0.5">
            Wallet No Custodia · Multi-red
          </p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Polygon · Ethereum · BSC · Tron · Bitcoin.
            Solo tú controlas tus fondos. Las llaves privadas
            están cifradas en tu dispositivo.
          </p>
        </div>
      </div>
            {/* ═══ MODAL DEPÓSITO ══════════════════════════════ */}
      {activeAction.type === "deposit" && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <ArrowDownLeft className="h-4 w-4 text-brand-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Depositar Cripto
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Recibe en tu wallet no custodia
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAction}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Selector de red */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Selecciona la Red
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {Object.entries(NETWORKS).map(([netId, net]) => {
                  const colors   = NETWORK_COLORS[netId];
                  const selected = depositNetwork === netId;
                  return (
                    <button
                      key={netId}
                      onClick={() => setDepositNetwork(netId as NetworkId)}
                      className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[9px] font-bold transition-all ${
                        selected
                          ? `${colors.bg} ${colors.text} ring-2 ring-current`
                          : "bg-gray-50 dark:bg-white/5 text-gray-400"
                      }`}
                    >
                      <span className="text-base">
                        {netId === "polygon"  ? "🟣"
                         : netId === "ethereum" ? "🔵"
                         : netId === "bsc"      ? "🟡"
                         : netId === "tron"     ? "🔴"
                         : "🟠"}
                      </span>
                      {net.shortName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dirección de depósito */}
            {addresses && (
              <>
                {/* Info de red */}
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                  NETWORK_COLORS[depositNetwork]?.border
                } ${NETWORK_COLORS[depositNetwork]?.bg}`}>
                  <span className="text-lg">
                    {depositNetwork === "polygon"  ? "🟣"
                     : depositNetwork === "ethereum" ? "🔵"
                     : depositNetwork === "bsc"      ? "🟡"
                     : depositNetwork === "tron"     ? "🔴"
                     : "🟠"}
                  </span>
                  <div>
                    <p className={`text-xs font-bold ${NETWORK_COLORS[depositNetwork]?.text}`}>
                      {NETWORKS[depositNetwork]?.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {depositNetwork === "bitcoin"
                        ? "Comisión variable · ~30 min"
                        : depositNetwork === "tron"
                        ? "Comisión ~1 USDT · ~1 min"
                        : depositNetwork === "ethereum"
                        ? "Comisión variable · ~3 min"
                        : "Comisión < $0.01 · ~2 min"
                      }
                    </p>
                  </div>
                </div>

                {/* Advertencia */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-red-600 dark:text-red-400 leading-relaxed">
                    <strong>Solo envía desde {NETWORKS[depositNetwork]?.name}.</strong>{" "}
                    Enviar desde otra red puede resultar en pérdida permanente de fondos.
                  </p>
                </div>

                {/* QR y dirección */}
            {(() => {
              const addr = depositNetwork === "tron"
                ? addresses.tron
                : depositNetwork === "bitcoin"
                ? addresses.bitcoin
                : addresses.evm;

              if (!addr) return (
                <div className="py-6 text-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">
                    Dirección no disponible para esta red.
                    Cierra sesión y vuelve a entrar.
                  </p>
                </div>
              );

              return (
                <div className="space-y-4">

                  {/* QR */}
                  <div className="flex justify-center">
                    <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(addr)}&format=svg`}
                        alt="QR"
                        className="w-44 h-44"
                      />
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Tu dirección {NETWORKS[depositNetwork]?.name}
                    </p>
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 border border-gray-200 dark:border-white/10">
                      <span className="text-[11px] font-mono text-gray-600 dark:text-gray-300 flex-1 break-all select-all">
                        {addr}
                      </span>
                      <button
                        onClick={() => handleCopy(addr, "deposit")}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex-shrink-0 ${
                          copied === "deposit"
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {copied === "deposit"
                          ? <><Check className="h-3 w-3" /> Copiada</>
                          : <><Copy  className="h-3 w-3" /> Copiar</>
                        }
                      </button>
                    </div>
                  </div>

                  {/* Explorer */}
                  <a
                    href={
                      depositNetwork === "bitcoin"
                        ? `https://mempool.space/address/${addr}`
                        : depositNetwork === "tron"
                        ? `https://tronscan.org/#/address/${addr}`
                        : `${NETWORKS[depositNetwork]?.explorerUrl}/address/${addr}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-center text-[11px] font-bold hover:opacity-80 transition-opacity ${
                      NETWORK_COLORS[depositNetwork]?.text
                    }`}
                  >
                    Ver en explorador →
                  </a>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        label: "Comisión",
                        value: depositNetwork === "bitcoin"  ? "Variable"
                             : depositNetwork === "tron"     ? "~1 USDT"
                             : depositNetwork === "ethereum" ? "Variable"
                             : "< $0.01",
                      },
                      {
                        label: "Tiempo",
                        value: depositNetwork === "bitcoin"  ? "~30 min"
                             : depositNetwork === "tron"     ? "~1 min"
                             : depositNetwork === "ethereum" ? "~3 min"
                             : "~2 min",
                      },
                      {
                        label: "Red",
                        value: NETWORKS[depositNetwork]?.shortName,
                      },
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
                </div>
              );
              })()}
            </>
           )}
         </div> 
       </div>   
      )}        

      {/* ═══ MODAL RETIRO ════════════════════════════════ */}
      {activeAction.type === "withdraw" && activeAction.asset && activeAction.networkId && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${
                  NETWORK_COLORS[activeAction.networkId]?.bg
                } flex items-center justify-center`}>
                  <ArrowUpRight className={`h-4 w-4 ${
                    NETWORK_COLORS[activeAction.networkId]?.text
                  }`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Retirar {activeAction.asset}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    {NETWORKS[activeAction.networkId]?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseAction}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Steps */}
            {!withdrawSuccess && (
              <div className="flex items-center gap-2">
                {[
                  { step: 1, label: "Dirección" },
                  { step: 2, label: "Monto" },
                  { step: 3, label: "Confirmar" },
                ].map(({ step, label }, idx) => (
                  <div key={step} className="flex items-center gap-1.5 flex-1">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                      withdrawStep >= step
                        ? `${NETWORK_COLORS[activeAction.networkId!]?.bg} ${NETWORK_COLORS[activeAction.networkId!]?.text} ring-2 ring-current`
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
                      <div className={`flex-1 h-0.5 rounded-full ${
                        withdrawStep > step
                          ? NETWORK_COLORS[activeAction.networkId!]?.bg || "bg-brand-500"
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
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                  NETWORK_COLORS[activeAction.networkId]?.border
                } ${NETWORK_COLORS[activeAction.networkId]?.bg}`}>
                  <span className="text-xl">
                    {activeAction.networkId === "polygon"  ? "🟣"
                     : activeAction.networkId === "ethereum" ? "🔵"
                     : activeAction.networkId === "bsc"      ? "🟡"
                     : activeAction.networkId === "tron"     ? "🔴"
                     : "🟠"}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {NETWORKS[activeAction.networkId]?.name}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {activeAction.networkId === "bitcoin"  ? "Variable · ~30 min"
                       : activeAction.networkId === "tron"    ? "~1 USDT · ~1 min"
                       : activeAction.networkId === "ethereum" ? "Variable · ~3 min"
                       : "< $0.01 · ~2 min"
                      }
                    </p>
                  </div>
                  <CheckCircle2 className={`h-4 w-4 ${NETWORK_COLORS[activeAction.networkId]?.text}`} />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Dirección destino
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder={getAddressPlaceholder(activeAction.networkId)}
                    className="w-full text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 font-mono transition-all"
                  />
                  {withdrawAddress.length > 0 && (
                    <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-semibold ${
                      validateAddress(withdrawAddress, activeAction.networkId)
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}>
                      {validateAddress(withdrawAddress, activeAction.networkId)
                        ? <><CheckCircle2 className="h-3 w-3" /> Dirección válida</>
                        : <><AlertTriangle className="h-3 w-3" /> Dirección inválida para {NETWORKS[activeAction.networkId]?.name}</>
                      }
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    Solo envía a direcciones de <strong>{NETWORKS[activeAction.networkId]?.name}</strong>.
                    Enviar a otra red puede resultar en pérdida permanente.
                  </p>
                </div>

                <button
                  disabled={!validateAddress(withdrawAddress, activeAction.networkId)}
                  onClick={() => setWithdrawStep(2)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-xs font-bold disabled:opacity-40 transition-all"
                >
                  Continuar <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ── STEP 2: Monto ── */}
            {withdrawStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10">
                  <span className="text-lg">
                    {activeAction.networkId === "polygon"  ? "🟣"
                     : activeAction.networkId === "ethereum" ? "🔵"
                     : activeAction.networkId === "bsc"      ? "🟡"
                     : activeAction.networkId === "tron"     ? "🔴"
                     : "🟠"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 dark:text-white">
                      {NETWORKS[activeAction.networkId]?.name}
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

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Monto a enviar
                    </label>
                    <button
                      onClick={handleSetMaxAmount}
                      className={`text-[10px] font-bold ${
                        NETWORK_COLORS[activeAction.networkId]?.text
                      }`}
                    >
                      MAX: {(() => {
                        const token = balances.find(
                          (b) => b.symbol    === activeAction.asset &&
                                 b.networkId === activeAction.networkId
                        );
                        const nativeCoins = ["MATIC", "ETH", "BNB", "TRX"];
                        if (!token) return "0";
                        if (nativeCoins.includes(activeAction.asset!)) {
                          return Math.max(0, token.amount - 0.05).toFixed(4);
                        }
                        return token.amount.toFixed(
                          ["BTC", "WBTC"].includes(activeAction.asset!) ? 6 : 2
                        );
                      })()} {activeAction.asset}
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
                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      ≈ ${(
                        parseFloat(withdrawAmount) *
                        (prices[activeAction.asset!]?.usd || 1)
                      ).toFixed(2)} USD
                    </p>
                  )}
                </div>

                {gasEstimate && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl border ${
                    NETWORK_COLORS[activeAction.networkId]?.border
                  } ${NETWORK_COLORS[activeAction.networkId]?.bg}`}>
                    <Info className={`h-4 w-4 flex-shrink-0 ${NETWORK_COLORS[activeAction.networkId]?.text}`} />
                    <div>
                      <p className={`text-[10px] font-bold ${NETWORK_COLORS[activeAction.networkId]?.text}`}>
                        Gas estimado
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {gasEstimate.gasEstimate} · {gasEstimate.gasCostUSD}
                      </p>
                    </div>
                  </div>
                )}

                <button
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                  onClick={() => setWithdrawStep(3)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-xs font-bold disabled:opacity-40 transition-all"
                >
                  Continuar <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* ── STEP 3: Confirmar ── */}
            {withdrawStep === 3 && !withdrawSuccess && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Resumen de transacción
                  </p>
                  {[
                    { label: "Activo",   value: `${activeAction.asset}` },
                    { label: "Red",      value: NETWORKS[activeAction.networkId]?.name },
                    { label: "Monto",    value: `${withdrawAmount} ${activeAction.asset}` },
                    {
                      label: "Valor USD",
                      value: `$${(parseFloat(withdrawAmount || "0") * (prices[activeAction.asset!]?.usd || 1)).toFixed(2)}`
                    },
                    {
                      label: "Comisión",
                      value: gasEstimate?.gasCostUSD || (
                        activeAction.networkId === "bitcoin"  ? "Variable" :
                        activeAction.networkId === "tron"     ? "~1 USDT"  :
                        "< $0.01"
                      )
                    },
                    {
                      label: "Destino",
                      value: `${withdrawAddress.slice(0, 8)}...${withdrawAddress.slice(-6)}`
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

                {withdrawError && (
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-700 dark:text-red-400">
                      {withdrawError}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setWithdrawStep(2)}
                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold"
                  >
                    Atrás
                  </button>
                  <button
                    disabled={isSubmitting || !withdrawPassword}
                    onClick={handleExecuteWithdrawal}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-xs font-bold disabled:opacity-40 transition-all ${
                      NETWORK_COLORS[activeAction.networkId]?.bg?.replace("/10", "")
                    } bg-purple-500`}
                  >
                    {isSubmitting
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Firmando...</>
                      : <><Shield className="h-3.5 w-3.5" /> Confirmar y Enviar</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* ── SUCCESS ── */}
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
                    Firmada y enviada a {NETWORKS[activeAction.networkId!]?.name}
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
      href={
        activeAction.networkId === "bitcoin"
          ? `https://mempool.space/tx/${withdrawTxId}`
          : activeAction.networkId === "tron"
          ? `https://tronscan.org/#/transaction/${withdrawTxId}`
          : `${NETWORKS[activeAction.networkId!]?.explorerUrl}/tx/${withdrawTxId}`
      }
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-1 text-[11px] font-bold hover:opacity-80 ${
        NETWORK_COLORS[activeAction.networkId!]?.text
      }`}
    >
      Ver en explorador <ArrowRight className="h-3 w-3" />
    </a>
  </div>
)}
                
                <button
                  onClick={handleCloseAction}
                  className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-xs font-bold"
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
                     
