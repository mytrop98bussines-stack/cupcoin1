export interface WalletData {
  address:    string;
  privateKey: string;
  mnemonic:   string;
}

export interface StoredWallet {
  address:          string;
  encryptedPrivKey: string;
  iv:               string;
}

export interface TokenBalance {
  symbol:   string;
  name:     string;
  balance:  string;
  amount:   number;
  usdValue: number;
  contract: string | null;
  decimals: number;
  logoUrl:  string;
}

export interface SendTokenParams {
  toAddress: string;
  amount:    string;
  symbol:    string;
  password:  string;
}

export interface TransactionResult {
  success:   boolean;
  txHash?:   string;
  explorer?: string;
  error?:    string;
}

export interface WalletState {
  address:      string | null;
  isUnlocked:   boolean;
  balances:     TokenBalance[];
  isLoadingBal: boolean;
}
