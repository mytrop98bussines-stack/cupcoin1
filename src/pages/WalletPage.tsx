import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CRYPTO_ICONS, MOCK_PRICES } from "@/data/mock";
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
  const { balances, user } = useAppStore();
  const [hideBalances, setHideBalances] = useState(false);
  
  // Modals ficticios o estados para flujos de recarga/retiro directos
  const [activeAction, setActiveAction] = useState<{ type: "deposit" | "withdraw" | null; asset: string | null }>({
    type: null,
    asset: null,
  });

  const totalUSD = balances.reduce((sum, b) => sum + b.usdValue, 0);
  const prices = MOCK_PRICES;

  // Dirección única de depósito asignada al usuario en CubaX (Estilo Binance)
  // En producción, esto vendrá de la cuenta del usuario en Firestore
  const userDepositAddress = "TY9i7G9vKxM1R5X8yZuAnqWpB7B4Bck4Lm"; // Dirección TRON simulada

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(userDepositAddress);
    alert("¡Dirección de depósito copiada al portapapeles!");
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Mi Wallet
        </h1>
        <Badge variant="success" size="sm" className="font-semibold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border-0">
          Custodia Segura
        </Badge>
      </div>

      {/* Tarjeta de Balance General (Estilo Binance) */}
      <Card padding="lg" className="bg-gradient-to-br from-navy-900 to-navy-950 dark:from-white/[0.06] dark:to-white/[0.02] border-navy-800 dark:border-white/[0.08] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
          <Wallet className="h-24 w-24" />
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-400 fill-amber-400" />
            Balance Estimado de la Cuenta
          </span>
          <button 
            onClick={() => setHideBalances(!hideBalances)} 
            className="text-xs text-brand-400 hover:underline"
          >
            {hideBalances ? "Mostrar" : "Ocultar"}
          </button>
        </div>

        <div className="text-left mb-4">
          <p className="text-3xl font-black tracking-tight">
            {hideBalances ? "••••••" : `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          </p>
          <p className="text-xs text-emerald-400 font-medium mt-1">
            ≈ {(totalUSD / (prices.find(p => p.symbol === "btc")?.current_price || 60000)).toFixed(5)} BTC
          </p>
        </div>

        {/* Acciones principales globales */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => setActiveAction({ type: "deposit", asset: "USDT" })}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white border-0"
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
            Retirar (On-Chain)
          </Button>
        </div>
      </Card>

      {/* Panel de depósito rápido si se activa */}
      {activeAction.type === "deposit" && (
        <Card padding="md" className="border-brand-500/30 bg-brand-500/[0.02] space-y-3 animate-slide-in">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-brand-500">Depositar {activeAction.asset} via Blockchain</span>
            <button onClick={() => setActiveAction({ type: null, asset: null })} className="text-xs text-gray-400 hover:text-gray-600">Cerrar</button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Envía únicamente <b>{activeAction.asset}</b> a esta dirección a través de la red <b>TRON (TRC-20)</b>. Los depósitos se acreditan tras 1 confirmación.
          </p>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 rounded-lg px-3 py-2 border border-gray-200 dark:border-white/10">
            <span className="text-xs font-mono text-gray-600 dark:text-gray-300 flex-1 truncate select-all">
              {userDepositAddress}
            </span>
            <button onClick={handleCopyAddress} className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded">
              <Copy className="h-3.5 w-3.5 text-gray-500" />
            </button>
          </div>
        </Card>
      )}

      {/* Info Escrow / Garantía de Fondos */}
      <Card padding="sm" className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Tus fondos internos están custodiados de forma segura por CubaX. Puedes usarlos al instante en el mercado P2P y comercio local sin costes de gas de red.
          </p>
        </div>
      </Card>

      {/* Lista de Activos */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Balances por Criptomoneda
        </h2>
        <div className="space-y-2">
          {balances.map((balance) => {
            const price = prices.find(
              (p) => p.symbol.toUpperCase() === balance.asset
            );
            const change = price?.price_change_percentage_24h ?? 0;
            const isUp = change >= 0;

            return (
              <Card key={balance.asset} hover padding="md" className="border-gray-100 dark:border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-lg">
                      {CRYPTO_ICONS[balance.asset]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {balance.asset}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {hideBalances
                          ? "••••"
                          : `${balance.amount.toFixed(
                              balance.asset === "BTC" ? 5 : balance.asset === "ETH" ? 4 : 2
                            )} ${balance.asset}`}
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
                      {isUp ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {Math.abs(change).toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas del Activo */}
                <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-white/[0.05]">
                  <button 
                    onClick={() => setActiveAction({ type: "deposit", asset: balance.asset })}
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
                          
