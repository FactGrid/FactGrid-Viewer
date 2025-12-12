import { Injectable, inject } from '@angular/core';
import { map, tap, catchError, concatMap, bufferCount, delay } from 'rxjs/operators';
import { Observable, forkJoin, of, from, concat as rxConcat } from 'rxjs';
import { RequestService } from './request.service';
import { SelectedLangService } from '../selected-lang.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectsListService {
  private request = inject(RequestService);
  private lang = inject(SelectedLangService);
  private readonly PROJECTS_CACHE_KEY = 'researchFieldsCacheV1';

  langService: string =
    '%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22' +
    this.lang.selectedLang +
    '%22%2C%22en%22.%20%7D%0A';

  projectsListBuilding(ids: string | string[]) {
    // ids can be either a single id string (e.g., 'Q11295') or an array of ids
    const idsArray = Array.isArray(ids) ? ids : [ids];
    // Build a raw SPARQL query and encode it to a proper sparql endpoint URL
    const valuesClause = idsArray.map((i) => `wd:${i}`).join(' ');
    const rawSparql = `SELECT DISTINCT ?item ?itemLabel WHERE { SERVICE wikibase:label { bd:serviceParam wikibase:language "${this.lang.selectedLang},en". } VALUES ?p { ${valuesClause} } ?item wdt:P2 ?p . }`;
    const url = 'https://database.factgrid.de/sparql?query=' + encodeURIComponent(rawSparql) + '&format=json';
    return this.request.getList(url).pipe(map((res) => this.listFromSparql(res)));
  }

  private saveProjectsCacheForLang(lang: string, projects: any[]) {
    try {
      const raw = localStorage.getItem(this.PROJECTS_CACHE_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      obj[lang] = { projects, ts: Date.now() };
      localStorage.setItem(this.PROJECTS_CACHE_KEY, JSON.stringify(obj));
    } catch (e) {}
  }

  private loadProjectsCacheForLang(lang: string): any[] | null {
    try {
      const raw = localStorage.getItem(this.PROJECTS_CACHE_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      if (obj && obj[lang] && Array.isArray(obj[lang].projects)) return obj[lang].projects;
    } catch (e) {}
    return null;
  }
  public loadCacheForLang(lang: string): any[] | null {
    return this.loadProjectsCacheForLang(lang);
  }

  /** Query to get number of research fields (for cache invalidation check) */
  private getResearchFieldCountQuery(): string {
    return `https://database.factgrid.de/sparql?query=SELECT (COUNT(DISTINCT ?item) as ?c) WHERE { VALUES ?p { wd:Q11295 wd:Q395090 } ?item wdt:P2 ?p . }`;
  }

  getResearchFieldCount(): Observable<number> {
    return this.request.getList(this.getResearchFieldCountQuery()).pipe(
      map((res: any) => Number(res.results.bindings[0].c.value || 0)),
      catchError(() => of(0))
    );
  }

  /** Build a query to fetch research fields for a language */
  private getResearchFieldQuery(lang: string): string {
    return `https://database.factgrid.de/sparql?query=SELECT ?item ?itemLabel ?itemDescription  WHERE { SERVICE wikibase:label { bd:serviceParam wikibase:language "${lang},en". } VALUES ?p { wd:Q11295 wd:Q395090 } ?item wdt:P2 ?p . }&format=json`;
  }

  /** Fetches research fields and caches them for a given language */
  fetchResearchFieldsForLang(lang: string): Observable<any[]> {
    return this.request.getList(this.getResearchFieldQuery(lang)).pipe(
      map((res) => {
        const bindings = res.results.bindings || [];
        const projects = bindings.map((b: any) => {
          // Extract ID from URI (e.g., "http://database.factgrid.de/entity/Q123" -> "Q123")
          const uri = b.item?.value ?? '';
          const id = uri.split('/').pop() ?? '';
          return { 
            id: id, 
            name: b.itemLabel?.value ?? '', 
            description: b.itemDescription?.value ?? '' 
          };
        });
        projects.sort((a: any, b: any) => a.name.localeCompare(b.name));
        return projects;
      }),
      tap((projects: any[]) => this.saveProjectsCacheForLang(lang, projects)),
      catchError((e) => {
        return of([] as any[]);
      })
    );
  }

  /** Prefetch caches for all given languages */
  prefetchResearchFieldsCachesForLanguages(langs: string[]) {
    const calls = langs.map((l) => this.fetchResearchFieldsForLang(l));
    return forkJoin(calls).pipe();
  }

  /**
   * Prefetch caches progressively: first priority languages, then others in batches.
   * Returns an observable that completes once all fetches are done.
   */
  prefetchResearchFieldsWithPriority(
    priority: string[],
    others: string[],
    batchSize: number = 3,
    delayMs: number = 500
  ): Observable<any> {
    // Ensure uniqueness and remove empty entries
    const unique = (arr: string[]) => Array.from(new Set((arr || []).filter(Boolean)));
    const pri = unique(priority);
    const oth = unique(others.filter((l) => !pri.includes(l)));

    const priCalls = pri.length > 0 ? forkJoin(pri.map((l) => this.fetchResearchFieldsForLang(l))) : of([]);

    // Others: buffer into batches and fetch sequentially with delay
    const othersCalls = oth.length > 0
      ? from(oth).pipe(
          bufferCount(batchSize),
          concatMap((batch) =>
            forkJoin(batch.map((l) => this.fetchResearchFieldsForLang(l))).pipe(
              // small delay between batches to avoid overload
              delay(delayMs),
              map((r) => r)
            )
          )
        )
      : of([]);

    // combine priority + others sequentially
    return rxConcat(priCalls, othersCalls);
  }

  /** Returns cached projects for a language if present; otherwise fetches */
  getCachedOrFetchResearchFields(lang: string): Observable<any[]> {
    const cached = this.loadProjectsCacheForLang(lang);
    if (cached && cached.length > 0) return of(cached);
    return this.fetchResearchFieldsForLang(lang);
  }

  listFromSparql(res) {
    if (res !== undefined) {
      if (res.results !== undefined) {
        let v = res.results.bindings;
        for (let i = 0; i < v.length; i++) {
          v[i]['item'].id = v[i]['item'].value.replace('https://database.factgrid.de/entity/', '');
        }

        v.sort((a, b) => {
          if (a.itemLabel.value.toUpperCase() < b.itemLabel.value.toUpperCase()) {
            return -1;
          }
          if (b.itemLabel.value.toUpperCase() > b.itemLabel.value.toUpperCase()) {
            return 1;
          }
          return 0;
        });
      }
    }
    return res.results.bindings;
  }

  newSparqlAddress(address: string): string {
    const newPrefix = 'https://database.factgrid.de/sparql?query=';
    let oldPrefix = 'https://database.factgrid.de/query/#';
    if (address.includes('embed.html')) {
      oldPrefix = 'https://database.factgrid.de/query/embed.html#';
    }
    if (address !== undefined) address = address.replace(oldPrefix, newPrefix);
    return address;
  }
}
