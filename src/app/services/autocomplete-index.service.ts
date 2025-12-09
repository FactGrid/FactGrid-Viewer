import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface AutocompleteEntry {
  label: string;
  id?: string;
  norm: string;
  categories?: string[];
  prop?: string;
  weight?: number;
  aliases?: string[];
}

@Injectable({ providedIn: 'root' })
export class AutocompleteIndexService {
  private index: AutocompleteEntry[] | null = null;
  private loading: Promise<AutocompleteEntry[]> | null = null;

  constructor(private http: HttpClient) {}

  private normalize(s: string | undefined | null): string {
    if (!s) return '';
    return s
      .toLowerCase()
      .normalize('NFD')
      // remove combining diacritical marks (e.g. accents) only
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async ensureLoaded(): Promise<AutocompleteEntry[]> {
    if (this.index) return this.index;
    if (!this.loading) {
      this.loading = this.http
        .get<AutocompleteEntry[]>('/assets/data/autocomplete-index.json')
        .toPromise()
        .then((res) => {
          this.index = (res || []).map((e) => ({ ...e, norm: this.normalize(e.label) }));
          return this.index;
        })
        .catch(() => {
          this.index = [];
          return this.index;
        });
    }
    return this.loading;
  }

  /** Return top N matches for prefix in the index; optionally filter by categories */
  async getMatches(prefix: string, topN = 1, categories?: string[]): Promise<AutocompleteEntry[]> {
    const normalized = this.normalize(prefix);
    if (!normalized) return [];
    try {
      console.debug('[AutocompleteIndexService] getMatches prefix ->', prefix, 'normalized ->', normalized, 'categories ->', categories, 'topN ->', topN);
    } catch {}
    const list = await this.ensureLoaded();
    // prefer exact prefix on norm; also consider alias norms if present
    const matches = list
      .filter((e) => {
        if (categories && categories.length > 0) {
          const cats = e.categories || [];
          const intersects = categories.some((c) => cats.includes(c));
          if (!intersects) return false;
        }
        if (e.norm.startsWith(normalized)) return true;
        if (e.aliases && e.aliases.some((a) => this.normalize(a).startsWith(normalized))) return true;
        return false;
      })
      .sort((a, b) => (b.weight || 0) - (a.weight || 0));

    try {
      console.debug('[AutocompleteIndexService] matches for', normalized, '->', matches.slice(0, topN));
    } catch {}
    return matches.slice(0, topN);
  }
}
