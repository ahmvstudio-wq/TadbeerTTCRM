// In-Memory & Session Client Cache for Tadbeer TT CRM
// Provides instant (0ms) tab switching and navigation using dual-tier cache (L1 Memory Map, L2 SessionStorage)
// Automatically updates in real-time on 'lead-updated' and 'lead-created' events.

type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

const memoryStore = new Map<string, CacheEntry<any>>();
const inflightPromises = new Map<string, Promise<any>>();

// Helper to save to sessionStorage safely without throwing on quota
function saveToSession<T>(key: string, entry: CacheEntry<T>) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(`crm_cache_${key}`, JSON.stringify(entry));
  } catch (err) {
    // Gracefully ignore storage quota limits or private browsing restrictions
  }
}

// Helper to read from sessionStorage
function readFromSession<T>(key: string): CacheEntry<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`crm_cache_${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    return null;
  }
}

// Helper to remove from sessionStorage
function removeFromSession(prefixOrKey?: string) {
  if (typeof window === "undefined") return;
  try {
    if (!prefixOrKey) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith("crm_cache_")) keysToRemove.push(k);
      }
      keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      return;
    }

    const targetPrefix = `crm_cache_${prefixOrKey}`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k === targetPrefix || k.startsWith(targetPrefix))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // Ignore errors
  }
}

// Listen to global lead-updated event to optimistically patch cached data across all screens
if (typeof window !== "undefined") {
  window.addEventListener("lead-updated", (event: any) => {
    const detail = event?.detail;
    if (!detail) return;

    const companyId = detail.companyId;
    const newStatus = detail.status;
    const newLeadType = detail.leadType || detail.lead_type;

    // 1. Invalidate or patch single company cache
    if (companyId) {
      const cleanId = String(companyId).replace(/^staged-/, "");
      const singleKey = `company-${cleanId}`;
      const entry = memoryStore.get(singleKey);
      if (entry && entry.data) {
        entry.data = {
          ...entry.data,
          ...(newStatus ? { status: newStatus, pipeline_stage: newStatus } : {}),
          ...(newLeadType ? { lead_type: newLeadType } : {}),
        };
        entry.timestamp = Date.now();
        saveToSession(singleKey, entry);
      }
    }

    // 2. Patch prospects cache if present
    for (const [key, entry] of memoryStore.entries()) {
      if (key.startsWith("prospects") && Array.isArray(entry.data)) {
        if (companyId) {
          entry.data = entry.data.map((p: any) => {
            if (p.id === companyId || p.company_id === companyId) {
              return {
                ...p,
                ...(newStatus ? { status: newStatus, pipeline_stage: newStatus } : {}),
                ...(newLeadType ? { lead_type: newLeadType } : {}),
              };
            }
            return p;
          });
          saveToSession(key, entry);
        }
      }

      // 3. Patch outreach cache if present
      if (key.startsWith("outreach") && Array.isArray(entry.data)) {
        if (companyId) {
          entry.data = entry.data.map((l: any) => {
            if (l.id === companyId || l.company_id === companyId || l.id === `staged-${companyId}`) {
              return {
                ...l,
                ...(newStatus ? { status: newStatus, stage: newStatus } : {}),
                ...(detail.statuses ? { statuses: detail.statuses } : {}),
              };
            }
            return l;
          });
          saveToSession(key, entry);
        }
      }

      // 4. Patch follow-ups cache if present
      if (key.startsWith("followups") && Array.isArray(entry.data)) {
        if (companyId) {
          entry.data = entry.data.map((item: any) => {
            if (item.company_id === companyId || item.id === companyId) {
              return {
                ...item,
                ...(newStatus ? { status: newStatus } : {}),
              };
            }
            return item;
          });
          saveToSession(key, entry);
        }
      }

      // 5. Patch pipeline opportunities cache if present
      if (key.startsWith("pipeline-opportunities") && Array.isArray(entry.data)) {
        if (companyId && newStatus) {
          entry.data = entry.data.map((opp: any) => {
            if (opp.company_id === companyId) {
              return { ...opp, stage: newStatus };
            }
            return opp;
          });
          saveToSession(key, entry);
        }
      }

      // 6. Patch dashboard-data cache if present
      if (key === "dashboard-data" && entry.data) {
        const d = entry.data;
        if (Array.isArray(d.outreachLeads)) {
          d.outreachLeads = d.outreachLeads.map((l: any) => {
            if (l.id === companyId || l.company_id === companyId || l.id === `staged-${companyId}`) {
              return {
                ...l,
                ...(newStatus ? { status: newStatus, stage: newStatus } : {}),
              };
            }
            return l;
          });
        }
        if (Array.isArray(d.companies)) {
          d.companies = d.companies.map((c: any) => {
            if (c.id === companyId) {
              return {
                ...c,
                ...(newStatus ? { status: newStatus, pipeline_stage: newStatus } : {}),
              };
            }
            return c;
          });
        }
        entry.timestamp = Date.now();
        saveToSession(key, entry);
      }
    }
  });
}

export const CRMCache = {
  /**
   * Synchronously get cached data if available (0ms retrieval from RAM, fallback to sessionStorage)
   */
  get<T>(key: string): T | null {
    // 1. Check in-memory map
    const entry = memoryStore.get(key);
    if (entry) return entry.data as T;

    // 2. Check session storage (persists on page reloads)
    const sessionEntry = readFromSession<T>(key);
    if (sessionEntry) {
      memoryStore.set(key, sessionEntry);
      return sessionEntry.data;
    }

    return null;
  },

  /**
   * Check if cache entry is older than maxAgeMs (default: 90 seconds)
   */
  isStale(key: string, maxAgeMs = 90000): boolean {
    const entry = memoryStore.get(key) || readFromSession(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > maxAgeMs;
  },

  /**
   * Store data in memory and session storage with current timestamp
   */
  set<T>(key: string, data: T) {
    if (data === undefined || data === null) return;
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    memoryStore.set(key, entry);
    saveToSession(key, entry);
  },

  /**
   * Invalidate all or matching keys from RAM and sessionStorage
   */
  invalidate(prefixOrKey?: string) {
    if (!prefixOrKey) {
      memoryStore.clear();
      removeFromSession();
      return;
    }
    for (const key of memoryStore.keys()) {
      if (key === prefixOrKey || key.startsWith(prefixOrKey)) {
        memoryStore.delete(key);
      }
    }
    removeFromSession(prefixOrKey);
  },

  /**
   * Deduplicates concurrent fetch requests and saves result in memory
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { maxAgeMs?: number; forceRefresh?: boolean }
  ): Promise<T> {
    const maxAgeMs = options?.maxAgeMs ?? 120000;

    // Return fresh cached copy if not forced and within maxAgeMs
    if (!options?.forceRefresh) {
      const cached = memoryStore.get(key) || readFromSession<T>(key);
      if (cached && Date.now() - cached.timestamp < maxAgeMs) {
        if (!memoryStore.has(key)) memoryStore.set(key, cached);
        return cached.data;
      }
    }

    // Deduplicate in-flight promises to avoid duplicate network calls
    if (inflightPromises.has(key)) {
      return inflightPromises.get(key)!;
    }

    const promise = (async () => {
      try {
        const result = await fetcher();
        if (result !== undefined && result !== null) {
          const entry: CacheEntry<T> = { data: result, timestamp: Date.now() };
          memoryStore.set(key, entry);
          saveToSession(key, entry);
        }
        return result;
      } finally {
        inflightPromises.delete(key);
      }
    })();

    inflightPromises.set(key, promise);
    return promise;
  }
};
