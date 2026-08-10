import { ethers }  from "ethers";
import {
  saveWalletEncrypted,
  loadWalletPrivateKey,
} from "./walletStorage";
import type {
  WalletData,
  TokenBalance,
  TransactionResult,
  SendTokenParams,
  WalletAddresses,
  NetworkId,
} from "./walletTypes";
import {
  NETWORKS,
  TOKENS,
  COINGECKO_IDS,
  getTokensByNetwork,
} from "./networkConfig";

// =========================================================
// ABI ERC20 básico
// =========================================================
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
];

// =========================================================
// PROVIDERS EVM (Polygon, ETH, BSC)
// =========================================================
const rpcIndexes: Record<string, number> = {
  polygon:  0,
  ethereum: 0,
  bsc:      0,
};

function getEvmProvider(networkId: string): ethers.JsonRpcProvider {
  const network = NETWORKS[networkId];
  if (!network) throw new Error(`Red no soportada: ${networkId}`);

  const idx = rpcIndexes[networkId] || 0;
  const url = network.rpcUrls[idx];
  return new ethers.JsonRpcProvider(url);
}

function rotateEvmProvider(networkId: string): void {
  const network = NETWORKS[networkId];
  if (!network) return;
  const current = rpcIndexes[networkId] || 0;
  rpcIndexes[networkId] = (current + 1) % network.rpcUrls.length;
}

// =========================================================
// DERIVAR DIRECCIONES DESDE MNEMONIC
// =========================================================
export function deriveEvmAddress(mnemonic: string): string {
  const wallet = ethers.Wallet.fromPhrase(mnemonic);
  return wallet.address;
}

export async function deriveTronAddress(
  mnemonic: string
): Promise<string> {
  try {
    // Derivar la misma private key que EVM
    const wallet     = ethers.Wallet.fromPhrase(mnemonic);
    const privateKey = wallet.privateKey.slice(2); // Quitar 0x

    // TronWeb deriva la dirección desde la private key
    const { TronWeb } = await import("tronweb");
    const address = TronWeb.address.fromPrivateKey(privateKey);
    return address as string;
  } catch (err) {
    console.error("❌ Error derivando dirección Tron:", err);
    return "";
  }
}

export async function deriveBitcoinAddress(
  mnemonic: string
): Promise<string> {
  try {
    const ecc     = await import("tiny-secp256k1");
    const bip32   = await import("bip32");
    const bitcoin = await import("bitcoinjs-lib");

    const BIP32Factory = bip32.default(ecc.default || ecc);
    const { mnemonicToSeedSync } = await import("bip39");

    const seed = mnemonicToSeedSync(mnemonic);
    const root = BIP32Factory.fromSeed(seed, bitcoin.networks.bitcoin);

    // Derivación estándar BIP84 (Native SegWit bc1...)
    const child = root.derivePath("m/84'/0'/0'/0/0");

    if (!child.publicKey) throw new Error("No public key");

    const { address } = bitcoin.payments.p2wpkh({
      pubkey:  Buffer.from(child.publicKey),
      network: bitcoin.networks.bitcoin,
    });

    return address || "";
  } catch (err) {
    console.error("❌ Error derivando dirección Bitcoin:", err);
    return "";
  }
}

// =========================================================
// OBTENER TODAS LAS DIRECCIONES
// =========================================================
export async function getAllAddresses(
  mnemonic: string
): Promise<WalletAddresses> {
  const [tron, bitcoin] = await Promise.all([
    deriveTronAddress(mnemonic),
    deriveBitcoinAddress(mnemonic),
  ]);

  return {
    evm:     deriveEvmAddress(mnemonic),
    tron,
    bitcoin,
  };
}

// =========================================================
// CREAR WALLET NUEVA
// =========================================================
export async function createNewWallet(
  password: string
): Promise<WalletData & { addresses: WalletAddresses }> {
  const wallet = ethers.Wallet.createRandom();
  if (!wallet.mnemonic) throw new Error("Error generando mnemonic");

  const mnemonic = wallet.mnemonic.phrase;

  await saveWalletEncrypted(
    wallet.address,
    wallet.privateKey,
    mnemonic,
    password
  );

  // Derivar todas las direcciones
  const addresses = await getAllAddresses(mnemonic);

  console.log("✅ [Wallet] Creada:", wallet.address);
  console.log("✅ [Wallet] Tron:", addresses.tron);
  console.log("✅ [Wallet] Bitcoin:", addresses.bitcoin);

  return {
    address:   wallet.address,
    privateKey: wallet.privateKey,
    mnemonic,
    addresses,
  };
}

// =========================================================
// RESTAURAR WALLET
// =========================================================
export async function restoreWalletFromMnemonic(
  mnemonic:  string,
  password:  string
): Promise<WalletData & { addresses: WalletAddresses }> {
  const wallet = ethers.Wallet.fromPhrase(mnemonic.trim());

  await saveWalletEncrypted(
    wallet.address,
    wallet.privateKey,
    mnemonic.trim(),
    password
  );

  const addresses = await getAllAddresses(mnemonic.trim());

  console.log("✅ [Wallet] Restaurada:", wallet.address);

  return {
    address:    wallet.address,
    privateKey: wallet.privateKey,
    mnemonic:   mnemonic.trim(),
    addresses,
  };
}

// =========================================================
// OBTENER SALDOS EVM (Polygon, ETH, BSC)
// =========================================================
async function getEvmBalances(
  address:   string,
  networkId: string
): Promise<TokenBalance[]> {
  const provider = getEvmProvider(networkId);
  const tokens   = getTokensByNetwork(networkId);
  const balances: TokenBalance[] = [];

  for (const token of tokens) {
    try {
      let rawBalance: bigint = 0n;

      if (!token.contract) {
        rawBalance = await provider.getBalance(address);
      } else {
        const contract = new ethers.Contract(
          token.contract,
          ERC20_ABI,
          provider
        );
        rawBalance = await contract.balanceOf(address);
      }

      const safeBalance = typeof rawBalance === "bigint"
        ? rawBalance
        : BigInt(rawBalance ?? 0);

      const formatted = ethers.formatUnits(safeBalance, token.decimals);
      const amount    = parseFloat(formatted) || 0;

      balances.push({
        symbol:    token.symbol,
        name:      token.name,
        balance:   formatted,
        amount,
        usdValue:  0,
        contract:  token.contract,
        decimals:  token.decimals,
        logoUrl:   token.logoUrl,
        networkId: token.networkId,
        address,
      });
    } catch (err) {
      console.error(`❌ Error ${token.symbol} en ${networkId}:`, err);
      rotateEvmProvider(networkId);

      balances.push({
        symbol:    token.symbol,
        name:      token.name,
        balance:   "0",
        amount:    0,
        usdValue:  0,
        contract:  token.contract,
        decimals:  token.decimals,
        logoUrl:   token.logoUrl,
        networkId: token.networkId,
        address,
      });
    }
  }

  return balances;
}

// =========================================================
// OBTENER SALDOS TRON
// =========================================================
async function getTronBalances(
  tronAddress: string
): Promise<TokenBalance[]> {
  const balances: TokenBalance[] = [];
  const tokens = getTokensByNetwork("tron");

  try {
    const { TronWeb } = await import("tronweb");
    const tronWeb = new TronWeb({
      fullHost: "https://api.trongrid.io",
    });

    for (const token of tokens) {
      try {
        if (!token.contract) {
          // TRX nativo
          const accountInfo = await tronWeb.trx.getAccount(tronAddress);
          const balanceSun  = accountInfo?.balance || 0;
          const amount      = balanceSun / 1_000_000;

          balances.push({
            symbol:    "TRX",
            name:      "Tron",
            balance:   amount.toString(),
            amount,
            usdValue:  0,
            contract:  null,
            decimals:  6,
            logoUrl:   "/crypto/trx.svg",
            networkId: "tron",
            address:   tronAddress,
          });
        } else {
          // USDT TRC20
          const contract = await tronWeb.contract().at(token.contract);
          const raw      = await contract.balanceOf(tronAddress).call();
          const amount   = Number(raw) / Math.pow(10, token.decimals);

          balances.push({
            symbol:    token.symbol,
            name:      token.name,
            balance:   amount.toString(),
            amount,
            usdValue:  0,
            contract:  token.contract,
            decimals:  token.decimals,
            logoUrl:   token.logoUrl,
            networkId: "tron",
            address:   tronAddress,
          });
        }
      } catch (err) {
        console.error(`❌ Error ${token.symbol} Tron:`, err);
        balances.push({
          symbol:    token.symbol,
          name:      token.name,
          balance:   "0",
          amount:    0,
          usdValue:  0,
          contract:  token.contract,
          decimals:  token.decimals,
          logoUrl:   token.logoUrl,
          networkId: "tron",
          address:   tronAddress,
        });
      }
    }
  } catch (err) {
    console.error("❌ Error conectando a Tron:", err);
  }

  return balances;
}

// =========================================================
// OBTENER SALDO BITCOIN
// =========================================================
async function getBitcoinBalance(
  btcAddress: string
): Promise<TokenBalance[]> {
  try {
    // Blockstream API (gratuita, sin API key)
    const res  = await fetch(
      `https://blockstream.info/api/address/${btcAddress}`
    );
    const data = await res.json();

    const funded  = data?.chain_stats?.funded_txo_sum  || 0;
    const spent   = data?.chain_stats?.spent_txo_sum   || 0;
    const satoshis = funded - spent;
    const amount   = satoshis / 1e8;

    return [{
      symbol:    "BTC",
      name:      "Bitcoin",
      balance:   amount.toString(),
      amount,
      usdValue:  0,
      contract:  null,
      decimals:  8,
      logoUrl:   "/crypto/btc.svg",
      networkId: "bitcoin",
      address:   btcAddress,
    }];
  } catch (err) {
    console.error("❌ Error obteniendo BTC balance:", err);
    return [{
      symbol:    "BTC",
      name:      "Bitcoin",
      balance:   "0",
      amount:    0,
      usdValue:  0,
      contract:  null,
      decimals:  8,
      logoUrl:   "/crypto/btc.svg",
      networkId: "bitcoin",
      address:   btcAddress,
    }];
  }
}

// =========================================================
// OBTENER TODOS LOS SALDOS (Multi-red)
// =========================================================
export async function getWalletBalances(
  addresses: WalletAddresses
): Promise<TokenBalance[]> {
  if (!addresses?.evm) {
    console.error("❌ [Wallet] Direcciones inválidas");
    return [];
  }

  // Cargar todas las redes en paralelo
  const [
    polygonBal,
    ethereumBal,
    bscBal,
    tronBal,
    bitcoinBal,
  ] = await Promise.allSettled([
    getEvmBalances(addresses.evm, "polygon"),
    getEvmBalances(addresses.evm, "ethereum"),
    getEvmBalances(addresses.evm, "bsc"),
    addresses.tron   ? getTronBalances(addresses.tron)     : Promise.resolve([]),
    addresses.bitcoin ? getBitcoinBalance(addresses.bitcoin) : Promise.resolve([]),
  ]);

  const allBalances: TokenBalance[] = [];

  // Extraer resultados
  [polygonBal, ethereumBal, bscBal, tronBal, bitcoinBal].forEach((result) => {
    if (result.status === "fulfilled") {
      allBalances.push(...result.value);
    }
  });

  return allBalances;
}

// =========================================================
// OBTENER PRECIOS
// =========================================================
export async function getTokenPrices(): Promise<
  Record<string, { usd: number; usd_24h_change: number }>
> {
  try {
    const ids = COINGECKO_IDS.join(",");
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price` +
      `?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    const data = await res.json();

    const prices: Record<string, { usd: number; usd_24h_change: number }> = {};

    // Mapear coingecko id → símbolo
    const idToSymbol: Record<string, string> = {
      "matic-network":   "MATIC",
      "tether":          "USDT",
      "usd-coin":        "USDC",
      "ethereum":        "ETH",
      "wrapped-bitcoin": "WBTC",
      "binancecoin":     "BNB",
      "binance-usd":     "BUSD",
      "tron":            "TRX",
      "bitcoin":         "BTC",
    };

    for (const [id, symbol] of Object.entries(idToSymbol)) {
      if (data[id]) {
        prices[symbol] = {
          usd:             data[id].usd             || 0,
          usd_24h_change:  data[id].usd_24h_change  || 0,
        };
      }
    }

    return prices;
  } catch (err) {
    console.error("❌ Error obteniendo precios:", err);
    return {
      MATIC: { usd: 0.7,     usd_24h_change: 0 },
      USDT:  { usd: 1,       usd_24h_change: 0 },
      USDC:  { usd: 1,       usd_24h_change: 0 },
      ETH:   { usd: 3500,    usd_24h_change: 0 },
      WBTC:  { usd: 67500,   usd_24h_change: 0 },
      BNB:   { usd: 300,     usd_24h_change: 0 },
      BUSD:  { usd: 1,       usd_24h_change: 0 },
      TRX:   { usd: 0.12,    usd_24h_change: 0 },
      BTC:   { usd: 67500,   usd_24h_change: 0 },
    };
  }
}

// =========================================================
// ENVIAR TOKEN EVM
// =========================================================
async function sendEvmToken(
  params:     SendTokenParams,
  privateKey: string
): Promise<TransactionResult> {
  const { toAddress, amount, symbol, networkId } = params;

  try {
    const provider = getEvmProvider(networkId);
    const signer   = new ethers.Wallet(privateKey, provider);

    const token = TOKENS.find(
      (t) => t.symbol === symbol && t.networkId === networkId
    );

    if (!token) {
      return { success: false, error: `Token ${symbol} no encontrado en ${networkId}` };
    }

    let tx: ethers.TransactionResponse;

    if (!token.contract) {
      tx = await signer.sendTransaction({
        to:    toAddress,
        value: ethers.parseEther(amount),
      });
    } else {
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

    const receipt = await tx.wait();
    const network = NETWORKS[networkId];

    return {
      success:  true,
      txHash:   receipt?.hash || tx.hash,
      explorer: `${network.explorerUrl}/tx/${receipt?.hash || tx.hash}`,
    };
  } catch (error: any) {
    if (error.code === "INSUFFICIENT_FUNDS") {
      const native = NETWORKS[networkId]?.nativeCoin || "gas";
      return {
        success: false,
        error:   `Fondos insuficientes. Necesitas ${native} para pagar el gas.`,
      };
    }
    return {
      success: false,
      error:   error?.reason || error?.message || "Error enviando transacción",
    };
  }
}

// =========================================================
// ENVIAR TOKEN TRON
// =========================================================
async function sendTronToken(
  params:     SendTokenParams,
  privateKey: string
): Promise<TransactionResult> {
  const { toAddress, amount, symbol } = params;

  try {
    const { TronWeb } = await import("tronweb");
    const tronWeb = new TronWeb({
      fullHost:   "https://api.trongrid.io",
      privateKey: privateKey.replace("0x", ""),
    });

    const token = TOKENS.find(
      (t) => t.symbol === symbol && t.networkId === "tron"
    );

    if (!token) {
      return { success: false, error: "Token no encontrado en Tron" };
    }

    let txHash: string;

    if (!token.contract) {
      // TRX nativo
      const amountSun = Math.floor(parseFloat(amount) * 1_000_000);
      const tx = await tronWeb.trx.sendTransaction(toAddress, amountSun);
      txHash = tx.txid;
    } else {
      // TRC20 (USDT)
      const contract = await tronWeb.contract().at(token.contract);
      const amountRaw = Math.floor(
        parseFloat(amount) * Math.pow(10, token.decimals)
      );
      const tx = await contract.transfer(toAddress, amountRaw).send();
      txHash = tx;
    }

    return {
      success:  true,
      txHash,
      explorer: `https://tronscan.org/#/transaction/${txHash}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error:   error?.message || "Error enviando transacción Tron",
    };
  }
}

// =========================================================
// ENVIAR TOKEN BITCOIN
// =========================================================
async function sendBitcoin(
  params:     SendTokenParams,
  mnemonic:   string
): Promise<TransactionResult> {
  try {
    const ecc     = await import("tiny-secp256k1");
    const bip32   = await import("bip32");
    const bitcoin = await import("bitcoinjs-lib");
    const { mnemonicToSeedSync } = await import("bip39");

    const BIP32Factory = bip32.default(ecc.default || ecc);
    const seed = mnemonicToSeedSync(mnemonic);
    const root = BIP32Factory.fromSeed(seed, bitcoin.networks.bitcoin);
    const child = root.derivePath("m/84'/0'/0'/0/0");

    if (!child.privateKey) throw new Error("No private key");

    const keyPair = {
      publicKey:  Buffer.from(child.publicKey),
      privateKey: Buffer.from(child.privateKey),
    };

    const { address: fromAddress } = bitcoin.payments.p2wpkh({
      pubkey:  keyPair.publicKey,
      network: bitcoin.networks.bitcoin,
    });

    // Obtener UTXOs desde Blockstream
    const utxoRes  = await fetch(
      `https://blockstream.info/api/address/${fromAddress}/utxo`
    );
    const utxos    = await utxoRes.json();

    if (!utxos || utxos.length === 0) {
      return { success: false, error: "No hay fondos disponibles (UTXOs vacíos)" };
    }

    const psbt      = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
    const feeRate   = 10; // sats/vbyte
    let totalInput  = 0;

    for (const utxo of utxos) {
  const txRes  = await fetch(
    `https://blockstream.info/api/tx/${utxo.txid}/hex`
  );
      const txHex  = await txRes.text();

      psbt.addInput({
        hash:           utxo.txid,
        index:          utxo.vout,
        witnessUtxo: {
          script: bitcoin.payments.p2wpkh({
            pubkey:  keyPair.publicKey,
            network: bitcoin.networks.bitcoin,
          }).output!,
          value: utxo.value,
        },
        nonWitnessUtxo: Buffer.from(txHex, "hex"),
      });

      totalInput += utxo.value;
    }

    const amountSats  = Math.floor(parseFloat(params.amount) * 1e8);
    const estimatedFee = feeRate * (utxos.length * 68 + 2 * 31 + 10);
    const change       = totalInput - amountSats - estimatedFee;

    if (change < 0) {
      return { success: false, error: "Fondos insuficientes para cubrir el monto + comisión" };
    }

    psbt.addOutput({ address: params.toAddress, value: amountSats });

    if (change > 546) {
      psbt.addOutput({ address: fromAddress!, value: change });
    }

    // Firmar
    psbt.signAllInputs({
      publicKey: keyPair.publicKey,
      sign: (hash: Buffer) => {
        const sig = ecc.sign(hash, keyPair.privateKey!);
        return Buffer.from(sig);
      },
    });

    psbt.finalizeAllInputs();
    const txHex = psbt.extractTransaction().toHex();

    // Broadcast
    const broadcastRes = await fetch(
      "https://blockstream.info/api/tx",
      {
        method: "POST",
        body:   txHex,
      }
    );
    const txHash = await broadcastRes.text();

    return {
      success:  true,
      txHash,
      explorer: `https://mempool.space/tx/${txHash}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error:   error?.message || "Error enviando Bitcoin",
    };
  }
}

// =========================================================
// ENVIAR TOKEN (entrada principal)
// =========================================================
export async function sendToken(
  params: SendTokenParams
): Promise<TransactionResult> {
  const walletData = await loadWalletPrivateKey(params.password);
  if (!walletData) {
    return { success: false, error: "Contraseña incorrecta" };
  }

  const { networkId } = params;

  if (networkId === "bitcoin") {
    return sendBitcoin(params, walletData.mnemonic);
  }

  if (networkId === "tron") {
    return sendTronToken(params, walletData.privateKey);
  }

  // EVM: polygon, ethereum, bsc
  return sendEvmToken(params, walletData.privateKey);
}

// =========================================================
// ESTIMAR GAS
// =========================================================
export async function estimateGas(
  symbol:    string,
  networkId: string,
  toAddress: string,
  amount:    string
): Promise<{ gasEstimate: string; gasCostUSD: string } | null> {
  if (networkId === "bitcoin" || networkId === "tron") return null;

  try {
    const provider = getEvmProvider(networkId);
    const token    = TOKENS.find(
      (t) => t.symbol === symbol && t.networkId === networkId
    );
    if (!token) return null;

    let gasEstimate: bigint;

    if (!token.contract) {
      gasEstimate = await provider.estimateGas({
        to:    toAddress || ethers.ZeroAddress,
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

    const feeData  = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || 30000000000n;
    const gasCost  = gasEstimate * gasPrice;

    const prices    = await getTokenPrices();
    const native    = NETWORKS[networkId]?.nativeCoin || "ETH";
    const nativePrice = prices[native]?.usd || 1;
    const gasCostNative = parseFloat(ethers.formatEther(gasCost));
    const gasCostUSD    = gasCostNative * nativePrice;

    return {
      gasEstimate: `${gasCostNative.toFixed(6)} ${native}`,
      gasCostUSD:  `$${gasCostUSD.toFixed(4)}`,
    };
  } catch {
    return null;
  }
}

// =========================================================
// VERIFICAR PASSWORD
// =========================================================
export async function verifyWalletPassword(
  password: string
): Promise<boolean> {
  const result = await loadWalletPrivateKey(password);
  return result !== null;
}

// =========================================================
// OBTENER DIRECCIÓN POR RED
// =========================================================
export function getAddressForNetwork(
  addresses: WalletAddresses,
  networkId: NetworkId
): string {
  if (networkId === "tron")   return addresses.tron;
  if (networkId === "bitcoin") return addresses.bitcoin;
  return addresses.evm; // polygon, ethereum, bsc
}
