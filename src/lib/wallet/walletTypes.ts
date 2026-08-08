// ─── Tipos para el sistema de wallet no custodia ──────────

export interface WalletData {
  address:    string;   // Dirección pública (se guarda en Firebase)
  privateKey: string;   // Clave privada (NUNCA sale del dispositivo)
  mnemonic:   string;   // 12 palabras (el usuario las anota)
}

export interface StoredWallet {
  address:          string;   // Pública - ok guardar
  encryptedPrivKey: string;   // Cifrada con password del usuario
  iv:               string;   // Vector de inicialización del cifrado
}

export interface TokenBalance {
  symbol:   string;
  name:     string;
  balance:  string;
  usdValue: number;
  contract: string | null;  // null = moneda nativa
  decimals: number;
  logoUrl:  string;
}

export interface SendTokenParams {
  toAddress: string;
  amount:    string;
  symbol:    "MATIC" | "USDT" | "USDC";
  password:  string;   // Para descifrar la private key
}

export interface TransactionResult {
  success:  boolean;
  txHash?:  string;
  explorer?: string;
  error?:   string;
}

export interface WalletState {
  address:       string | null;
  isUnlocked:    boolean;   // Si el usuario ingresó su password en esta sesión
  balances:      TokenBalance[];
  isLoadingBal:  boolean;
}
