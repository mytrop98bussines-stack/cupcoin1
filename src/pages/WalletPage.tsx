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
} from "lucide-react";

export function WalletPage() {
  // Acciones y estados mapeados correctamente desde el store centralizado
  const { 
    balances, 
    prices, 
    depositAddresses, 
    fetchPrices, 
    fetchDepositAddress, 
    requestWithdrawal 
  } = useAppStore();

  const [hideBalances, setHideBalances] = useState(false);
  
  // Estado para controlar qué panel de acción On-Chain está desplegado
  const [activeAction, setActiveAction] = useState<{ type: "deposit" | "withdraw" | null; asset: string | null }>({
    type: null,
    asset: null,
  });

  // Estados locales para los inputs del formulario de retiro y loaders de acción
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  // 🔄 Sincronización en tiempo real mediante el endpoint centralizado en tu Backend
  useEffect(() => {
    fetchPrices();
    
    const interval = setInterval(() => {
      fetchPrices();
    }, 5000); // Polling constante cada 5 segundos para mantener cotizaciones frescas

    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Cálculo del balance neto total sumando el valor en USD de cada activo real
  const totalUSD = balances.reduce((sum, b) => sum + b.usdValue, 0);
  
  // Obtenemos el precio actual de Bitcoin para mostrar la equivalencia aproximada estilo CEX
  const btcPrice = prices.find((p) => p.symbol.toLowerCase() === "btc")?.priceUSD || 65000;
  const totalBTC = totalUSD / btcPrice;

  // Mapa de redes por activo para instruir correctamente al usuario en Cuba
  const networkMap: Record<string, string> = {
    USDT: "TRON (TRC-20)",
    USDC: "Binance Smart Chain (BEP-20)",
    BTC: "Bitcoin Network",
    ETH: "Ethereum (ERC-20)",
  };

  // Mapa de identificadores de red requeridos por la API v2 de CoinEx
  const coinexChainMap: Record<string, string> = {
    USDT: "TRC20",
    USDC: "BSC",
    BTC: "BTC",
    ETH: "ERC20",
  };

  // Manejador para abrir el panel de depósito y solicitar la dirección real
  const handleOpenDeposit = async (asset: string) => {
    setActiveAction({ type: "deposit", asset });
    if (!depositAddresses[asset]) {
      setIsLoadingAddress(true);
      const chain = coinexChainMap[asset] || "TRC20";
      await fetchDepositAddress(asset, chain);
      setIsLoadingAddress(false);
    }
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    alert("¡Dirección de depósito copiada al portapapeles!");
  };

  const handleExecuteWithdrawal = async () => {
    if (!activeAction.asset || !withdrawAddress || !withdrawAmount) return;
    
    setIsSubmitting(true);
    const chain = coinexChainMap[activeAction.asset] || "";
    
    const res = await requestWithdrawal(
      activeAction.asset,
      parseFloat(withdrawAmount),
      withdrawAddress,
      chain
    );

    setIsSubmitting(false);
    
    if (res.success) {
      alert(`✅ Retiro procesado con éxito.\nID de retiro en cola: ${res.txId || 'N/A'}`);
      // Limpiar estados y cerrar panel
      setActiveAction({ type: null, asset: null });
      setWithdrawAddress("");
      setWithdrawAmount("");
    } else {
      alert(`🚨 Error al procesar retiro: ${res.message}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      {/* Encabezado Principal */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Mi Wallet
        </h1>
        <Badge variant="success" size="sm" className="font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border-0">
          Custodia CubaX
        </Badge>
      </div>

      {/* Tarjeta de Balance General (Estilo Binance Cuenta Principal) */}
      <Card padding="lg" className="bg-gradient-to-br from-navy-900 to-navy-950 dark:from-white/[0.06] dark:to-white/[0.02] border-navy-800 dark:border-white/[0.08] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
          <Wallet className="h-24 w-24" />
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
            Balance Total Estimado
          </span>
          <button 
            onClick={() => setHideBalances(!hideBalances)} 
            className="text-xs text-brand-400 hover:text-brand-300 font-semibold focus:outline-none"
          >
            {hideBalances ? "Mostrar" : "Ocultar"}
          </button>
        </div>

        <div className="text-left mb-4">
          <p className="text-3xl font-black tracking-tight">
            {hideBalances ? "••••••" : `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </p>
          <p className="text-xs text-emerald-400 font-medium mt-1">
            ≈ {hideBalances ? "••••" : totalBTC.toFixed(5)} BTC
          </p>
        </div>

        {/* Acciones Rápidas del Balance de Cuenta */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => handleOpenDeposit("USDT")}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white border-0 shadow-sm"
            icon={<ArrowDownLeft className="h-3.5 w-3.5" />}
          >
            Depositar
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveAction({ type: "withdraw", asset: "USDT" })}
            className="flex-1 bg-white/10 hover:bg-white/15 text-white border-0"
            icon={<ArrowUpRight className="h-3.5 w-3.5" />}
          >
            Retirar
          </Button>
        </div>
      </Card>

      {/* 📥 PANEL DINÁMICO: Flujo de Depósito Blockchain */}
      {activeAction.type === "deposit" && activeAction.asset && (
        <Card padding="md" className="border-brand-500/30 bg-brand-500/[0.02] space-y-3 animate-slide-in">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-brand-500 flex items-center gap-1">
              <ArrowDownLeft className="h-3.5 w-3.5" /> Depositar {activeAction.asset}
            </span>
            <button 
              onClick={() => setActiveAction({ type: null, asset: null })} 
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Cerrar
            </button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Envía únicamente <b>{activeAction.asset}</b> a esta dirección asignada a través de la red de seguridad de <b>{networkMap[activeAction.asset] || "Mainnet"}</b>. El saldo impactará tu balance interno automáticamente tras confirmarse en la blockchain.
          </p>

          {isLoadingAddress ? (
            <div className="text-center p-3 text-xs text-brand-500 font-medium animate-pulse">
              Generando dirección única mediante CoinEx API v2...
            </div>
          ) : depositAddresses[activeAction.asset] ? (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-2 border border-gray-200 dark:border-white/10">
              <span className="text-xs font-mono text-gray-600 dark:text-gray-300 flex-1 truncate select-all">
                {depositAddresses[activeAction.asset]}
              </span>
              <button 
                onClick={() => handleCopyAddress(depositAddresses[activeAction.asset || ""])} 
                className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors"
                title="Copiar dirección"
              >
                <Copy className="h-3.5 w-3.5 text-gray-500" />
              </button>
            </div>
          ) : (
            <div className="text-center p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-medium">
              ⚠️ No se pudo recuperar una dirección válida. Intenta nuevamente o verifica la conexión del servidor.
            </div>
          )}
        </Card>
      )}

      {/* 📤 PANEL DINÁMICO: Formulario de Retiro On-Chain */}
      {activeAction.type === "withdraw" && activeAction.asset && (
        <Card padding="md" className="border-red-500/20 bg-red-500/[0.01] space-y-3 animate-slide-in">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-red-500 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5" /> Retirar {activeAction.asset} de CubaX
            </span>
            <button 
              onClick={() => setActiveAction({ type: null, asset: null })} 
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cerrar
            </button>
          </div>
          
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                Dirección Externa Destino ({networkMap[activeAction.asset] || "On-Chain"})
              </label>
              <input 
                type="text" 
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                placeholder={`Introduce dirección de ${activeAction.asset} o e-mail/ID de CoinEx`}
                className="w-full text-xs bg-white dark:bg-navy-900 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Monto a Enviar</label>
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
              disabled={isSubmitting || !withdrawAddress || !withdrawAmount}
              onClick={handleExecuteWithdrawal}
              className="bg-red-500 hover:bg-red-600 text-white border-0 text-xs"
            >
              {isSubmitting ? "Procesando con CoinEx Core..." : "Solicitar Retiro Externo"}
            </Button>
          </div>
        </Card>
      )}

      {/* Escrow & Security Info Banner */}
      <Card padding="sm" className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Los fondos internos operan bajo un modelo atómico *off-chain*. Esto permite transacciones instantáneas y libres de comisiones de gas de red para todos los intercambios comerciales y P2P dentro de CubaX.
          </p>
        </div>
      </Card>

      {/* Crypto Asset List Container */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Saldos por Criptomoneda
        </h2>
        <div className="space-y-2">
          {balances.map((balance) => {
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
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {balance.asset}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {hideBalances
                          ? "••••"
                          : `${balance.amount.toFixed(balance.asset === "BTC" ? 5 : balance.asset === "ETH" ? 4 : 2)} ${balance.asset}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                      {hideBalances
                        ? "••••"
                        : `$${balance.usdValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                    </div>
                    <div
                      className={`text-xs font-medium flex items-center gap-0.5 justify-end ${
                        isUp ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(change).toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Acciones Inline del Activo de la Cuenta */}
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
                  <button 
                    onClick={() => handleOpenDeposit(balance.asset)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5"
                  >
                    <ArrowDownLeft className="h-3 w-3" />
                    Depositar
                  </button>
                  <button 
                    onClick={() => setActiveAction({ type: "withdraw", asset: balance.asset })}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5"
                  >
                    <ArrowUpRight className="h-3 w-3" />
                    Retirar
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <QrCode className="h-3 w-3" />
                    Mi QR
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
              
