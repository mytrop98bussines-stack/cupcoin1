import { useState, useEffect, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }         from "@/components/ui/Card";
import { CRYPTO_ICONS } from "@/data/data";
import {
  Wallet, Copy, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Shield, Loader2, Check,
  Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, X, Sparkles, ArrowRight,
  Info, CheckCircle2, Star, ArrowDownUp,
  Clock,
} from "lucide-react";

type ActionType = "deposit" | "withdraw" | null;

interface BalanceItem {
  asset:     string;
  amount:    number;
  usdValue:  number;
  change24h: number;
  price:     number;
  network?:  string;
}

const LOCAL_ICONS: Record<string, string> = {
  USDT: "usdt.svg",
  USDC: "usdc.svg",
  BTC:  "btc.svg",
  ETH:  "eth.svg",
  XLM:  "xlm.svg",
  USD:  "usd.svg",
};

const CHAIN_OPTIONS: Record<
  string,
  { label: string; value: string; icon: string; fee: string; time: string }[]
> = {
  USDT: [{ label: "Tron (TRC-20)",    value: "TRC20",   icon: "🔴", fee: "~1 USDT",       time: "~1 min" }],
  USDC: [{ label: "Stellar Network",  value: "STELLAR", icon: "⭐", fee: "~0.00001 XLM",  time: "~5 seg" }],
  BTC:  [{ label: "Bitcoin Network",  value: "BTC",     icon: "🟠", fee: "Variable",      time: "~10-30 min" }],
  ETH:  [{ label: "Ethereum (ERC-20)", value: "ERC20",  icon: "🔵", fee: "Variable",      time: "~3-5 min" }],
  XLM:  [{ label: "Stellar Network",  value: "STELLAR", icon: "⭐", fee: "~0.00001 XLM",  time: "~5 seg" }],
};

const ASSET_COLORS: Record<
  string,
  { bg: string; text: string; gradient: string; border: string }
> = {
  USDT: { bg: "bg-emerald-500/10", text: "text-emerald-500", gradient: "from-emerald-500/20 to-emerald-600/5", border: "border-emerald-500/20" },
  USDC: { bg: "bg-blue-500/10",    text: "text-blue-500",    gradient: "from-blue-500/20 to-blue-600/5",       border: "border-blue-500/20" },
  BTC:  { bg: "bg-orange-500/10",  text: "text-orange-500",  gradient: "from-orange-500/20 to-orange-600/5",   border: "border-orange-500/20" },
  ETH:  { bg: "bg-violet-500/10",  text: "text-violet-500",  gradient: "from-violet-500/20 to-violet-600/5",   border: "border-violet-500/20" },
  XLM:  { bg: "bg-indigo-500/10",  text: "text-indigo-500",  gradient: "from-indigo-500/20 to-indigo-600/5",   border: "border-indigo-500/20" },
};

const BACKEND_URL = "https://cubax-backend.onrender.com";

export function WalletPage() {
  const {
    user, prices, fetchPrices,
    depositAddresses, setModalOpen, navigate,
  } = useAppStore();

  const [hideBalances, setHideBalances]         = useState(false);
  const [copied, setCopied]                     = useState(false);
  const [activeAction, setActiveAction]         = useState<{ type: ActionType; asset: string | null }>({ type: null, asset: null });

  const [depositAsset, setDepositAsset]         = useState("USDT");
  const [withdrawAddress, setWithdrawAddress]   = useState("");
  const [withdrawAmount, setWithdrawAmount]     = useState("");
  const [withdrawMemo, setWithdrawMemo]         = useState("");
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

  const [stellarPublic, setStellarPublic]       = useState<string | null>(null);
  const [stellarBalance, setStellarBalance]     = useState<number>(0);
  const [stellarLoading, setStellarLoading]     = useState(true);
  const [creatingStellar, setCreatingStellar]   = useState(false);
  const [stellarExplorer, setStellarExplorer]   = useState<string>("");

  const [usdcBalance, setUsdcBalance]           = useState<number>(0);
  const [usdcTrustline, setUsdcTrustline]       = useState(false);
  const [activatingUsdc, setActivatingUsdc]     = useState(false);

  const firestoreBalances = (user as any)?.balances || { USDT: 0, BTC: 0, ETH: 0, USDC: 0 };

  useEffect(() => {
    if (!user?.uid) return;
    void loadStellarWallet();
  }, [user?.uid]);

  const loadStellarWallet = async () => {
    setStellarLoading(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res = await fetch(`${BACKEND_URL}/api/stellar/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setStellarPublic(data.publicKey);
        setStellarBalance(data.balances?.XLM || 0);
        setStellarExplorer(
          data.network === "public"
            ? `https://stellar.expert/explorer/public/account/${data.publicKey}`
            : `https://stellar.expert/explorer/testnet/account/${data.publicKey}`
        );

        const usdcRes = await fetch(`${BACKEND_URL}/api/stellar/usdc/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usdcData = await usdcRes.json();

        if (usdcData.success) {
          setUsdcBalance(usdcData.balance || 0);
          setUsdcTrustline(usdcData.hasTrustline || false);
        }
      } else if (data.code === "NO_STELLAR_ACCOUNT") {
        setStellarPublic(null);
      }
    } catch (err) {
      console.error("❌ Error cargando Stellar:", err);
    } finally {
      setStellarLoading(false);
    }
  };

  const handleCreateStellar = async () => {
    setCreatingStellar(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/api/stellar/create-account`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) await loadStellarWallet();
    } catch (err) {
      console.error("❌ Error creando Stellar:", err);
    } finally {
      setCreatingStellar(false);
    }
  };

  const handleActivateUSDC = async () => {
    setActivatingUsdc(true);
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/api/stellar/usdc/trustline`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) await loadStellarWallet();
    } catch (err) {
      console.error("❌ Error activando USDC:", err);
    } finally {
      setActivatingUsdc(false);
    }
  };

  const xlmPrice  = prices.find((p) => p.symbol.toUpperCase() === "XLM")?.priceUSD  || 0.12;
  const usdcPrice = prices.find((p) => p.symbol.toUpperCase() === "USDC")?.priceUSD || 1;

  const baseAssets: BalanceItem[] = ["USDT", "BTC", "ETH"].map((asset) => {
    const amount    = firestoreBalances[asset] || 0;
    const priceInfo = prices.find((p) => p.symbol.toUpperCase() === asset);
    const price     = priceInfo?.priceUSD || (asset === "BTC" ? 67500 : asset === "ETH" ? 3500 : 1);
    const change    = priceInfo?.change24h || 0;
    return { asset, amount, usdValue: amount * price, change24h: change, price };
  });

  const usdcAsset: BalanceItem | null = stellarPublic && usdcTrustline
    ? { asset: "USDC", amount: usdcBalance, usdValue: usdcBalance * usdcPrice, change24h: 0, price: usdcPrice, network: "Stellar" }
    : null;

  const stellarAsset: BalanceItem | null = stellarPublic
    ? {
        asset: "XLM", amount: stellarBalance, usdValue: stellarBalance * xlmPrice,
        change24h: prices.find((p) => p.symbol.toUpperCase() === "XLM")?.change24h || 0,
        price: xlmPrice, network: "Stellar",
      }
    : null;

  const balancesList = [
    ...baseAssets,
    ...(usdcAsset    ? [usdcAsset]    : []),
    ...(stellarAsset ? [stellarAsset] : []),
  ];

  const totalUSD = balancesList.reduce((sum, b) => sum + b.usdValue, 0);
  const btcPrice = prices.find((p) => p.symbol === "BTC")?.priceUSD || 67500;
  const totalBTC = totalUSD / btcPrice;

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  useEffect(() => {
    setModalOpen(activeAction.type !== null);
    return () => setModalOpen(false);
  }, [activeAction.type, setModalOpen]);

  useEffect(() => {
    if (activeAction.asset && CHAIN_OPTIONS[activeAction.asset]) {
      setSelectedChain(CHAIN_OPTIONS[activeAction.asset][0].value);
    }
  }, [activeAction.asset]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPrices();
    await loadStellarWallet();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchPrices]);

  const getAssetIcon = (asset: string) => {
    const upper = asset.toUpperCase();
    if (LOCAL_ICONS[upper]) return `/crypto/${LOCAL_ICONS[upper]}`;
    return CRYPTO_ICONS[upper] || CRYPTO_ICONS[asset.toLowerCase()] || "/crypto/usd.svg";
  };

  const handleOpenDeposit = async (asset: string) => {
    const assetUpper = asset.toUpperCase();
    setDepositAsset(assetUpper);
    setDepositAddress(null);
    setActiveAction({ type: "deposit", asset: assetUpper });

    if ((assetUpper === "XLM" || assetUpper === "USDC") && stellarPublic) {
      setDepositAddress(stellarPublic);
      return;
    }

    if (!user?.uid || assetUpper !== "USDT") return;

    const cachedAddress = depositAddresses[assetUpper] || (user as any)?.depositAddresses?.[assetUpper];
    if (cachedAddress) {
      setDepositAddress(cachedAddress);
      return;
    }

    setIsLoadingAddress(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tron/deposit-address`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (data.success && data.coin_address) setDepositAddress(data.coin_address);
    } catch (err: any) {
      console.error("Error:", err.message);
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
    setWithdrawMemo("");
    setWithdrawTxId("");
    setWithdrawError(null);
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetMaxAmount = () => {
    if (activeAction.asset === "XLM") {
      const max = Math.max(0, stellarBalance - 1.5);
      setWithdrawAmount(max.toFixed(4));
    } else if (activeAction.asset === "USDC") {
      setWithdrawAmount(usdcBalance.toFixed(2));
    } else if (activeAction.asset) {
      const max = firestoreBalances[activeAction.asset] || 0;
      setWithdrawAmount(String(max));
    }
  };

  const handleExecuteWithdrawal = async () => {
    if (!activeAction.asset || !withdrawAddress || !withdrawAmount || !user?.uid) return;

    if (activeAction.asset === "USDC") {
      if (!withdrawAddress.startsWith("G") || withdrawAddress.length !== 56) {
        setWithdrawError("Dirección Stellar inválida"); return;
      }
      const monto = parseFloat(withdrawAmount);
      if (monto <= 0 || monto > usdcBalance) {
        setWithdrawError("Balance USDC insuficiente"); return;
      }
      setIsSubmitting(true); setWithdrawError(null);
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(`${BACKEND_URL}/api/stellar/usdc/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ toAddress: withdrawAddress, amount: monto, memo: withdrawMemo || undefined }),
        });
        const data = await res.json();
        if (data.success) {
          setWithdrawSuccess(true); setWithdrawTxId(data.txHash); setWithdrawStep(3);
          await loadStellarWallet();
        } else setWithdrawError(data.error || "Error procesando retiro");
      } catch { setWithdrawError("Error de conexión"); }
      finally { setIsSubmitting(false); }
      return;
    }

    if (activeAction.asset === "XLM") {
      if (!withdrawAddress.startsWith("G") || withdrawAddress.length !== 56) {
        setWithdrawError("Dirección Stellar inválida"); return;
      }
      const monto = parseFloat(withdrawAmount);
      if (monto <= 0 || monto > (stellarBalance - 1.5)) {
        setWithdrawError("Balance insuficiente (deja 1.5 XLM de reserva)"); return;
      }
      setIsSubmitting(true); setWithdrawError(null);
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(`${BACKEND_URL}/api/stellar/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ toAddress: withdrawAddress, amount: monto, memo: withdrawMemo || undefined }),
        });
        const data = await res.json();
        if (data.success) {
          setWithdrawSuccess(true); setWithdrawTxId(data.txHash); setWithdrawStep(3);
          await loadStellarWallet();
        } else setWithdrawError(data.error || "Error procesando el retiro");
      } catch { setWithdrawError("Error de conexión"); }
      finally { setIsSubmitting(false); }
      return;
    }

    if (activeAction.asset !== "USDT") return;
    if (!withdrawAddress.startsWith("T")) {
      setWithdrawError("La dirección debe ser TRC20 y empezar con T"); return;
    }
    const disponible = firestoreBalances[activeAction.asset] || 0;
    const monto      = parseFloat(withdrawAmount);
    if (monto <= 0 || monto > disponible) return;
    if (monto < 1) { setWithdrawError("El monto mínimo de retiro es 1 USDT"); return; }
    setIsSubmitting(true); setWithdrawError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tron/withdraw`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid: user.uid, toAddress: withdrawAddress, amount: monto }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawSuccess(true); setWithdrawTxId(data.txHash || ""); setWithdrawStep(3);
      } else setWithdrawError(data.error || "Error procesando el retiro");
    } catch (err) { setWithdrawError("Error de conexión con el servidor"); }
    finally { setIsSubmitting(false); }
  };

  const handleCloseAction = () => {
    setActiveAction({ type: null, asset: null });
    setWithdrawStep(1); setWithdrawSuccess(false);
    setWithdrawAddress(""); setWithdrawAmount(""); setWithdrawMemo("");
    setWithdrawError(null); setDepositAddress(null);
  };

  const currentChainInfo = activeAction.asset ? CHAIN_OPTIONS[activeAction.asset]?.[0] : null;
  const isStellar        = activeAction.asset === "XLM" || activeAction.asset === "USDC";

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-28 space-y-4 animate-fade-in">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Mi Wallet</h1>
            <p className="text-[10px] text-gray-400 font-medium">Multi-red · CupCoin</p>
          </div>
        </div>
        <button onClick={handleRefresh} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5">
          <RefreshCw className={`h-4 w-4 text-gray-500 dark:text-gray-400 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* BALANCE CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-white/[0.08] dark:via-white/[0.04] dark:to-white/[0.02] p-5 border border-gray-800 dark:border-white/[0.08] shadow-2xl">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Balance Total</span>
            </div>
            <button onClick={() => setHideBalances(!hideBalances)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white">
              {hideBalances ? <><Eye className="h-3.5 w-3.5" /> Mostrar</> : <><EyeOff className="h-3.5 w-3.5" /> Ocultar</>}
            </button>
          </div>
          <div className="mb-5">
            <p className="text-4xl font-black text-white tracking-tight leading-none">
              {hideBalances ? "••••••" : `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <p className="text-sm text-gray-400 mt-1.5 font-medium">≈ {hideBalances ? "••••" : `${totalBTC.toFixed(6)} BTC`}</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => handleOpenDeposit("USDT")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-lg shadow-brand-500/25">
              <ArrowDownLeft className="h-4 w-4" /> Depositar
            </button>
            <button onClick={() => handleOpenWithdraw("USDT")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold backdrop-blur-sm">
              <ArrowUpRight className="h-4 w-4" /> Retirar
            </button>
          </div>
        </div>
      </div>

      {/* ✅ ACCIONES RÁPIDAS — Swap + Historial */}
      <div className="grid grid-cols-2 gap-2">
        {stellarPublic && usdcTrustline && (
          <button
            onClick={() => navigate("swap")}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md hover:shadow-lg transition-all"
          >
            <ArrowDownUp className="h-5 w-5" />
            <span className="text-xs font-bold">Swap</span>
            <span className="text-[9px] text-white/70">XLM ↔ USDC</span>
          </button>
        )}

        <button
          onClick={() => navigate("wallet-history")}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 text-white shadow-md hover:shadow-lg transition-all ${
            !(stellarPublic && usdcTrustline) ? "col-span-2" : ""
          }`}
        >
          <Clock className="h-5 w-5" />
          <span className="text-xs font-bold">Historial</span>
          <span className="text-[9px] text-white/70">Ver movimientos</span>
        </button>
      </div>

      {/* BANNERS */}
      {!stellarLoading && !stellarPublic && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-4 text-white">
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Activa tu wallet Stellar</p>
              <p className="text-[11px] text-white/70">Envía XLM y USDC con comisión de $0.00001</p>
            </div>
            <button onClick={handleCreateStellar} disabled={creatingStellar} className="px-3 py-2 rounded-xl bg-white text-indigo-600 text-xs font-bold disabled:opacity-60">
              {creatingStellar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Activar"}
            </button>
          </div>
        </div>
      )}

      {!stellarLoading && stellarPublic && !usdcTrustline && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 text-white">
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <img src="/crypto/usdc.svg" alt="USDC" className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold">Activa USDC en Stellar</p>
              <p className="text-[11px] text-white/70">Envía y recibe USDC con comisión ínfima</p>
            </div>
            <button onClick={handleActivateUSDC} disabled={activatingUsdc} className="px-3 py-2 rounded-xl bg-white text-blue-600 text-xs font-bold disabled:opacity-60">
              {activatingUsdc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Activar"}
            </button>
          </div>
        </div>
      )}

      {/* MINI RESUMEN */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {balancesList.map((b) => {
          const colors = ASSET_COLORS[b.asset] || ASSET_COLORS.USDT;
          const isUp   = b.change24h >= 0;
          return (
            <div
              key={b.asset}
              className={`flex-shrink-0 w-[130px] rounded-xl p-3 bg-gradient-to-br ${colors.gradient} border ${colors.border} cursor-pointer hover:scale-[1.02] transition-all`}
              onClick={() => setExpandedAsset(expandedAsset === b.asset ? null : b.asset)}
            >
              <div className="flex items-center gap-2 mb-2">
                <img src={getAssetIcon(b.asset)} alt={b.asset} className="h-5 w-5 object-contain" onError={(e) => { e.currentTarget.src = "/crypto/usd.svg"; }} />
                <span className="text-xs font-bold text-gray-900 dark:text-white">{b.asset}</span>
                {b.network === "Stellar" && <Star className="h-2.5 w-2.5 text-indigo-500 fill-current" />}
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {hideBalances ? "••••" : `$${b.usdValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`}
              </p>
              <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-semibold ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {Math.abs(b.change24h).toFixed(2)}%
              </div>
            </div>
          );
        })}
      </div>

      {/* LISTA DE ACTIVOS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Mis Activos</h2>
          <span className="text-[10px] text-gray-400 font-medium">{balancesList.length} activos</span>
        </div>

        <div className="space-y-2">
          {balancesList.map((balance) => {
            const colors     = ASSET_COLORS[balance.asset] || ASSET_COLORS.USDT;
            const isUp       = balance.change24h >= 0;
            const isExpanded = expandedAsset === balance.asset;

            return (
              <div key={balance.asset} className={`rounded-2xl border transition-all ${
                isExpanded ? `${colors.border} bg-gradient-to-r ${colors.gradient}` : "border-gray-100 dark:border-white/[0.05] bg-white dark:bg-white/[0.02]"
              }`}>
                <button onClick={() => setExpandedAsset(isExpanded ? null : balance.asset)} className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${colors.bg} flex items-center justify-center overflow-hidden`}>
                      <img src={getAssetIcon(balance.asset)} alt={balance.asset} className="h-6 w-6 object-contain" onError={(e) => { e.currentTarget.src = "/crypto/usd.svg"; }} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{balance.asset}</p>
                        {balance.network && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-semibold">
                            {balance.network}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {hideBalances ? "••••" : `${balance.amount.toFixed(balance.asset === "BTC" ? 6 : balance.asset === "ETH" || balance.asset === "XLM" ? 4 : 2)} ${balance.asset}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {hideBalances ? "••••" : `$${balance.usdValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                      </p>
                      <div className={`flex items-center justify-end gap-0.5 text-[10px] font-semibold ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                        {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                        {Math.abs(balance.change24h).toFixed(2)}%
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 flex gap-2 animate-fade-in">
                    <button onClick={() => handleOpenDeposit(balance.asset)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold ${colors.bg} ${colors.text}`}>
                      <ArrowDownLeft className="h-3.5 w-3.5 block" /> Depositar
                    </button>
                    <button onClick={() => handleOpenWithdraw(balance.asset)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                      <ArrowUpRight className="h-3.5 w-3.5 block" /> Retirar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* INFO BANNER */}
      <div className="flex items-start gap-3 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl p-4">
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
          <Info className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-900 dark:text-white mb-0.5">Multi-red: TRC20 + Stellar</p>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            USDT vía Tron con detección automática cada 5 min.
            XLM y USDC vía Stellar con confirmación en segundos.
          </p>
        </div>
      </div>

            {/* ═══ MODAL DEPÓSITO ══════════════════════════════ */}
      {activeAction.type === "deposit" && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${ASSET_COLORS[depositAsset]?.bg || "bg-brand-500/10"} flex items-center justify-center`}>
                  <ArrowDownLeft className={`h-4 w-4 ${ASSET_COLORS[depositAsset]?.text || "text-brand-500"}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Depositar Cripto</h3>
                  <p className="text-[10px] text-gray-400">Recibe fondos en tu wallet CupCoin</p>
                </div>
              </div>
              <button onClick={handleCloseAction} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Selecciona el Activo</label>
              <div className="grid grid-cols-5 gap-2">
                {["USDT", "USDC", "BTC", "ETH", "XLM"].map((asset) => {
                  const colors   = ASSET_COLORS[asset] || ASSET_COLORS.USDT;
                  const selected = depositAsset === asset;
                  const disabled = (asset === "XLM" && !stellarPublic) ||
                                   (asset === "USDC" && (!stellarPublic || !usdcTrustline));

                  return (
                    <button
                      key={asset}
                      disabled={disabled}
                      onClick={() => handleOpenDeposit(asset)}
                      className={`flex flex-col items-center gap-2 py-2.5 rounded-xl text-[10px] font-bold transition-all ${
                        selected
                          ? `${colors.bg} ${colors.text} ring-2 ring-current`
                          : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400"
                      } ${disabled ? "opacity-40" : ""}`}
                    >
                      <img
                        src={getAssetIcon(asset)}
                        alt={asset}
                        className="h-6 w-6 object-contain"
                        onError={(e) => { e.currentTarget.src = "/crypto/usd.svg"; }}
                      />
                      {asset}
                    </button>
                  );
                })}
              </div>
            </div>

            {depositAsset === "USDT" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                <span className="text-sm">🔴</span>
                <div>
                  <p className="text-xs font-bold text-red-600 dark:text-red-400">Red: Tron (TRC-20)</p>
                  <p className="text-[10px] text-gray-400">Envía únicamente USDT TRC20 a esta dirección</p>
                </div>
              </div>
            )}

            {depositAsset === "USDC" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-sm">⭐</span>
                <div>
                  <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Red: Stellar</p>
                  <p className="text-[10px] text-gray-400">Envía USDC vía Stellar (barato y rápido)</p>
                </div>
              </div>
            )}

            {depositAsset === "XLM" && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <span className="text-sm">⭐</span>
                <div>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Red: Stellar</p>
                  <p className="text-[10px] text-gray-400">Recibe XLM en segundos con comisión mínima</p>
                </div>
              </div>
            )}

            {depositAsset !== "USDT" && depositAsset !== "XLM" && depositAsset !== "USDC" ? (
              <div className="py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
                  <Info className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Próximamente</p>
                <p className="text-xs text-gray-400">Por ahora solo <strong>USDT/TRC20</strong>, <strong>USDC/Stellar</strong> y <strong>XLM/Stellar</strong> están disponibles.</p>
              </div>
            ) : isLoadingAddress ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                <p className="text-xs text-gray-400 font-medium animate-pulse">Generando dirección segura...</p>
              </div>
            ) : depositAddress ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="bg-white p-3 rounded-2xl shadow-lg border border-gray-100">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(depositAddress)}&format=svg`} alt="QR" className="w-40 h-40" />
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-3 border border-gray-200 dark:border-white/10">
                  <span className="text-[11px] font-mono text-gray-600 dark:text-gray-300 flex-1 truncate select-all">{depositAddress}</span>
                  <button onClick={() => handleCopyAddress(depositAddress)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${copied ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"}`}>
                    {copied ? <><Check className="h-3 w-3" /> Copiada</> : <><Copy className="h-3 w-3" /> Copiar</>}
                  </button>
                </div>
                {(depositAsset === "XLM" || depositAsset === "USDC") && stellarExplorer && (
                  <a
                    href={stellarExplorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-[11px] text-indigo-500 font-bold hover:text-indigo-600"
                  >
                    Ver en Stellar Expert →
                  </a>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                <p className="text-xs text-gray-400 mb-3">No se pudo obtener dirección</p>
                <button onClick={() => handleOpenDeposit(depositAsset)} className="text-xs font-bold text-brand-500">Reintentar →</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODAL RETIRO ════════════════════════════════ */}
      {activeAction.type === "withdraw" && activeAction.asset && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-slide-up shadow-2xl safe-bottom">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${isStellar ? "bg-indigo-500/10" : "bg-red-500/10"} flex items-center justify-center`}>
                  <ArrowUpRight className={`h-4 w-4 ${isStellar ? "text-indigo-500" : "text-red-500"}`} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Retirar {activeAction.asset}</h3>
                  <p className="text-[10px] text-gray-400">Enviar a wallet externa</p>
                </div>
              </div>
              <button onClick={handleCloseAction} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {activeAction.asset !== "USDT" && activeAction.asset !== "XLM" && activeAction.asset !== "USDC" ? (
              <div className="py-8 text-center">
                <Info className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Próximamente</p>
                <p className="text-xs text-gray-400">Por ahora solo <strong>USDT/TRC20</strong>, <strong>USDC/Stellar</strong> y <strong>XLM/Stellar</strong> están disponibles.</p>
              </div>
            ) : (
              <>
                {!withdrawSuccess && (
                  <div className="flex items-center gap-2">
                    {[1, 2].map((step) => (
                      <div key={step} className="flex items-center gap-2 flex-1">
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                          withdrawStep >= step
                            ? isStellar ? "bg-indigo-500 text-white" : "bg-red-500 text-white"
                            : "bg-gray-100 dark:bg-white/5 text-gray-400"
                        }`}>{step}</div>
                        <span className={`text-[10px] font-semibold ${withdrawStep >= step ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
                          {step === 1 ? "Dirección" : "Monto"}
                        </span>
                        {step < 2 && <div className={`flex-1 h-0.5 rounded-full ${
                          withdrawStep > step
                            ? isStellar ? "bg-indigo-500" : "bg-red-500"
                            : "bg-gray-200 dark:bg-white/10"
                        }`} />}
                      </div>
                    ))}
                  </div>
                )}

                {withdrawStep === 1 && (
                  <div className="space-y-4">
                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                      isStellar ? "border-indigo-500/30 bg-indigo-500/5" : "border-red-500/30 bg-red-500/5"
                    }`}>
                      <span className="text-xl">{currentChainInfo?.icon || "🔴"}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{currentChainInfo?.label}</p>
                        <p className="text-[10px] text-gray-400">Comisión: {currentChainInfo?.fee} · Tiempo: {currentChainInfo?.time}</p>
                      </div>
                      <CheckCircle2 className={`h-4 w-4 ${isStellar ? "text-indigo-500" : "text-red-500"}`} />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                        Dirección {isStellar ? "Stellar" : "TRC20"} de destino
                      </label>
                      <input
                        type="text"
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        placeholder={isStellar ? "Empieza con G..." : "Empieza con T..."}
                        className="w-full text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                      />
                      {withdrawAddress && isStellar && (!withdrawAddress.startsWith("G") || withdrawAddress.length !== 56) && (
                        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Debe empezar con G y tener 56 caracteres
                        </p>
                      )}
                      {withdrawAddress && !isStellar && !withdrawAddress.startsWith("T") && (
                        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> La dirección debe empezar con T
                        </p>
                      )}
                    </div>

                    {isStellar && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                          Memo (opcional, máx 28 caracteres)
                        </label>
                        <input
                          type="text"
                          value={withdrawMemo}
                          onChange={(e) => setWithdrawMemo(e.target.value)}
                          maxLength={28}
                          placeholder="Referencia o nota"
                          className="w-full text-xs bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                        />
                      </div>
                    )}

                    <button
                      disabled={
                        !withdrawAddress ||
                        (isStellar && (!withdrawAddress.startsWith("G") || withdrawAddress.length !== 56)) ||
                        (!isStellar && !withdrawAddress.startsWith("T"))
                      }
                      onClick={() => setWithdrawStep(2)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 dark:bg-white/10 text-white text-xs font-bold disabled:opacity-40"
                    >
                      Continuar <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {withdrawStep === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 rounded-xl p-3 border border-gray-200">
                      <span className="text-lg">{isStellar ? "⭐" : "🔴"}</span>
                      <div className="flex-1 truncate">
                        <p className="text-[11px] font-bold text-gray-900 dark:text-white">{currentChainInfo?.label}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">{withdrawAddress}</p>
                      </div>
                      <button onClick={() => setWithdrawStep(1)} className="text-[10px] text-brand-500 font-bold">Editar</button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Monto a enviar</label>
                        <button
                          onClick={handleSetMaxAmount}
                          className={`text-[10px] font-bold ${isStellar ? "text-indigo-500" : "text-red-500"}`}
                        >
                          MAX: {activeAction.asset === "XLM"
                            ? Math.max(0, stellarBalance - 1.5).toFixed(4)
                            : activeAction.asset === "USDC"
                            ? usdcBalance.toFixed(2)
                            : (firestoreBalances[activeAction.asset] || 0)
                          } {activeAction.asset}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full text-2xl font-bold bg-gray-50 dark:bg-white/5 border border-gray-200 rounded-xl px-4 py-4 pr-20 text-gray-900 dark:text-white focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                          {activeAction.asset}
                        </span>
                      </div>
                    </div>

                    {withdrawError && (
                      <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 text-xs text-red-700 dark:text-red-400">
                        {withdrawError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => setWithdrawStep(1)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold">
                        Atrás
                      </button>
                      <button
                        disabled={isSubmitting || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                        onClick={handleExecuteWithdrawal}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ${
                          isStellar ? "bg-indigo-500" : "bg-red-500"
                        } text-white text-xs font-bold disabled:opacity-40`}
                      >
                        {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Shield className="h-3.5 w-3.5" /> Confirmar</>}
                      </button>
                    </div>
                  </div>
                )}

                {withdrawStep === 3 && withdrawSuccess && (
                  <div className="py-6 text-center space-y-4">
                    <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">¡Retiro Enviado!</h3>
                    {withdrawTxId && (
                      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 border text-center">
                        <p className="text-[10px] text-gray-400">Hash de transacción</p>
                        <p className="text-[11px] font-mono text-gray-600 dark:text-gray-300 break-all">{withdrawTxId}</p>
                        <a
                          href={isStellar
                            ? `https://stellar.expert/explorer/testnet/tx/${withdrawTxId}`
                            : `https://tronscan.org/#/transaction/${withdrawTxId}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-brand-500 block mt-1"
                        >
                          Ver en explorador →
                        </a>
                      </div>
                    )}
                    <button onClick={handleCloseAction} className="w-full py-3 rounded-xl bg-gray-900 text-white text-xs font-bold">
                      Volver a Wallet
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
