import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";

const BACKEND_URL = "https://cubax-backend.onrender.com/api";

// ─── Detectar soporte ────────────────────────────────────
export function isBiometricSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.PublicKeyCredential &&
    navigator.credentials &&
    typeof navigator.credentials.create === "function");
}

// ─── Detectar tipo de biometría del dispositivo ──────────
export async function getBiometricType(): Promise<string> {
  if (!isBiometricSupported()) return "biometría";

  try {
    const available = await (window.PublicKeyCredential as any)
      .isUserVerifyingPlatformAuthenticatorAvailable();

    if (!available) return "biometría";

    const ua = navigator.userAgent.toLowerCase();

    if (/iphone|ipad/.test(ua))         return "Face ID / Touch ID";
    if (/android/.test(ua))             return "huella dactilar";
    if (/macintosh/.test(ua))           return "Touch ID";
    if (/windows/.test(ua))             return "Windows Hello";

    return "biometría";
  } catch {
    return "biometría";
  }
}

// ─── Registrar biometría ─────────────────────────────────
export async function registerBiometric(): Promise<{
  success: boolean;
  error?:  string;
}> {
  try {
    const token = localStorage.getItem("cubax_token");

    console.log("🔐 [Register] Solicitando opciones...");
    const optionsRes = await fetch(`${BACKEND_URL}/biometric/register/options`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const optionsData = await optionsRes.json();
    console.log("🔐 [Register] Opciones recibidas:", optionsData);

    if (!optionsData.success) {
      return { success: false, error: optionsData.error };
    }

    console.log("🔐 [Register] Iniciando prompt biométrico...");
    const response = await startRegistration({ optionsJSON: optionsData.options });
    console.log("🔐 [Register] Respuesta del navegador:", response);

    const deviceName = navigator.userAgent.match(/\((.*?)\)/)?.[1]?.split(";")[0]?.trim() || "Este dispositivo";

    console.log("🔐 [Register] Verificando en el servidor...");
    const verifyRes = await fetch(`${BACKEND_URL}/biometric/register/verify`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify({ response, deviceName }),
    });
    const verifyData = await verifyRes.json();
    console.log("🔐 [Register] Verificación:", verifyData);

    return { success: verifyData.success, error: verifyData.error };
  } catch (err: any) {
    console.error("❌ [Register] Error:", err);
    if (err.name === "NotAllowedError") {
      return { success: false, error: "Cancelado o rechazado" };
    }
    return { success: false, error: err.message || "Error registrando biometría" };
  }
}

// ─── Autenticar con biometría ────────────────────────────
export async function authenticateBiometric(uid: string): Promise<{
  success: boolean;
  data?:   any;
  error?:  string;
}> {
  try {
    console.log("🔓 [Auth] Iniciando autenticación con UID:", uid);

    // 1. Obtener opciones
    console.log("🔓 [Auth] Solicitando opciones al backend...");
    const optionsRes = await fetch(`${BACKEND_URL}/biometric/authenticate/options`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ uid }),
    });

    console.log("🔓 [Auth] Status:", optionsRes.status);
    const optionsData = await optionsRes.json();
    console.log("🔓 [Auth] Opciones recibidas:", optionsData);

    if (!optionsData.success) {
      console.error("❌ [Auth] Error en opciones:", optionsData.error);
      return { success: false, error: optionsData.error };
    }

    // 2. Iniciar autenticación con el navegador
    console.log("🔓 [Auth] Lanzando prompt biométrico...");
    const response = await startAuthentication({ optionsJSON: optionsData.options });
    console.log("🔓 [Auth] Respuesta del navegador:", response);

    // 3. Verificar
    console.log("🔓 [Auth] Verificando en el servidor...");
    const verifyRes = await fetch(`${BACKEND_URL}/biometric/authenticate/verify`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ uid, response }),
    });
    const verifyData = await verifyRes.json();
    console.log("🔓 [Auth] Verificación completada:", verifyData);

    if (verifyData.success) {
      return { success: true, data: verifyData };
    } else {
      return { success: false, error: verifyData.error };
    }
  } catch (err: any) {
    console.error("❌ [Auth] Error completo:", err);
    console.error("❌ [Auth] Nombre del error:", err.name);
    console.error("❌ [Auth] Mensaje:", err.message);

    if (err.name === "NotAllowedError") {
      return { success: false, error: "Cancelado o rechazado" };
    }
    return { success: false, error: err.message || "Error autenticando" };
  }
}

// ─── Obtener estado ──────────────────────────────────────
export async function getBiometricStatus() {
  try {
    const token = localStorage.getItem("cubax_token");
    const res   = await fetch(`${BACKEND_URL}/biometric/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { success: false, enabled: false, devices: [] };
  }
}

// ─── Eliminar biometría ──────────────────────────────────
export async function removeBiometric(deviceId?: string) {
  try {
    const token = localStorage.getItem("cubax_token");
    const res   = await fetch(`${BACKEND_URL}/biometric/remove`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:  `Bearer ${token}`,
      },
      body: JSON.stringify(deviceId ? { deviceId } : {}),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
