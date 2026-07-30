import { useState, useEffect, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, CheckCircle2, Clock, ShoppingBag } from "lucide-react";

interface ProductQRCodeProps {
  productId:   string;
  productTitle: string;
  price:       number;
  sellerUid:   string;
  sellerName:  string;
  acceptedCryptos: string[];
  onClose:     () => void;
}

const QR_EXPIRY_MINUTES = 10;

export function ProductQRCode({
  productId,
  productTitle,
  price,
  sellerUid,
  sellerName,
  acceptedCryptos,
  onClose,
}: ProductQRCodeProps) {
  const [timeLeft, setTimeLeft]       = useState(QR_EXPIRY_MINUTES * 60);
  const [copied, setCopied]           = useState(false);
  const [regenerated, setRegenerated] = useState(0);

  // ✅ Payload congelado — SOLO cambia cuando se regenera manualmente
  const qrPayload = useMemo(() => {
    const now       = Date.now();
    const expiresAt = now + QR_EXPIRY_MINUTES * 60 * 1000;

    return JSON.stringify({
      type: "CUBAX_PAYMENT",
      v: 1,
      productId,
      productTitle,
      price,
      sellerUid,
      sellerName,
      acceptedCryptos,
      timestamp: now,
      expiresAt,
    });
    // 👇 Solo se recalcula cuando cambia `regenerated` o cambian los props del producto
  }, [regenerated, productId, productTitle, price, sellerUid, sellerName, acceptedCryptos]);

  // Countdown (afecta SOLO el timer visual, NO el QR)
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const expired = timeLeft <= 0;

  const handleRegenerate = () => {
    setTimeLeft(QR_EXPIRY_MINUTES * 60);
    setRegenerated((n) => n + 1); // ✅ Fuerza el recálculo del useMemo
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-6 space-y-5 shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-brand-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              QR de cobro
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        {/* Producto */}
        <div className="text-center">
          <p className="text-xs text-gray-400 font-medium mb-1">Cobrando por</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
            {productTitle}
          </p>
          <p className="text-3xl font-black text-brand-500">
            ${price.toLocaleString("en-US")} USD
          </p>
        </div>

        {/* QR — ✅ Ya no parpadea */}
        <div className={`relative mx-auto w-fit p-5 rounded-2xl bg-white border-4 ${
          expired ? "border-red-500 opacity-40" : "border-brand-500"
        }`}>
          <QRCodeSVG
            value={qrPayload}
            size={220}
            level="M"
            marginSize={0}
          />
          {expired && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
              <span className="text-lg font-black text-red-500">EXPIRADO</span>
            </div>
          )}
        </div>

        {/* Timer + regenerar */}
        {!expired ? (
          <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
            <Clock className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
              Expira en {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          </div>
        ) : (
          <button
            onClick={handleRegenerate}
            className="w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors"
          >
            🔄 Generar nuevo QR
          </button>
        )}

        {/* Cryptos aceptadas */}
        <div>
          <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 text-center">
            Aceptas pago en
          </p>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            {acceptedCryptos.map((c) => (
              <span
                key={c}
                className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Instrucciones */}
        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20">
          <p className="text-xs text-blue-700 dark:text-blue-400 font-semibold text-center">
            📱 Pide al comprador que escanee este QR desde su Marketplace
          </p>
        </div>

        {/* Debug — copiar payload */}
        <button
          onClick={handleCopyLink}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {copied ? (
            <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Copiado</>
          ) : (
            <><Copy className="h-3 w-3" /> Copiar código</>
          )}
        </button>
      </div>
    </div>
  );
}
