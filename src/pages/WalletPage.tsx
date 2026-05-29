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
} from "lucide-react";

export function WalletPage() {
  const { balances, walletConnected, walletAddress, setWallet } = useAppStore();
  const [connecting, setConnecting] = useState(false);
  const [hideBalances] = useState(false);

  const totalUSD = balances.reduce((sum, b) => sum + b.usdValue, 0);
  const prices = MOCK_PRICES;

  const handleConnect = async () => {
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 2000));
    setWallet(true, "0x7a8b...3d4e5f");
    setConnecting(false);
  };

  const handleDisconnect = () => {
    setWallet(false, null);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      <h1 className="text-lg font-bold text-gray-900 dark:text-white">
        Mi Wallet
      </h1>

      {/* Wallet Connection */}
      <Card padding="lg" className="bg-gradient-to-br from-navy-900 to-navy-950 dark:from-white/[0.06] dark:to-white/[0.02] border-navy-800 dark:border-white/[0.08] text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-brand-400" />
            <span className="text-sm font-semibold">WalletConnect</span>
          </div>
          <Badge
            variant={walletConnected ? "success" : "warning"}
            size="sm"
          >
            {walletConnected ? "Conectada" : "Desconectada"}
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
              <button className="p-1 hover:bg-white/10 rounded">
                <Copy className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>

            <div className="text-center mb-3">
              <p className="text-xs text-gray-400 mb-1">Balance total</p>
              <p className="text-2xl font-black">
                {hideBalances ? "••••••" : `$${totalUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-white/10 hover:bg-white/15 text-white border-0"
                icon={<ArrowDownLeft className="h-3.5 w-3.5" />}
              >
                Recibir
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white"
                icon={<ArrowUpRight className="h-3.5 w-3.5" />}
              >
                Enviar
              </Button>
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full mt-3 py-2 text-xs text-red-400 hover:text-red-300 flex items-center justify-center gap-1 transition-colors"
            >
              <Unlink className="h-3 w-3" />
              Desconectar wallet
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-300 mb-4">
              Conecta tu wallet para ver tus balances, enviar y recibir cripto,
              y participar en trades P2P con escrow.
            </p>
            <Button
              size="lg"
              fullWidth
              loading={connecting}
              onClick={handleConnect}
              icon={<LinkIcon className="h-4 w-4" />}
              className="bg-brand-500 hover:bg-brand-600 text-white"
            >
              Conectar Wallet
            </Button>
          </>
        )}
      </Card>

      {/* Escrow Info */}
      <Card padding="sm" className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Los fondos de trades P2P se protegen mediante contratos
            inteligentes de Escrow. Solo se liberan al confirmar ambas partes.
          </p>
        </div>
      </Card>

      {/* Asset List */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Activos
        </h2>
        <div className="space-y-2">
          {balances.map((balance) => {
            const price = prices.find(
              (p) => p.symbol.toUpperCase() === balance.asset
            );
            const change = price?.price_change_percentage_24h ?? 0;
            const isUp = change >= 0;

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

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <ArrowDownLeft className="h-3 w-3" />
                    Recibir
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <ArrowUpRight className="h-3 w-3" />
                    Enviar
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <QrCode className="h-3 w-3" />
                    QR
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-500/5">
                    <ExternalLink className="h-3 w-3" />
                    Explorer
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
