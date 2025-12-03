import { Injectable } from '@angular/core';
import { WikibaseEntity } from '../models/wikibase-entity.model';

/**
 * Service to manage search caches (term cache and broad cache)
 * Aligned with the SearchComponent after refactoring.
 */
@Injectable({ providedIn: 'root' })
export class SearchCacheService {
  // --- Broad cache for large result sets (completion, etc.) ---
  private broadCacheInput: string = '';
  private broadCacheItems: WikibaseEntity[] = [];
  private broadCacheComplete: boolean = false;

  // Generic in-memory cache store: key => { value, ts (ms), ttl(ms) }
  private genericCache = new Map<string, { value: any; ts: number; ttl?: number }>();
  private defaultGenericTTL = 1000 * 60 * 5; // 5 minutes
  private defaultMaxGenericEntries = 50; // avoid unbounded memory growth

  /**
   * Invalidate all caches (called when search is reset)
   */
  invalidateCache(): void {
    this.broadCacheInput = '';
    this.broadCacheItems = [];
    this.broadCacheComplete = false;
  }

  /**
   * Set the completeness status of the broad cache (API truncated or not)
   */
  setCacheComplete(isComplete: boolean): void {
    this.broadCacheComplete = isComplete;
  }

  /**
   * Get the current items in the broad cache
   */
  getItems(): WikibaseEntity[] {
    return this.broadCacheItems;
  }

  /**
   * Is the broad cache complete (not truncated by API limits)?
   */
  isComplete(): boolean {
    return this.broadCacheComplete;
  }

  /**
   * Cache the items for the current search input (when API is not truncated)
   */
  cacheItems(input: string, items: WikibaseEntity[]): void {
    this.broadCacheInput = input;
    this.broadCacheItems = items;
  }

  // --- Generic cache API ---
  setItem(key: string, value: any, ttlMs?: number, maxEntries?: number): void {
    try {
      // prune expired entries first
      this.pruneGenericCache();

      // LRU-ish pruning when reaching maxEntries
      const maxE = maxEntries ?? this.defaultMaxGenericEntries;
      if (this.genericCache.size >= maxE) {
        // drop the oldest entry
        let oldestKey: string | null = null;
        let oldestTs = Infinity;
        for (const [k, v] of this.genericCache.entries()) {
          if (v.ts < oldestTs) {
            oldestKey = k;
            oldestTs = v.ts;
          }
        }
        if (oldestKey) this.genericCache.delete(oldestKey);
      }

      this.genericCache.set(key, { value, ts: Date.now(), ttl: ttlMs ?? this.defaultGenericTTL });
    } catch (e) {
      // noop
    }
  }

  getItem(key: string): any | null {
    this.pruneGenericCache();
    const v = this.genericCache.get(key);
    return v ? v.value : null;
  }

  // find first entry with key prefix
  getItemByPrefix(prefix: string): any | null {
    this.pruneGenericCache();
    for (const [k, v] of this.genericCache.entries()) {
      if (k.startsWith(prefix)) return v.value;
    }
    return null;
  }

  deleteItem(key: string): void {
    try {
      this.genericCache.delete(key);
    } catch {}
  }

  clearGeneric(): void {
    try {
      this.genericCache.clear();
    } catch {}
  }

  private pruneGenericCache(): void {
    const now = Date.now();
    for (const [k, v] of Array.from(this.genericCache.entries())) {
      if (v.ttl && now - v.ts > v.ttl) this.genericCache.delete(k);
    }
  }
}
