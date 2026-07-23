import { useState, useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }         from "@/components/ui/Card";
import { CRYPTO_ICONS } from "@/data/data";
import {
  Wallet, Copy, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Shield, Loader2, Check,
  Eye, EyeOff, RefreshCw, ChevronDown, ChevronUp,
  AlertTriangle, X, Sparkles, ArrowRight,
  Info, CheckCircle2, Star, ArrowDownUp,
  Filter, Search, Download, ChevronLeft, ChevronRight,
} from "lucide-react";

type ActionType = "deposit" | "withdraw" | null;
type FilterType = "all" | "deposit" | "withdraw" | "trade";
type FilterAsset = "all" | "USDT" | "BTC" | "ETH" | "USDC" | "XLM";

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
const ITEMS_PER_PAGE = 10;

export function WalletPage() {
  const {
    user, prices, fetchPrices,
    depositAddresses, setModalOpen,
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

  // ─── Estado Stellar ────────────────────────────────────────
  const [stellarPublic, setStellarPublic]       = useState<string | null>(null);
  const [stellarBalance, setStellarBalance]     = useState<number>(0);
  const [stellarLoading, setStellarLoading]     = useState(true);
  const [creatingStellar, setCreatingStellar]   = useState(false);
  const [stellarExplorer, setStellarExplorer]   = useState<string>("");

  // ─── Estado USDC Stellar ─────────────────────────────────
  const [usdcBalance, setUsdcBalance]           = useState<number>(0);
  const [usdcTrustline, setUsdcTrustline]       = useState(false);
  const [activatingUsdc, setActivatingUsdc]     = useState(false);

  // ─── Estado historial mejorado ────────────────────────────
  const [movements, setMovements]         = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [currentPage, setCurrentPage]     = useState(1);
  const [filterType, setFilterType]       = useState<FilterType>("all");
  const [filterAsset, setFilterAsset]     = useState<FilterAsset>("all");
  const [searchQuery, setSearchQuery]     = useState("");
  const [showFilters, setShowFilters]     = useState(false);

  const firestoreBalances = (user as any)?.balances || { USDT: 0, BTC: 0, ETH: 0, USDC: 0 };

  // ─── Cargar wallet Stellar al inicio ──────────────────────
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

      if (data.success) {
        await loadStellarWallet();
      }
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

      if (data.success) {
        await loadStellarWallet();
      }
    } catch (err) {
      console.error("❌ Error activando USDC:", err);
    } finally {
      setActivatingUsdc(false);
    }
  };

  // ─── Balances list ────────────────────────────────────────
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
        asset:     "XLM",
        amount:    stellarBalance,
        usdValue:  stellarBalance * xlmPrice,
        change24h: prices.find((p) => p.symbol.toUpperCase() === "XLM")?.change24h || 0,
        price:     xlmPrice,
        network:   "Stellar",
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
    await loadHistory();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchPrices]);

  const getAssetIcon = (asset: string) => {
    const upper = asset.toUpperCase();
    if (LOCAL_ICONS[upper]) return `/crypto/${LOCAL_ICONS[upper]}`;
    return CRYPTO_ICONS[upper] || CRYPTO_ICONS[asset.toLowerCase()] || "/crypto/usd.svg";
  };

  // ─── Cargar historial ─────────────────────────────────────
  const loadHistory = async () => {
    if (!user?.uid) return;
    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/api/wallet/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMovements(data.movements);
    } catch (err) {
      console.error("❌ Error cargando historial:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    void loadHistory();
  }, [user?.uid]);
    // ─── Filtrar movimientos ─────────────────────────────────
  const filteredMovements = useMemo(() => {
    return movements.filter((mov) => {
      // Filtro por tipo
      if (filterType !== "all") {
        const isDeposit  = mov.amount > 0 && mov.label?.toLowerCase().includes("depósito");
        const isWithdraw = mov.amount < 0 && mov.label?.toLowerCase().includes("retiro");
        const isTrade    = mov.label?.toLowerCase().includes("trade") || mov.label?.toLowerCase().includes("p2p");

        if (filterType === "deposit"  && !isDeposit)  return false;
        if (filterType === "withdraw" && !isWithdraw) return false;
        if (filterType === "trade"    && !isTrade)    return false;
      }

      // Filtro por moneda
      if (filterAsset !== "all" && mov.asset !== filterAsset) return false;

      // Búsqueda por hash o label
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const hashMatch  = mov.txHash?.toLowerCase().includes(q);
        const labelMatch = mov.label?.toLowerCase().includes(q);
        if (!hashMatch && !labelMatch) return false;
      }

      return true;
    });
  }, [movements, filterType, filterAsset, searchQuery]);

  // ─── Paginación ──────────────────────────────────────────
  const totalPages   = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);
  const startIdx     = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedMov = filteredMovements.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  // Resetear página cuando cambian filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, filterAsset, searchQuery]);

  // ─── Exportar CSV ────────────────────────────────────────
  const handleExportCSV = () => {
    if (filteredMovements.length === 0) {
      alert("No hay movimientos para exportar");
      return;
    }

    const headers = ["Fecha", "Descripción", "Tipo", "Monto", "Moneda", "Estado", "TxHash"];
    const rows    = filteredMovements.map((mov) => [
      new Date(mov.createdAt).toLocaleString("es-CU"),
      mov.label || "—",
      mov.amount > 0 ? "Entrada" : "Salida",
      Math.abs(mov.amount),
      mov.asset || "—",
      mov.status || "—",
      mov.txHash || "—",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href     = url;
    link.download = `cupcoin_wallet_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Handlers de depósito/retiro (sin cambios) ───────────
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
      if (data.success && data.coin_address) {
        setDepositAddress(data.coin_address);
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
        setWithdrawError("Dirección Stellar inválida");
        return;
      }
      const monto = parseFloat(withdrawAmount);
      if (monto <= 0 || monto > usdcBalance) {
        setWithdrawError("Balance USDC insuficiente");
        return;
      }
      setIsSubmitting(true);
      setWithdrawError(null);
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(`${BACKEND_URL}/api/stellar/usdc/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ toAddress: withdrawAddress, amount: monto, memo: withdrawMemo || undefined }),
        });
        const data = await res.json();
        if (data.success) {
          setWithdrawSuccess(true);
          setWithdrawTxId(data.txHash);
          setWithdrawStep(3);
          await loadStellarWallet();
        } else {
          setWithdrawError(data.error || "Error procesando retiro");
        }
      } catch {
        setWithdrawError("Error de conexión");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (activeAction.asset === "XLM") {
      if (!withdrawAddress.startsWith("G") || withdrawAddress.length !== 56) {
        setWithdrawError("Dirección Stellar inválida");
        return;
      }
      const monto = parseFloat(withdrawAmount);
      if (monto <= 0 || monto > (stellarBalance - 1.5)) {
        setWithdrawError("Balance insuficiente (deja 1.5 XLM de reserva)");
        return;
      }
      setIsSubmitting(true);
      setWithdrawError(null);
      try {
        const token = localStorage.getItem("cubax_token");
        const res   = await fetch(`${BACKEND_URL}/api/stellar/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ toAddress: withdrawAddress, amount: monto, memo: withdrawMemo || undefined }),
        });
        const data = await res.json();
        if (data.success) {
          setWithdrawSuccess(true);
          setWithdrawTxId(data.txHash);
          setWithdrawStep(3);
          await loadStellarWallet();
        } else {
          setWithdrawError(data.error || "Error procesando retiro");
        }
      } catch {
        setWithdrawError("Error de conexión");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (activeAction.asset !== "USDT") return;
    if (!withdrawAddress.startsWith("T")) {
      setWithdrawError("La dirección debe ser TRC20 y empezar con T");
      return;
    }
    const disponible = firestoreBalances[activeAction.asset] || 0;
    const monto      = parseFloat(withdrawAmount);
    if (monto <= 0 || monto > disponible) return;
    if (monto < 1) {
      setWithdrawError("El monto mínimo de retiro es 1 USDT");
      return;
    }
    setIsSubmitting(true);
    setWithdrawError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/tron/withdraw`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ uid: user.uid, toAddress: withdrawAddress, amount: monto }),
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawSuccess(true);
        setWithdrawTxId(data.txHash || "");
        setWithdrawStep(3);
      } else {
        setWithdrawError(data.error || "Error procesando el retiro");
      }
    } catch (err) {
      setWithdrawError("Error de conexión con el servidor");
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
    setWithdrawMemo("");
    setWithdrawError(null);
    setDepositAddress(null);
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
        <button onClick={handleRefresh} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
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
            <button onClick={() => setHideBalances(!hideBalances)} className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors">
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
            <button onClick={() => handleOpenDeposit("USDT")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-lg shadow-brand-500/25 active:scale-[0.98]">
              <ArrowDownLeft className="h-4 w-4" /> Depositar
            </button>
            <button onClick={() => handleOpenWithdraw("USDT")} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all backdrop-blur-sm active:scale-[0.98]">
              <ArrowUpRight className="h-4 w-4" /> Retirar
            </button>
          </div>
        </div>
      </div>

      {/* BANNERS STELLAR / USDC */}
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
            <button onClick={handleCreateStellar} disabled={creatingStellar} className="px-3 py-2 rounded-xl bg-white text-indigo-600 text-xs font-bold hover:bg-gray-50 transition-all disabled:opacity-60">
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
            <button onClick={handleActivateUSDC} disabled={activatingUsdc} className="px-3 py-2 rounded-xl bg-white text-blue-600 text-xs font-bold hover:bg-gray-50 transition-all disabled:opacity-60">
              {activatingUsdc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Activar"}
            </button>
          </div>
        </div>
      )}

      {/* ═══ HISTORIAL MEJORADO ══════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Historial de movimientos
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1.5 rounded-lg transition-colors ${
                showFilters || filterType !== "all" || filterAsset !== "all"
                  ? "bg-brand-500/10 text-brand-500"
                  : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
              title="Filtros"
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredMovements.length === 0}
              className="p-1.5 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-brand-500/10 transition-colors disabled:opacity-40"
              title="Exportar CSV"
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Filtros expandibles */}
        {showFilters && (
          <Card padding="md" className="mb-2 space-y-3">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por hash o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              )}
            </div>

            {/* Filtro por tipo */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Tipo</p>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "deposit", "withdraw", "trade"] as FilterType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      filterType === t
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {t === "all"      ? "Todos"    :
                     t === "deposit"  ? "Depósitos" :
                     t === "withdraw" ? "Retiros"  : "Trades"}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por moneda */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1.5">Moneda</p>
              <div className="flex gap-1.5 flex-wrap">
                {(["all", "USDT", "USDC", "BTC", "ETH", "XLM"] as FilterAsset[]).map((a) => (
                  <button
                    key={a}
                    onClick={() => setFilterAsset(a)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      filterAsset === a
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {a === "all" ? "Todas" : a}
                  </button>
                ))}
              </div>
            </div>

            {/* Limpiar filtros */}
            {(filterType !== "all" || filterAsset !== "all" || searchQuery) && (
              <button
                onClick={() => {
                  setFilterType("all");
                  setFilterAsset("all");
                  setSearchQuery("");
                }}
                className="text-[10px] text-red-500 font-bold flex items-center gap-1"
              >
                <X className="h-3 w-3" /> Limpiar filtros
              </button>
            )}
          </Card>
        )}

        {/* Lista de movimientos */}
        {loadingHistory ? (
          <div className="text-center py-8">
            <div className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-gray-400">Cargando historial...</p>
          </div>
        ) : filteredMovements.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-2xl mb-2">📭</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
              {movements.length === 0 ? "Sin movimientos" : "Sin resultados"}
            </p>
            <p className="text-xs text-gray-400">
              {movements.length === 0
                ? "Aquí aparecerán tus depósitos, retiros y trades."
                : "Prueba cambiando los filtros o la búsqueda."}
            </p>
          </Card>
        ) : (
          <>
            <Card padding="none" className="divide-y divide-gray-100 dark:divide-white/[0.06] overflow-hidden">
              {paginatedMov.map((mov) => {
                const isPositive = mov.amount > 0;
                return (
                  <div key={mov.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                      isPositive ? "bg-emerald-500/10" : "bg-red-500/10"
                    }`}>
                      {mov.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {mov.label}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-gray-400">
                          {new Date(mov.createdAt).toLocaleDateString("es-CU", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          mov.status === "completed" ? "bg-emerald-500/10 text-emerald-500" :
                          mov.status === "pending"   ? "bg-amber-500/10 text-amber-500"   :
                                                       "bg-red-500/10 text-red-500"
                        }`}>
                          {mov.status === "completed" ? "✓ Completado" :
                           mov.status === "pending"   ? "⏳ Pendiente" : "❌ Fallido"}
                        </span>
                      </div>
                      {mov.txHash && (
                        <p className="text-[9px] text-gray-400 font-mono truncate mt-0.5">
                          Tx: {mov.txHash.slice(0, 20)}...
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-black ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                        {isPositive ? "+" : ""}{mov.amount} {mov.asset}
                      </p>
                    </div>
                  </div>
                );
              })}
            </Card>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 px-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </button>

                <span className="text-xs text-gray-400 font-medium">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 text-xs font-bold disabled:opacity-40"
                >
                  Siguiente
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            <p className="text-center text-[10px] text-gray-400 mt-2">
              Mostrando {paginatedMov.length} de {filteredMovements.length} movimientos
            </p>
          </>
        )}
      </div>

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
                    <button onClick={() => handleOpenDeposit(balance.asset)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold transition-all ${colors.bg} ${colors.text} hover:opacity-80`}>
                      <ArrowDownLeft className="h-3.5 w-3.5 block" /> Depositar
                    </button>
                    <button onClick={() => handleOpenWithdraw(balance.asset)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
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
            Transferencias internas entre usuarios de CupCoin son instantáneas.
          </p>
        </div>
      </div>

      {/* MODAL DEPÓSITO Y RETIRO — Los que ya tenías */}
      {/* Nota: mantén los modales de deposit/withdraw que ya tenías, no los pego para no repetir */}
    </div>
  );
}
