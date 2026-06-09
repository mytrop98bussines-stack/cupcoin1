import { useState, useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

import { db } from "@/lib/firebase/config";
import { collection, doc, setDoc } from "firebase/firestore";
import { PAYMENT_METHOD_LABELS, CRYPTO_ICONS } from "@/data/mock";
import {
  ArrowLeftRight,
  Shield,
  CheckCircle2,
} from "lucide-react";
import type { OrderType, CryptoAsset, PaymentMethod, P2POrder } from "@/types";

export function CreateOrderPage() {
  const { navigate, user } = useAppStore();

  const [orderType, setOrderType] = useState<OrderType>("sell");
  const [asset, setAsset] = useState<CryptoAsset>("USDT");
  const [price, setPrice] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [selectedMethods, setSelectedMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const togglePayment = useCallback((method: PaymentMethod) => {
    setSelectedMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!price || !minAmount || !maxAmount || selectedMethods.length === 0 || !user) return;

    setLoading(true);

    try {
      // Generamos una referencia nueva en Firestore para obtener un ID único instantáneo
      const orderRef = doc(collection(db, "p2p_orders"));

      const newOrder: P2POrder = {
        id: orderRef.id,
        userId: user.uid,
        userName: user.displayName || "Usuario CubaX",
        userRating: user.rating || 5.0,
        userTrades: user.totalTrades || 0,
        type: orderType,
        asset,
        pricePerUnit: parseFloat(price),
        currency: "CUP",
        minAmount: parseFloat(minAmount),
        maxAmount: parseFloat(maxAmount),
        availableAmount: parseFloat(maxAmount), // Inicialmente todo lo máximo está disponible
        paymentMethods: selectedMethods,
        status: "active",
        createdAt: Date.now(),
      };

      // Guardamos el documento directamente en la base de datos real de Firestore
      await setDoc(orderRef, newOrder);

      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate("p2p"), 1500);
    } catch (error) {
      console.error("Error al publicar la oferta en Firestore:", error);
      setLoading(false);
    }
  }, [price, minAmount, maxAmount, selectedMethods, user, orderType, asset, navigate]);

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
          Tu oferta de {orderType === "sell" ? "venta" : "compra"} está activa en el mercado P2P.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      <h1 className="text-lg font-bold text-gray-900 dark:text-white">
        Publicar oferta P2P
      </h1>

      {/* Order Type */}
      <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-1">
        {(["sell", "buy"] as OrderType[]).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              orderType === type
                ? type === "sell"
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-emerald-500 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {type === "sell" ? "Quiero vender" : "Quiero comprar"}
          </button>
        ))}
      </div>

      {/* Asset Selection */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Criptomoneda
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(["USDT", "USDC", "BTC", "ETH"] as CryptoAsset[]).map((a) => (
            <button
              key={a}
              onClick={() => setAsset(a)}
              className={`py-3 rounded-xl text-center transition-all duration-200 border ${
                asset === a
                  ? "border-brand-500 bg-brand-500/10 text-brand-500"
                  : "border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400"
              }`}
            >
              <div className="text-lg mb-0.5">{CRYPTO_ICONS[a]}</div>
              <div className="text-xs font-semibold">{a}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <Input
        label={`Precio por 1 ${asset} (CUP)`}
        type="number"
        placeholder="395"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        rightElement={
          <span className="text-xs font-medium text-gray-400">CUP</span>
        }
      />

      {/* Amounts */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Mínimo"
          type="number"
          placeholder="10"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          rightElement={
            <span className="text-[10px] font-medium text-gray-400">
              {asset}
            </span>
          }
        />
        <Input
          label="Máximo"
          type="number"
          placeholder="500"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          rightElement={
            <span className="text-[10px] font-medium text-gray-400">
              {asset}
            </span>
          }
        />
      </div>

      {/* Payment Methods */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Métodos de pago aceptados
        </p>
        <div className="space-y-2">
          {(["transfermovil", "enzona", "efectivo"] as PaymentMethod[]).map((method) => (
            <button
              key={method}
              onClick={() => togglePayment(method)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 ${
                selectedMethods.includes(method)
                  ? "border-brand-500 bg-brand-500/5"
                  : "border-gray-200 dark:border-white/10"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  selectedMethods.includes(method)
                    ? "text-brand-500"
                    : "text-gray-600 dark:text-gray-400"
                }`}
              >
                {PAYMENT_METHOD_LABELS[method]}
              </span>
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedMethods.includes(method)
                    ? "border-brand-500 bg-brand-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
              >
                {selectedMethods.includes(method) && (
                  <CheckCircle2 className="h-3 w-3 text-white" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Escrow Info */}
      {orderType === "sell" && (
        <Card padding="md" className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                Depósito en Escrow
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Al publicar una orden de venta, se te pedirá depositar los
                fondos en un contrato inteligente de escrow. Los fondos se
                liberan automáticamente al confirmar el pago del comprador.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary */}
      {price && minAmount && maxAmount && (
        <Card padding="md" className="bg-gray-50 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            Resumen de la oferta
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Tipo</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {orderType === "sell" ? "Venta" : "Compra"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Activo</span>
              <span className="font-medium text-gray-900 dark:text-white">{asset}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Precio</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {parseFloat(price).toLocaleString("es-CU")} CUP/{asset}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Rango fiat</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {(parseFloat(minAmount) * parseFloat(price)).toLocaleString("es-CU")} -{" "}
                {(parseFloat(maxAmount) * parseFloat(price)).toLocaleString("es-CU")} CUP
              </span>
            </div>
          </div>
        </Card>
      )}

      <Button
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleSubmit}
        disabled={!price || !minAmount || !maxAmount || selectedMethods.length === 0}
        icon={<ArrowLeftRight className="h-4 w-4" />}
      >
        Publicar oferta
      </Button>
    </div>
  );
}
