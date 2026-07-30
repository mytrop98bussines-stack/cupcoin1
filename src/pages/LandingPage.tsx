import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Logo }   from "@/components/Logo";
import { useCryptoPrices } from "@/lib/coingecko/prices";
import { useTranslation } from "@/lib/useTranslation";
import type { Language } from "@/lib/i18n";
import {
  Shield,
  ArrowLeftRight,
  ShoppingBag,
  Zap,
  Globe,
  Lock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";

// ─── MAPEO DINÁMICO DE ICONOS CRYPTO ───────────────────────
const MAPEO_CRYPTO_SVG: Record<string, string> = {
  BTC:  "/crypto/btc.svg",
  USDT: "/crypto/usdt.svg",
  ETH:  "/crypto/eth.svg",
  USDC: "/crypto/usdc.svg",
  TRX:  "/crypto/trx.svg",
  XLM:  "/crypto/xlm.svg",
};

export function LandingPage() {
  const { navigate, language, setLanguage } = useAppStore();
  const { t } = useTranslation();
  const { data: cryptoPrices, isLoading: loadingPrices } = useCryptoPrices();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const features = [
    {
      icon:  <ArrowLeftRight className="h-6 w-6" />,
      title: t("landing.features.p2pTitle"),
      desc:  t("landing.features.p2pDesc"),
      color: "bg-brand-500/10 text-brand-500",
    },
    {
      icon:  <Shield className="h-6 w-6" />,
      title: t("landing.features.escrowTitle"),
      desc:  t("landing.features.escrowDesc"),
      color: "bg-emerald-500/10 text-emerald-500",
    },
    {
      icon:  <ShoppingBag className="h-6 w-6" />,
      title: t("landing.features.marketTitle"),
      desc:  t("landing.features.marketDesc"),
      color: "bg-violet-500/10 text-violet-500",
    },
    {
      icon:  <Zap className="h-6 w-6" />,
      title: t("landing.features.fastTitle"),
      desc:  t("landing.features.fastDesc"),
      color: "bg-amber-500/10 text-amber-500",
    },
    {
      icon:  <Globe className="h-6 w-6" />,
      title: t("landing.features.realTimeTitle"),
      desc:  t("landing.features.realTimeDesc"),
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      icon:  <Lock className="h-6 w-6" />,
      title: t("landing.features.kycTitle"),
      desc:  t("landing.features.kycDesc"),
      color: "bg-red-500/10 text-red-500",
    },
  ];

  const trustBadges = [
    t("landing.trust.encrypted"),
    t("landing.trust.escrow"),
    t("landing.trust.support"),
  ];

  const languages: { code: Language; flag: string; label: string }[] = [
    { code: "es", flag: "🇨🇺", label: "Español" },
    { code: "en", flag: "🇺🇸", label: "English" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white transition-colors duration-300">

      {/* ═══ HEADER (con selector de idioma) ═════════════════ */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center">
            <Logo size={28} className="text-black dark:text-white" />
          </div>

          <div className="flex items-center gap-2">
            {/* 🌐 Selector de idioma */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <span className="text-base">
                  {languages.find((l) => l.code === language)?.flag || "🌐"}
                </span>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  {language}
                </span>
              </button>

              {/* Dropdown */}
              {showLangMenu && (
                <>
                  {/* Overlay para cerrar */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLangMenu(false)}
                  />

                  {/* Menú */}
                  <div className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden min-w-[140px] animate-fade-in">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                          language === lang.code
                            ? "bg-brand-500/10 text-brand-500"
                            : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-xs font-bold">{lang.label}</span>
                        {language === lang.code && (
                          <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-brand-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <Button size="sm" onClick={() => navigate("login")}>
              {t("landing.loginBtn")}
            </Button>
          </div>
        </div>
      </header>

      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent dark:from-brand-500/10 pointer-events-none" />
        <div className="absolute top-0 right-0 h-64 w-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-48 w-48 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-lg mx-auto px-4 pt-12 pb-8 text-center">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold mb-6 border border-amber-500/20">
            <Zap className="h-3.5 w-3.5 fill-current" />
            {t("landing.badge")}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black leading-tight mb-4">
            {t("landing.heroTitle1")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600">
              {t("landing.heroTitle2")}
            </span>
            {t("landing.heroTitle3")}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-violet-600">
              {t("landing.heroTitle4")}
            </span>
          </h1>

          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6 max-w-xs mx-auto">
            {t("landing.heroDesc")}
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
              {t("landing.cta.createFree")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => navigate("login")}
            >
              {t("landing.cta.haveAccount")}
            </Button>
          </div>
        </div>
      </section>

      {/* ═══ PRECIOS EN VIVO ═════════════════════════════════ */}
      <section className="max-w-lg mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            {t("landing.livePrices")}
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
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] animate-pulse rounded-xl"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {cryptoPrices?.slice(0, 5).map((coin) => {
              const symbolUpper = coin.symbol.toUpperCase();
              const symbolLower = coin.symbol.toLowerCase();
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
            {t("landing.featuresTitle")}
          </h2>
          <p className="text-xs text-gray-400">
            {t("landing.featuresSubtitle")}
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

      {/* ═══ CTA COMUNIDAD ═══════════════════════════════════ */}
      <section className="max-w-lg mx-auto px-4 py-8 pb-12">
        <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white text-center">
          <div className="absolute -top-8 -right-8 h-32 w-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-xs font-bold mb-4">
              <Zap className="h-3 w-3 fill-current" />
              {t("landing.community.badge")}
            </div>

            <h2 className="text-xl font-black mb-2">
              {t("landing.community.title")}
            </h2>
            <p className="text-sm text-white/70 mb-5 max-w-xs mx-auto">
              {t("landing.community.desc")}
            </p>

            <div className="space-y-3 mb-5 text-left max-w-xs mx-auto">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-white/80 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/80">
                  <strong>{t("landing.community.waitlist")}</strong> — {t("landing.community.waitlistDesc")}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-white/80 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/80">
                  <strong>{t("landing.community.investors")}</strong> — {t("landing.community.investorsDesc")}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-white/80 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/80">
                  <strong>{t("landing.community.community")}</strong> — {t("landing.community.communityDesc")}
                </p>
              </div>
            </div>

            <Button
              size="lg"
              fullWidth
              onClick={() => navigate("register")}
              className="bg-white text-brand-600 hover:bg-gray-50 font-bold shadow-lg"
            >
              {t("landing.cta.createFree")}
            </Button>

            <p className="text-[11px] text-white/60 mt-4">
              {t("landing.community.writeMe")}{" "}
              <a
                href="mailto:mytrop98bussines@gmail.com"
                className="underline font-semibold text-white"
              >
                mytrop98bussines@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ══════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 dark:border-white/[0.06] py-6">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-3">
            <Logo size={22} className="text-black dark:text-white" />
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t("landing.footer.madeIn")}
          </p>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
            {t("landing.footer.rights")}
          </p>

          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button className="text-[10px] text-gray-400 hover:text-brand-500 transition-colors font-medium">
              {t("landing.footer.terms")}
            </button>
            <button className="text-[10px] text-gray-400 hover:text-brand-500 transition-colors font-medium">
              {t("landing.footer.privacy")}
            </button>
            <button className="text-[10px] text-gray-400 hover:text-brand-500 transition-colors font-medium">
              {t("landing.footer.support")}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
