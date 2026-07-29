import React from "react";

// Mapeo centralizado a tu carpeta local /public/crypto/
const MAPEO_CRYPTO_SVG: Record<string, string> = {
  BTC:  "/crypto/btc.svg",
  USDT: "/crypto/usdt.svg",
  ETH:  "/crypto/eth.svg",
  USDC: "/crypto/usdc.svg",
  XLM:  "/crypto/xlm.svg", // ✅ Stellar añadido
  TRX:  "/crypto/trx.svg", // (por si lo agregas después)
};

interface CryptoIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  symbol: string;  // El token (ej: "BTC", "USDT")
  size?: number;   // Tamaño en píxeles (opcional)
}

export function CryptoIcon({ symbol, size = 24, className = "", ...props }: CryptoIconProps) {
  // Aseguramos que el símbolo esté en mayúsculas para evitar fallos de tipeo (ej: "usdt" -> "USDT")
  const token = symbol?.toUpperCase();
  
  // Si la moneda no existe en tu carpeta, usamos un icono genérico por defecto
  const src = MAPEO_CRYPTO_SVG[token] || "/crypto/generic.svg";

  return (
    <img
      src={src}
      alt={symbol}
      width={size}
      height={size}
      className={`inline-block select-none object-contain ${className}`}
      style={{ width: size, height: size }}
      {...props}
    />
  );
        }
