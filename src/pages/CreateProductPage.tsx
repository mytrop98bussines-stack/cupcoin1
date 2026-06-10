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
  Upload,
  Camera,
  CheckCircle2,
  Shield,
  Loader2,
  X,
} from "lucide-react";
import type { CryptoAsset, ProductCategory, Product } from "@/types";

export function CreateProductPage() {
  const { navigate, user } = useAppStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<ProductCategory>("electronics");
  const [condition, setCondition] = useState<"new" | "used" | "refurbished">("new");
  const [location, setLocation] = useState("");
  const [acceptedCryptos, setAcceptedCryptos] = useState<CryptoAsset[]>(["USDT"]);
  
  // 📸 Manejo de imágenes reales (guardamos objetos File para subirlos luego)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Referencia para disparar el input de archivos oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleCrypto = useCallback((crypto: CryptoAsset) => {
    setAcceptedCryptos((prev) =>
      prev.includes(crypto) ? prev.filter((c) => c !== crypto) : [...prev, crypto]
    );
  }, []);

  // Capturar imágenes del sistema de archivos o cámara
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Controlar el límite estricto de 5 imágenes máximo
      const availableSlots = 5 - selectedFiles.length;
      const filesToProcess = filesArray.slice(0, availableSlots);

      filesToProcess.forEach((file) => {
        setSelectedFiles((prev) => [...prev, file]);
        
        // Crear URLs locales temporales para ver la miniatura de la imagen antes de subirla
        const objectUrl = URL.createObjectURL(file);
        setPreviews((prev) => [...prev, objectUrl]);
      });
    }
  };

  // Eliminar una imagen seleccionada antes de publicar
  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    // Revocamos la URL local para liberar memoria ram del dispositivo
    URL.revokeObjectURL(previews[index]);
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = useCallback(async () => {
    if (!title || !description || !price || !location || !user) return;

    setLoading(true);

    try {
      const uploadedImageUrls: string[] = [];

      // ➡️ 1. SUBIDA MULTIPART REAL A CLOUDINARY
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        
        // 🛠️ ¡CORREGIDO AQUÍ! Clave oficial "upload_preset" apuntando a tu valor real "cubax_preset"
        formData.append("upload_preset", "cubax_preset"); 
        formData.append("folder", "cubax/products");

        const cloudinaryRes = await fetch(
          "https://api.cloudinary.com/v1_1/cupcoin-b2b4f/image/upload",
          {
            method: "POST",
            body: formData, // El navegador inyecta el Content-Type correcto automáticamente
          }
        );

        if (!cloudinaryRes.ok) {
          const errorData = await cloudinaryRes.json();
          throw new Error(errorData.error?.message || "Error en la respuesta del servidor de Cloudinary");
        }

        const imageData = await cloudinaryRes.json();
        uploadedImageUrls.push(imageData.secure_url); // URL segura HTTPS final
      }

      // ➡️ 2. GUARDADO DE DOCUMENTO FINAL EN FIRESTORE
      const productRef = doc(collection(db, "products"));

      const newProduct: Product = {
        id: productRef.id,
        sellerId: user.uid,
        sellerName: user.displayName || "Comerciante CubaX",
        title,
        description,
        priceUSD: parseFloat(price),
        acceptedCryptos,
        images: uploadedImageUrls, // Aquí inyectamos el array de URLs reales
        category,
        condition,
        location,
        status: "active",
        createdAt: Date.now(),
      };

      await setDoc(productRef, newProduct);

      // Limpieza de URLs temporales
      previews.forEach((url) => URL.revokeObjectURL(url));

      setLoading(false);
      setSuccess(true);
      setTimeout(() => navigate("marketplace"), 1500);
    } catch (error: any) {
      console.error("Error al publicar el producto con imágenes reales:", error);
      alert(`Fallo en la publicación: ${error.message || "Revisa tu conexión."}`);
      setLoading(false);
    }
  }, [title, description, price, location, user, acceptedCryptos, selectedFiles, category, condition, navigate, previews]);

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
          Tu producto está visible en el marketplace con imágenes reales.
        </p>
      </div>
    );
  }

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
            Las imágenes se suben con firma criptográfica Cloudinary. Tus
            credenciales están protegidas.
          </p>
        </div>
      </Card>

      {/* Input nativo oculto para invocar el selector de archivos o la cámara del móvil */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Images Preview Section */}
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          Fotos del producto ({previews.length}/5)
        </p>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
          {previews.map((url, i) => (
            <div
              key={i}
              className="relative flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-sm"
            >
              <img
                src={url}
                alt="preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
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

      <Input
        label="Título"
        placeholder="iPhone 14 Pro Max 256GB"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

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

      <Input
        label="Precio (USD)"
        type="number"
        placeholder="850"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        rightElement={<span className="text-xs font-medium text-gray-400">USD</span>}
      />

      <Select
        label="Categoría"
        value={category}
        onChange={(e) => setCategory(e.target.value as ProductCategory)}
        options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
      />

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

      <Input
        label="Ubicación"
        placeholder="La Habana, Cuba"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />

      {/* Accepted Cryptos */}
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
        disabled={!title || !description || !price || !location || acceptedCryptos.length === 0 || selectedFiles.length === 0}
        icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
      >
        {loading ? "Subiendo imágenes a Cloudinary..." : "Publicar producto real"}
      </Button>
    </div>
  );
          }
