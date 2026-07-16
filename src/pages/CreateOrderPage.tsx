import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Input }  from "@/components/ui/Input";
import { Card }   from "@/components/ui/Card";
import { PAYMENT_METHOD_LABELS, CRYPTO_ICONS } from "@/data/data";
import {
  ArrowLeftRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  Crown,
} from "lucide-react";
import type { OrderType, CryptoAsset, PaymentMethod } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function CreateOrderPage() {
  const { navigate, user } = useAppStore();

  const [orderType, setOrderType]             = useState<OrderType>("sell");
  const [asset, setAsset]                     = useState<CryptoAsset>("USDT");
  const [price, setPrice]                     = useState("");
  const [minAmount, setMinAmount]             = useState("");
  const [maxAmount, setMaxAmount]             = useState("");
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading]                 = useState(false);
  const [success, setSuccess]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);

  // ─── 1. Esperar a que la cuenta cargue ────────────────────
  if (!user || !(user as any).membership) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-xs text-gray-400">Verificando cuenta...</p>
      </div>
    );
  }

  // ─── 2. Verificar membresía ───────────────────────────────
  const membershipActive = (() => {
    const m = (user as any).membership;
    if (!m)                       return false;
    if (m.status === "expired")   return false;
    if (m.expiresAt < Date.now()) return false;
    return true;
  })();

  // ─── 3. Bloqueo por membresía ─────────────────────────────
  if (!membershipActive) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
          <Crown className="h-8 w-8 text-brand-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Membresía requerida
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Necesitas una membresía activa para publicar anuncios en el P2P.
        </p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-6">
          ✨ El primer mes es completamente gratis
        </p>
        <Button size="lg" fullWidth onClick={() => navigate("membership")}>
          <Crown className="h-4 w-4 mr-2" />
          Activar membresía
        </Button>
      </div>
    );
  }

  // ─── 4. Bloqueo por KYC ───────────────────────────────────
  if (user.kycStatus !== "verified") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Verificación KYC requerida
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          Debes verificar tu identidad para poder publicar anuncios en el P2P.
        </p>
        {user.kycStatus === "pending_verification" ? (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              ⏳ Tu solicitud está siendo revisada.
            </p>
          </div>
        ) : user.kycStatus === "rejected" ? (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
              ❌ Tu KYC fue rechazado. Vuelve a intentarlo.
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mb-6">
            El proceso toma menos de 48 horas.
          </p>
        )}
        <Button
          size="lg"
          fullWidth
          onClick={() => navigate("kyc")}
          disabled={user.kycStatus === "pending_verification"}
        >
          <Shield className="h-4 w-4 mr-2" />
          {user.kycStatus === "pending_verification"
            ? "Verificación en proceso..."
            : "Verificar identidad"}
        </Button>
      </div>
    );
  }

  // ─── Callbacks ────────────────────────────────────────────
  const togglePayment = useCallback((method: PaymentMethod) => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  }, []);

  const validationError = (() => {
    if (!price || parseFloat(price) <= 0)
      return "El precio debe ser mayor a 0.";
    if (!minAmount || parseFloat(minAmount) <= 0)
      return "El monto mínimo debe ser mayor a 0.";
    if (!maxAmount || parseFloat(maxAmount) <= 0)
      return "El monto máximo debe ser mayor a 0.";
    if (parseFloat(minAmount) > parseFloat(maxAmount))
      return "El monto mínimo no puede ser mayor al máximo.";
    if (selectedMethods.length === 0)
      return "Selecciona al menos un método de pago.";
    return null;
  })();

  // ─── Publicar orden via backend ───────────────────────────
  const handleSubmit = useCallback(async () => {
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");

      const res  = await fetch(`${BACKEND_URL}/orders/create`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          uid:            user.uid,
          type:           orderType,
          asset,
          price:          parseFloat(price),
          minAmount:      parseFloat(minAmount),
          maxAmount:      parseFloat(maxAmount),
          paymentMethods: selectedMethods,
          userName:       user.displayName          || "Usuario CubaX",
          userRating:     (user as any).rating      || 5.0,
          userTrades:     (user as any).totalTrades || 0,
          currency:       "CUP",
        }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Error al publicar la orden.");
      }

      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate("p2p"), 1500);

    } catch (err: any) {
      console.error("❌ Error al publicar orden:", err);
      setError(err.message || "Error al publicar la orden. Intenta de nuevo.");
      setLoading(false);
    }
  }, [
    price, minAmount, maxAmount,
    selectedMethods, user, orderType,
    asset, navigate, validationError,
  ]);

  // ─── Pantalla de éxito ────────────────────────────────────
  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Orden publicada!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tu oferta de{" "}
          <strong>{orderType === "sell" ? "venta" : "compra"}</strong> está
          activa en el mercado P2P.
        </p>
      </div>
    );
  }

  // ─── RENDER PRINCIPAL ─────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Publicar oferta P2P
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Crea tu anuncio de compra o venta de criptomonedas
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Tipo de orden */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Tipo de orden
        </p>
        <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1">
          {(["sell", "buy"] as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                orderType === type
                  ? type === "sell"
                    ? "bg-red-500 text-white shadow-sm"
                    : "bg-emerald-500 text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {type === "sell" ? "Quiero vender" : "Quiero comprar"}
            </button>
          ))}
        </div>
      </div>

      {/* Criptomoneda */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Criptomoneda
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(["USDT", "USDC", "BTC", "ETH"] as CryptoAsset[]).map((a) => (
            <button
              key={a}
              onClick={() => setAsset(a)}
              className={`py-3 rounded-xl text-center transition-all duration-200 border ${
                asset === a
                  ? "border-brand-500 bg-brand-500/10 text-brand-500 shadow-sm"
                  : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
              }`}
            >
              <div className="text-xl mb-0.5">{CRYPTO_ICONS[a]}</div>
              <div className="text-xs font-bold">{a}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Precio */}
      <Input
        label={`Precio por 1 ${asset} (CUP)`}
        type="number"
        placeholder="395"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        rightElement={
          <span className="text-xs font-bold text-gray-400">CUP</span>
        }
      />

      {/* Montos */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Mínimo"
          type="number"
          placeholder="10"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          rightElement={
            <span className="text-[10px] font-bold text-gray-400">{asset}</span>
          }
        />
        <Input
          label="Máximo"
          type="number"
          placeholder="500"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          rightElement={
            <span className="text-[10px] font-bold text-gray-400">{asset}</span>
          }
        />
      </div>

      {/* Rango en CUP */}
      {price && minAmount && maxAmount &&
        parseFloat(minAmount) > 0 &&
        parseFloat(maxAmount) > 0 &&
        parseFloat(price) > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
          <Info className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Rango en CUP:{" "}
            <strong className="text-gray-900 dark:text-white">
              {(parseFloat(minAmount) * parseFloat(price)).toLocaleString("es-CU")}
            </strong>
            {" "}—{" "}
            <strong className="text-gray-900 dark:text-white">
              {(parseFloat(maxAmount) * parseFloat(price)).toLocaleString("es-CU")}
            </strong>{" "}
            CUP
          </p>
        </div>
      )}

      {/* Métodos de pago */}
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Métodos de pago aceptados
        </p>
        <div className="space-y-2">
          {(["transfermovil", "enzona", "efectivo"] as PaymentMethod[]).map((method) => {
            const selected = selectedMethods.includes(method);
            return (
              <button
                key={method}
                onClick={() => togglePayment(method)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                  selected
                    ? "border-brand-500 bg-brand-500/5"
                    : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">
                    {method === "transfermovil" ? "📱" : method === "enzona" ? "💳" : "💵"}
                  </span>
                  <span className={`text-sm font-semibold ${
                    selected ? "text-brand-500" : "text-gray-600 dark:text-gray-400"
                  }`}>
                    {PAYMENT_METHOD_LABELS[method]}
                  </span>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected
                    ? "border-brand-500 bg-brand-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}>
                  {selected && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info escrow — Solo ventas */}
      {orderType === "sell" && (
        <Card padding="md" className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                Protección Escrow Automática
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Al iniciar un trade, tus fondos se bloquean en escrow dentro
                de CubaX. Solo se liberan al comprador cuando confirmes haber
                recibido el pago en CUP.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Info compra */}
      {orderType === "buy" && (
        <Card padding="md" className="border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                ¿Cómo funciona la compra?
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Publicas tu intención de compra. Los vendedores interesados
                iniciarán un trade contigo. El vendedor depositará los fondos
                en escrow antes de que envíes el pago en CUP.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Resumen */}
      {price && minAmount && maxAmount &&
        parseFloat(price) > 0 &&
        parseFloat(minAmount) > 0 &&
        parseFloat(maxAmount) > 0 && (
        <Card padding="md" className="bg-gray-50 dark:bg-white/[0.03]">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Resumen de la oferta
          </p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Tipo</span>
              <span className={`font-bold ${orderType === "sell" ? "text-red-500" : "text-emerald-500"}`}>
                {orderType === "sell" ? "🔴 Venta" : "🟢 Compra"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Activo</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {CRYPTO_ICONS[asset]} {asset}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Precio</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {parseFloat(price).toLocaleString("es-CU")} CUP/{asset}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Mínimo</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {parseFloat(minAmount)} {asset}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Máximo</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {parseFloat(maxAmount)} {asset}
              </span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-white/10" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Métodos</span>
              <span className="font-bold text-gray-900 dark:text-white text-right">
                {selectedMethods.map((m) => PAYMENT_METHOD_LABELS[m]).join(", ") || "—"}
              </span>
            </div>
          </div>
        </Card>
      )}
      {/* ✅ Teléfono de pago guardado */}
{(user as any).phone && (
  <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-500/5 border border-brand-500/20">
    <Phone className="h-4 w-4 text-brand-500 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-xs font-bold text-brand-600 dark:text-brand-400">
        Número de pago guardado
      </p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        {(user as any).phone} — Los compradores verán este número
      </p>
    </div>
  </div>
)}

{!(user as any).phone && (
  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
    <div className="flex-1">
      <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
        Sin número de pago
      </p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        Agrega tu número en el perfil para que aparezca automáticamente.
      </p>
    </div>
    <button
      onClick={() => navigate("profile")}
      className="text-[11px] font-bold text-amber-500 hover:text-amber-400"
    >
      Agregar →
    </button>
  </div>
)}

      {/* Botón publicar */}
      <Button
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleSubmit}
        disabled={
          loading                      ||
          !price                       ||
          !minAmount                   ||
          !maxAmount                   ||
          parseFloat(price) <= 0       ||
          parseFloat(minAmount) <= 0   ||
          parseFloat(maxAmount) <= 0   ||
          selectedMethods.length === 0 ||
          !!validationError
        }
        icon={
          loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ArrowLeftRight className="h-4 w-4" />
        }
      >
        {loading ? "Publicando oferta..." : "Publicar oferta P2P"}
      </Button>
    </div>
  );
    }
