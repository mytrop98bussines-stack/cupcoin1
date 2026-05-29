import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  ArrowLeftRight,
  ShoppingBag,
  Zap,
  Globe,
  Lock,
  ChevronRight,
  Star,
} from "lucide-react";

export function LandingPage() {
  const { navigate } = useAppStore();

  const features = [
    {
      icon: <ArrowLeftRight className="h-6 w-6" />,
      title: "P2P Sin Límites",
      desc: "Compra y vende cripto con Transfermóvil, EnZona y efectivo",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Escrow Seguro",
      desc: "Fondos protegidos en contrato inteligente durante el trade",
    },
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: "Marketplace",
      desc: "Compra productos reales pagando con criptomonedas",
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Ultra Rápido",
      desc: "Optimizado para redes 3G/4G del mercado cubano",
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Precios en Tiempo Real",
      desc: "Cotizaciones globales de CoinGecko actualizadas al instante",
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Verificación KYC",
      desc: "Sistema de identidad seguro para operar sin restricciones",
    },
  ];

  const stats = [
    { value: "5,200+", label: "Usuarios activos" },
    { value: "$2.4M", label: "Vol. mensual" },
    { value: "99.8%", label: "Trades exitosos" },
    { value: "<3min", label: "Tiempo promedio" },
  ];

  return (
      <div className="min-h-screen bg-white dark:bg-navy-950 text-gray-900 dark:text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 glass bg-white/80 dark:bg-navy-950/80 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-1.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">CX</span>
              </div>
              <span className="font-bold text-lg tracking-tight">
                Cuba<span className="text-brand-500">X</span>
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("login")}
            >
              Iniciar Sesión
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent dark:from-brand-500/10" />
          <div className="relative max-w-lg mx-auto px-4 pt-12 pb-8 text-center">
            <div className="inline-flex items-center gap-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-full text-xs font-semibold mb-6">
              <Star className="h-3.5 w-3.5 fill-current" />
              #1 Plataforma P2P en Cuba
            </div>

            <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
              Cripto para{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
                Cuba
              </span>
              , sin{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-navy-400 to-navy-600">
                fronteras
              </span>
            </h1>

            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
              Compra, vende e intercambia criptomonedas de forma segura con
              métodos de pago cubanos. Todo protegido por contratos inteligentes.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                fullWidth
                onClick={() => navigate("register")}
                icon={<ChevronRight className="h-4 w-4" />}
              >
                Crear cuenta gratis
              </Button>
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => navigate("login")}
              >
                Ya tengo cuenta
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-lg mx-auto px-4 py-6">
          <div className="grid grid-cols-4 gap-2">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
              >
                <div className="text-lg font-bold text-brand-500">{stat.value}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Prices Preview */}
        <section className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Precios en vivo
            </h2>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">vía CoinGecko</span>
          </div>
          <div className="space-y-2">
            {[
              { symbol: "BTC", name: "Bitcoin", price: "$106,250", change: "+2.34%", up: true, icon: "₿" },
              { symbol: "ETH", name: "Ethereum", price: "$3,745", change: "-0.87%", up: false, icon: "Ξ" },
              { symbol: "USDT", name: "Tether", price: "$1.00", change: "+0.01%", up: true, icon: "₮" },
            ].map((coin) => (
              <div
                key={coin.symbol}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-sm">
                    {coin.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{coin.symbol}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{coin.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">{coin.price}</div>
                  <div
                    className={`text-[11px] font-medium ${
                      coin.up ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {coin.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="max-w-lg mx-auto px-4 py-8">
          <h2 className="text-xl font-bold text-center mb-6">
            Todo lo que necesitas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] transition-all hover:border-brand-500/30"
              >
                <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-lg mx-auto px-4 py-8 pb-12">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white text-center">
            <h2 className="text-xl font-bold mb-2">
              Empieza a operar hoy
            </h2>
            <p className="text-sm text-white/70 mb-5">
              Regístrate en menos de 2 minutos y únete a miles de cubanos que
              ya usan CubaX.
            </p>
            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={() => navigate("register")}
              className="bg-white text-brand-600 hover:bg-gray-100"
            >
              Crear cuenta gratis
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 dark:border-white/[0.06] py-6">
          <div className="max-w-lg mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <span className="text-white font-black text-[9px]">CX</span>
              </div>
              <span className="font-bold text-sm">
                Cuba<span className="text-brand-500">X</span>
              </span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              © 2025 CubaX. Plataforma P2P & Crypto para Cuba.
            </p>
          </div>
        </footer>
      </div>
  );
}
