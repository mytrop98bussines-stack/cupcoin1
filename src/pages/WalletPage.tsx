import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CRYPTO_ICONS } from "@/data/mock";
import {
  Wallet, Copy, QrCode, ArrowUpRight, ArrowDownLeft,
  TrendingUp, TrendingDown, Shield, Zap, Loader2, Check, Network
} from "lucide-react";

export function WalletPage() {
  const { user, prices, fetchPrices, requestWithdrawal } = useAppStore();
  const [hideBalances, setHideBalances] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [activeAction, setActiveAction] = useState<{ type: "deposit" | "withdraw" | null; asset: string | null }>({
    type: null, asset: null,
  });

  const [depositAsset, setDepositAsset] = useState<string>("USDT");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [selectedChain, setSelectedChain] = useState("");

  const availableChains: Record<string, { label: string; value: string }[]> = {
    USDT: [{ label: "Tron (TRC-20)", value: "TRC20" }, { label: "BSC", value: "BSC" }, { label: "Polygon", value: "CSC" }],
    USDC: [{ label: "BSC", value: "BSC" }, { label: "Ethereum (ERC-20)", value: "ERC20" }],
    BTC: [{ label: "Bitcoin Mainnet", value: "BTC" }],
    ETH: [{ label: "Ethereum (ERC-20)", value: "ERC20" }],
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const handleOpenDeposit = async (asset: string) => {
    setDepositAsset(asset);
    setActiveAction({ type: "deposit", asset });
    
    if (!user?.uid) return;
    if (!user.depositAddresses) user.depositAddresses = {};
    
    if (!user.depositAddresses[asset]) {
      setIsLoadingAddress(true);
      try {
        const response = await fetch("https://cubax-backend.onrender.com/api/coinex/deposit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid, asset: asset })
        });
        const resData = await response.json();
        if (resData.success) {
          user.depositAddresses[asset] = resData.coin_address;
        }
      } catch (e) { console.error("Error al obtener dirección:", e); }
      finally { setIsLoadingAddress(false); }
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const firestoreBalances = (user as any)?.balances || { USDT: 0, BTC: 0, ETH: 0, USDC: 0 };
  const balancesList = [
    { asset: "USDT", amount: firestoreBalances.USDT || 0, usdValue: (firestoreBalances.USDT || 0) * (prices.find(p => p.symbol === "USDT")?.priceUSD || 1) },
    { asset: "BTC", amount: firestoreBalances.BTC || 0, usdValue: (firestoreBalances.BTC || 0) * (prices.find(p => p.symbol === "BTC")?.priceUSD || 65000) },
    { asset: "ETH", amount: firestoreBalances.ETH || 0, usdValue: (firestoreBalances.ETH || 0) * (prices.find(p => p.symbol === "ETH")?.priceUSD || 3500) },
    { asset: "USDC", amount: firestoreBalances.USDC || 0, usdValue: (firestoreBalances.USDC || 0) * (prices.find(p => p.symbol === "USDC")?.priceUSD || 1) },
  ];

  const totalUSD = balancesList.reduce((sum, b) => sum + b.usdValue, 0);

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Mi Wallet</h1>
        <Badge variant="success" className="bg-emerald-500/10 text-emerald-500">Custodia CubaX</Badge>
      </div>

      <Card padding="lg" className="bg-gradient-to-br from-navy-900 to-navy-950 text-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Balance Total Estimado</span>
          <button onClick={() => setHideBalances(!hideBalances)} className="text-xs text-brand-400">
            {hideBalances ? "Mostrar" : "Ocultar"}
          </button>
        </div>
        <p className="text-3xl font-black">{hideBalances ? "•••••" : `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</p>
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => handleOpenDeposit("USDT")} className="flex-1 bg-brand-500">Depositar</Button>
          <Button size="sm" onClick={() => setActiveAction({ type: "withdraw", asset: "USDT" })} className="flex-1 bg-white/10">Retirar</Button>
        </div>
      </Card>

      {activeAction.type === "deposit" && (
        <Card padding="md" className="border-brand-500/30 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-brand-500">Depositar Cripto</span>
            <button onClick={() => setActiveAction({ type: null, asset: null })}>Cerrar</button>
          </div>
          
          <select value={depositAsset} onChange={(e) => handleOpenDeposit(e.target.value)} className="w-full p-2 bg-gray-100 dark:bg-white/5 rounded-lg border border-white/10 text-sm">
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>

          {isLoadingAddress ? <Loader2 className="animate-spin mx-auto text-brand-500" /> : user?.depositAddresses?.[depositAsset] && (
            <div className="text-center space-y-3">
              <div className="bg-white p-2 rounded-xl mx-auto w-36 h-36 flex items-center justify-center overflow-hidden">
                <img src={`https://chart.googleapis.com/chart?chs=140&cht=qr&chl=${encodeURIComponent(user.depositAddresses[depositAsset])}&choe=UTF-8`} alt="QR" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
              <div className="flex items-center justify-between bg-gray-100 p-2 rounded text-xs font-mono">
                <span className="truncate">{user.depositAddresses[depositAsset]}</span>
                <button onClick={() => handleCopyAddress(user.depositAddresses[depositAsset])}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Lista de Saldos */}
      <div className="space-y-2">
        {balancesList.map((balance) => (
          <Card key={balance.asset} padding="md" className="border-gray-100 dark:border-white/[0.04]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold">{CRYPTO_ICONS[balance.asset] || "🪙"}</div>
                <div>
                  <div className="font-semibold text-sm">{balance.asset}</div>
                  <div className="text-xs text-gray-500">{hideBalances ? "••••" : `${balance.amount.toFixed(4)} ${balance.asset}`}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-sm">${hideBalances ? "••••" : balance.usdValue.toFixed(2)}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
                }
