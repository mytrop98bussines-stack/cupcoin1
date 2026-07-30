export type Language = "es" | "en";

const translations = {
  es: {
    // Añadir a la sección "es"
landing: {
  loginBtn:            "Iniciar Sesión",
  badge:               "En desarrollo activo · Únete a la lista de espera",
  heroTitle1:          "Cripto para",
  heroTitle2:          "Cuba",
  heroTitle3:          ", sin",
  heroTitle4:          "fronteras",
  heroDesc:            "Compra, vende e intercambia criptomonedas de forma segura con métodos de pago cubanos. Todo protegido por contratos inteligentes.",
  trust: {
    encrypted:  "Transacciones cifradas",
    escrow:     "Escrow automático",
    support:    "Soporte 24/7",
  },
  cta: {
    createFree:      "Crear cuenta gratis",
    haveAccount:     "Ya tengo cuenta",
  },
  livePrices:          "Precios en vivo",
  featuresTitle:       "Todo lo que necesitas",
  featuresSubtitle:    "Una plataforma completa para el mercado cubano",
  features: {
    p2pTitle:        "P2P Sin Límites",
    p2pDesc:         "Compra y vende cripto con Transfermóvil, EnZona y efectivo",
    escrowTitle:     "Escrow Seguro",
    escrowDesc:      "Fondos protegidos en contrato inteligente durante el trade",
    marketTitle:     "Marketplace",
    marketDesc:      "Compra productos reales pagando con criptomonedas",
    fastTitle:       "Ultra Rápido",
    fastDesc:        "Optimizado para redes 3G/4G del mercado cubano",
    realTimeTitle:   "Precios en Tiempo Real",
    realTimeDesc:    "Cotizaciones globales de CoinGecko actualizadas al instante",
    kycTitle:        "Verificación KYC",
    kycDesc:         "Sistema de identidad seguro para operar sin restricciones",
  },
  community: {
    badge:        "Fase de desarrollo activo",
    title:        "¿Quieres ser parte del primer P2P cubano?",
    desc:         "Creado por un emprendedor cubano que entiende las necesidades reales de la isla.",
    waitlist:     "Lista de espera",
    waitlistDesc: "Sé de los primeros en usar la app",
    investors:    "Inversores ángeles",
    investorsDesc: "Únete a un proyecto con impacto real",
    community:    "Comunidad",
    communityDesc: "Comparte tu feedback y crece con nosotros",
    writeMe:      "Escríbeme directamente:",
  },
  footer: {
    madeIn:     "Hecho con ❤️ en Cuba, para Cuba 🇨🇺",
    rights:     "© 2026 CupCoin. Todos los derechos reservados.",
    terms:      "Términos",
    privacy:    "Privacidad",
    support:    "Soporte",
  },
},
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
    // Añadir a la sección "en"
landing: {
  loginBtn:            "Sign in",
  badge:               "In active development · Join the waitlist",
  heroTitle1:          "Crypto for",
  heroTitle2:          "Cuba",
  heroTitle3:          ", without",
  heroTitle4:          "borders",
  heroDesc:            "Buy, sell and exchange cryptocurrencies safely with Cuban payment methods. All protected by smart contracts.",
  trust: {
    encrypted:  "Encrypted transactions",
    escrow:     "Automatic escrow",
    support:    "24/7 Support",
  },
  cta: {
    createFree:      "Create free account",
    haveAccount:     "I already have an account",
  },
  livePrices:          "Live prices",
  featuresTitle:       "Everything you need",
  featuresSubtitle:    "A complete platform for the Cuban market",
  features: {
    p2pTitle:        "Unlimited P2P",
    p2pDesc:         "Buy and sell crypto with Transfermóvil, EnZona and cash",
    escrowTitle:     "Secure Escrow",
    escrowDesc:      "Funds protected by smart contract during the trade",
    marketTitle:     "Marketplace",
    marketDesc:      "Buy real products paying with cryptocurrencies",
    fastTitle:       "Ultra Fast",
    fastDesc:        "Optimized for 3G/4G networks in the Cuban market",
    realTimeTitle:   "Real-Time Prices",
    realTimeDesc:    "Global quotes from CoinGecko updated instantly",
    kycTitle:        "KYC Verification",
    kycDesc:         "Secure identity system to operate without restrictions",
  },
  community: {
    badge:        "Active development phase",
    title:        "Want to be part of the first Cuban P2P?",
    desc:         "Created by a Cuban entrepreneur who understands the real needs of the island.",
    waitlist:     "Waitlist",
    waitlistDesc: "Be among the first to use the app",
    investors:    "Angel investors",
    investorsDesc: "Join a project with real impact",
    community:    "Community",
    communityDesc: "Share your feedback and grow with us",
    writeMe:      "Write to me directly:",
  },
  footer: {
    madeIn:     "Made with ❤️ in Cuba, for Cuba 🇨🇺",
    rights:     "© 2026 CupCoin. All rights reserved.",
    terms:      "Terms",
    privacy:    "Privacy",
    support:    "Support",
  },
},
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
