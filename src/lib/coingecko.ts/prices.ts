// src/lib/coingecko/prices.ts
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  market_cap: number;
  total_volume: number;
}

export async function fetchCryptoPrices(): Promise<CoinGeckoPrice[]> {
  const ids = 'bitcoin,ethereum,tether,usd-coin';
  
  const response = await fetch(
    `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch prices');
  }
  
  return response.json();
}

// Hook para React Query
import { useQuery } from '@tanstack/react-query';

export function useCryptoPrices() {
  return useQuery({
    queryKey: ['crypto-prices'],
    queryFn: fetchCryptoPrices,
    refetchInterval: 30000, // Actualizar cada 30 segundos
    staleTime: 15000,
  });
}