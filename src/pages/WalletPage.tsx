import { useState, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CRYPTO_ICONS } from "@/data/mock";
import {
  Wallet,
  Copy,
  QrCode,
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
  const { 
    user,
    prices, 
    fetchPrices, 
    requestWithdrawal 
  } = useAppStore();

  const [hideBalances, setHideBalances] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [activeAction, setActiveAction] = useState<{ type: "deposit" | "withdraw" | null; asset: string | null }>({
    type: null,
    asset: null,
  });

  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // 🔄 Estado para capturar la red seleccionada por el usuario
  const [selectedChain, setSelectedChain] = useState("");

  // 🌐 MAPA MULTI-RED OFICIAL DE COINEX V2 (Alineado con tu backend)
  const availableChains: Record<string, { label: string; value: string }[]> = {
    USDT: [
      { label: "Tron (TRC-20)", value: "TRC20" },
      { label: "Binance Smart Chain (BEP-20)", value: "BSC" },
      { label: "Polygon Network", value: "CSC" }, 
    ],
    USDC: [
      { label: "Binance Smart Chain (BEP-20)", value: "BSC" },
      { label: "Ethereum (ERC-20)", value: "ERC20" },
    ],
    BTC: [{ label: "Bitcoin Main Network", value: "BTC" }],
    ETH: [{ label: "Ethereum (ERC-20)", value: "ERC20" }],
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => {
      fetchPrices();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Al cambiar de activo en retiro o depósito, preselecciona la primera red disponible automáticamente
  useEffect(() => {
    if (activeAction.asset && availableChains[activeAction.asset]) {
      setSelectedChain(availableChains[activeAction.asset][0].value);
    }
  }, [activeAction.asset, activeAction.type]);

  // Captura de balances directamente desde tu estructura de mapa en Firestore
  const firestoreBalances = (user as any)?.balances || { USDT: 0, BTC: 0, ETH: 0, USDC: 0 };
  
  const balancesList = [
    { asset: "USDT", amount: firestoreBalances.USDT || 0, usdValue: (firestoreBalances.USDT || 0) * (prices.find(p => p.symbol.toUpperCase() === "USDT")?.priceUSD || 1) },
    { asset: "BTC", amount: firestoreBalances.BTC || 0, usdValue: (firestoreBalances.BTC || 0) * (prices.find(p => p.symbol.toUpperCase() === "BTC")?.priceUSD || 65000) },
    { asset: "ETH", amount: firestoreBalances.ETH || 0, usdValue: (firestoreBalances.ETH || 0) * (prices.find(p => p.symbol.toUpperCase() === "ETH")?.priceUSD || 35000) },
    { asset: "USDC", amount: firestoreBalances.USDC || 0, usdValue: (firestoreBalances.USDC || 0) * (prices.find(p => p.symbol.toUpperCase() === "USDC")?.priceUSD || 1) },
  ];

  const totalUSD = balancesList.reduce((sum, b) => sum + b.usdValue, 0);
  const btcPrice = prices.find((p) => p.symbol.toLowerCase() === "btc")?.priceUSD || 65000;
  const totalBTC = totalUSD / btcPrice;

  // 🔥 CORREGIDO: Llamada directa a la URL absoluta del puerto 3001 generado por Replit
  const handleOpenDeposit = async (asset: string) => {
    setActiveAction({ type: "deposit", asset });
    
    if (!user) return;
    if (!user.depositAddresses) user.depositAddresses = {};
    const currentAddress = user.depositAddresses[asset];
    
    if (!currentAddress || currentAddress === "") {
      setIsLoadingAddress(true);
      try {
        // Usamos la URL principal de tu Replit, la que responde por defecto
        const URL_PRINCIPAL = "https://9135d135-ea80-4a99-9924-bbd7c9f38add-00-3lqvjidfldz1p.worf.replit.dev/api/coinex/deposit";

        const response = await fetch(URL_PRINCIPAL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          }
        });

        const resData = await response.json();

        if (resData && resData.success && resData.coin_address) {
          user.depositAddresses[asset] = resData.coin_address;
        } else {
          console.error("Error devuelto por el backend:", resData);
          alert(`🚨 Error: ${resData.error || "No se pudo asignar dirección"}`);
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        alert("🚨 Error de conexión con el servidor principal de CubaX.");
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

  const handleExecuteWithdrawal = async () => {
    if (!activeAction.asset || !withdrawAddress || !withdrawAmount || !selectedChain) return;
    
    const disponible = firestoreBalances[activeAction.asset] || 0;
    if (parseFloat(withdrawAmount) > disponible) {
      alert(`🚨 Saldo insuficiente. Tienes ${disponible} ${activeAction.asset} disponibles.`);
      return;
    }

    setIsSubmitting(true);
    
    const res = await requestWithdrawal(
      activeAction.asset,
      parseFloat(withdrawAmount),
      withdrawAddress,
      selectedChain
    );

    setIsSubmitting(false);
    
    if (res.success) {
      alert(`✅ Retiro procesado con éxito.\nFondos descontados de tu cuenta.`);
      setActiveAction({ type: null, asset: null });
      setWithdrawAddress("");
      setWithdrawAmount("");
    } else {
      alert(`🚨 Error al procesar retiro: ${res.message}`);
    }
  };

  const activeDepositAddress = activeAction.asset ? user?.depositAddresses?.[activeAction.asset] : null;

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Mi Wallet</h1>
        <Badge variant="success" size="sm" className="font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border-0">
          Custodia CubaX
        </Badge>
      </div>

      {/* Tarjeta de Balance General */}
      <Card padding="lg" className="bg-gradient-to-br from-navy-900 to-navy-950 dark:from-white/[0.06] dark:to-white/[0.02] border-navy-800 dark:border-white/[0.08] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
          <Wallet className="h-24 w-24" />
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
            Balance Total Estimado
          </span>
          <button onClick={() => setHideBalances(!hideBalances)} className="text-xs text-brand-400 hover:text-brand-300 font-semibold focus:outline-none">
            {hideBalances ? "Mostrar" : "Ocultar"}
          </button>
        </div>
        <div className="text-left mb-4">
          <p className="text-3xl font-black tracking-tight">
            {hideBalances ? "•••••" : `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </p>
          <p className="text-xs text-emerald-400 font-medium mt-1">
            ≈ {hideBalances ? "••••" : totalBTC.toFixed(5)} BTC
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleOpenDeposit("USDT")} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white border-0 shadow-sm" icon={<ArrowDownLeft className="h-3.5 w-3.5" />}>
            Depositar
          </Button>
          <Button size="sm" onClick={() => setActiveAction({ type: "withdraw", asset: "USDT" })} className="flex-1 bg-white/10 hover:bg-white/15 text-white border-0" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>
            Retirar
          </Button>
        </div>
      </Card>

      {/* 📥 PANEL DINÁMICO: Depósito */}
      {activeAction.type === "deposit" && activeAction.asset && (
        <Card padding="md" className="border-brand-500/30 bg-brand-500/[0.02] space-y-3 animate-slide-in">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-brand-500 flex items-center gap-1">
              <ArrowDownLeft className="h-3.5 w-3.5" /> Depositar {activeAction.asset}
            </span>
            <button onClick={() => setActiveAction({ type: null, asset: null })} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              Cerrar
            </button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Tu dirección única para recibir fondos. Envía únicamente {activeAction.asset} mediante la red oficial seleccionada.
          </p>

          {isLoadingAddress ? (
            <div className="py-6 flex flex-col items-center justify-center space-y-2 text-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              <div className="text-xs text-brand-500 font-medium animate-pulse">Asignando dirección única mediante CoinEx API v2...</div>
            </div>
          ) : activeDepositAddress ? (
            <div className="space-y-3">
              <div className="bg-white p-3 rounded-xl mx-auto w-36 h-36 flex flex-col items-center justify-center border border-gray-100 shadow-sm">
                <QrCode className="h-16 w-16 text-gray-400 dark:text-gray-600" />
                <span className="text-[10px] text-gray-400 font-sans mt-1">QR Operativo</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-2 border border-gray-200 dark:border-white/10">
                <span className="text-xs font-mono text-gray-600 dark:text-gray-300 flex-1 truncate select-all">{activeDepositAddress}</span>
                <button onClick={() => handleCopyAddress(activeDepositAddress)} className={`p-1.5 rounded transition-colors ${copied ? "bg-emerald-500 text-white" : "hover:bg-gray-200 dark:hover:bg-white/10"}`}>
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 text-gray-500" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-medium">
              ⚠️ No se pudo recuperar una dirección. Intenta de nuevo.
            </div>
          )}
        </Card>
      )}

      {/* 📤 PANEL DINÁMICO: Formulario de Retiro */}
      {activeAction.type === "withdraw" && activeAction.asset && (
        <Card padding="md" className="border-red-500/20 bg-red-500/[0.01] space-y-3 animate-slide-in">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-red-500 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" /> Retirar {activeAction.asset} de CubaX
            </span>
            <button onClick={() => setActiveAction({ type: null, asset: null })} className="text-xs text-gray-400 hover:text-gray-600">
              Cerrar
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 flex items-center gap-1">
                <Network className="h-3 w-3 text-red-500" /> Selecciona la Red de Envío
              </label>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="w-full text-xs bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-red-500 h-9"
              >
                {availableChains[activeAction.asset]?.map((chain) => (
                  <option key={chain.value} value={chain.value}>
                    {chain.label}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-amber-500 mt-1 font-medium">
                ⚠️ Enviar fondos por una red incorrecta puede resultar en la pérdida total del activo.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Dirección Externa Destino
              </label>
              <input 
                type="text" 
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder={`Introduce la billetera destino compatible con la red elegida`}
                className="w-full text-xs bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">Monto a Enviar</label>
                <span className="text-[10px] text-gray-400 font-medium">
                  Disponible: {firestoreBalances[activeAction.asset] || 0} {activeAction.asset}
                </span>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-xs bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 pr-12 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
                <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">{activeAction.asset}</span>
              </div>
            </div>

            <Button 
              size="sm" 
              fullWidth 
              disabled={isSubmitting || !withdrawAddress || !withdrawAmount || !selectedChain}
              onClick={handleExecuteWithdrawal}
              className="bg-red-500 hover:bg-red-600 text-white border-0 text-xs"
            >
              {isSubmitting ? "Procesando con CoinEx Core..." : `Solicitar Retiro por ${selectedChain}`}
            </Button>
          </div>
        </Card>
      )}

      {/* Info Banner */}
      <Card padding="sm" className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Los fondos internos operan bajo un modelo atómico *off-chain*. Esto permite transacciones instantáneas y libres de comisiones para movimientos internos dentro de CubaX.
          </p>
        </div>
      </Card>

      {/* Lista de Saldos Reactiva */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Saldos por Criptomoneda</h2>
        <div className="space-y-2">
          {balancesList.map((balance) => {
            const tokenPriceInfo = prices.find((p) => p.symbol.toUpperCase() === balance.asset.toUpperCase());
            const change = tokenPriceInfo?.change24h ?? 0;
            const isUp = change >= 0;

            return (
              <Card key={balance.asset} padding="md" className="border-gray-100 dark:border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-lg">
                      {CRYPTO_ICONS[balance.asset] || "🪙"}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">{balance.asset}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {hideBalances ? "••••" : `${balance.amount.toFixed(balance.asset === "BTC" ? 5 : balance.asset === "ETH" ? 4 : 2)} ${balance.asset}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                      {hideBalances ? "••••" : `$${balance.usdValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    </div>
                    <div className={`text-xs font-medium flex items-center gap-0.5 justify-end ${isUp ? "text-emerald-500" : "text-red-500"}`}>
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(change).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
                  <button onClick={() => handleOpenDeposit(balance.asset)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <ArrowDownLeft className="h-3 w-3" /> Depositar
                  </button>
                  <button onClick={() => setActiveAction({ type: "withdraw", asset: balance.asset })} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <ArrowUpRight className="h-3 w-3" /> Retirar
                  </button>
                  <button onClick={() => handleOpenDeposit(balance.asset)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <QrCode className="h-3 w-3" /> Mi QR
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
    }
                  
