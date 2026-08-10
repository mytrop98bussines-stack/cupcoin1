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
    const storedAddresses = getWalletAddresses();
    if (!storedAddresses?.evm) {
      setLoadingBalances(false);
      return;
    }

    setAddresses(storedAddresses);
    setLoadingBalances(true);

    try {
      const [tokenBalances, tokenPrices] = await Promise.all([
        getWalletBalances(storedAddresses),
        getTokenPrices(),
      ]);

      if (!Array.isArray(tokenBalances)) {
        setBalances([]);
        return;
      }

      const safePrices = tokenPrices || {};

      const enriched = tokenBalances
        .filter((b) => b && b.symbol)
        .map((b) => {
          const price = safePrices[b.symbol];
          return {
            ...b,
            usdValue: price ? (b.amount || 0) * price.usd : 0,
          };
        });

      setBalances(enriched);
      setPrices(safePrices);
      console.log("✅ [Wallet] Saldos multi-red cargados");
    } catch (err) {
      console.error("❌ [Wallet] Error:", err);
      setBalances([]);
    } finally {
      setLoadingBalances(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

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
