import { ethers } from "ethers";
import {
  saveWalletEncrypted,
  loadWalletPrivateKey,
} from "./walletStorage";
import type {
  WalletData,
  TokenBalance,
  TransactionResult,
  SendTokenParams,
} from "./walletTypes";

// ─── Tokens soportados en Polygon ──────────────────────────
const TOKENS: Record<
  string,
  {
    contract: string | null;
    decimals: number;
    name: string;
    logoUrl: string;
    coingeckoId: string;
  }
> = {
  MATIC: {
    contract: null,
    decimals: 18,
    name: "Polygon",
    logoUrl: "/crypto/matic.svg",
    coingeckoId: "matic-network",
  },
  USDT: {
    contract: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals: 6,
    name: "Tether USD",
    logoUrl: "/crypto/usdt.svg",
    coingeckoId: "tether",
  },
  USDC: {
    contract: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
    name: "USD Coin",
    logoUrl: "/crypto/usdc.svg",
    coingeckoId: "usd-coin",
  },
  ETH: {
    contract: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    decimals: 18,
    name: "Ethereum (Bridged)",
    logoUrl: "/crypto/eth.svg",
    coingeckoId: "ethereum",
  },
  BTC: {
    contract: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    decimals: 8,
    name: "Bitcoin (Bridged)",
    logoUrl: "/crypto/btc.svg",
    coingeckoId: "bitcoin",
  },
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// ─── RPC Providers (gratuitos) ──────────────────────────────
const RPC_URLS = [
  "https://polygon-rpc.com",
  "https://rpc-mainnet.maticvigil.com",
  "https://polygon-mainnet.public.blastapi.io",
];

let currentRpcIndex = 0;

function getProvider(): ethers.JsonRpcProvider {
  const url = RPC_URLS[currentRpcIndex];
  return new ethers.JsonRpcProvider(url);
}

function rotateProvider(): void {
  currentRpcIndex = (currentRpcIndex + 1) % RPC_URLS.length;
  console.log(`🔄 [RPC] Rotando a: ${RPC_URLS[currentRpcIndex]}`);
}

// ─── CREAR WALLET NUEVA ────────────────────────────────────
export async function createNewWallet(
  password: string
): Promise<WalletData> {
  const wallet = ethers.Wallet.createRandom();
  if (!wallet.mnemonic) throw new Error("Error generando mnemonic");

  await saveWalletEncrypted(
    wallet.address,
    wallet.privateKey,
    wallet.mnemonic.phrase,
    password
  );

  console.log("✅ [Wallet] Creada:", wallet.address);

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  };
}

// ─── RESTAURAR WALLET ──────────────────────────────────────
export async function restoreWalletFromMnemonic(
  mnemonic: string,
  password: string
): Promise<WalletData> {
  const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());

  await saveWalletEncrypted(
    wallet.address,
    wallet.privateKey,
    mnemonic.trim(),
    password
  );

  console.log("✅ [Wallet] Restaurada:", wallet.address);

  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: mnemonic.trim(),
  };
}

// ─── OBTENER SALDOS ────────────────────────────────────────
export async function getWalletBalances(
  address: string
): Promise<TokenBalance[]> {
  const provider = getProvider();
  const balances: TokenBalance[] = [];

  for (const [symbol, token] of Object.entries(TOKENS)) {
    try {
      let rawBalance: bigint;

      if (!token.contract) {
        // Token nativo (MATIC)
        rawBalance = await provider.getBalance(address);
      } else {
        // Token ERC20
        const contract = new ethers.Contract(
          token.contract,
          ERC20_ABI,
          provider
        );
        rawBalance = await contract.balanceOf(address);
      }

      const formatted = ethers.formatUnits(rawBalance, token.decimals);
      const amount = parseFloat(formatted);

      balances.push({
        symbol,
        name: token.name,
        balance: formatted,
        amount,
        usdValue: 0, // Se actualiza con precios
        contract: token.contract,
        decimals: token.decimals,
        logoUrl: token.logoUrl,
      });
    } catch (err) {
      console.error(`❌ Error obteniendo ${symbol}:`, err);

      // Si falla, rotar RPC e insertar balance 0
      rotateProvider();
      balances.push({
        symbol,
        name: token.name,
        balance: "0",
        amount: 0,
        usdValue: 0,
        contract: token.contract,
        decimals: token.decimals,
        logoUrl: token.logoUrl,
      });
    }
  }

  return balances;
}

// ─── OBTENER PRECIOS ───────────────────────────────────────
export async function getTokenPrices(): Promise<
  Record<string, { usd: number; usd_24h_change: number }>
> {
  try {
    const ids = Object.values(TOKENS)
      .map((t) => t.coingeckoId)
      .join(",");

    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    const data = await res.json();

    const prices: Record<
      string,
      { usd: number; usd_24h_change: number }
    > = {};

    for (const [symbol, token] of Object.entries(TOKENS)) {
      const priceData = data[token.coingeckoId];
      if (priceData) {
        prices[symbol] = {
          usd: priceData.usd || 0,
          usd_24h_change: priceData.usd_24h_change || 0,
        };
      }
    }

    return prices;
  } catch (err) {
    console.error("❌ Error obteniendo precios:", err);
    return {
      MATIC: { usd: 0.7, usd_24h_change: 0 },
      USDT: { usd: 1, usd_24h_change: 0 },
      USDC: { usd: 1, usd_24h_change: 0 },
      ETH: { usd: 3500, usd_24h_change: 0 },
      BTC: { usd: 67500, usd_24h_change: 0 },
    };
  }
}

// ─── ENVIAR TOKEN ──────────────────────────────────────────
export async function sendToken(
  params: SendTokenParams
): Promise<TransactionResult> {
  const { toAddress, amount, symbol, password } = params;

  // 1. Descifrar private key
  const walletData = await loadWalletPrivateKey(password);
  if (!walletData) {
    return { success: false, error: "Contraseña incorrecta" };
  }

  try {
    const provider = getProvider();
    const signer = new ethers.Wallet(walletData.privateKey, provider);
    const token = TOKENS[symbol];

    if (!token) {
      return { success: false, error: "Token no soportado" };
    }

    let tx: ethers.TransactionResponse;

    if (!token.contract) {
      // Envío nativo MATIC
      tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
      });
    } else {
      // Envío ERC20
      const contract = new ethers.Contract(
        token.contract,
        ERC20_ABI,
        signer
      );
      tx = await contract.transfer(
        toAddress,
        ethers.parseUnits(amount, token.decimals)
      );
    }

    console.log("📤 [TX] Enviada:", tx.hash);
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt?.hash || tx.hash,
      explorer: `https://polygonscan.com/tx/${receipt?.hash || tx.hash}`,
    };
  } catch (error: any) {
    console.error("❌ [sendToken] Error:", error);

    // Errores comunes
    if (error.code === "INSUFFICIENT_FUNDS") {
      return {
        success: false,
        error: "Fondos insuficientes. Necesitas MATIC para pagar el gas.",
      };
    }

    return {
      success: false,
      error:
        error?.reason ||
        error?.message ||
        "Error enviando transacción",
    };
  }
}

// ─── ESTIMAR GAS ───────────────────────────────────────────
export async function estimateGas(
  symbol: string,
  toAddress: string,
  amount: string
): Promise<{ gasEstimate: string; gasCostUSD: string } | null> {
  try {
    const provider = getProvider();
    const token = TOKENS[symbol];
    if (!token) return null;

    let gasEstimate: bigint;

    if (!token.contract) {
      gasEstimate = await provider.estimateGas({
        to: toAddress,
        value: ethers.parseEther(amount || "0"),
      });
    } else {
      const contract = new ethers.Contract(
        token.contract,
        ERC20_ABI,
        provider
      );
      gasEstimate = await contract.transfer.estimateGas(
        toAddress || ethers.ZeroAddress,
        ethers.parseUnits(amount || "0", token.decimals)
      );
    }

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 30000000000n;
    const gasCost = gasEstimate * gasPrice;

    const prices = await getTokenPrices();
    const maticPrice = prices.MATIC?.usd || 0.7;
    const gasCostMatic = parseFloat(ethers.formatEther(gasCost));
    const gasCostUSD = gasCostMatic * maticPrice;

    return {
      gasEstimate: gasCostMatic.toFixed(6) + " MATIC",
      gasCostUSD: "$" + gasCostUSD.toFixed(4),
    };
  } catch {
    return null;
  }
}

// ─── VERIFICAR PASSWORD ────────────────────────────────────
export async function verifyWalletPassword(
  password: string
): Promise<boolean> {
  const result = await loadWalletPrivateKey(password);
  return result !== null;
}

// ─── INFO DE TOKENS ────────────────────────────────────────
export function getTokenInfo(symbol: string) {
  return TOKENS[symbol] || null;
}

export function getSupportedTokens() {
  return Object.keys(TOKENS);
}
