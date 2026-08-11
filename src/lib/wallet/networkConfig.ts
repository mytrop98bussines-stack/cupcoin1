import type { Network, TokenInfo } from "./walletTypes";

// =========================================================
// REDES SOPORTADAS
// =========================================================
export const NETWORKS: Record<string, Network> = {
  polygon: {
    id:         "polygon",
    name:       "Polygon",
    shortName:  "MATIC",
    nativeCoin: "MATIC",
    chainId:    137,
    rpcUrls: [
      // ✅ Estos son los más confiables y sin rate limit
      "https://polygon-bor-rpc.publicnode.com",
      "https://polygon.llamarpc.com",
      "https://polygon-rpc.com",
      "https://rpc-mainnet.matic.quiknode.pro",
    ],
    explorerUrl: "https://polygonscan.com",
    logoUrl:     "/crypto/matic.svg",
    color:       "#8247E5",
  },

  ethereum: {
    id:         "ethereum",
    name:       "Ethereum",
    shortName:  "ETH",
    nativeCoin: "ETH",
    chainId:    1,
    rpcUrls: [
      "https://eth.llamarpc.com",
      "https://ethereum.publicnode.com",
      "https://rpc.ankr.com/eth",
    ],
    explorerUrl: "https://etherscan.io",
    logoUrl:     "/crypto/eth.svg",
    color:       "#627EEA",
  },

  bsc: {
    id:         "bsc",
    name:       "BNB Smart Chain",
    shortName:  "BSC",
    nativeCoin: "BNB",
    chainId:    56,
    rpcUrls: [
      "https://bsc.llamarpc.com",
      "https://bsc-dataseed1.binance.org",
      "https://bsc-dataseed2.binance.org",
    ],
    explorerUrl: "https://bscscan.com",
    logoUrl:     "/crypto/bnb.svg",
    color:       "#F3BA2F",
  },

  tron: {
    id:         "tron",
    name:       "Tron",
    shortName:  "TRX",
    nativeCoin: "TRX",
    rpcUrls:    ["https://api.trongrid.io"],
    explorerUrl: "https://tronscan.org",
    logoUrl:     "/crypto/trx.svg",
    color:       "#EF0027",
  },

  bitcoin: {
    id:         "bitcoin",
    name:       "Bitcoin",
    shortName:  "BTC",
    nativeCoin: "BTC",
    rpcUrls:    ["https://blockstream.info/api"],
    explorerUrl: "https://mempool.space",
    logoUrl:     "/crypto/btc.svg",
    color:       "#F7931A",
  },
};

// =========================================================
// TOKENS POR RED
// =========================================================
export const TOKENS: TokenInfo[] = [
  // ─── Polygon ─────────────────────────────────────────
  {
    symbol:      "MATIC",
    name:        "Polygon",
    contract:    null,
    decimals:    18,
    logoUrl:     "/crypto/matic.svg",
    networkId:   "polygon",
    coingeckoId: "matic-network",
  },
  {
    symbol:      "USDT",
    name:        "Tether USD",
    contract:    "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals:    6,
    logoUrl:     "/crypto/usdt.svg",
    networkId:   "polygon",
    coingeckoId: "tether",
  },
  {
    symbol:      "USDC",
    name:        "USD Coin",
    contract:    "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals:    6,
    logoUrl:     "/crypto/usdc.svg",
    networkId:   "polygon",
    coingeckoId: "usd-coin",
  },
  {
    symbol:      "ETH",
    name:        "Ethereum (Bridged)",
    contract:    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    decimals:    18,
    logoUrl:     "/crypto/eth.svg",
    networkId:   "polygon",
    coingeckoId: "ethereum",
  },
  {
    symbol:      "WBTC",
    name:        "Bitcoin (Bridged)",
    contract:    "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    decimals:    8,
    logoUrl:     "/crypto/btc.svg",
    networkId:   "polygon",
    coingeckoId: "wrapped-bitcoin",
  },

  // ─── Ethereum ─────────────────────────────────────────
  {
    symbol:      "ETH",
    name:        "Ethereum",
    contract:    null,
    decimals:    18,
    logoUrl:     "/crypto/eth.svg",
    networkId:   "ethereum",
    coingeckoId: "ethereum",
  },
  {
    symbol:      "USDT",
    name:        "Tether USD",
    contract:    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals:    6,
    logoUrl:     "/crypto/usdt.svg",
    networkId:   "ethereum",
    coingeckoId: "tether",
  },
  {
    symbol:      "USDC",
    name:        "USD Coin",
    contract:    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals:    6,
    logoUrl:     "/crypto/usdc.svg",
    networkId:   "ethereum",
    coingeckoId: "usd-coin",
  },

  // ─── BSC ──────────────────────────────────────────────
  {
    symbol:      "BNB",
    name:        "BNB",
    contract:    null,
    decimals:    18,
    logoUrl:     "/crypto/bnb.svg",
    networkId:   "bsc",
    coingeckoId: "binancecoin",
  },
  {
    symbol:      "USDT",
    name:        "Tether USD",
    contract:    "0x55d398326f99059fF775485246999027B3197955",
    decimals:    18,
    logoUrl:     "/crypto/usdt.svg",
    networkId:   "bsc",
    coingeckoId: "tether",
  },
  {
    symbol:      "BUSD",
    name:        "Binance USD",
    contract:    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    decimals:    18,
    logoUrl:     "/crypto/busd.svg",
    networkId:   "bsc",
    coingeckoId: "binance-usd",
  },
  {
    symbol:      "ETH",
    name:        "Ethereum (BSC)",
    contract:    "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    decimals:    18,
    logoUrl:     "/crypto/eth.svg",
    networkId:   "bsc",
    coingeckoId: "ethereum",
  },

  // ─── Tron ─────────────────────────────────────────────
  {
    symbol:      "TRX",
    name:        "Tron",
    contract:    null,
    decimals:    6,
    logoUrl:     "/crypto/trx.svg",
    networkId:   "tron",
    coingeckoId: "tron",
  },
  {
    symbol:      "USDT",
    name:        "Tether USD (TRC20)",
    contract:    "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
    decimals:    6,
    logoUrl:     "/crypto/usdt.svg",
    networkId:   "tron",
    coingeckoId: "tether",
  },

  // ─── Bitcoin ──────────────────────────────────────────
  {
    symbol:      "BTC",
    name:        "Bitcoin",
    contract:    null,
    decimals:    8,
    logoUrl:     "/crypto/btc.svg",
    networkId:   "bitcoin",
    coingeckoId: "bitcoin",
  },
];

// ─── Helpers ──────────────────────────────────────────────
export function getTokensByNetwork(networkId: string): TokenInfo[] {
  return TOKENS.filter((t) => t.networkId === networkId);
}

export function getNetwork(networkId: string): Network | null {
  return NETWORKS[networkId] || null;
}

export function getToken(
  symbol: string,
  networkId: string
): TokenInfo | null {
  return (
    TOKENS.find(
      (t) =>
        t.symbol === symbol &&
        t.networkId === networkId
    ) || null
  );
}

// ─── Precios únicos a consultar ───────────────────────────
export const COINGECKO_IDS = [
  "matic-network",
  "tether",
  "usd-coin",
  "ethereum",
  "wrapped-bitcoin",
  "binancecoin",
  "binance-usd",
  "tron",
  "bitcoin",
];
