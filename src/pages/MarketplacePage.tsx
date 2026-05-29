import { useState, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  MOCK_PRODUCTS,
  CONDITION_LABELS,
} from "@/data/mock";
import {
  Search,
  Plus,
  MapPin,
  Filter,
  ShoppingBag,
} from "lucide-react";
import type { ProductCategory } from "@/types";

export function MarketplacePage() {
  const { navigate, setSelectedProductId } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const products = MOCK_PRODUCTS;

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
      {filteredProducts.length === 0 ? (
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
              className="overflow-hidden"
              onClick={() => handleProductClick(product.id)}
            >
              {/* Image Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/5 dark:to-white/[0.02] flex items-center justify-center">
                <div className="text-center">
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
                      : "📦"}
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-1.5">
                <h3 className="font-semibold text-xs text-gray-900 dark:text-white line-clamp-2 leading-tight">
                  {product.title}
                </h3>
                <p className="text-sm font-bold text-brand-500">
                  ${product.priceUSD.toLocaleString("en-US")}
                </p>
                <div className="flex items-center gap-1">
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
                  <MapPin className="h-2.5 w-2.5" />
                  {product.location}
                </div>
                <Badge
                  variant={product.condition === "new" ? "success" : "default"}
                  size="sm"
                >
                  {CONDITION_LABELS[product.condition]}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
