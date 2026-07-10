# CubaX — Plataforma Financiera Descentralizada para Cuba 🇨🇺
MIT License — Copyright (c) 2026 CubaX

> **La primera plataforma P2P de criptomonedas diseñada específicamente para el mercado cubano.**
> Sin VPN. Sin restricciones. Sin intermediarios.

---

## 🌐 Demo en vivo

**[cupcoin-b2b4f.web.app](https://cupcoin-b2b4f.web.app)**

---

## 🎯 El Problema que Resolvemos

Cuba enfrenta un sistema financiero con restricciones únicas en el mundo:

- **Bloqueada del sistema bancario internacional** — sin PayPal, Stripe, ni transferencias SWIFT
- **Sin acceso a exchanges globales** — Binance, Coinbase y la mayoría bloquean IPs cubanas
- **Inflación descontrolada** — el peso cubano pierde valor constantemente
- **Mercado informal sin protección** — las transacciones P2P se hacen sin escrow ni garantías
- **Firebase Auth bloqueada** — los servicios de Google están restringidos sin VPN

**CubaX resuelve todos estos problemas en una sola plataforma.**

---

## ✅ La Solución

CubaX es una aplicación web progresiva (PWA) que permite a los cubanos:

- Comprar y vender USDT de forma segura entre personas
- Publicar y comprar productos en un marketplace local
- Depositar y retirar criptomonedas sin necesidad de una exchange centralizada
- Verificar su identidad (KYC) para operar con confianza
- Todo esto **sin VPN y desde Cuba**

---

## 🏗️ Arquitectura Técnica
┌─────────────────────────────────────────────────────┐
│ USUARIO EN CUBA │
│ (Sin VPN, desde cualquier red) │
└──────────────────────┬──────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────┐
│ FRONTEND — Firebase Hosting │
│ React + TypeScript + Vite + Tailwind │
│ cupcoin-b2b4f.web.app │
└──────────────────────┬──────────────────────────────┘
│
┌────────────┼────────────┐
▼ ▼ ▼
┌──────────────┐ ┌──────────┐ ┌────────────────────┐
│ BACKEND │ │FIRESTORE │ │ TRONGRID API │
│ Render.com │ │(Database)│ │ (Red TRON/USDT) │
│ Node.js + │ │ │ │ │
│ TypeScript │ │ Reglas │ │ Depósitos TRC20 │
│ │ │ seguras │ │ Retiros USDT │
│ Auth Proxy │ │ │ │ Detección auto │
│ Trade Logic │ └──────────┘ └────────────────────┘
│ Marketplace │
│ Membresías │
└──────────────┘
---

## 🚀 Funcionalidades Implementadas

### 🔐 Autenticación sin VPN
- Sistema de auth propio via backend proxy en Render
- El backend llama a Firebase Auth desde el servidor (no bloqueado)
- Sesión persistente con JWT + refresh tokens
- Recuperación de contraseña funcional desde Cuba

### 💱 Mercado P2P
- Publicación de órdenes de compra/venta de USDT, BTC, ETH, USDC
- Sistema de escrow real — los fondos se bloquean hasta confirmar el pago
- Chat en tiempo real entre comprador y vendedor
- Soporte para Transfermóvil, Enzona y efectivo
- Filtros por cripto, método de pago y tipo de operación
- Modal para elegir cantidad con slider interactivo

### 🛡️ Sistema de Escrow
- El vendedor deposita los fondos en escrow antes del trade
- El comprador marca el pago como enviado
- El vendedor confirma y libera los fondos automáticamente
- Sistema de disputas con mediador admin
- Toda la lógica crítica procesada en el backend (Admin SDK)

### 🛍️ Marketplace
- Publicación de productos con hasta 5 imágenes (Cloudinary)
- **El producto NO desaparece al venderse** — stock ilimitado
- Contador de ventas por producto
- Opciones de entrega: recogida en persona o envío a domicilio
- Opciones de pago: antes de recibir, al recibir, o flexible
- Chat directo entre comprador y vendedor por producto
- El vendedor ve todas las conversaciones de sus productos

### 💰 Wallet con TronGrid
- Dirección USDT/TRC20 única generada por usuario
- Detección automática de depósitos cada 5 minutos
- Retiros via red TRON desde Hot Wallet
- Sin dependencia de exchanges centralizadas
- Generación de wallets 100% local (sin librerías externas)
- Compatible con TronLink, Trust Wallet y cualquier wallet TRC20

### 🪪 KYC (Verificación de Identidad)
- Formulario de 3 pasos con datos personales
- Subida de documentos a Cloudinary
- Panel admin para aprobar/rechazar solicitudes
- Notificaciones automáticas al usuario
- Requerido para publicar en P2P y Marketplace

### 👑 Sistema de Membresía
- Primer mes gratis automático al registrarse
- Pago mensual en USDT (desde el saldo de la wallet)
- Pago alternativo por Transfermóvil o Enzona con comprobante
- Admin aprueba comprobantes manualmente
- Precio editable desde el panel de admin
- Avisos automáticos 3 días antes de vencer
- Sin membresía: no puede publicar en P2P ni Marketplace

### 🔔 Notificaciones
- Sistema en tiempo real via Firestore
- Clickeables — navegan directo al trade, chat o sección relevante
- Tipos: trade, KYC, producto, membresía, sistema
- Badge de no leídas en tiempo real

### 👨‍💼 Panel de Administración
- **KYC**: Revisar documentos, aprobar o rechazar con motivo
- **Disputas**: Ver chat completo del trade, resolver a favor del comprador o vendedor con transferencia automática de fondos
- **Membresías**: Ver comprobantes de pago, aprobar o rechazar
- Dar membresía gratuita manualmente a cualquier usuario
- Editar precios de membresía en tiempo real
- Indicador en vivo de datos en tiempo real

### 📊 Historial
- Historial de trades P2P con filtros por tipo y estado
- **Historial de Marketplace** — compras y ventas separadas
- Acceso rápido a trades activos desde el historial
- Estadísticas de actividad del usuario

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| React | 18 | UI |
| TypeScript | 5 | Tipado |
| Vite | 7 | Build tool |
| Tailwind CSS | 4 | Estilos |
| Zustand | 4 | Estado global |
| Firebase SDK | 11 | Firestore + Auth cliente |
| Bun | Latest | Runtime y package manager |

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | 20 | Runtime |
| TypeScript | 5 | Tipado |
| Firebase Admin SDK | 14 | Firestore Admin |
| TronGrid API | v1 | Red TRON/USDT |
| esbuild | 0.27 | Bundler |
| Render.com | — | Hosting del backend |

### Infraestructura
| Servicio | Uso | Costo |
|---------|-----|-------|
| Firebase Hosting | Frontend PWA | Gratis |
| Firebase Firestore | Base de datos en tiempo real | Gratis (tier) |
| Render.com | Backend Node.js | Gratis (tier) |
| TronGrid | API red TRON | Gratis hasta 100k req/día |
| Cloudinary | Imágenes KYC y productos | Gratis (tier) |
| **Total mensual** | | **$0** |

---

## 🔒 Seguridad

### Arquitectura de seguridad

Frontend (usuario)
│
├── Firestore rules → solo lee/escribe sus propios datos
├── Custom token Firebase → autenticado via backend
└── JWT tokens → sesión persistente sin cookies

Backend (Admin SDK)
│
├── Bypasea reglas de Firestore → operaciones críticas seguras
├── Escrow logic → fondos nunca en control del usuario
├── Validaciones → verifica identidad en cada operación
└── Claves privadas → encriptadas con AES-256

Wallets
│
├── wallets_private/ → colección Firestore solo accesible por backend
├── Claves privadas encriptadas con AES-256-CBC
└── Hot wallet → clave privada solo en variables de entorno de Render

### Reglas de Firestore
- Cada usuario solo puede leer/escribir sus propios documentos
- Wallets privadas: acceso `false` desde el cliente (solo backend)
- Trades: solo participantes pueden ver los mensajes
- Config: solo admin puede modificar precios

---

## 📱 Diseño y UX

- **Mobile-first** — diseñado para móviles desde el principio
- **PWA** — instalable como app nativa en Android e iOS
- **Modo oscuro** — soporte completo con detección automática
- **Sin VPN** — funciona desde la red cubana sin configuración adicional
- **Scroll nativo** — sin el "pegado" típico de apps web en móvil
- **Safe areas** — compatible con notch y home bar de iPhone

---

## 🗺️ Roadmap

### ✅ Completado (v1.0)
- [x] Auth sin VPN via backend proxy
- [x] Mercado P2P con escrow real
- [x] Marketplace con chat bidireccional
- [x] Wallet USDT/TRC20 con TronGrid
- [x] KYC con revisión admin
- [x] Sistema de membresía
- [x] Panel admin completo
- [x] Notificaciones en tiempo real clickeables
- [x] Historial de trades y marketplace
- [x] Sistema de disputas con resolución admin

### 🔄 En desarrollo (v1.1)
- [ ] Sistema de rating entre usuarios
- [ ] Soporte para BTC y ETH
- [ ] Notificaciones push nativas (FCM)
- [ ] Exportar historial en PDF
- [ ] Modo vendedor con dashboard de ventas

### 🔮 Futuro (v2.0)
- [ ] App nativa Android/iOS
- [ ] Integración con bancos cubanos
- [ ] Sistema de préstamos P2P
- [ ] Tarjeta prepagada virtual
- [ ] API pública para desarrolladores

---

## 💡 Por qué CubaX es diferente

| Característica | CubaX | Exchanges tradicionales | Grupos Telegram |
|---------------|-------|------------------------|-----------------|
| Funciona en Cuba sin VPN | ✅ | ❌ | ✅ |
| Escrow automático | ✅ | ✅ | ❌ |
| KYC verificado | ✅ | ✅ | ❌ |
| Chat integrado | ✅ | ❌ | ✅ |
| Marketplace de productos | ✅ | ❌ | ❌ |
| Sin custodia centralizada | ✅ | ❌ | ✅ |
| Wallet propia | ✅ | ❌ | ❌ |
| Costo mensual | $0 infra | Variable | $0 |

---

## 👥 Equipo

| Rol | Descripción |
|-----|-------------|
| **Fundador / Full Stack** | Arquitectura, backend, frontend, infraestructura |
| **Comunidad Cuba** | Beta testers y primeros usuarios |

---

## 📊 Métricas del Proyecto
Líneas de código: ~15,000+
Componentes React: 50+
Endpoints backend: 20+
Colecciones Firestore: 12
Tiempo de desarrollo: 3 meses
Costo de infraestructura: $0/mes

Hecho con ❤️ para Cuba

CubaX no está afiliado con ningún gobierno ni entidad financiera regulada.
El uso de esta plataforma es responsabilidad del usuario
