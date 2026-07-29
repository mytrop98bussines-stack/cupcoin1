import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { CryptoIcon } from "@/components/ui/CryptoIcon";
import {
  X, ShoppingBag, CheckCircle2, AlertTriangle,
  Loader2, Zap, Shield,
} from "lucide-react";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

interface QRPaymentData {
  type:            "CUBAX_PAYMENT";
  v:               number;
  productId:       string;
  productTitle:    string;
  price:           number;      // USD
  sellerUid:       string;
  sellerName:      string;
  acceptedCryptos: string[];
  timestamp:       number;
  expiresAt:       number;
}

interface PayWithQRModalProps {
  data:      QRPaymentData;
  onClose:   () => void;
  onSuccess: (orderId: string) => void;
}

export function PayWithQRModal({ data, onClose, onSuccess }: PayWithQRModalProps) {
  const { user, balances, prices } = useAppStore();

  const [selectedCrypto, setSelectedCrypto] = useState<string>(
    data.acceptedCryptos[0] || "USDT"
  );
  const [paying, setPaying] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ─── Calcular cantidad de crypto necesaria ────────────────
  const cryptoAmount = useMemo(() => {
    const priceData = prices.find((p) => p.symbol === selectedCrypto);
    const rate      = priceData?.priceUSD || 1;
    return data.price / rate;
  }, [selectedCrypto, prices, data.price]);

  // ─── Balance disponible de esa crypto ─────────────────────
  const userBalance = useMemo(() => {
    const bal = balances.find((b) => b.asset === selectedCrypto);
    return bal?.amount || 0;
  }, [balances, selectedCrypto]);

  const hasEnoughBalance = userBalance >= cryptoAmount;
  const isOwnProduct     = user?.uid === data.sellerUid;

  // ─── Formato de cantidad según asset ──────────────────────
  const formatAmount = (amount: number, asset: string): string => {
    if (asset === "BTC" || asset === "ETH") return amount.toFixed(6);
    if (asset === "XLM") return amount.toFixed(4);
    return amount.toFixed(2);
  };

  // ─── Confirmar pago ───────────────────────────────────────
  const handlePay = async () => {
    if (!user)             return setError("Debes iniciar sesión.");
    if (isOwnProduct)      return setError("No puedes pagar tu propio producto.");
    if (!hasEnoughBalance) return setError(`Balance insuficiente en ${selectedCrypto}.`);
    if (Date.now() > data.expiresAt) {
      return setError("Este QR ha expirado. Pide al vendedor uno nuevo.");
    }

    setPaying(true);
    setError(null);

    try {
      const token = localStorage.getItem("cubax_token");
      const res   = await fetch(`${BACKEND_URL}/marketplace/pay-qr`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId:    data.productId,
          sellerUid:    data.sellerUid,
          priceUSD:     data.price,
          cryptoAsset:  selectedCrypto,
          cryptoAmount: cryptoAmount,
          qrTimestamp:  data.timestamp,
          qrExpiresAt:  data.expiresAt,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error || "Error al procesar el pago.");
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess(result.orderId);
      }, 1500);

    } catch (err: any) {
      setError(err.message || "Error al procesar el pago.");
    } finally {
      setPaying(false);
    }
  };

  // ─── Pantalla de éxito ────────────────────────────────────
  if (success) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-sm mx-4 bg-white dark:bg-gray-900 rounded-3xl p-6 space-y-4 text-center shadow-2xl animate-slide-up">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white">
            ¡Pago exitoso! 🎉
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pagaste <strong className="text-brand-500">
              {formatAmount(cryptoAmount, selectedCrypto)} {selectedCrypto}
            </strong> a {data.sellerName}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <Zap className="h-3 w-3 text-amber-400" />
            Transacción completada al instante
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-emerald-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Confirmar pago
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Info del producto */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/10 to-brand-600/5 border border-brand-500/20">
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mb-1">
            Pagando a <strong className="text-gray-900 dark:text-white">{data.sellerName}</strong>
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {data.productTitle}
          </p>
          <p className="text-3xl font-black text-brand-500 leading-none">
            ${data.price.toLocaleString("en-US")}
            <span className="text-sm text-gray-400 font-medium ml-1">USD</span>
          </p>
        </div>

        {/* Aviso propio producto */}
        {isOwnProduct && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Este es tu propio producto. No puedes pagarlo.
            </p>
          </div>
        )}

        {/* Selector de crypto */}
        {!isOwnProduct && (
          <div>
            <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Pagar con
            </p>
            <div className="grid grid-cols-3 gap-2">
              {data.acceptedCryptos.map((crypto) => {
                const isSelected = selectedCrypto === crypto;
                const bal        = balances.find((b) => b.asset === crypto)?.amount || 0;

                return (
                  <button
                    key={crypto}
                    onClick={() => setSelectedCrypto(crypto)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]"
                    }`}
                  >
                    <CryptoIcon symbol={crypto} size={22} />
                    <span className={`text-xs font-bold ${
                      isSelected ? "text-brand-500" : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {crypto}
                    </span>
                    <span className="text-[9px] text-gray-400">
                      {bal > 0 ? formatAmount(bal, crypto) : "0"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Desglose del pago */}
        {!isOwnProduct && (
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Cantidad a pagar</span>
              <div className="flex items-center gap-1.5">
                <CryptoIcon symbol={selectedCrypto} size={14} />
                <span className="text-sm font-black text-gray-900 dark:text-white font-mono">
                  {formatAmount(cryptoAmount, selectedCrypto)} {selectedCrypto}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Tu balance</span>
              <span className={`text-xs font-bold ${
                hasEnoughBalance ? "text-emerald-500" : "text-red-500"
              }`}>
                {formatAmount(userBalance, selectedCrypto)} {selectedCrypto}
              </span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Después del pago</span>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {formatAmount(Math.max(0, userBalance - cryptoAmount), selectedCrypto)} {selectedCrypto}
              </span>
            </div>
          </div>
        )}

        {/* Aviso balance insuficiente */}
        {!isOwnProduct && !hasEnoughBalance && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400">
              Balance insuficiente en {selectedCrypto}. Prueba con otra crypto o deposita fondos.
            </p>
          </div>
        )}

        {/* Info de seguridad */}
        {!isOwnProduct && hasEnoughBalance && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
            <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Pago instantáneo entre wallets internas. La transacción no se puede revertir.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400 flex-1">{error}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-sm font-bold"
          >
            Cancelar
          </button>
          <button
            onClick={handlePay}
            disabled={paying || isOwnProduct || !hasEnoughBalance}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {paying ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Procesando...</>
            ) : (
              <><Zap className="h-4 w-4" /> Pagar ahora</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
