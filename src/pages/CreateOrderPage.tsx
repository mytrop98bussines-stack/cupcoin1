import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

import { db } from "@/lib/firebase/config";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { PAYMENT_METHOD_LABELS, CRYPTO_ICONS } from "@/data/mock";
import {
  ArrowLeftRight,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Info,
  Crown,
} from "lucide-react";
import type { OrderType, CryptoAsset, PaymentMethod, P2POrder } from "@/types";

export function CreateOrderPage() {
  const { navigate, user } = useAppStore();

  const [orderType, setOrderType]           = useState<OrderType>("sell");
  const [asset, setAsset]                   = useState<CryptoAsset>("USDT");
  const [price, setPrice]                   = useState("");
  const [minAmount, setMinAmount]           = useState("");
  const [maxAmount, setMaxAmount]           = useState("");
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading]               = useState(false);
  const [success, setSuccess]               = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  const togglePayment = useCallback((method: PaymentMethod) => {
    setSelectedMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method]
    );
  }, []);

  // ─── Validaciones locales ─────────────────────────────────
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

  const handleSubmit = useCallback(async () => {
    if (!user) {
      setError("Debes iniciar sesión para publicar una orden.");
      return;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ VALIDAR SALDO si es orden de VENTA
      if (orderType === "sell") {
        const userRef  = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          throw new Error("Tu usuario no existe en Firestore.");
        }

        const balances     = userSnap.data().balances || {};
        const assetBalance = balances[asset] || 0;
        const maxAmountNum = parseFloat(maxAmount);

        if (assetBalance < maxAmountNum) {
          throw new Error(
            `Saldo insuficiente. Tienes ${assetBalance} ${asset} y quieres vender hasta ${maxAmountNum} ${asset}. Deposita más fondos primero.`
          );
        }
      }

      // ✅ Crear referencia con ID único en Firestore
      const orderRef = doc(collection(db, "orders"));

      const newOrder: P2POrder = {
        id:              orderRef.id,
        userId:          user.uid,
        userName:        user.displayName || "Usuario CubaX",
        userRating:      (user as any).rating      || 5.0,
        userTrades:      (user as any).totalTrades || 0,
        type:            orderType,
        asset,
        pricePerUnit:    parseFloat(price),
        currency:        "CUP",
        minAmount:       parseFloat(minAmount),
        maxAmount:       parseFloat(maxAmount),
        availableAmount: parseFloat(maxAmount),
        paymentMethods:  selectedMethods,
        status:          "active",
        createdAt:       Date.now(),
      };

      await setDoc(orderRef, newOrder);

      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate("p2p"), 1500);

    } catch (err: any) {
      console.error("Error al publicar orden:", err);
      setError(err.message || "Error al publicar la orden. Intenta de nuevo.");
      setLoading(false);
    }
  }, [
    price, minAmount, maxAmount,
    selectedMethods, user, orderType,
    asset, navigate, validationError,
  ]);

  // Al inicio del componente, antes del return
const membershipActive = (() => {
  const m = (user as any)?.membership;
  if (!m) return false;
  if (m.status === "expired") return false;
  if (m.expiresAt < Date.now()) return false;
  return true;
})();

const kycVerified = user?.kycStatus === "verified";

  // ─── Verificación de Membresía y KYC ──────────────────────
  const membershipActive = (() => {
    const m = (user as any)?.membership;
    if (!m) return false;
    if (m.status === "expired") return false;
    if (m.expiresAt < Date.now()) return false;
    return true;
  })();

  const kycVerified = user?.kycStatus === "verified";

  // 1️⃣ PRIORIDAD 1: Si no tiene membresía activa, salta esto primero
  if (!membershipActive) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-brand-500/10 flex items-center justify-center mx-auto mb-4">
          {/* Asegúrate de añadir Crown a tus imports de lucide-react */}
          <Shield className="h-8 w-8 text-brand-500" /> 
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Membresía requerida
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Necesitas una membresía activa para publicar anuncios.
          El primer mes es gratis.
        </p>
        <Button size="lg" onClick={() => navigate("membership")}>
          Ver membresía
        </Button>
      </div>
    );
  }

  // 2️⃣ PRIORIDAD 2: Si ya tiene membresía pero le falta el KYC, salta esto después
  if (!kycVerified) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          KYC requerido
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Debes verificar tu identidad para poder publicar anuncios.
        </p>
        <Button size="lg" onClick={() => navigate("kyc")}>
          Verificar identidad
        </Button>
      </div>
    );
  }
  
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

  // ─── RENDER ───────────────────────────────────────────────
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

      {/* Selección de criptomoneda */}
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
                  : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20"
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
            </strong>{" "}
            —{" "}
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
          {(["transfermovil", "enzona", "efectivo"] as PaymentMethod[]).map(
            (method) => {
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
                      {method === "transfermovil"
                        ? "📱"
                        : method === "enzona"
                        ? "💳"
                        : "💵"}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        selected
                          ? "text-brand-500"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {PAYMENT_METHOD_LABELS[method]}
                    </span>
                  </div>
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      selected
                        ? "border-brand-500 bg-brand-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {selected && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Info escrow — Solo para ventas */}
      {orderType === "sell" && (
        <Card
          padding="md"
          className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5"
        >
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">
                Protección Escrow Automática
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                Al iniciar un trade, tus fondos se bloquean en escrow dentro
                de CubaX. Solo se liberan al comprador cuando tú confirmes
                haber recibido el pago en CUP. Si hay algún problema, puedes
                abrir una disputa y un moderador intervendrá.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Info compra */}
      {orderType === "buy" && (
        <Card
          padding="md"
          className="border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5"
        >
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
              <span className={`font-bold ${
                orderType === "sell" ? "text-red-500" : "text-emerald-500"
              }`}>
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
                {selectedMethods
                  .map((m) => PAYMENT_METHOD_LABELS[m])
                  .join(", ") || "—"}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Botón publicar */}
      <Button
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleSubmit}
        disabled={
          loading ||
          !price ||
          !minAmount ||
          !maxAmount ||
          parseFloat(price) <= 0 ||
          parseFloat(minAmount) <= 0 ||
          parseFloat(maxAmount) <= 0 ||
          selectedMethods.length === 0 ||
          !!validationError
        }
        icon={
          loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowLeftRight className="h-4 w-4" />
          )
        }
      >
        {loading ? "Publicando oferta..." : "Publicar oferta P2P"}
      </Button>
    </div>
  );
}
