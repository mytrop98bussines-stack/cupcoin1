import { ethers }            from "ethers";
import { saveWalletEncrypted, loadWalletPrivateKey } from "./walletStorage";
import type { WalletData, TokenBalance, TransactionResult, SendTokenParams } from "./walletTypes";

// ─── Contratos USDT y USDC en Polygon Mainnet ─────────────
const TOKENS = {
  USDT: {
    contract: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    decimals: 6,
    name:     "Tether USD",
    logoUrl:  "https://cryptologos.cc/logos/tether-usdt-logo.png",
  },
  USDC: {
    contract: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    decimals: 6,
    name:     "USD Coin",
    logoUrl:  "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  },
  MATIC: {
    contract: null,
    decimals: 18,
    name:     "Polygon",
    logoUrl:  "https://cryptologos.cc/logos/polygon-matic-logo.png",
  },
};

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

// ─── Provider de Polygon (RPC público gratis) ─────────────
function getProvider(): ethers.JsonRpcProvider {
  // Puedes cambiar a Alchemy cuando quieras más capacidad
  return new ethers.JsonRpcProvider("https://polygon-rpc.com");
}

// ─── CREAR WALLET NUEVA ────────────────────────────────────
export async function createNewWallet(password: string): Promise<WalletData> {
  const wallet = ethers.Wallet.createRandom();

  if (!wallet.mnemonic) throw new Error("Error generando mnemonic");

  // Cifrar y guardar en localStorage (NUNCA en Firebase)
  await saveWalletEncrypted(
    wallet.address,
    wallet.privateKey,
    wallet.mnemonic.phrase,
    password
  );

  console.log("✅ [Wallet] Nueva wallet creada:", wallet.address);

  return {
    address:    wallet.address,
    privateKey: wallet.privateKey,
    mnemonic:   wallet.mnemonic.phrase,
  };
}

// ─── RECUPERAR WALLET CON FRASE SEMILLA ───────────────────
export async function restoreWalletFromMnemonic(
  mnemonic:  string,
  password:  string
): Promise<WalletData> {
  const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());

  await saveWalletEncrypted(
    wallet.address,
    wallet.privateKey,
    mnemonic.trim(),
    password
  );

  console.log("✅ [Wallet] Restaurada desde mnemonic:", wallet.address);

  return {
    address:    wallet.address,
    privateKey: wallet.privateKey,
    mnemonic:   mnemonic.trim(),
  };
}

// ─── OBTENER SALDOS ────────────────────────────────────────
export async function getWalletBalances(address: string): Promise<TokenBalance[]> {
  const provider = getProvider();
  const balances: TokenBalance[] = [];

  // MATIC nativo
  try {
    const maticBalance = await provider.getBalance(address);
    balances.push({
      symbol:   "MATIC",
      name:     "Polygon",
      balance:  ethers.formatEther(maticBalance),
      usdValue: 0, // Se actualiza con CoinGecko
      contract: null,
      decimals: 18,
      logoUrl:  TOKENS.MATIC.logoUrl,
    });
  } catch (e) {
    console.error("❌ Error obteniendo MATIC:", e);
  }

  // USDT y USDC
  for (const [symbol, token] of Object.entries(TOKENS)) {
    if (!token.contract) continue;
    try {
      const contract = new ethers.Contract(token.contract, ERC20_ABI, provider);
      const raw      = await contract.balanceOf(address);
      const balance  = ethers.formatUnits(raw, token.decimals);

      balances.push({
        symbol,
        name:     token.name,
        balance,
        usdValue: parseFloat(balance), // USDT/USDC ≈ 1 USD
        contract: token.contract,
        decimals: token.decimals,
        logoUrl:  token.logoUrl,
      });
    } catch (e) {
      console.error(`❌ Error obteniendo ${symbol}:`, e);
    }
  }

  return balances;
}

// ─── ENVIAR TOKEN ──────────────────────────────────────────
export async function sendToken(params: SendTokenParams): Promise<TransactionResult> {
  const { toAddress, amount, symbol, password } = params;

  // 1. Recuperar private key
  const walletData = await loadWalletPrivateKey(password);
  if (!walletData) {
    return { success: false, error: "Password incorrecta" };
  }

  try {
    const provider = getProvider();
    const signer   = new ethers.Wallet(walletData.privateKey, provider);

    let tx: ethers.TransactionResponse;

    if (symbol === "MATIC") {
      // Envío nativo
      tx = await signer.sendTransaction({
        to:    toAddress,
        value: ethers.parseEther(amount),
      });
    } else {
      // Envío de token ERC20
      const token    = TOKENS[symbol as keyof typeof TOKENS];
      if (!token?.contract) throw new Error("Token no soportado");

      const contract = new ethers.Contract(token.contract, ERC20_ABI, signer);
      tx             = await contract.transfer(
        toAddress,
        ethers.parseUnits(amount, token.decimals)
      );
    }

    const receipt = await tx.wait();

    return {
      success:  true,
      txHash:   receipt?.hash,
      explorer: `https://polygonscan.com/tx/${receipt?.hash}`,
    };
  } catch (error: any) {
    console.error("❌ [sendToken] Error:", error);
    return {
      success: false,
      error:   error?.reason || error?.message || "Error enviando transacción",
    };
  }
}

// ─── VERIFICAR PASSWORD ────────────────────────────────────
export async function verifyWalletPassword(password: string): Promise<boolean> {
  const result = await loadWalletPrivateKey(password);
  return result !== null;
}
