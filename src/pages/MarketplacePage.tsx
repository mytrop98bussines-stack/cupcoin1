import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card }   from "@/components/ui/Card";
import { Badge }  from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CryptoIcon } from "@/components/ui/CryptoIcon";
import { QRScanner } from "@/components/marketplace/QRScanner";
import { PayWithQRModal } from "@/components/marketplace/PayWithQRModal";
import { CONDITION_LABELS } from "@/data/data";
import {
  Search, Plus, MapPin, Filter,
  ShoppingBag, X, Camera, Truck,
  Package, Sparkles, QrCode,
} from "lucide-react";
import type { ProductCategory } from "@/types";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

export function MarketplacePage() {
  const {
    navigate,
    setSelectedProductId,
    products,
    setProducts,
  } = useAppStore();

  const [searchQuery, setSearchQuery]           = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [showFilters, setShowFilters]           = useState(false);
  const [loadingProducts, setLoadingProducts]   = useState(true);

  // 🎯 Estados del sistema QR
  const [showScanner, setShowScanner]         = useState(false);
  const [scannedData, setScannedData]         = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess]   = useState<string | null>(null);

  // ─── Cargar productos via backend ─────────────────────────
  useEffect(() => {
    if (products.length > 0) {
      setLoadingProducts(false);
      return;
    }

    setLoadingProducts(true);

    fetch(`${BACKEND_URL}/products`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setProducts(data.products);
      })
      .catch((error) => {
        console.error("❌ Error cargando productos:", error);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, [setProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== "active") return false;

      if (selectedCategory !== "all" && p.category !== selectedCategory) {
        return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle       = p.title?.toLowerCase().includes(q);
        const matchDescription = p.description?.toLowerCase().includes(q);
        const matchLocation    = p.location?.toLowerCase().includes(q);
        const matchCategory    = p.category?.toLowerCase().includes(q);

        if (!matchTitle && !matchDescription && !matchLocation && !matchCategory) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleProductClick = (productId: string) => {
    setSelectedProductId(productId);
    navigate("product-detail");
  };

  // 🎯 Handlers del sistema QR
  const handleScanSuccess = (data: any) => {
    setShowScanner(false);
    setScannedData(data);
  };

  const handlePaymentSuccess = (orderId: string) => {
    setScannedData(null);
    setPaymentSuccess(orderId);
    setTimeout(() => setPaymentSuccess(null), 5000);
  };

  const categories: { value: ProductCategory | "all"; label: string; emoji: string }[] = [
    { value: "all",         label: "Todos",        emoji: "🔥" },
    { value: "phones",      label: "Teléfonos",    emoji: "📱" },
    { value: "computers",   label: "Computadoras", emoji: "💻" },
    { value: "electronics", label: "Electrónica",  emoji: "🔌" },
    { value: "clothing",    label: "Ropa",         emoji: "👕" },
    { value: "services",    label: "Servicios",    emoji: "🛠" },
    { value: "home",        label: "Hogar",        emoji: "🏠" },
    { value: "vehicles",    label: "Vehículos",    emoji: "🚗" },
    { value: "other",       label: "Otros",        emoji: "📦" },
  ];

  const getCategoryEmoji = (category: string) => {
    const map: Record<string, string> = {
      phones:      "📱",
      computers:   "💻",
      electronics: "🔌",
      services:    "🛠",
      clothing:    "👕",
      home:        "🏠",
      vehicles:    "🚗",
    };
    return map[category] || "📦";
  };

  const getConditionStyle = (condition: string) => {
    switch (condition) {
      case "new":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "used":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "refurbished":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">

      {/* ═══ HEADER ══════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            Marketplace
            <Sparkles className="h-4 w-4 text-amber-400" />
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {loadingProducts
              ? "Cargando productos..."
              : `${filteredProducts.length} producto${filteredProducts.length !== 1 ? "s" : ""} disponible${filteredProducts.length !== 1 ? "s" : ""}`
            }
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => navigate("create-product")}
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Publicar
        </Button>
      </div>

      {/* ═══ BÚSQUEDA ════════════════════════════════════════ */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos, ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-colors relative ${
            showFilters || selectedCategory !== "all"
              ? "border-brand-500 bg-brand-500/10 text-brand-500"
              : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
          }`}
        >
          <Filter className="h-4 w-4" />
          {selectedCategory !== "all" && (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-brand-500 rounded-full" />
          )}
        </button>
      </div>

      {searchQuery && (
        <p className="text-xs text-gray-400 px-1">
          {filteredProducts.length === 0
            ? "Sin resultados para"
            : `${filteredProducts.length} resultado${filteredProducts.length !== 1 ? "s" : ""} para`}{" "}
          <strong className="text-gray-600 dark:text-gray-300">
            "{searchQuery}"
          </strong>
        </p>
      )}

      {/* ═══ CATEGORÍAS ══════════════════════════════════════ */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedCategory === cat.value
                ? "bg-brand-500 text-white shadow-sm shadow-brand-500/20"
                : "bg-gray-100 dark:bg-white/[0.03] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-white/[0.06]"
            }`}
          >
            <span className="text-sm">{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* ═══ PRODUCTOS ═══════════════════════════════════════ */}
      {loadingProducts ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden"
            >
              <div className="aspect-square bg-gray-100 dark:bg-white/5 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full animate-pulse w-3/4" />
                <div className="h-4 bg-gray-100 dark:bg-white/5 rounded-full animate-pulse w-1/2" />
                <div className="flex gap-1">
                  <div className="h-4 w-10 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
                  <div className="h-4 w-10 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
                </div>
                <div className="h-3 bg-gray-100 dark:bg-white/5 rounded-full animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>

      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
            {searchQuery
              ? `Sin resultados para "${searchQuery}"`
              : "No hay productos disponibles"}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {searchQuery
              ? "Prueba con otros términos de búsqueda"
              : "Sé el primero en publicar un producto"}
          </p>
          <div className="flex gap-2 justify-center">
            {searchQuery && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                Limpiar búsqueda
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => navigate("create-product")}
              icon={<Plus className="h-3.5 w-3.5" />}
            >
              Publicar producto
            </Button>
          </div>
        </div>

      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              className="text-left rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] overflow-hidden hover:border-brand-500/20 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 active:scale-[0.98] flex flex-col"
            >
              <div className="aspect-square w-full bg-gray-100 dark:bg-white/5 relative overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <>
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="h-full w-full object-cover transform hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    {product.images.length > 1 && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                        <Camera className="h-2.5 w-2.5" />
                        {product.images.length}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="text-4xl opacity-60">
                      {getCategoryEmoji(product.category)}
                    </span>
                  </div>
                )}

                <div className="absolute bottom-2 left-2">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border backdrop-blur-sm ${getConditionStyle(product.condition)}`}>
                    {CONDITION_LABELS[product.condition] || product.condition}
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <h3 className="font-bold text-xs text-gray-900 dark:text-white line-clamp-2 leading-snug">
                    {product.title}
                  </h3>

                  <div className="flex items-baseline gap-1">
                    <p className="text-base font-black text-brand-500 leading-none">
                      ${product.priceUSD.toLocaleString("en-US")}
                    </p>
                    <span className="text-[9px] text-gray-400 font-medium">USD</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    {product.acceptedCryptos.slice(0, 4).map((c) => (
                      <span
                        key={c}
                        className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-semibold border border-gray-100 dark:border-white/[0.06]"
                      >
                        <CryptoIcon symbol={c} size={10} />
                        {c}
                      </span>
                    ))}
                    {product.acceptedCryptos.length > 4 && (
                      <span className="text-[9px] text-gray-400 font-medium">
                        +{product.acceptedCryptos.length - 4}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 text-[10px] text-gray-400 dark:text-gray-500 flex-1 min-w-0">
                      <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                      <span className="truncate">{product.location}</span>
                    </div>
                    {(product as any).homeDelivery && (
                      <div className="flex items-center gap-0.5 text-[9px] text-emerald-500 font-semibold flex-shrink-0">
                        <Truck className="h-2.5 w-2.5" />
                        Envío
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ═══ BOTÓN FLOTANTE ESCANEAR QR ══════════════════════ */}
      <button
        onClick={() => setShowScanner(true)}
        className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-2xl shadow-brand-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        title="Escanear QR de pago"
      >
        <QrCode className="h-6 w-6" />
      </button>

      {/* ═══ TOAST DE PAGO EXITOSO ═══════════════════════════ */}
      {paymentSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-3 rounded-2xl bg-emerald-500 text-white shadow-2xl animate-slide-up flex items-center gap-2">
          <span className="text-lg">🎉</span>
          <div>
            <p className="text-xs font-black">¡Pago exitoso!</p>
            <p className="text-[10px] opacity-90">Orden #{paymentSuccess.slice(-8)}</p>
          </div>
        </div>
      )}

      {/* ═══ ESCÁNER QR ══════════════════════════════════════ */}
      {showScanner && (
        <QRScanner
          onScan={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* ═══ MODAL DE PAGO ═══════════════════════════════════ */}
      {scannedData && (
        <PayWithQRModal
          data={scannedData}
          onClose={() => setScannedData(null)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
          }
