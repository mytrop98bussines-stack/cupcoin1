export type Language = "es" | "en";

const translations = {
  es: {
    // ═══ COMÚN ══════════════════════════════════════════════
    common: {
      save:      "Guardar",
      cancel:    "Cancelar",
      confirm:   "Confirmar",
      delete:    "Eliminar",
      edit:      "Editar",
      close:     "Cerrar",
      back:      "Volver",
      next:      "Siguiente",
      loading:   "Cargando...",
      search:    "Buscar",
      filter:    "Filtrar",
      all:       "Todos",
      yes:       "Sí",
      no:        "No",
      error:     "Error",
      success:   "Éxito",
      warning:   "Atención",
      continue:  "Continuar",
      verify:    "Verificar",
      buy:       "Comprar",
      sell:      "Vender",
      send:      "Enviar",
      receive:   "Recibir",
      copy:      "Copiar",
      copied:    "Copiado",
      share:     "Compartir",
      balance:   "Balance",
      price:     "Precio",
      amount:    "Cantidad",
      total:     "Total",
      publish:   "Publicar",
    },

    // ═══ NAV ════════════════════════════════════════════════
    nav: {
      dashboard:     "Inicio",
      p2p:           "P2P",
      marketplace:   "Marketplace",
      wallet:        "Wallet",
      profile:       "Perfil",
      settings:      "Ajustes",
      notifications: "Notificaciones",
    },

    // ═══ AUTH ═══════════════════════════════════════════════
    auth: {
      login:           "Iniciar sesión",
      register:        "Crear cuenta",
      logout:          "Cerrar sesión",
      email:           "Correo electrónico",
      password:        "Contraseña",
      name:            "Nombre completo",
      forgotPassword:  "¿Olvidaste tu contraseña?",
      createAccount:   "Crear cuenta gratis",
      alreadyAccount:  "Ya tengo cuenta",
    },

    // ═══ DASHBOARD ══════════════════════════════════════════
    dashboard: {
      greeting: {
        morning:   "Buenos días",
        afternoon: "Buenas tardes",
        evening:   "Buenas noches",
      },
      totalBalance:      "Balance total",
      myAssets:          "Mis activos",
      viewAll:           "Ver todo",
      market:            "Mercado",
      myTrades:          "Mis trades",
      myOrders:          "Mis anuncios",
      trades:            "trades",
      completed:         "completados",
      p2pActive:         "P2P activos",
      stellarWallet:     "Stellar Wallet",
      stellarDesc:       "Envía y recibe XLM al instante",
      noBalance:         "Sin saldo aún",
      depositToStart:    "Deposita cripto para empezar a operar",
      goToWallet:        "Ir a Wallet",
      exchange:          "Intercambiar",
      myWallet:          "Mi Wallet",
      kycAlert:          "Completa tu verificación KYC",
      kycAlertDesc:      "Verifica tu identidad para operar sin límites",
      publishFirstOffer: "Publica tu primera oferta P2P",
      publishFirstDesc:  "Compra o vende cripto sin comisiones",
    },

    // ═══ P2P ═════════════════════════════════════════════════
    p2p: {
      title:            "Mercado P2P",
      loading:          "Cargando...",
      ordersAvailable:  "órdenes disponibles",
      orderAvailable:   "orden disponible",
      buyTab:           "🟢 Comprar",
      sellTab:          "🔴 Vender",
      onlyVerified:     "Solo traders verificados",
      verifiedDesc:     "Traders con +20 trades y rating 4.5⭐",
      searchUser:       "Buscar usuario...",
      crypto:           "Criptomoneda",
      paymentMethod:    "Método de pago",
      clearFilters:     "Limpiar todos los filtros",
      noOrders:         "Sin órdenes disponibles",
      noOrdersDesc:     "Prueba cambiando los filtros o publica tu propia oferta.",
      publishOffer:     "Publicar oferta",
      startingTrade:    "Iniciando trade...",
      scanningOrders:   "Escaneando órdenes en la red...",
      yourAd:           "📌 Tu anuncio activo",
      buyCrypto:        "Comprar {{asset}}",
      sellCrypto:       "Vender {{asset}}",
    },

    // ═══ WALLET ══════════════════════════════════════════════
    wallet: {
      title:           "Mi Wallet",
      totalBalance:    "Balance total",
      myAssets:        "Mis activos",
      deposit:         "Depositar",
      withdraw:        "Retirar",
      history:         "Historial",
      swap:            "Intercambiar",
      scanQR:          "Escanear QR",
      depositAddress:  "Dirección de depósito",
      copyAddress:     "Copiar dirección",
      network:         "Red",
      warning:         "Envía solo {{asset}} a esta dirección",
    },

    // ═══ MARKETPLACE ════════════════════════════════════════
    marketplace: {
      title:           "Marketplace",
      productsAvail:   "productos disponibles",
      productAvail:    "producto disponible",
      publish:         "Publicar",
      search:          "Buscar productos, ubicación...",
      allCategories:   "Todos",
      noProducts:      "No hay productos disponibles.",
      beFirst:         "Sé el primero en publicar un producto",
      noResults:       "Sin resultados para",
      publishProduct:  "Publicar producto",
      delivery:        "Envío",
      categories: {
        all:         "Todos",
        phones:      "Teléfonos",
        computers:   "Computadoras",
        electronics: "Electrónica",
        clothing:    "Ropa",
        services:    "Servicios",
        home:        "Hogar",
        vehicles:    "Vehículos",
        other:       "Otros",
      },
    },

    // ═══ SETTINGS ═══════════════════════════════════════════
    settings: {
      title:           "Ajustes",
      profile:         "Mi Perfil",
      security:        "Seguridad",
      notifications:   "Notificaciones",
      language:        "Idioma",
      theme:           "Tema",
      darkMode:        "Modo oscuro",
      lightMode:       "Modo claro",
      help:            "Centro de ayuda",
      terms:           "Términos y Privacidad",
      about:           "Acerca de CUPCOIN",
      version:         "Versión",
      logout:          "Cerrar sesión",
    },

    // ═══ KYC ═════════════════════════════════════════════════
    kyc: {
      title:           "Verificación KYC",
      verified:        "Verificado",
      unverified:      "Sin verificar",
      pending:         "En revisión",
      rejected:        "Rechazado",
      startVerify:     "Verificar identidad",
      processing:      "Verificación en proceso...",
    },

    // ═══ LANGUAGE ═══════════════════════════════════════════
    language: {
      title:           "Idioma / Language",
      moreSoon:        "Más idiomas próximamente",
      spanish:         "Español",
      english:         "English",
      spanishDesc:     "Español (Cuba)",
      englishDesc:     "English (US)",
    },
  },

  en: {
    // ═══ COMMON ═════════════════════════════════════════════
    common: {
      save:      "Save",
      cancel:    "Cancel",
      confirm:   "Confirm",
      delete:    "Delete",
      edit:      "Edit",
      close:     "Close",
      back:      "Back",
      next:      "Next",
      loading:   "Loading...",
      search:    "Search",
      filter:    "Filter",
      all:       "All",
      yes:       "Yes",
      no:        "No",
      error:     "Error",
      success:   "Success",
      warning:   "Warning",
      continue:  "Continue",
      verify:    "Verify",
      buy:       "Buy",
      sell:      "Sell",
      send:      "Send",
      receive:   "Receive",
      copy:      "Copy",
      copied:    "Copied",
      share:     "Share",
      balance:   "Balance",
      price:     "Price",
      amount:    "Amount",
      total:     "Total",
      publish:   "Publish",
    },

    // ═══ NAV ════════════════════════════════════════════════
    nav: {
      dashboard:     "Home",
      p2p:           "P2P",
      marketplace:   "Marketplace",
      wallet:        "Wallet",
      profile:       "Profile",
      settings:      "Settings",
      notifications: "Notifications",
    },

    // ═══ AUTH ═══════════════════════════════════════════════
    auth: {
      login:           "Sign in",
      register:        "Create account",
      logout:          "Sign out",
      email:           "Email address",
      password:        "Password",
      name:            "Full name",
      forgotPassword:  "Forgot password?",
      createAccount:   "Create free account",
      alreadyAccount:  "I already have an account",
    },

    // ═══ DASHBOARD ══════════════════════════════════════════
    dashboard: {
      greeting: {
        morning:   "Good morning",
        afternoon: "Good afternoon",
        evening:   "Good evening",
      },
      totalBalance:      "Total balance",
      myAssets:          "My assets",
      viewAll:           "View all",
      market:            "Market",
      myTrades:          "My trades",
      myOrders:          "My listings",
      trades:            "trades",
      completed:         "completed",
      p2pActive:         "P2P active",
      stellarWallet:     "Stellar Wallet",
      stellarDesc:       "Send and receive XLM instantly",
      noBalance:         "No balance yet",
      depositToStart:    "Deposit crypto to start trading",
      goToWallet:        "Go to Wallet",
      exchange:          "Exchange",
      myWallet:          "My Wallet",
      kycAlert:          "Complete your KYC verification",
      kycAlertDesc:      "Verify your identity to trade without limits",
      publishFirstOffer: "Publish your first P2P offer",
      publishFirstDesc:  "Buy or sell crypto with no fees",
    },

    // ═══ P2P ═════════════════════════════════════════════════
    p2p: {
      title:            "P2P Market",
      loading:          "Loading...",
      ordersAvailable:  "orders available",
      orderAvailable:   "order available",
      buyTab:           "🟢 Buy",
      sellTab:          "🔴 Sell",
      onlyVerified:     "Verified traders only",
      verifiedDesc:     "Traders with +20 trades and rating 4.5⭐",
      searchUser:       "Search user...",
      crypto:           "Cryptocurrency",
      paymentMethod:    "Payment method",
      clearFilters:     "Clear all filters",
      noOrders:         "No orders available",
      noOrdersDesc:     "Try changing the filters or publish your own offer.",
      publishOffer:     "Publish offer",
      startingTrade:    "Starting trade...",
      scanningOrders:   "Scanning orders on the network...",
      yourAd:           "📌 Your active listing",
      buyCrypto:        "Buy {{asset}}",
      sellCrypto:       "Sell {{asset}}",
    },

    // ═══ WALLET ══════════════════════════════════════════════
    wallet: {
      title:           "My Wallet",
      totalBalance:    "Total balance",
      myAssets:        "My assets",
      deposit:         "Deposit",
      withdraw:        "Withdraw",
      history:         "History",
      swap:            "Swap",
      scanQR:          "Scan QR",
      depositAddress:  "Deposit address",
      copyAddress:     "Copy address",
      network:         "Network",
      warning:         "Send only {{asset}} to this address",
    },

    // ═══ MARKETPLACE ════════════════════════════════════════
    marketplace: {
      title:           "Marketplace",
      productsAvail:   "products available",
      productAvail:    "product available",
      publish:         "Publish",
      search:          "Search products, location...",
      allCategories:   "All",
      noProducts:      "No products available.",
      beFirst:         "Be the first to publish a product",
      noResults:       "No results for",
      publishProduct:  "Publish product",
      delivery:        "Delivery",
      categories: {
        all:         "All",
        phones:      "Phones",
        computers:   "Computers",
        electronics: "Electronics",
        clothing:    "Clothing",
        services:    "Services",
        home:        "Home",
        vehicles:    "Vehicles",
        other:       "Other",
      },
    },

    // ═══ SETTINGS ═══════════════════════════════════════════
    settings: {
      title:           "Settings",
      profile:         "My Profile",
      security:        "Security",
      notifications:   "Notifications",
      language:        "Language",
      theme:           "Theme",
      darkMode:        "Dark mode",
      lightMode:       "Light mode",
      help:            "Help Center",
      terms:           "Terms and Privacy",
      about:           "About CUPCOIN",
      version:         "Version",
      logout:          "Sign out",
    },

    // ═══ KYC ═════════════════════════════════════════════════
    kyc: {
      title:           "KYC Verification",
      verified:        "Verified",
      unverified:      "Unverified",
      pending:         "Under review",
      rejected:        "Rejected",
      startVerify:     "Verify identity",
      processing:      "Verification in process...",
    },

    // ═══ LANGUAGE ═══════════════════════════════════════════
    language: {
      title:           "Idioma / Language",
      moreSoon:        "More languages coming soon",
      spanish:         "Español",
      english:         "English",
      spanishDesc:     "Español (Cuba)",
      englishDesc:     "English (US)",
    },
  },
} as const;

// ─── Helper: obtiene valores anidados desde string ──────
function getNestedValue(obj: any, path: string): string {
  const keys = path.split(".");
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = result[key];
    } else {
      return path;
    }
  }
  return typeof result === "string" ? result : path;
}

// ─── Función standalone (retrocompatibilidad) ───────────
export function t(
  key: string,
  lang: Language = "es",
  params?: Record<string, string | number>
): string {
  let text = getNestedValue(translations[lang], key);

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{{${k}}}`, "g"), String(v));
    });
  }

  return text;
}

export { translations };
