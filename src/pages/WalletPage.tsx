import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CRYPTO_ICONS, MOCK_PRICES } from "@/data/mock";
import {
  Wallet,
  Link as LinkIcon,
  Unlink,
  Copy,
  ExternalLink,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  Shield,
  Zap,
} from "lucide-react";

export function WalletPage() {
  const { balances, walletConnected, walletAddress, setWallet } = useAppStore();
  const [connecting, setConnecting] = useState(false);
  const [hideBalances] = useState(false);
  
  // 🔄 Control de pestañas para el modelo híbrido
  const [walletType, setWalletType] = useState<"internal" | "blockchain">("internal");

  const totalUSD = balances.reduce((sum, b) => sum + b.usdValue, 0);
  const prices = MOCK_PRICES;

  const handleConnect = async () => {
    setConnecting(true);
    // Simulación de generación de llaves o handshake
    await new Promise((r) => setTimeout(r, 2000));
    setWallet(true, "0x7a8b6932...3d4e5f78");
    setConnecting(false);
  };

  const handleDisconnect = () => {
    setWallet(false, null);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Mi Wallet
        </h1>
        <Badge variant="info" size="sm" className="font-semibold uppercase tracking-wider">
          Híbrida
        </Badge>
      </div>

      {/* 🎛️ Selector de Tipo de Balance Híbrido */}
      <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/[0.06]">
        <button
          onClick={() => setWalletType("internal")}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            walletType === "internal"
              ? "bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Balance CubaX (Sin Gas)
        </button>
        <button
          onClick={() => setWalletType("blockchain")}
          className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
            walletType === "blockchain"
              ? "bg-white dark:bg-navy-900 text-brand-600 dark:text-brand-400 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Wallet className="h-3.5 w-3.5" />
          Balance Blockchain
        </button>
      </div>

      {/* 1. SECCIÓN CONTENEDORA SEGÚN TIPO DE WALLET */}
      {walletType === "internal" ? (
        /* --- Capa Custodial / Interna --- */
        <Card padding="lg" className="bg-gradient-to-br from-brand-600 to-brand-800 text-white border-0 shadow-lg shadow-brand-600/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-300 fill-amber-300" />
              <span className="text-sm font-semibold opacity-90">Cuenta Interna Instantánea</span>
            </div>
            <Badge className="bg-white/20 text-white border-0">Activa</Badge>
          </div>

          <div className="text-center mb-4 mt-2">
            <p className="text-xs text-brand-200 mb-1">Disponible para trading P2P instantáneo</p>
            <p className="text-3xl font-black tracking-tight">
              {hideBalances ? "••••••" : `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-white/10 hover:bg-white/15 text-white border-0"
              icon={<ArrowDownLeft className="h-3.5 w-3.5" />}
            >
              Transferencia Interna
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-amber-400 hover:bg-amber-500 text-gray-900 font-bold border-0"
              icon={<ArrowUpRight className="h-3.5 w-3.5" />}
            >
              Cargar Fondos
            </Button>
          </div>
        </Card>
      ) : (
        /* --- Capa No Custodial / Blockchain --- */
        <Card padding="lg" className="bg-gradient-to-br from-navy-900 to-navy-950 dark:from-white/[0.06] dark:to-white/[0.02] border-navy-800 dark:border-white/[0.08] text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-brand-400" />
              <span className="text-sm font-semibold">Llave en Dispositivo (Web3)</span>
            </div>
            <Badge variant={walletConnected ? "success" : "warning"} size="sm">
              {walletConnected ? "Resguardada" : "Inactiva"}
            </Badge>
          </div>

          {walletConnected ? (
            <>
              <div className="flex items-center gap-2 mb-3 bg-white/5 rounded-lg px-3 py-2">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <span className="text-sm font-mono text-gray-300 flex-1 truncate">
                  {walletAddress}
                </span>
                <button 
                  onClick={() => navigator.clipboard.writeText(walletAddress || "")}
                  className="p-1 hover:bg-white/10 rounded"
                >
                  <Copy className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>

              <div className="text-center mb-3">
                <p className="text-xs text-gray-400 mb-1">Balance On-Chain</p>
                <p className="text-2xl font-black">
                  {hideBalances ? "••••••" : `$${(totalUSD * 0.4).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-white/10 hover:bg-white/15 text-white border-0"
                  icon={<ArrowDownLeft className="h-3.5 w-3.5" />}
                >
                  Recibir Web3
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white"
                  icon={<ArrowUpRight className="h-3.5 w-3.5" />}
                >
                  Retirar de Cuba
                </Button>
              </div>

              <button
                onClick={handleDisconnect}
                className="w-full mt-3 py-2 text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1 transition-colors"
              >
                <Unlink className="h-3 w-3" />
                Eliminar llave del almacenamiento local
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-300 mb-4">
                Genera de manera segura tu dirección on-chain para recibir remesas directas y liquidar tus fondos hacia wallets externas.
              </p>
              <Button
                size="lg"
                fullWidth
                loading={connecting}
                onClick={handleConnect}
                icon={<LinkIcon className="h-4 w-4" />}
                className="bg-brand-500 hover:bg-brand-600 text-white"
              >
                Activar Wallet Blockchain
              </Button>
            </>
          )}
        </Card>
      )}

      {/* Escrow Info */}
      <Card padding="sm" className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {walletType === "internal" 
              ? "Tu saldo interno está asegurado mediante registros atómicos en la base de datos de CubaX para transacciones sin coste." 
              : "Los fondos on-chain interactúan con contratos inteligentes descentralizados (Escrow) independientes de los servidores de la plataforma."}
          </p>
        </div>
      </Card>

      {/* Asset List */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Activos ({walletType === "internal" ? "Internal Off-chain" : "On-chain"})
        </h2>
        <div className="space-y-2">
          {balances.map((balance) => {
            const price = prices.find(
              (p) => p.symbol.toUpperCase() === balance.asset
            );
            const change = price?.price_change_percentage_24h ?? 0;
            const isUp = change >= 0;

            // Simulación: Modificamos balances para simular que son cuentas diferentes
            const displayAmount = walletType === "internal" ? balance.amount : balance.amount * 0.4;
            const displayUsdValue = walletType === "internal" ? balance.usdValue : balance.usdValue * 0.4;

            return (
              <Card key={balance.asset} hover padding="md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-xl">
                      {CRYPTO_ICONS[balance.asset]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white">
                        {balance.asset}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {hideBalances
                          ? "••••"
                          : `${displayAmount.toFixed(
                              balance.asset === "BTC" ? 5 : balance.asset === "ETH" ? 4 : 2
                            )} ${balance.asset}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                      {hideBalances
                        ? "••••"
                        : `$${displayUsdValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
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

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <ArrowDownLeft className="h-3 w-3" />
                    {walletType === "internal" ? "Recibir Pago" : "Recibir Web3"}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <ArrowUpRight className="h-3 w-3" />
                    Enviar
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <QrCode className="h-3 w-3" />
                    QR
                  </button>
                  {walletType === "blockchain" && (
                    <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                      <ExternalLink className="h-3 w-3" />
                      Explorer
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
                  }
          
