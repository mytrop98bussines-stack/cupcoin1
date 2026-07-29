import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';

// 🌐 URL Base oficial y limpia para planes Demo/Gratuitos de CoinGecko
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
// 🔑 Tu API Key real bien aislada
const API_KEY = 'CG-zzRk6THcTeXm7N6Tj1gWbDuX';

export interface CoinGeckoPrice {
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
  // ✅ Añadido stellar (XLM)
  const ids = 'bitcoin,ethereum,tether,usd-coin,stellar';
  
  // 🛠️ Pasamos la API Key de forma correcta y nativa en los Headers de la petición
  const response = await fetch(
    `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`,
    {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-cg-demo-api-key': API_KEY // Estructura obligatoria de CoinGecko para credenciales CG-
      }
    }
  );
  
  if (!response.ok) {
    const errText = await response.text();
    console.error("Error nativo de CoinGecko:", errText);
    throw new Error(`Failed to fetch prices: ${response.status}`);
  }
  
  return response.json();
}

// 🔄 Hook optimizado para React Query conectado con Zustand
export function useCryptoPrices() {
  const setPrices = useAppStore((state) => state.setPrices);

  return useQuery({
    queryKey: ['crypto-prices'],
    queryFn: async () => {
      const data = await fetchCryptoPrices();
      
      // 🔥 Sincronizamos React Query directamente con tu Zustand Store en cada ráfaga
      if (data && Array.isArray(data)) {
        const formattedPrices = data.map((coin, index) => ({
          id: (index + 1).toString(),
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          priceUSD: coin.current_price,
          change24h: coin.price_change_percentage_24h || 0,
        }));
        
        // Seteamos el estado global para que CreateProductPage y ProductDetailPage muten en caliente
        setPrices(formattedPrices);
      }
      
      return data;
    },
    refetchInterval: 60000, // Subimos a 60s para cuidar tu API Key Demo y evitar baneos de IP (Rate Limits)
    staleTime: 30000,
  });
}
