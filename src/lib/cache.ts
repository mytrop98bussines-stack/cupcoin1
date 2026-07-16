// ─── Cache simple en localStorage ────────────────────────
const CACHE_PREFIX  = "cubax_cache_";
const CACHE_TTL_MS  = 5 * 60 * 1000; // 5 minutos

export function setCache(key: string, data: any): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, savedAt: Date.now() })
    );
  } catch {
    // localStorage lleno — ignorar
  }
}

export function getCache<T>(key: string, maxAgeMs = CACHE_TTL_MS): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;

    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > maxAgeMs) return null;

    return data as T;
  } catch {
    return null;
  }
}

export function clearCache(key: string): void {
  localStorage.removeItem(CACHE_PREFIX + key);
}

export function clearAllCache(): void {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(CACHE_PREFIX))
    .forEach((k) => localStorage.removeItem(k));
}
