// Server-side In-Memory Cache for Tadbeer TT CRM
// Deduplicates and accelerates repeated read queries across Server Actions & SSR
// In-memory with TTL + automatic invalidation on mutations

type ServerCacheEntry<T> = {
  data: T;
  timestamp: number;
};

const serverMemoryStore = new Map<string, ServerCacheEntry<any>>();

export function getServerCached<T>(key: string, maxAgeMs = 45000): T | null {
  const entry = serverMemoryStore.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > maxAgeMs) {
    serverMemoryStore.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setServerCached<T>(key: string, data: T) {
  if (data === undefined || data === null) return;
  serverMemoryStore.set(key, { data, timestamp: Date.now() });
}

export function invalidateServerCache(prefixOrKey?: string) {
  if (!prefixOrKey) {
    serverMemoryStore.clear();
    return;
  }
  for (const key of serverMemoryStore.keys()) {
    if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
      serverMemoryStore.delete(key);
    }
  }
}
