import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { useCryptoPrices } from "@/lib/coingecko/prices";
import {
  Shield,
  ArrowLeftRight,
  ShoppingBag,
  Zap,
  Globe,
  Lock,
  ChevronRight,
  Star,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";

// ─── COMPONENTE INTERNO DEL LOGO DE CUBAX ─────────────────
function CubaXLogo({ size = 32 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15 15H42L85 85H58L15 15Z" fill="#000000" stroke="#cbd5e1" strokeWidth="5" strokeLinejoin="miter" />
      <path d="M85 15H58L45.5 35L57.5 45L85 15Z" fill="#000000" stroke="#cbd5e1" strokeWidth="5" strokeLinejoin="miter" />
      <path d="M15 85H42L54.5 65L42.5 55L15 85Z" fill="#000000" stroke="#cbd5e1" strokeWidth="5" strokeLinejoin="miter" />
    </svg>
  );
}

// ─── MAPEO DINÁMICO DE ICONOS CRYPTO (LLAVES EN MAYÚSCULAS) ───
const MAPEO_CRYPTO_SVG: Record<string, string> = {
  BTC: "/crypto/btc.svg",
  USDT: "/crypto/usdt.svg",
  ETH: "/crypto/eth.svg",
  USDC: "/crypto/usdc.svg",
  TRX: "/crypto/trx.svg"
};

export function LandingPage() {
  const { navigate } = useAppStore();
  const { data: cryptoPrices, isLoading: loadingPrices } = useCryptoPrices();

  const features = [
    {
      icon:  <ArrowLeftRight className="h-6 w-6" />,
      title: "P2P Sin Límites",
      desc:  "Compra y vende cripto con Transfermóvil, EnZona y efectivo",
      color: "bg-brand-500/10 text-brand-500",
    },
    {
      icon:  <Shield className="h-6 w-6" />,
      title: "Escrow Seguro",
      desc:  "Fondos protegidos en contrato inteligente durante el trade",
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      icon:  <ShoppingBag className="h-6 w-6" />,
      title: "Marketplace",
      desc:  "Compra productos reales pagando con criptomonedas",
      color: "bg-violet-500/10 text-violet-500",
    },
    {
      icon:  <Zap className="h-6 w-6" />,
      title: "Ultra Rápido",
      desc:  "Optimizado para redes 3G/4G del mercado cubano",
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      icon:  <Globe className="h-6 w-6" />,
      title: "Precios en Tiempo Real",
      desc:  "Cotizaciones globales de CoinGecko actualizadas al instante",
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon:  <Lock className="h-6 w-6" />,
      title: "Verificación KYC",
      desc:  "Sistema de identidad seguro para operar sin restricciones",
      color: "bg-red-500/10 text-red-500",
    },
  ];

  const stats = [
    { value: "5,200+", label: "Usuarios activos" },
    { value: "$2.4M",  label: "Vol. mensual"     },
    { value: "99.8%",  label: "Trades exitosos"  },
    { value: "<3min",  label: "Tiempo promedio"  },
  ];

  const trustBadges = [
    "Transacciones cifradas",
    "Escrow automático",
    "Soporte 24/7",
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">

      {/* ═══ HEADER ══════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <CubaXLogo size={28} />
            <span className="font-bold text-lg tracking-tight">
              Cuba<span className="text-brand-500">X</span>
            </span>
          </div>
          <Button size="sm" onClick={() => navigate("login")}>
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent dark:from-brand-500/10 pointer-events-none" />
        <div className="absolute top-0 right-0 h-64 w-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-48 w-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-lg mx-auto px-4 pt-12 pb-8 text-center">
          <div className="inline-flex items-center gap-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-full text-xs font-bold mb-6 border border-brand-500/20">
            <Star className="h-3.5 w-3.5 fill-current" />
            #1 Plataforma P2P en Cuba
          </div>

          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            Cripto para{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
              Cuba
            </span>
            , sin{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">
              fronteras
            </span>
          </h1>

          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 max-w-xs mx-auto">
            Compra, vende e intercambia criptomonedas de forma segura con
            métodos de pago cubanos. Todo protegido por contratos inteligentes.
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
            {trustBadges.map((badge) => (
              <div
                key={badge}
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 dark:text-gray-400"
              >
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                {badge}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              fullWidth
              onClick={() => navigate("register")}
              icon={<ChevronRight className="h-4 w-4" />}
              className="shadow-lg shadow-brand-500/20"
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

      {/* ═══ STATS ═══════════════════════════════════════════ */}
      <section className="max-w-lg mx-auto px-4 py-6">
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-brand-500/20 transition-colors"
            >
              <div className="text-base font-black text-brand-500">
                {stat.value}
              </div>
              <div className="text-[9px] text-gray-500 dark:text-gray-400 font-semibold mt-0.5 leading-tight">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ PRECIOS EN VIVO ═════════════════════════════════ */}
      <section className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            Precios en vivo
            {loadingPrices && (
              <div className="h-3 w-3 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            )}
          </h2>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-400 font-medium">
              via CoinGecko
            </span>
          </div>
        </div>

        {loadingPrices && !cryptoPrices ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {cryptoPrices?.slice(0, 4).map((coin) => {
              // ─── NORMALIZACIÓN CORREGIDA ───────────────────────────
              const symbolUpper = coin.symbol.toUpperCase();
              const symbolLower = coin.symbol.toLowerCase(); // Forzamos minúsculas para buscar tu archivo real
              const isUp        = coin.price_change_percentage_24h >= 0;
              const tieneIconoSvg = !!MAPEO_CRYPTO_SVG[symbolUpper];

              return (
                <div
                  key={coin.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-brand-500/20 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-1.5 overflow-hidden">
                      {tieneIconoSvg ? (
                        <img 
                          // Apunta dinámicamente a tu archivo local en minúscula (ej: /crypto/usdt.svg)
                          src={`/crypto/${symbolLower}.svg`} 
                          alt={symbolUpper} 
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="font-bold text-sm text-gray-500 dark:text-gray-400">
                          {symbolUpper.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900 dark:text-white">
                        {symbolUpper}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {coin.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm text-gray-900 dark:text-white font-mono">
                      $
                      {coin.current_price >= 1
                        ? coin.current_price.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })
                        : coin.current_price.toFixed(4)}
                    </div>
                    <div
                      className={`text-[11px] font-bold flex items-center justify-end gap-0.5 ${
                        isUp ? "text-emerald-500" : "text-red-500"
                      }`}
                    >
                      {isUp ? (
                        <TrendingUp className="h-2.5 w-2.5" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5" />
                      )}
                      {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ═══ FEATURES ════════════════════════════════════════ */}
      <section className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="text-xl font-black mb-1">
            Todo lo que necesitas
          </h2>
          <p className="text-xs text-gray-400">
            Una plataforma completa para el mercado cubano
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:border-brand-500/20 transition-all hover:shadow-sm"
            >
              <div
                className={`h-10 w-10 rounded-xl ${feature.color} flex items-center justify-center mb-3`}
              >
                {feature.icon}
              </div>
              <h3 className="font-bold text-sm mb-1 text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA FINAL ═══════════════════════════════════════ */}
      <section className="max-w-lg mx-auto px-4 py-8 pb-12">
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white text-center">
          <div className="absolute -top-8 -right-8 h-32 w-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Zap className="h-3 w-3 fill-current" />
              Registro en 2 minutos
            </div>

            <h2 className="text-xl font-black mb-2">
              Empieza a operar hoy
            </h2>
            <p className="text-sm text-white/70 mb-5 max-w-xs mx-auto">
              Únete a miles de cubanos que ya usan CubaX para manejar su
              cripto con seguridad.
            </p>

            <div className="flex items-center justify-center gap-4 mb-5">
              {trustBadges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-1 text-[10px] font-semibold text-white/70"
                >
                  <CheckCircle2 className="h-3 w-3 text-white/50" />
                  {badge}
                </div>
              ))}
            </div>

            <Button
              size="lg"
              fullWidth
              onClick={() => navigate("register")}
              className="bg-white text-brand-600 hover:bg-gray-50 font-bold shadow-lg"
            >
              Crear cuenta gratis
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 dark:border-white/[0.06] py-6">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <CubaXLogo size={22} />
            <span className="font-bold text-sm">
              Cuba<span className="text-brand-500">X</span>
            </span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            © 2026 CubaX. Plataforma P2P & Crypto para Cuba.
          </p>
          <div className="flex items-center justify-center gap-3 mt-2">
            {["Términos", "Privacidad", "Soporte"].map((link) => (
              <button
                key={link}
                className="text-[10px] text-gray-400 hover:text-brand-500 transition-colors font-medium"
              >
                {link}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
                          }
