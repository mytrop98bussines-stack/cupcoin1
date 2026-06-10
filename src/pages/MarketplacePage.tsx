import { useState, useMemo, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import {
  CONDITION_LABELS,
} from "@/data/mock";
import {
  Search,
  Plus,
  MapPin,
  Filter,
  ShoppingBag,
} from "lucide-react";
import type { ProductCategory, Product } from "@/types";

export function MarketplacePage() {
  const { navigate, setSelectedProductId, products, setProducts } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // ==========================================
  // ESCUCHADOR EN TIEMPO REAL DESDE FIRESTORE
  // ==========================================
  useEffect(() => {
    setLoadingProducts(true);

    // Consultamos los productos activos ordenados por los más recientes
    const q = query(
      collection(db, "products"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveProducts: Product[] = [];
      snapshot.forEach((doc) => {
        // Aseguramos capturar el ID real del documento por si acaso
        liveProducts.push({ id: doc.id, ...doc.data() } as Product);
      });

      // Guardamos la lista real en el store global de Zustand
      setProducts(liveProducts);
      setLoadingProducts(false);
    }, (error) => {
      console.error("Error cargando el marketplace desde Firestore:", error);
      setLoadingProducts(false); // 🛠️ Corregido: antes decía setLoadingOrders
    });

    return () => unsubscribe();
  }, [setProducts]);

  // ==========================================
  // FILTRADO LOCAL (MANTENIENDO TU LÓGICA)
  // ==========================================
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.status !== "active") return false;
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (
        searchQuery &&
        !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleProductClick = (productId: string) => {
    setSelectedProductId(productId);
    navigate("product-detail");
  };

  const categories: { value: ProductCategory | "all"; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "phones", label: "📱 Teléfonos" },
    { value: "computers", label: "💻 Computadoras" },
    { value: "electronics", label: "🔌 Electrónica" },
    { value: "clothing", label: "👕 Ropa" },
    { value: "services", label: "🛠 Servicios" },
    { value: "home", label: "🏠 Hogar" },
    { value: "vehicles", label: "🚗 Vehículos" },
    { value: "other", label: "📦 Otros" },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-4 pb-24 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            Marketplace
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Compra con cripto, entrega en persona
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

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition-colors ${
            showFilters
              ? "border-brand-500 bg-brand-500/10 text-brand-500"
              : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400"
          }`}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {/* Categories Horizontal Scroll */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === cat.value
                ? "bg-brand-500 text-white"
                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loadingProducts ? (
        <div className="text-center py-12">
          <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-gray-400">Escaneando ofertas en el Marketplace...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card padding="lg" className="text-center">
          <ShoppingBag className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay productos disponibles.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              hover
              padding="none"
              className="overflow-hidden cursor-pointer flex flex-col justify-between"
              onClick={() => handleProductClick(product.id)}
            >
              {/* 📸 RENDERIZACIÓN REAL DE IMAGEN CLOUDINARY */}
              <div className="aspect-square w-full bg-gray-100 dark:bg-white/5 relative overflow-hidden flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]} // Muestra la primera foto subida
                    alt={product.title}
                    className="h-full w-full object-cover transform hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  // Respaldo de seguridad con emoji si el producto viene sin foto
                  <span className="text-3xl">
                    {product.category === "phones"
                      ? "📱"
                      : product.category === "computers"
                      ? "💻"
                      : product.category === "electronics"
                      ? "🔌"
                      : product.category === "services"
                      ? "🛠"
                      : product.category === "clothing"
                      ? "👕"
                      : product.category === "home"
                      ? "🏠"
                      : product.category === "vehicles"
                      ? "🚗"
                      : "📦"}
                  </span>
                )}
              </div>

              <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-2 leading-tight">
                    {product.title}
                  </h3>
                  <p className="text-sm font-bold text-brand-500">
                    ${product.priceUSD.toLocaleString("en-US")}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex flex-wrap gap-1">
                    {product.acceptedCryptos.slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500">
                    <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
                    <span className="truncate">{product.location}</span>
                  </div>
                  <div className="pt-0.5">
                    <Badge
                      variant={product.condition === "new" ? "success" : "default"}
                      size="sm"
                    >
                      {CONDITION_LABELS[product.condition] || product.condition}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
            }
