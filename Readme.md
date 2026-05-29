# 🇨🇺 CubaX — Plataforma P2P & Crypto para Cuba

> Plataforma integral de finanzas, P2P y comercio cripto diseñada para el mercado cubano. Mobile-First, optimizada para redes 3G/4G.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-MVP%20Demo-orange)

---

## ✅ Estado Actual del Proyecto
La aplicación cuenta con toda la interfaz funcional, navegación y lógica de estado (Zustand) con datos mock listos para conectar a servicios reales.

### Implementado:
- **Auth:** Login/Registro optimizado.
- **P2P:** Mercado completo, filtros y creación de órdenes.
- **Trade:** Chat en tiempo real y flujo de Escrow.
- **Marketplace:** Catálogo de productos con pago cripto.
- **KYC:** Verificación de identidad multi-paso segura.
- **Wallet:** Interfaz de conexión Web3 (AppKit).

---

## 🚧 Requisitos para Producción Real

### 1. Firebase (Backend & Auth)
- Crear proyecto en Firebase Console.
- Habilitar Auth (Google/Email), Firestore y Functions.
- Implementar los hooks de `src/lib/firebase/auth.ts`.

### 2. Cloudinary (Media)
- Configurar cuenta y obtener API Keys.
- Implementar subidas firmadas (Signed Uploads) para documentos KYC y fotos de productos.

### 3. Web3 / Blockchain
- Desplegar el contrato `CubaXEscrow.sol` (incluido en este README) en Polygon (Mainnet o Amoy).
- Configurar el Project ID de WalletConnect (AppKit).

---

## 🚀 Despliegue Rápido

1. **Instalar dependencias:**
   ```bash
   npm install