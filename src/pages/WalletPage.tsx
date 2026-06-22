import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CRYPTO_ICONS } from "@/data/mock";
import {
  Wallet,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
  Loader2,
  Check,
  Network,
} from "lucide-react";

export function WalletPage() {
  const { user, prices, fetchPrices, requestWithdrawal } = useAppStore();
  const [hideBalances, setHideBalances] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeAction, setActiveAction] = useState<{ type: "deposit" | "withdraw" | null; asset: string | null }>({
    type: null,
    asset: null,
  });
  
  // Estados para escalabilidad y selección
  const [depositAsset, setDepositAsset] = useState<string>("USDT");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [selectedChain, setSelectedChain] = useState("");

  const availableChains: Record<string, { label: string; value: string }[]> = {
    USDT: [{ label: "Tron (TRC-20)", value: "TRC20" }, { label: "BSC", value: "BSC" }],
    USDC: [{ label: "BSC", value: "BSC" }, { label: "Ethereum (ERC-20)", value: "ERC20" }],
    BTC: [{ label: "Bitcoin", value: "BTC" }],
  };

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  const handleOpenDeposit = async (asset: string) => {
    setDepositAsset(asset);
    setActiveAction({ type: "deposit", asset });
    
    if (!user || !user.uid) return;
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
      } catch (error) {
        console.error("Error al obtener dirección:", error);
      } finally {
        setIsLoadingAddress(false);
      }
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const firestoreBalances = (user as any)?.balances || { USDT: 0, BTC: 0, ETH: 0, USDC: 0 };
  const balancesList = [
    { asset: "USDT", amount: firestoreBalances.USDT || 0 },
    { asset: "BTC", amount: firestoreBalances.BTC || 0 },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      {/* Balance Card */}
      <Card padding="lg" className="bg-gradient-to-br from-navy-900 to-navy-950 text-white">
        <h3 className="text-xs text-gray-400">Balance Total</h3>
        <p className="text-2xl font-bold">Saldo disponible</p>
        <div className="flex gap-2 mt-4">
          <Button size="sm" onClick={() => handleOpenDeposit("USDT")}>Depositar</Button>
        </div>
      </Card>

      {/* Panel Dinámico de Depósito */}
      {activeAction.type === "deposit" && (
        <Card padding="md" className="space-y-4 animate-slide-in">
          <div className="flex justify-between">
            <h3 className="font-bold text-sm">Depositar Activo</h3>
            <button onClick={() => setActiveAction({ type: null, asset: null })}>Cerrar</button>
          </div>

          <select 
            value={depositAsset} 
            onChange={(e) => handleOpenDeposit(e.target.value)}
            className="w-full p-2 bg-gray-100 dark:bg-white/5 rounded-lg border border-white/10"
          >
            <option value="USDT">USDT</option>
            <option value="USDC">USDC</option>
            <option value="BTC">BTC</option>
          </select>

          {isLoadingAddress ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : user?.depositAddresses?.[depositAsset] ? (
            <div className="space-y-4 text-center">
              <div className="bg-white p-2 rounded-xl mx-auto w-36 h-36 flex items-center justify-center overflow-hidden">
                <img 
                  src={`https://chart.googleapis.com/chart?chs=140&cht=qr&chl=${encodeURIComponent(user.depositAddresses[depositAsset])}&choe=UTF-8`}
                  alt="QR"
                  onError={(e) => (e.currentTarget.style.display = 'none')} 
                />
              </div>
              <p className="text-xs break-all font-mono">{user.depositAddresses[depositAsset]}</p>
              <Button size="sm" onClick={() => handleCopyAddress(user.depositAddresses[depositAsset])}>
                {copied ? <Check /> : <Copy />} Copiar
              </Button>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
