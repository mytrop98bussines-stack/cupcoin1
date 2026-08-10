// ─── Claves de localStorage ───────────────────────────────
const WALLET_KEY    = "cubax_wallet_enc";
const ADDRESSES_KEY = "cubax_wallet_addresses";

// =========================================================
// CIFRADO AES-GCM (nativo del navegador)
// =========================================================
async function encrypt(
  text:     string,
  password: string
): Promise<{ encrypted: string; iv: string }> {
  const encoder     = new TextEncoder();
  const salt        = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );
  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(text)
  );

  const combined = new Uint8Array([
    ...salt,
    ...iv,
    ...new Uint8Array(encrypted),
  ]);

  return {
    encrypted: btoa(String.fromCharCode(...combined)),
    iv:        btoa(String.fromCharCode(...iv)),
  };
}

async function decrypt(
  encryptedData: string,
  password:      string
): Promise<string> {
  const encoder  = new TextEncoder();
  const combined = Uint8Array.from(
    atob(encryptedData),
    (c) => c.charCodeAt(0)
  );

  const salt      = combined.slice(0, 16);
  const iv        = combined.slice(16, 28);
  const encrypted = combined.slice(28);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

// =========================================================
// WALLET CIFRADA
// =========================================================
export async function saveWalletEncrypted(
  address:    string,
  privateKey: string,
  mnemonic:   string,
  password:   string
): Promise<void> {
  const payload       = JSON.stringify({ privateKey, mnemonic });
  const { encrypted } = await encrypt(payload, password);

  const stored = {
    address,
    encryptedData: encrypted,
    createdAt:     Date.now(),
  };

  localStorage.setItem(WALLET_KEY, JSON.stringify(stored));
  console.log("✅ [Wallet] Guardada cifrada en dispositivo");
}

export async function loadWalletPrivateKey(password: string): Promise<{
  address:    string;
  privateKey: string;
  mnemonic:   string;
} | null> {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) return null;

    const stored            = JSON.parse(raw);
    const decrypted         = await decrypt(stored.encryptedData, password);
    const { privateKey, mnemonic } = JSON.parse(decrypted);

    return { address: stored.address, privateKey, mnemonic };
  } catch {
    console.error("❌ [Wallet] Password incorrecta o wallet corrupta");
    return null;
  }
}

export function getStoredWalletAddress(): string | null {
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    return stored.address || null;
  } catch {
    return null;
  }
}

export function hasStoredWallet(): boolean {
  return !!localStorage.getItem(WALLET_KEY);
}

export function clearStoredWallet(): void {
  localStorage.removeItem(WALLET_KEY);
  localStorage.removeItem(ADDRESSES_KEY);
  console.log("🗑️ [Wallet] Eliminada del dispositivo");
}

// =========================================================
// DIRECCIONES MULTI-RED (públicas, sin cifrado)
// =========================================================
export interface StoredAddresses {
  evm:       string;   // Polygon, ETH, BSC (0x...)
  tron:      string;   // Tron (T...)
  bitcoin:   string;   // Bitcoin (bc1...)
  savedAt:   number;
}

export function saveWalletAddresses(addresses: {
  evm:     string;
  tron:    string;
  bitcoin: string;
}): void {
  const data: StoredAddresses = {
    ...addresses,
    savedAt: Date.now(),
  };
  localStorage.setItem(ADDRESSES_KEY, JSON.stringify(data));
  console.log("✅ [Wallet] Direcciones multi-red guardadas");
}

export function getWalletAddresses(): StoredAddresses | null {
  try {
    const raw = localStorage.getItem(ADDRESSES_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasWalletAddresses(): boolean {
  return !!localStorage.getItem(ADDRESSES_KEY);
}

export function clearWalletAddresses(): void {
  localStorage.removeItem(ADDRESSES_KEY);
  }
