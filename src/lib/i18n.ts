export type Language = "es" | "en";

const translations = {
  es: {
    // ─── Navegación ───────────────────────────────────────
    dashboard:    "Inicio",
    p2p:          "P2P",
    marketplace:  "Marketplace",
    wallet:       "Wallet",
    settings:     "Ajustes",

    // ─── Auth ─────────────────────────────────────────────
    login:        "Iniciar sesión",
    register:     "Crear cuenta",
    logout:       "Cerrar sesión",
    email:        "Correo electrónico",
    password:     "Contraseña",
    name:         "Nombre completo",

    // ─── P2P ──────────────────────────────────────────────
    buy:          "Comprar",
    sell:         "Vender",
    amount:       "Cantidad",
    price:        "Precio",
    publish:      "Publicar",

    // ─── Marketplace ──────────────────────────────────────
    search:       "Buscar productos...",
    allCategories: "Todos",
    noProducts:   "No hay productos disponibles.",

    // ─── Wallet ───────────────────────────────────────────
    deposit:      "Depositar",
    withdraw:     "Retirar",
    balance:      "Balance",
    history:      "Historial",

    // ─── General ──────────────────────────────────────────
    loading:      "Cargando...",
    error:        "Error",
    success:      "Éxito",
    cancel:       "Cancelar",
    confirm:      "Confirmar",
    save:         "Guardar",
    back:         "Volver",
    next:         "Siguiente",
    yes:          "Sí",
    no:           "No",
  },
  en: {
    // ─── Navegación ───────────────────────────────────────
    dashboard:    "Home",
    p2p:          "P2P",
    marketplace:  "Marketplace",
    wallet:       "Wallet",
    settings:     "Settings",

    // ─── Auth ─────────────────────────────────────────────
    login:        "Sign in",
    register:     "Create account",
    logout:       "Sign out",
    email:        "Email address",
    password:     "Password",
    name:         "Full name",

    // ─── P2P ──────────────────────────────────────────────
    buy:          "Buy",
    sell:         "Sell",
    amount:       "Amount",
    price:        "Price",
    publish:      "Publish",

    // ─── Marketplace ──────────────────────────────────────
    search:       "Search products...",
    allCategories: "All",
    noProducts:   "No products available.",

    // ─── Wallet ───────────────────────────────────────────
    deposit:      "Deposit",
    withdraw:     "Withdraw",
    balance:      "Balance",
    history:      "History",

    // ─── General ──────────────────────────────────────────
    loading:      "Loading...",
    error:        "Error",
    success:      "Success",
    cancel:       "Cancel",
    confirm:      "Confirm",
    save:         "Save",
    back:         "Back",
    next:         "Next",
    yes:          "Yes",
    no:           "No",
  },
} as const;

export type TranslationKey = keyof typeof translations.es;

export function t(key: TranslationKey, lang: Language = "es"): string {
  return translations[lang][key] || translations.es[key] || key;
}
