import { useState, useCallback, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";

import { db } from "@/lib/firebase/config";
import { collection, doc, setDoc } from "firebase/firestore";
import { CATEGORY_LABELS, CRYPTO_ICONS } from "@/data/mock";
import {
  Upload, Camera, CheckCircle2, Shield,
  Loader2, X, Crown, Truck, MapPin,
  CreditCard, Clock,
} from "lucide-react";
import type { CryptoAsset, ProductCategory, Product, ProductPaymentTiming } from "@/types";

export function CreateProductPage() {
  const { navigate, user, prices } = useAppStore();

  // ✅ TODOS los estados primero — sin excepción
  const [title, setTitle]               = useState("");
  const [description, setDescription]   = useState("");
  const [price, setPrice]               = useState("");
  const [category, setCategory]         = useState<ProductCategory>("electronics");
  const [condition, setCondition]       = useState<"new" | "used" | "refurbished">("new");
  const [location, setLocation]         = useState("");
  const [acceptedCryptos, setAcceptedCryptos] = useState<CryptoAsset[]>(["USDT"]);
  const [selectedFiles, setSelectedFiles]     = useState<File[]>([]);
  const [previews, setPreviews]               = useState<string[]>([]);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [pickup, setPickup]             = useState(true);
  const [homeDelivery, setHomeDelivery] = useState(false);
  const [deliveryFee, setDeliveryFee]   = useState("");
  const [deliveryInfo, setDeliveryInfo] = useState("");
  const [paymentTiming, setPaymentTiming] = useState<ProductPaymentTiming>("flexible");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ TODOS los callbacks aquí — antes de cualquier return
  const toggleCrypto = useCallback((crypto: CryptoAsset) => {
    setAcceptedCryptos((prev) =>
      prev.includes(crypto)
        ? prev.filter((c) => c !== crypto)
        : [...prev, crypto]
    );
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray     = Array.from(e.target.files);
      const availableSlots = 5 - selectedFiles.length;
      const filesToProcess = filesArray.slice(0, availableSlots);
      filesToProcess.forEach((file) => {
        setSelectedFiles((prev) => [...prev, file]);
        const objectUrl = URL.createObjectURL(file);
        setPreviews((prev) => [...prev, objectUrl]);
      });
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(async () => {
    if (!title || !description || !price || !location || !user) return;
    if (!pickup && !homeDelivery) {
      alert("Selecciona al menos una opción de entrega.");
      return;
    }

    setLoading(true);

    try {
      const uploadedImageUrls: string[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file",          file);
        formData.append("upload_preset", "cubax_unsigned");
        formData.append("folder",        "cubax/products");

        const cloudinaryRes = await fetch(
          "https://api.cloudinary.com/v1_1/dc4caibrn/image/upload",
          { method: "POST", body: formData }
        );

        if (!cloudinaryRes.ok) {
          const errorData = await cloudinaryRes.json();
          throw new Error(errorData.error?.message || "Error en Cloudinary");
        }

        const imageData = await cloudinaryRes.json();
        uploadedImageUrls.push(imageData.secure_url);
      }

      const productRef = doc(collection(db, "products"));

      const newProduct: Product = {
        id:              productRef.id,
        sellerId:        user.uid,
        sellerName:      user.displayName || "Comerciante CubaX",
        title,
        description,
        priceUSD:        parseFloat(price),
        acceptedCryptos,
        images:          uploadedImageUrls,
        category,
        condition,
        location,
        status:          "active",
        createdAt:       Date.now(),
        totalSold:       0,
        delivery: {
          pickup,
          homeDelivery,
          ...(homeDelivery && deliveryFee && parseFloat(deliveryFee) > 0
            ? { deliveryFee: parseFloat(deliveryFee) }
            : { deliveryFee: 0 }),
          ...(deliveryInfo.trim()
            ? { deliveryInfo: deliveryInfo.trim() }
            : {}),
        },
        paymentTiming,
      };

      await setDoc(productRef, newProduct);
      previews.forEach((url) => URL.revokeObjectURL(url));

      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate("marketplace"), 1500);

    } catch (error: any) {
      console.error("Error al publicar:", error);
      alert(`Fallo: ${error.message || "Revisa tu conexión."}`);
      setLoading(false);
    }
  }, [
    title, description, price, location,
    user, acceptedCryptos, selectedFiles,
    category, condition, navigate, previews,
    pickup, homeDelivery, deliveryFee,
    deliveryInfo, paymentTiming,
  ]);

  // ─── AHORA SÍ — returns condicionales DESPUÉS de todos los hooks ──

  // 1. Esperar cuenta
  if (!user || !(user as any).membership) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        <p className="text-xs text-gray-400">Verificando cuenta...</p>
      </div>
    );
  }

  // 2. Verificar membresía
  const membershipActive = (() => {
    const m = (user as any).membership;
    if (!m)                       return false;
    if (m.status === "expired")   return false;
    if (m.expiresAt < Date.now()) return false;
    return true;
  })();

  // 3. Bloqueo membresía
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
          Necesitas una membresía activa para publicar productos.
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

  // 4. Bloqueo KYC
  if (user.kycStatus !== "verified") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Verificación KYC requerida
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Debes verificar tu identidad para publicar productos.
        </p>
        <Button size="lg" fullWidth onClick={() => navigate("kyc")}>
          <Shield className="h-4 w-4 mr-2" />
          Verificar identidad
        </Button>
      </div>
    );
  }

  // 5. Éxito
  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          ¡Producto publicado!
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tu producto está visible en el marketplace.
        </p>
      </div>
    );
  }

  // ─── RENDER PRINCIPAL ─────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      <h1 className="text-lg font-bold text-gray-900 dark:text-white">
        Publicar producto
      </h1>

      {/* Security Notice */}
      <Card padding="sm" className="border-blue-500/20 bg-blue-50 dark:bg-blue-500/5">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Las imágenes se suben con firma criptográfica Cloudinary.
            Tu producto no desaparecerá al venderse — puedes tener stock ilimitado.
          </p>
        </div>
      </Card>

      {/* Input oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Imágenes */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Fotos del producto ({previews.length}/5)
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
          {previews.map((url, i) => (
            <div key={i} className="relative flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm">
              <img src={url} alt="preview" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {previews.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 h-20 w-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 hover:border-brand-500 hover:bg-brand-500/5 transition-all text-gray-400 hover:text-brand-500"
            >
              <Camera className="h-5 w-5" />
              <span className="text-[9px] font-medium">Agregar</span>
            </button>
          )}
        </div>
      </div>

      {/* Título */}
      <Input
        label="Título"
        placeholder="iPhone 14 Pro Max 256GB"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* Descripción */}
      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
          Descripción
        </label>
        <textarea
          placeholder="Describe tu producto en detalle..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
        />
      </div>

      {/* Precio */}
      <Input
        label="Precio (USD)"
        type="number"
        placeholder="850"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        rightElement={<span className="text-xs font-medium text-gray-400">USD</span>}
      />

      {/* Equivalencia crypto */}
      {price && parseFloat(price) > 0 && (
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-1.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            Equivalencia en vivo:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {acceptedCryptos.map((crypto) => {
              const cryptoData      = prices.find((p) => p.symbol === crypto);
              const rate            = cryptoData ? cryptoData.priceUSD : 1;
              const amount          = parseFloat(price) / rate;
              const formattedAmount = crypto === "BTC" || crypto === "ETH"
                ? amount.toFixed(6)
                : amount.toFixed(2);

              return (
                <div
                  key={crypto}
                  className="flex items-center justify-between text-xs font-mono bg-white dark:bg-black/20 p-1.5 rounded-lg px-2 border dark:border-white/5"
                >
                  <span className="text-gray-500">{crypto}:</span>
                  <span className="font-bold text-brand-500">{formattedAmount}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categoría */}
      <Select
        label="Categoría"
        value={category}
        onChange={(e) => setCategory(e.target.value as ProductCategory)}
        options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
      />

      {/* Condición */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Condición
        </p>
        <div className="flex gap-2">
          {(["new", "used", "refurbished"] as const).map((cond) => (
            <button
              key={cond}
              onClick={() => setCondition(cond)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                condition === cond
                  ? "border-brand-500 bg-brand-500/10 text-brand-500"
                  : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
              }`}
            >
              {cond === "new" ? "Nuevo" : cond === "used" ? "Usado" : "Reacondicionado"}
            </button>
          ))}
        </div>
      </div>

      {/* Ubicación */}
      <Input
        label="Ubicación"
        placeholder="La Habana, Cuba"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      {/* ✅ Opciones de entrega */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5" />
          Opciones de entrega
        </p>
        <div className="space-y-2">

          {/* Recogida en persona */}
          <button
            onClick={() => setPickup(!pickup)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
              pickup
                ? "border-brand-500 bg-brand-500/5"
                : "border-gray-200 dark:border-white/10"
            }`}
          >
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
              pickup ? "border-brand-500 bg-brand-500" : "border-gray-300 dark:border-gray-600"
            }`}>
              {pickup && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Recogida en persona
              </p>
              <p className="text-[11px] text-gray-400">
                El comprador recoge el producto en {location || "tu ubicación"}
              </p>
            </div>
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </button>

          {/* Envío a domicilio */}
          <button
            onClick={() => setHomeDelivery(!homeDelivery)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
              homeDelivery
                ? "border-brand-500 bg-brand-500/5"
                : "border-gray-200 dark:border-white/10"
            }`}
          >
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
              homeDelivery ? "border-brand-500 bg-brand-500" : "border-gray-300 dark:border-gray-600"
            }`}>
              {homeDelivery && <div className="h-2 w-2 rounded-full bg-white" />}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Envío a domicilio
              </p>
              <p className="text-[11px] text-gray-400">
                Envías el producto al comprador
              </p>
            </div>
            <Truck className="h-4 w-4 text-gray-400 flex-shrink-0" />
          </button>

          {/* Detalles del envío */}
          {homeDelivery && (
            <div className="pl-3 space-y-2 animate-slide-up">
              <Input
                label="Costo de envío (USD) — opcional"
                type="number"
                placeholder="0 = envío gratis"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                rightElement={<span className="text-xs text-gray-400">USD</span>}
              />
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                  Zona de cobertura y tiempo estimado
                </label>
                <textarea
                  placeholder="Ej: Entrego en La Habana en 24h, otras provincias en 3-5 días..."
                  value={deliveryInfo}
                  onChange={(e) => setDeliveryInfo(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 px-4 py-2.5 text-sm focus:border-brand-500 outline-none resize-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Opciones de pago */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5" />
          Cuándo se paga
        </p>
        <div className="space-y-2">
          {[
            {
              value:    "before" as ProductPaymentTiming,
              label:    "Pago antes de recibir",
              desc:     "El comprador paga primero y luego recibe el producto",
              icon:     <CreditCard className="h-4 w-4 text-gray-400" />,
            },
            {
              value:    "on_delivery" as ProductPaymentTiming,
              label:    "Pago al recibir",
              desc:     "El comprador paga cuando recibe el producto",
              icon:     <Truck className="h-4 w-4 text-gray-400" />,
            },
            {
              value:    "flexible" as ProductPaymentTiming,
              label:    "Flexible — lo coordinan",
              desc:     "Vendedor y comprador coordinan por chat",
              icon:     <Clock className="h-4 w-4 text-gray-400" />,
            },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setPaymentTiming(option.value)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                paymentTiming === option.value
                  ? "border-brand-500 bg-brand-500/5"
                  : "border-gray-200 dark:border-white/10"
              }`}
            >
              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                paymentTiming === option.value
                  ? "border-brand-500 bg-brand-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}>
                {paymentTiming === option.value && (
                  <div className="h-2 w-2 rounded-full bg-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {option.label}
                </p>
                <p className="text-[11px] text-gray-400">{option.desc}</p>
              </div>
              {option.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Criptomonedas */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Criptomonedas aceptadas
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(["USDT", "USDC", "BTC", "ETH"] as CryptoAsset[]).map((crypto) => (
            <button
              key={crypto}
              onClick={() => toggleCrypto(crypto)}
              className={`py-3 rounded-xl text-center transition-all duration-200 border ${
                acceptedCryptos.includes(crypto)
                  ? "border-brand-500 bg-brand-500/10 text-brand-500"
                  : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
              }`}
            >
              <div className="text-lg mb-0.5">{CRYPTO_ICONS[crypto]}</div>
              <div className="text-xs font-semibold">{crypto}</div>
            </button>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        fullWidth
        loading={loading}
        onClick={handleSubmit}
        disabled={
          !title                       ||
          !description                 ||
          !price                       ||
          parseFloat(price) <= 0       ||
          !location                    ||
          acceptedCryptos.length === 0 ||
          selectedFiles.length === 0   ||
          (!pickup && !homeDelivery)
        }
        icon={
          loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Upload className="h-4 w-4" />
        }
      >
        {loading ? "Subiendo imágenes..." : "Publicar producto"}
      </Button>
    </div>
  );
}
