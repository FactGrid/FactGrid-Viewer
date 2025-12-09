import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  ChangeDetectionStrategy,
  Output,
  EventEmitter,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Observable,
  Subscription,
  BehaviorSubject,
  map,
  switchMap,
  delay,
  tap,
  finalize,
  debounceTime,
  combineLatest,
  filter,
  startWith,
  of,
  take,
  catchError,
  forkJoin,
  distinctUntilChanged,
  firstValueFrom,
} from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { OverlayModule } from '@angular/cdk/overlay';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { SetLanguageService } from '../services/set-language.service';
import { RequestService, WBSearchResponse, GetEntitiesResponse, WBSearchEntry } from '../services/request.service';
import { AutocompleteIndexService, AutocompleteEntry } from '../services/autocomplete-index.service';
import { SparqlResults, SparqlBinding } from '../services/sparql-types';
import { SelectedLangService } from '../selected-lang.service';
import { SelectedResearchFieldService } from '../services/selected-research-field.service';
import { WikibaseSearchService } from '../services/wikibase-search.service';
import { SearchFilterService } from '../services/search-filter.service';
import { SearchCacheService } from '../services/search-cache.service';

import { WikibaseEntity, EnrichedWikibaseEntity } from '../models/wikibase-entity.model';
import { ResearchField } from '../models/research-field.model';

function normalizeString(s: string | undefined | null): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const results: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    results.push(array.slice(i, i + chunkSize));
  }

  
  
  return results;
  
}

@Component({
  selector: 'app-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatSelectModule,
    OverlayModule,
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, OnDestroy, AfterViewInit {
  // ========== SERVICES ==========
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly request = inject(RequestService);
  private readonly autocompleteIndex = inject(AutocompleteIndexService);
  private readonly setLanguage = inject(SetLanguageService);
  private readonly lang = inject(SelectedLangService);
  private readonly selectedResearchField = inject(SelectedResearchFieldService);
  private readonly wikibaseSearch = inject(WikibaseSearchService);
  private readonly searchFilter = inject(SearchFilterService);
  private readonly searchCache = inject(SearchCacheService);
  private readonly router = inject(Router);

  // ========== OUTPUTS (EMBEDDED MODE) ==========
  @Output() itemSelected = new EventEmitter<string>();

  // mode compact only — no external input

  // ========== UI TEXTS ==========
  title = 'factgrid';
  subtitle = '';
  advanced_search = '';
  projects = '';
  fields = '';
  dataOptions = '';
  projectsInput = '';
  itemsInput = '';
  filterResults = '';
  formerVisitsTitle = '';
  filterPeopleActivate = '';
  filterPeopleDeactivate = '';
  filterPublicationActivate = '';
  filterPublicationDeactivate = '';

  // ========== COMPONENT STATE ==========
  showResearchField = false;
  showInDescription = false;
  isSearching = false;
  showProjectDropdown = false;
  projectDisplayValue = '';

  // ========== FORM CONTROLS ==========
  searchResearchField = new FormControl<ResearchField | string>('');
  searchInput = new FormControl();
  filterInput = new FormControl('');

  // ========== LINKS ==========
  clickedItemId: string | null = null;

  // ========== DATA SOURCES ==========
  researchFields: ResearchField[] = [];
  private researchFields$ = new BehaviorSubject<ResearchField[]>([]);
  filteredResearchFields$: Observable<ResearchField[]>;
  items: EnrichedWikibaseEntity[] = [];
  private items$ = new BehaviorSubject<EnrichedWikibaseEntity[]>([]);
  filteredItems$: Observable<EnrichedWikibaseEntity[]>;
  // Observable indiquant si l'overlay doit être ouvert (utilisé pour debug/contrôle)
  overlayOpen$: Observable<boolean>;
  // runtime flag set when an overlay pane with expected class is present
  overlayAttached = false;
  // --- adaptive attach latency estimator (persisted) ---
  private overlayAttachLatencyEstimateMs = 100; // initial guess (ms)
  private overlayAttachLatencyAlpha = 0.25; // EMA alpha
  private readonly OVERLAY_ESTIMATE_KEY = 'search.overlayAttachEstimateMs';
  private lastOverlayOpenTimestamp: number | null = null;
  // history overlay behaviour (for visited items panel)
  historyOverlayOpen$ = new BehaviorSubject<boolean>(false);
  // pagination/pages removed for compact-only mode
  selectedItemsList: Array<EnrichedWikibaseEntity | { value?: { id?: string; label?: string } }> = [];
  selectedResearchField$ = this.selectedResearchField.selectedResearchField$;

  // ========== SUBSCRIPTIONS ==========
  private subscriptions: Subscription[] = [];

  // monotonic id for current search query — used to guard against stale responses
  // ----- autocomplete limits (tunable) -----
  private readonly SR_LIMIT = 50; // how many ids to request from CirrusSearch by default
  private readonly DETAIL_K_DESKTOP = 10; // how many detailed entities to fetch for desktop
  private readonly DETAIL_K_MOBILE = 5; // for mobile
  private readonly SEE_MORE_LIMIT = 200; // how many ids to request when user clicks Voir plus
  private readonly SEE_MORE_DETAILS_DESKTOP = 50; // detailed entities to fetch after See more
  private readonly SEE_MORE_DETAILS_MOBILE = 20;
  private readonly EXPANSION_DETAIL_LIMIT = 20; // limit for expansion fetches
  private currentQueryId = 0;
  // total count of results from last autocomplete fetch (approx. server total if available)
  currentTotalCount = 0;
  // remember last project-mode srsearch so 'Voir plus' can re-run with a larger limit
  private lastProjectSrsearch: string | null = null;
  private lastProjectSelectedId: string | null = null;

  // ========== SUBJECTS ==========
  showInDescriptionSubject = new BehaviorSubject<boolean>(false);

  // pagination / totals removed — compact-only

  // ========== API ENDPOINTS ==========
  private readonly baseGetURL = 'https://database.factgrid.de//w/api.php?action=wbgetentities&ids=';
  private readonly getUrlSuffix = '&format=json&origin=*';

  // ========== FILTERS ==========
  filterPeople: 'people' | null = null;
  filterPublication: 'publication' | null = null;

  // ========== CACHING MECHANISM ==========
  private termCache: { [term: string]: EnrichedWikibaseEntity[] } = {};
  private broadCacheInput: string = '';
  private broadCacheItems: EnrichedWikibaseEntity[] = [];
  private broadCacheComplete: boolean = false;
  // items the component has seen/displayed before — used to preserve
  // previously-displayed matches during input evolution and merging.
  private seenItems: Map<string, EnrichedWikibaseEntity> = new Map();
  // timer for delayed application of result updates (ms)
  private resultApplyDelayMs: number = 300;
  // We use RxJS delay + switchMap to schedule apply; no manual timer
  // instance is required here.

  // pagination removed for compact-only mode

  ngAfterViewInit(): void {
    // no-op; ViewChild is available for manual overlay positioning
  }

  togglePeopleFilter() {
    if (this.filterPeople === 'people') {
      this.filterPeople = null;
    } else {
      this.filterPeople = 'people';
      this.filterPublication = null;
    }
    this.searchInput.setValue(this.searchInput.value || '');
  }

  togglePublicationFilter() {
    if (this.filterPublication === 'publication') {
      this.filterPublication = null;
    } else {
      this.filterPublication = 'publication';
      this.filterPeople = null;
    }
    this.searchInput.setValue(this.searchInput.value || '');
  }

  ngOnInit(): void {
    // ngOnInit called
    this.initTranslations();
    this.initSelectedItemsList();
    this.initShowResearchFieldSync();
    this.initResearchFields();
    this.initProjectList();
    this.initSearchResults();
    this.initFilteredItems();

    this.searchInput.valueChanges.subscribe(() => {
      this.filterInput.setValue('', { emitEvent: false });
    });

    // hydrate persisted attach-latency estimate if available
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(this.OVERLAY_ESTIMATE_KEY) : null;
      if (raw != null) {
        const parsed = Number(raw);
        if (!Number.isNaN(parsed) && isFinite(parsed) && parsed > 0) {
          this.overlayAttachLatencyEstimateMs = Math.max(10, Math.round(parsed));
        }
      }
    } catch {}

    const overlaySub = this.overlayOpen$?.subscribe();
    if (overlaySub) this.subscriptions.push(overlaySub);

    // ensure body scroll is locked while history overlay is open
    const histSub = this.historyOverlayOpen$.subscribe((open) => {
      try {
        if (open) document.body.classList.add('no-overlay-scroll');
        else document.body.classList.remove('no-overlay-scroll');
      } catch {}
    });
    this.subscriptions.push(histSub);
  }

  // Required trackBy helper used from templates with @for ... track trackById(...)
  trackById(index: number, item: EnrichedWikibaseEntity | { value?: { id?: string; label?: string } } | null): string | number {
    if (!item) return index;
    // support objects wrapped in { value: { id, label } }
    if (item && (item as any).value && ((item as any).value.id || (item as any).value.label)) return (item as any).value.id ?? (item as any).value.label;
    // item may be a WikibaseEntity or a wrapped object { value: { id, label } }
    try {
      if (item && typeof item === 'object') {
        if ('id' in item || 'label' in item) return (item as any).id ?? (item as any).label ?? index;
        if ((item as any).value) return (item as any).value.id ?? (item as any).value.label ?? index;
      }
    } catch {}
    return index;
  }

  onItemRowClick(itemId: string, event?: MouseEvent) {
    if (event) {
      // allow Ctrl/Cmd/Shift or middle-click to open in new tab/window - don't block default in that case
      const isModifiedClick =
        event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1;
      if (!isModifiedClick) {
        event.preventDefault();
      } else {
        // If the user wanted a new tab/window, let the browser handle it.
        return;
      }
    }
    this.clickedItemId = itemId;
    // Item click handling — no debug logging in production code
    // Changement de couleur temporaire (par exemple 200ms)
    setTimeout(() => {
      this.clickedItemId = null;
      // Always emit selection event so embedding parents can react
      const hasParent = !!(
        this.itemSelected &&
        (this.itemSelected as any).observers &&
        (this.itemSelected as any).observers.length
      );
      this.itemSelected.emit(itemId);
      // Only navigate when running standalone (no parent subscribers)
      if (!hasParent) {
        this.router.navigate(['/item', itemId]);
      }
      // Ferme le panneau de résultats en vidant la recherche et la liste
      this.searchInput.setValue('', { emitEvent: true });
      this.filterInput.setValue('', { emitEvent: false });
      this.items = [];
      this.items$.next([]);
      this.changeDetector.markForCheck();
    }, 200);
  }

  private initResearchFields() {
    const sub = this.selectedResearchField.selectedResearchField$.subscribe((selected) => {
      this.searchResearchField.setValue(selected, { emitEvent: false });
      this.updateProjectDisplayValue(selected);
      this.searchInput.setValue('');
      this.items = [];
      this.items$.next([]);
      this.changeDetector.markForCheck();
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    try {
      document.body.classList.remove('no-overlay-scroll');
    } catch (e) {
      // ignore in test environments without document
    }
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.items = [];
    this.items$.next([]);
    this.termCache = {};
    this.broadCacheItems = [];
  }

  toggleHistoryOverlay(): void {
    this.historyOverlayOpen$.next(!this.historyOverlayOpen$.getValue());
  }

  closeHistoryOverlay(): void {
    this.historyOverlayOpen$.next(false);
  }

  private initTranslations() {
    const lang = this.lang.selectedLang;
    this.subtitle = this.lang.getTranslation('subtitle', lang);
    this.advanced_search = this.lang.getTranslation('advanced_search', lang);
    this.projects = this.lang.getTranslation('projects', lang);
    this.fields = this.lang.getTranslation('fields', lang);
    this.projectsInput = this.lang.getTranslation('projectsInput', lang);
    this.itemsInput = this.lang.getTranslation('itemsInput', lang);
    this.formerVisitsTitle = this.lang.getTranslation('formerVisitsTitle', lang);
    this.filterResults = this.lang.getTranslation('filterResults', lang);
    this.filterPeopleActivate = this.lang.getTranslation('filterPeopleActivate', lang);
    this.filterPeopleDeactivate = this.lang.getTranslation('filterPeopleDeactivate', lang);
    this.filterPublicationActivate = this.lang.getTranslation('filterPublicationActivate', lang);
    this.filterPublicationDeactivate = this.lang.getTranslation(
      'filterPublicationDeactivate',
      lang
    );
    this.dataOptions = this.lang.getTranslation('results', lang);
  }

  private initSelectedItemsList() {
    const stored = localStorage.getItem('selectedItems');
    this.selectedItemsList = stored ? (JSON.parse(stored) as Array<EnrichedWikibaseEntity | { value?: { id?: string; label?: string } }>).filter((el: unknown) => el !== null) : [];
  }

  private initShowResearchFieldSync() {
    const sub = this.selectedResearchField.showResearchField$.subscribe((show) => {
      this.showResearchField = show;
      this.changeDetector.markForCheck();
    });
    this.subscriptions.push(sub);
  }

  private initProjectList() {
    const selected = this.selectedResearchField.getSelectedResearchField();
    this.searchResearchField.setValue(selected);
    this.updateProjectDisplayValue(selected);

    this.filteredResearchFields$ = combineLatest([
      this.researchFields$,
      this.searchResearchField.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([fields, value]) => {
        const search = (typeof value === 'string' ? value : value?.name || '').toLowerCase();
        return fields.filter((f) => f.name.toLowerCase().includes(search));
      })
    );

    this.request
      .getList(this.getResearchFieldQuery(this.lang.selectedLang))
      .pipe(
        map((res) => this.listFromSparql(res)),
        map((res) => [
          { name: '-', id: '-', description: '' },
          ...res.results.bindings.map((b: SparqlBinding) => ({
            name: b.itemLabel.value,
            id: b.item.id,
            description: b.itemDescription?.value ?? '',
          })),
        ])
      )
      .subscribe((projects) => {
        projects.sort((a: ResearchField, b: ResearchField) => a.name.localeCompare(b.name));
        this.researchFields = projects;
        this.researchFields$.next(projects);
      });
  }

  private getResearchFieldQuery(lang: string): string {
    return `https://database.factgrid.de/sparql?query=SELECT ?item ?itemLabel ?itemDescription  
    WHERE {
      SERVICE wikibase:label { bd:serviceParam wikibase:language "${lang},en". }
      ?item wdt:P2 wd:Q11295.
    }`;
  }

  /**
   * Récupère jusqu'à 50 items
   */
  private fetchAutocompleteEntities(
    searchTerm: string,
    lang: string,
    maxResults: number = this.SR_LIMIT,
    selectedProjectId?: string
  ): Observable<{ items: EnrichedWikibaseEntity[]; total: number }> {
    // If a project is selected, use Cirrus search (action=query list=search) with
    // property filters (haswbstatement:P131=...) to restrict results to items in that project.
    // Build cache keys used for accelerated lookup and to avoid duplicate API calls
    const wbsearchKey = `wbsearch:${this.lang.selectedLang}:${searchTerm}:${maxResults}`;

    if (
      selectedProjectId &&
      selectedProjectId !== 'all' &&
      selectedProjectId !== '-' &&
      selectedProjectId !== 'Q0'
    ) {
      const filters = this.buildSearchFilters(selectedProjectId, searchTerm);
      const srsearch = filters.join(' ');
        const qidsKey = `qids:${selectedProjectId}:${srsearch}:${maxResults}`;

      // Try cache for the Cirrus titles result first
      const cachedTitles = this.searchCache.getItem(qidsKey);
      if (Array.isArray(cachedTitles) && cachedTitles.length > 0) {
        const ids = cachedTitles
          .map((t: string) => (t ? String(t).split(':').pop() : ''))
          .filter(Boolean);
        // only fetch detailed entities for the top K; prefer smaller payload on mobile
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 700;
        const detailK = isMobile ? this.DETAIL_K_MOBILE : this.DETAIL_K_DESKTOP;
        const detailsIds = ids.slice(0, detailK);
        // Use fetchEntities (which has entity-level caching) to return typed results
        return this.fetchEntities(detailsIds).pipe(map((items) => ({ items, total: cachedTitles.length })));
      }
      // getQidsList returns page titles (e.g. Q123). Use it to then fetch entities data.
      return this.request.getQidsList(srsearch, maxResults).pipe(
        switchMap((result: { titles?: string[]; total?: number }) => {
          const titles: string[] = result?.titles ?? [];
          const total: number = Number(result?.total ?? (titles || []).length) || 0;
          // cache titles list for a short time (2 minutes) to avoid re-requesting repeated searches
          try {
            // cache only the titles array (legacy storage format)
            this.searchCache.setItem(qidsKey, titles, 1000 * 60 * 2);
          } catch (e) {}

          // If Cirrus returned titles, fetch entities and apply client-side filtering
          // with phrase-priority. Keep behaviour straightforward: if titles are
          // empty, return an empty result (no complex fallback queries).
          // remember last srsearch for See-more behavior
          this.lastProjectSrsearch = srsearch;
          this.lastProjectSelectedId = selectedProjectId ?? null;

          if (Array.isArray(titles) && titles.length > 0) {
            const ids = (titles || []).map((t) => (t ? String(t).split(':').pop() : '')).filter(Boolean);
            // only fetch detailed entities for the top-K to reduce payload; leave total as server total
            const isMobile = typeof window !== 'undefined' && window.innerWidth <= 700;
            const detailK = isMobile ? this.DETAIL_K_MOBILE : this.DETAIL_K_DESKTOP;
            const detailsIds = ids.slice(0, detailK);
            return this.fetchEntities(detailsIds).pipe(
              map((items) => {
                const normalized = normalizeString(searchTerm);
                // token-based (non-consecutive) filtered results
                const filtered = items.filter((it) => this.matchesAllTokens(it, normalized, this.showInDescription));

                // phrase priority: find items where the full normalized search term
                // appears as a substring in the item label/aliases/description
                const phraseMatches = items.filter((it) => {
                  const lbl = normalizeString(it.label);
                  const aliases = (it.aliases || []).map(normalizeString);
                  const desc = normalizeString(it.description);
                  return (
                    (lbl && lbl.includes(normalized)) ||
                    aliases.some((a) => a.includes(normalized)) ||
                    (this.showInDescription && desc.includes(normalized))
                  );
                });

                // mark items with an exactPhraseMatch flag (used by template for styling)
                const itemsEnriched = items as EnrichedWikibaseEntity[];
                itemsEnriched.forEach((it) => {
                  it.exactPhraseMatch = phraseMatches.includes(it);
                });

                const resultItems: EnrichedWikibaseEntity[] =
                  phraseMatches.length > 0
                    ? [...phraseMatches, ...filtered.filter((f) => !phraseMatches.includes(f))]
                    : filtered;

                // If our client-side filter removed all entries, do NOT return
                // the raw items. Returning raw (unfiltered) items caused
                // transient display of unrelated results — instead return an
                // empty result and let client-side merging / seenItems decide
                // whether any previously-seen item should be preserved.
                return { items: resultItems, total: resultItems.length };
                return { items: resultItems, total };
              })
            );
          }

          // No titles returned -> return empty result for project-mode
          return of({ items: [], total: 0 });
        })
      );
    }

    // Default: use the faster wbsearchentities path when no project filter is active.
    // Fast path: cached wbsearch response
    const cachedSearch = this.searchCache.getItem(wbsearchKey);
    if (cachedSearch) {
      return of(cachedSearch);
    }

    return this.request.searchItem(searchTerm, lang, 0, maxResults).pipe(
      map((res: WBSearchResponse) => {
        const total = res.searchinfo?.totalhits ?? res.search?.length ?? 0;
        const items = (res.search || []).map((e: WBSearchEntry) => ({
          id: e.id,
          label: e.label,
          aliases: (e.aliases || [])
            .filter((a: any) => a.language === lang)
            .map((a: any) => a.value),
          description: e.description || '',
          })) as EnrichedWikibaseEntity[];
        const out = { items, total };
        try {
          // cache fast search results for a short TTL to reduce duplicate requests when typing
          this.searchCache.setItem(wbsearchKey, out, 1000 * 60 * 2);

          // OPTIMIZATION: Warm up the individual entity cache with these results.
          // If the user later switches to a project search that returns these same IDs,
          // we won't need to fetch their details again via wbgetentities.
          items.forEach((item: EnrichedWikibaseEntity) => {
            this.searchCache.setItem(`entity:${item.id}:${lang}`, item, 1000 * 60 * 60);
          });
        } catch (e) {}
        return out;
      })
    );
  }

  /**
   * Initialisation de la recherche principale avec pagination UI
   */
  private initSearchResults() {
    // Compact-only search pipeline: simple autocomplete + update items list
    const sub = this.searchInput.valueChanges
      .pipe(
        startWith(this.searchInput.value || ''),
        tap((label) => (this.isSearching = !!label && label.length > 0)),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((label) => {
          const searchTerm = normalizeString(label as string);
          // New query id assigned for this particular user input state.
          // We DO NOT clear the existing items immediately here — keeping the
          // previous results visible while a new request is in flight avoids
          // flicker/brief disappearance of results while the user types.
          // The queryId + searchTerm guard below still protects against stale
          // results overwriting fresh ones when responses arrive out-of-order.
          const myQueryId = ++this.currentQueryId;
            if (!searchTerm) {
            this.searchCache.invalidateCache();
            this.resetSearchState();
            return of([] as EnrichedWikibaseEntity[]);
          }
          const selected = this.selectedResearchField.getSelectedResearchField();
          const selectedId = selected?.id;
          return this.fetchAutocompleteEntities(
            searchTerm,
            this.lang.selectedLang,
            50,
            selectedId
          ).pipe(
            // attach the query id and explicit searchTerm so we can ignore stale responses
            map(({ items, total }) => ({ items, total, searchTerm, queryId: myQueryId })),
            map(({ items, total, searchTerm, queryId }: { items: EnrichedWikibaseEntity[]; total: number; searchTerm: string; queryId: number }) => ({ items, total, searchTerm, queryId })),
            // Apply updates immediately (no scheduled delay). To avoid
            // flashing unrelated / noisy payloads we still perform the
            // stale-guard and a relevance check against tokens. This keeps
            // behaviour simple and deterministic while refusing to show raw
            // fallback items that don't match the current search.
            // payload received — no debug log
            tap(({ items, total, searchTerm, queryId }: { items: EnrichedWikibaseEntity[]; total: number; searchTerm: string; queryId: number }) => {
              // record total for UI / See-more behaviour
              try { this.currentTotalCount = Number(total ?? 0); } catch {}
              const currentNormalized = normalizeString(this.searchInput.value || '');
              // stale-guard: ignore if query id or normalized input no longer matches
              if (queryId !== this.currentQueryId || currentNormalized !== searchTerm) {
                // stale response — ignore silently
                return;
              }

              const merged = this.mergeResultsPreservingPriorMatches(searchTerm, items as EnrichedWikibaseEntity[]);

              // Skip applying if merged contains no relevant matches — this
              // avoids showing noisy unrelated items returned by the server
              // while keeping previously-seen matches that still satisfy the
              // token criteria.
              const hasRelevant = merged.some((it) => this.matchesAllTokens(it, searchTerm, this.showInDescription));
              if (!hasRelevant) {
                // merged set contained no relevant items for current tokens — ignore
                return;
              }

              this.updateItemsList(merged);

              // --- expansion path (prototype): when in project mode and heuristics indicate
              // we should attempt an expansion based on local index candidates (e.g. "Fred" -> "Frédéric")
              try {
                const tokens = (searchTerm || '').split(' ').filter(Boolean);
                const firstToken = tokens.length > 0 ? tokens[0] : '';
                const tokenLen = (firstToken || '').length;
                const shouldTryExpansion = (() => {
                  // trigger expansions for short single-token inputs
                  if (!selectedId) return false; // expansion targets project-mode only for now
                  // token single OR first token only
                  if (tokens.length === 1 && tokenLen > 0 && tokenLen <= 6) return true;
                  // allow expansion if pattern "<firstname> <initial or short fragment>" e.g. "Pierre C" or "Frede Cor"
                  if (tokens.length >= 2) {
                    const second = tokens[1];
                    // initial like 'C' or 'C.'
                    if (/^[a-z]\.?$/.test(second)) return true;
                    // small fragment (2..4) likely last name prefix
                    if (second.length >= 2 && second.length <= 4) return true;
                  }
                  return false;
                })();

                // Debug: show why we choose to expand (or not)
                try {
                  console.debug('[SearchComponent] expansion decision', {
                    searchTerm,
                    tokens,
                    firstToken,
                    tokenLen,
                    selectedId,
                    shouldTryExpansion,
                  });
                } catch {}

                if (shouldTryExpansion) {
                  // get local candidates (topN configurable; prototype default = 1)
                  // Delegate into a helper to keep the pipeline testable.
                  this.attemptProjectExpansion(firstToken, selectedId, queryId, searchTerm).catch(() => {});
                }
              } catch (e) {
                // ensure expansion failures do not break the main pipeline
              }
            }),
            catchError((err) => {
              console.error('[SearchComponent] fetchAutocompleteEntities error', err);
              this.resetSearchState();
              return of([] as EnrichedWikibaseEntity[]);
            })
          );
        })
      )
      .subscribe();
    this.subscriptions.push(sub);
  }

  private async attemptProjectExpansion(
    firstToken: string,
    selectedId: string | undefined,
    queryId: number,
    searchTerm: string
  ): Promise<void> {
    try {
      const candidates: AutocompleteEntry[] = await this.autocompleteIndex.getMatches(firstToken, 1, ['firstName']);
      try { console.debug('[SearchComponent] local-autocomplete candidates for', firstToken, candidates); } catch {}
      for (const c of candidates || []) {
        if (selectedId && c?.id && c?.prop) {
          const srsearch = `haswbstatement:${c.prop}=${c.id} haswbstatement:P131=${selectedId}`;
          try { console.debug('[SearchComponent] project expansion srsearch ->', srsearch); } catch {}
          const res: { titles?: string[]; total?: number } = await firstValueFrom(this.request.getQidsList(srsearch, 50));
          const titles = res?.titles ?? [];
          try { console.debug('[SearchComponent] getQidsList results ->', titles); } catch {}
          const ids = (titles || []).map((t: string) => (t ? String(t).split(':').pop() : '')).filter(Boolean);
          try { console.debug('[SearchComponent] extracted ids ->', ids); } catch {}
          if (ids.length === 0) continue;
          const idsToFetch = ids.slice(0, this.EXPANSION_DETAIL_LIMIT);
          const expItems: EnrichedWikibaseEntity[] = await firstValueFrom(this.fetchEntities(idsToFetch).pipe(take(1)));
          try { console.debug('[SearchComponent] fetched entities for expansion ->', expItems); } catch {}
          const nowNorm = normalizeString(this.searchInput.value || '');
          if (queryId !== this.currentQueryId || nowNorm !== searchTerm) return;
          const mergedExp = this.mergeResultsPreservingPriorMatches(searchTerm, expItems as EnrichedWikibaseEntity[]);
          const hasRelevantExp = mergedExp.some((it) => this.matchesAllTokens(it, searchTerm, this.showInDescription));
          try { console.debug('[SearchComponent] expansion merged result count ->', mergedExp.length, 'hasRelevantExp ->', hasRelevantExp); } catch {}
          if (hasRelevantExp) this.updateItemsList(mergedExp);
        }
      }
    } catch (e) {
      // swallow expansion errors
    }
  }

  private resetSearchState(): void {
    this.items = [];
    this.items$.next([]);
    this.changeDetector.markForCheck();
    this.termCache = {};
    this.broadCacheInput = '';
    this.broadCacheItems = [];
    this.broadCacheComplete = false;
    // Note: delayed application is handled via RxJS delay+switchMap; stale
    // responses will be ignored at apply time so no manual timer cleanup is
    // necessary here.
  }

  private buildSearchFilters(selectedId: string, searchTerm: string): string[] {
    const filters: string[] = [];
    if (this.filterPeople === 'people') {
      filters.push('haswbstatement:P2=Q7');
    }
    if (this.filterPublication === 'publication') {
      filters.push('haswbstatement:P2=Q20');
    }
    if (selectedId && selectedId !== '-' && selectedId !== 'Q0' && selectedId !== 'all') {
      filters.push(`haswbstatement:P131=${selectedId}`);
    }
    // Require ALL tokens for project-mode CirrusSearch queries, but allow
    // partial typing by appending a wildcard to each token. The leading
    // '+' ensures each token must appear somewhere in the indexed document
    // (title, aliases, descriptions or claims). Example: `+jacques* +louis*`.
    // Treat short tokens (length < 3) as permissive (do not prepend '+') to
    // avoid overly strict queries for partial typing like "Jacques Louis D" or "Jacques Louis Da".
    const tokens = searchTerm.split(' ').filter((t) => t.length > 0);
    if (tokens.length > 0) {
      // Treat the final token as the 'typing' token and keep it permissive
      // (no leading '+') so partial typing like "Jule" can match "Jules".
      // For non-final tokens require the token only when it's sufficiently
      // long (>= 3 characters) to avoid overly restrictive queries.
      // Option A: if there are multiple tokens and the final token is a
      // single character (user is typing a new short token like "D"), omit
      // that final token entirely from the server query so we don't ask
      // Cirrus for one-letter partial matches — client-side filtering will
      // handle permissive matching and adjacency.
      let effectiveTokens = tokens.slice();
      const last = tokens[tokens.length - 1];
      if (tokens.length > 1 && last.length === 1) {
        // drop the final single-character typing token for server query
        effectiveTokens = tokens.slice(0, tokens.length - 1);
      }

      const query = effectiveTokens
        .map((t, i) => {
          const isLastEff = i === effectiveTokens.length - 1;
          // if this maps to the final effective token, keep it permissive
          if (isLastEff) return `${t}*`;
          return t.length >= 3 ? `+${t}*` : `${t}*`;
        })
        .join(' ');
      filters.push(query);
    } else {
      filters.push(searchTerm);
    }
    return filters;
  }

  private buildSearchUrl(searchQuery: string): string {
    return (
      'https://database.factgrid.de/w/api.php' +
      '?action=query' +
      '&list=search' +
      '&format=json' +
      '&origin=*' +
      `&srsearch=${encodeURIComponent(searchQuery)}` +
      '&srnamespace=120' +
      '&srlimit=500'
    );
  }

  private fetchEntities(ids: string[]): Observable<EnrichedWikibaseEntity[]> {
    if (ids.length === 0) return of([]);
    // Try to reuse per-entity cache entries before issuing any network requests
    const lang = this.lang.selectedLang;
    const cached: EnrichedWikibaseEntity[] = [];
    const missingIds: string[] = [];
    ids.forEach((id) => {
      const key = `entity:${id}:${lang}`;
      const c = this.searchCache.getItem(key);
      if (c) cached.push(c);
      else missingIds.push(id);
    });

    if (missingIds.length === 0) {
      // All entities were cached
      return of(cached);
    }

    const chunks = chunkArray(missingIds, 50);
    const requests = chunks.map((chunk) => {
      const idsParam = chunk.join('|');
      const getEntitiesUrl =
        `https://database.factgrid.de/w/api.php?action=wbgetentities` +
        `&ids=${idsParam}` +
        `&format=json` +
        `&languages=${this.lang.selectedLang}` +
        `&origin=*`;
      return this.request.getItem(getEntitiesUrl).pipe(
        map((res: GetEntitiesResponse | undefined) => {
          if (!res.entities) return [];
          const adapted = this.adaptEntities(Object.values(res.entities), this.lang.selectedLang);
          // cache each entity individually
          try {
            adapted.forEach((ent) =>
              this.searchCache.setItem(`entity:${ent.id}:${lang}`, ent, 1000 * 60 * 60)
            );
          } catch (e) {}
          return adapted;
        })
      );
    });
    // combine network results with cached entities for final response
    const fetched$ = requests.length > 0 ? forkJoin(requests).pipe(map((results) => results.flat())) : of([] as EnrichedWikibaseEntity[]);
    return fetched$.pipe(map((fetched) => [...cached, ...fetched]));
  }

  private filterResultsLocally(
    entities: EnrichedWikibaseEntity[],
    searchTerm: string,
    showInDescription: boolean
  ): EnrichedWikibaseEntity[] {
    if (!this.broadCacheComplete && this.broadCacheItems.length > 0) {
      return this.broadCacheItems.filter((item) =>
        this.matchesSearchCriteria(item, searchTerm, showInDescription)
      );
    }
    return entities.filter((item) =>
      this.matchesSearchCriteria(item, searchTerm, showInDescription)
    );
  }

  private matchesSearchCriteria(
    item: EnrichedWikibaseEntity,
    searchTerm: string,
    showInDescription: boolean
  ): boolean {
    const normalizedLabel = normalizeString(item.label);
    const normalizedAliases = (item.aliases || []).map(normalizeString);
    const normalizedDesc = normalizeString(item.description);

    // If the entire normalized search term is contained as a phrase -> accept
    if (normalizedLabel.includes(searchTerm)) return true;
    if (normalizedAliases.some((alias) => alias.includes(searchTerm))) return true;
    if (showInDescription && normalizedDesc.includes(searchTerm)) return true;

    // Otherwise, require tokens to match words by prefix (avoid internal-substring matches)
    const tokens = (searchTerm || '').split(' ').map((t) => t.trim()).filter(Boolean);
    if (tokens.length === 0) return true;

    const labelWords = normalizedLabel.split(/[^a-z0-9]+/).filter(Boolean);
    const aliasWords = normalizedAliases.flatMap((a) => a.split(/[^a-z0-9]+/).filter(Boolean));
    const descWords = normalizedDesc.split(/[^a-z0-9]+/).filter(Boolean);

    return tokens.every((token) => {
      if (!token) return true;
      if (token.length === 1) return true;
      if (labelWords.some((w) => w.startsWith(token))) return true;
      if (aliasWords.some((w) => w.startsWith(token))) return true;
      if (showInDescription && descWords.some((w) => w.startsWith(token))) return true;
      return false;
    });
  }

  private updateItemsList(items: EnrichedWikibaseEntity[]): void {
    try {
      console.debug(
        '[SearchComponent] updateItemsList ->',
        { count: items?.length ?? 0, first: (items || []).slice(0, 5).map((i) => i.label) }
      );
    } catch {}
    this.items = items;
    this.items$.next(items);
    // update seenItems cache so we can consider them later when merging
    try {
      items.forEach((it) => this.seenItems.set(it.id, it));
    } catch (e) {}
    this.changeDetector.markForCheck();
  }

  private initFilteredItems() {
    this.filteredItems$ = combineLatest([
      this.items$,
      this.filterInput.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([items, filterValue]) => {
        const filter = normalizeString(filterValue || '');
        if (!filter) return items;
        return items.filter(
          (item) =>
            normalizeString(item.label).includes(filter) ||
            normalizeString(item.description).includes(filter)
        );
      })
    );
    // overlayOpen$ suit la condition utilisée dans le template et logge sa valeur
    this.overlayOpen$ = combineLatest([this.filteredItems$, this.searchInputValue$]).pipe(
      map(([items, input]) => !!(items && items.length > 0 && (input || '').length > 0))

      // overlayOpen state computed
    );

    // On mobile: when overlay is open, prevent body scrolling so the modal-like
    // overlay doesn't let the background content scroll. This is safe because
    // we only toggle a small utility class and remove it on destroy.
    // debug: supervise emissions from filteredItems$ & searchInputValue$
    try {
      combineLatest([this.filteredItems$, this.searchInputValue$])
        .pipe(
          // throttle reporting to avoid huge logs
          debounceTime(60)
        )
        .subscribe(([items, input]) => {
          try {
            console.debug('[SearchComponent] filteredItems$/searchInputValue$ ->', { cnt: items?.length ?? 0, input });
          } catch {}
        });
    } catch {}

    const overlayScrollSub = this.overlayOpen$.subscribe((open) => {
      // debug: explicitly log overlay open state + DOM element info so we
      // can diagnose visibility / placement issues in dev consoles.
      try {
        console.info('[SearchComponent] overlayOpen ->', open);
        if (open && typeof document !== 'undefined') {
          const panes = Array.from(document.querySelectorAll('.cdk-overlay-pane')) as HTMLElement[];
          // log all current overlay panes and their classes/rect so we can see if
          // the search panel exists under another pane or with different classes
          try {
            console.info('[SearchComponent] overlay panes count ->', panes.length);
            panes.forEach((p, ix) => {
              const cls = p.className;
              let rect: DOMRect | null = null;
              try { rect = p.getBoundingClientRect(); } catch {}
              console.info(`[SearchComponent] pane[${ix}] classes ->`, cls, 'rect ->', rect);
            });
          } catch (err) {}

          // also check specifically for the expected pane class
          const pane = document.querySelector('.cdk-overlay-pane.search-items_panel') as HTMLElement | null;
          if (pane) {
            const rect = pane.getBoundingClientRect();
            const style = window.getComputedStyle(pane);
            console.info('[SearchComponent] overlay DOM present (expected class), rect ->', rect, 'computedStyle ->', {
              display: style.display,
              visibility: style.visibility,
              opacity: style.opacity,
              zIndex: style.zIndex,
            });
            // mark that the overlay pane exists so template can hide other UI
            try {
              this.overlayAttached = true;
            } catch {}
            // If we previously recorded when overlayOpen moved to true, use
            // that to compute an observed attach latency and update our EMA
            try {
              const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
              if (this.lastOverlayOpenTimestamp != null) {
                const observed = Math.max(0, now - this.lastOverlayOpenTimestamp);
                this.overlayAttachLatencyEstimateMs = Math.round(
                  this.overlayAttachLatencyAlpha * observed + (1 - this.overlayAttachLatencyAlpha) * this.overlayAttachLatencyEstimateMs
                );
                try { if (typeof localStorage !== 'undefined') localStorage.setItem(this.OVERLAY_ESTIMATE_KEY, String(this.overlayAttachLatencyEstimateMs)); } catch (e) {}
                // clear marker
                this.lastOverlayOpenTimestamp = null;
              }
            } catch (e) {}
          } else {
            console.info('[SearchComponent] overlay DOM not found (no pane with .search-items_panel)');
            // Mark not attached
            try { this.overlayAttached = false; } catch {}
            // start timing when overlayOpen -> true and no pane yet
            try {
              this.lastOverlayOpenTimestamp = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
            } catch {}
          }

          // Inspect whether the global overlay container exists and how many children it has
          try {
            const oc = document.querySelector('.cdk-overlay-container') as HTMLElement | null;
            if (oc) {
              console.info('[SearchComponent] overlayContainer present, childCount ->', oc.childElementCount);
            } else {
              console.info('[SearchComponent] overlayContainer NOT found');
            }
          } catch {}

          // verify the anchor / input exists on the page
          try {
            const anchor = document.querySelector('.new-search-input') as HTMLElement | null;
            if (anchor) console.info('[SearchComponent] anchor/input exists (new-search-input)');
            else console.info('[SearchComponent] anchor/input NOT found (new-search-input)');
          } catch {}
          // ensure change detection updates template usage of overlayAttached
          try { this.changeDetector.markForCheck(); } catch {}
        }
      } catch (err) {
        /* ignore DOM errors in test env */
      }
      // overlayOpen$ debug removed — keep behaviour but do not log to console in production
        try {
          if (typeof window !== 'undefined') {
          // Toggle body scroll-lock on small screens only; but always attempt to log
          if (window.innerWidth <= 700) {
            document.body.classList.toggle('no-overlay-scroll', !!open);
          }
          // debug: log overlay element and its computed styles so we can inspect in browser devtools
          try {
            if (open) {
              const pane = document.querySelector(
                '.cdk-overlay-pane.search-items_panel'
              ) as HTMLElement | null;
              if (pane) {
                const rect = pane.getBoundingClientRect();
              } else {
                // debug removed
              }
            }
          } catch (err) {
            // ignore any DOM errors while debugging
          }
        }
      } catch (e) {
        /* noop in test env where document may not exist */
      }
    });
    this.subscriptions.push(overlayScrollSub);
  }

  seeMore(): void {
    // User clicked the "Voir plus" button — load more results up to SEE_MORE_LIMIT and show more details
    const searchTerm = normalizeString(this.searchInput.value || '');
    if (!searchTerm) return;
    const selected = this.selectedResearchField.getSelectedResearchField();
    const selectedId = selected?.id;
    const lang = this.lang.selectedLang;

    if (selectedId && this.lastProjectSrsearch) {
      // project mode: run a larger Cirrus request
      this.fetchAutocompleteEntities(searchTerm, lang, this.SEE_MORE_LIMIT, selectedId)
        .pipe(take(1))
        .subscribe((res) => {
          const merged = this.mergeResultsPreservingPriorMatches(searchTerm, res.items as EnrichedWikibaseEntity[]);
          this.updateItemsList(merged);
          try { this.currentTotalCount = Number(res.total ?? 0); } catch {}
        });
    } else {
      // non-project: request more wbsearch results
      this.fetchAutocompleteEntities(searchTerm, lang, this.SEE_MORE_LIMIT)
        .pipe(take(1))
        .subscribe((res) => {
          this.updateItemsList(res.items);
          try { this.currentTotalCount = Number(res.total ?? 0); } catch {}
        });
    }
  }

  // hintValue/pages removed for compact-only mode

  isArray(val: unknown): boolean {
    return Array.isArray(val);
  }

  createList(re: WBSearchResponse | { search?: { id?: string }[] } | undefined): string {
    const arr = (re?.search ?? []) as Array<{ id?: string }>;
    const list = arr.map((item) => item.id).filter(Boolean).join('|');
    return this.baseGetURL + list + this.getUrlSuffix;
  }

  listFromSparql(res: SparqlResults | undefined) {
    if (res?.results) {
      for (let i = 0; i < res.results.bindings.length; i++) {
        const binding = res.results.bindings[i];
        binding['item'].id = binding['item'].value.replace(
          'https://database.factgrid.de/entity/',
          ''
        );
        binding['item'].id.startsWith('P')
          ? (binding['item'].entity = 'property')
          : (binding['item'].entity = 'item');
        binding['itemLabel'].value = binding['itemLabel'].value;
        if (binding['itemDescription']) {
          binding['itemDescription'].value = binding['itemDescription'].value;
        } else {
          binding['itemDescription'] = { value: '' };
        }
      }
    } else {
      res = { head: { vars: ['item', 'itemLabel', 'itemDescription'] }, results: { bindings: [] } };
    }
    return res;
  }

  private adaptEntities(entities: Array<Record<string, any>>, lang: string): EnrichedWikibaseEntity[] {
    return entities.map((e) => ({
      id: e.id,
      label: e.labels?.[lang]?.value || '',
      aliases: e.aliases?.[lang]?.map((a: any) => a.value) || [],
      description: e.descriptions?.[lang]?.value || '',
    }));
  }

  /**
   * Merge the newly-retrieved items with previously-displayed items that
   * still match the current search term. This prevents brief disappearance of
   * a previously-selected item when transient server results omit it.
   */
  private mergeResultsPreservingPriorMatches(searchTerm: string, newItems: EnrichedWikibaseEntity[]): EnrichedWikibaseEntity[] {
    // preserve identity by id
    const byId = new Map<string, EnrichedWikibaseEntity>();
    newItems.forEach((it) => byId.set(it.id, it));

    // collect previously displayed or seen items that still match the search term
    const preserved: EnrichedWikibaseEntity[] = [];
    // include currently-displayed items
    (this.items || []).forEach((it) => {
      if (byId.has(it.id)) return; // already included
      if (this.matchesAllTokens(it, searchTerm, this.showInDescription)) preserved.push(it);
    });
    // also consider historical seen items (previously displayed/cached)
    Array.from(this.seenItems.values()).forEach((it) => {
      if (byId.has(it.id)) return; // included in newItems
      // avoid re-adding items already added from this.items
      if (preserved.some((p) => p.id === it.id)) return;
      if (this.matchesAllTokens(it, searchTerm, this.showInDescription)) preserved.push(it);
    });

    const merged: EnrichedWikibaseEntity[] = [...newItems, ...preserved];

    // recompute phrase-priority on the merged set so exact phrase matches
    // remain first (consistent with existing behaviour)
    const normalized = searchTerm;
    const phraseMatches = merged.filter((it) => {
      const lbl = normalizeString(it.label);
      const aliases = (it.aliases || []).map(normalizeString);
      const desc = normalizeString(it.description);
      return (lbl && lbl.includes(normalized)) || aliases.some((a) => a.includes(normalized)) || (this.showInDescription && desc.includes(normalized));
    });
    merged.forEach((it) => (it.exactPhraseMatch = phraseMatches.includes(it)));
    return phraseMatches.length ? [...phraseMatches, ...merged.filter((m) => !phraseMatches.includes(m))] : merged;
  }

  /**
   * Ensure that an entity matches ALL tokens from the search term.
   * Each token must be contained in the item's label or aliases (or description if enabled).
   */
  private matchesAllTokens(item: EnrichedWikibaseEntity, searchTerm: string, showInDescription: boolean): boolean {
    const normalizedLabel = normalizeString(item.label);
    const normalizedAliases = (item.aliases || []).map(normalizeString);
    const normalizedDesc = normalizeString(item.description);

    // tokenized words (split on non-alphanumeric chars after normalization)
    const labelWords = normalizedLabel.split(/[^a-z0-9]+/).filter(Boolean);
    const aliasWords = normalizedAliases.flatMap((a) => a.split(/[^a-z0-9]+/).filter(Boolean));
    const descWords = normalizedDesc.split(/[^a-z0-9]+/).filter(Boolean);

    const tokens = (searchTerm || '')
      .split(' ')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length === 0) return true; // nothing to require

    // Quick path for single-token queries
    if (tokens.length === 1) {
      const token = tokens[0];
      if (!token) return true;
      if (token.length === 1) return true; // permissive for single-char typing
      if (labelWords.some((w) => w.startsWith(token))) return true;
      if (aliasWords.some((w) => w.startsWith(token))) return true;
      if (showInDescription && descWords.some((w) => w.startsWith(token))) return true;
      return false;
    }

    // For multi-token queries, require all tokens to match.
    // Special-case: if the final token is a short fragment (<=2 chars) and
    // doesn't match on its own, allow it to match as the start of the next
    // word following a match for the penultimate token (adjacent pair).
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (!token) continue;

      // permissive for any single-character tokens
      if (token.length === 1) continue;

      // if a non-final token, require it to match normally
      if (i < tokens.length - 1) {
        if (
          labelWords.some((w) => w.startsWith(token)) ||
          aliasWords.some((w) => w.startsWith(token)) ||
          (showInDescription && descWords.some((w) => w.startsWith(token)))
        ) {
          continue; // matched normally
        }

        // otherwise this token failed to match
        return false;

        // otherwise this token failed to match
        return false;
      }

      // final token: normal match or permissive if single-char. If the
      // final token doesn't match on its own and is short (<= 2 chars),
      // perform an adjacency check: look for a consecutive pair of words in
      // label/aliases/description where the first startsWith the penultimate
      // token and the second startsWith the final token.
      if (
        labelWords.some((w) => w.startsWith(token)) ||
        aliasWords.some((w) => w.startsWith(token)) ||
        (showInDescription && descWords.some((w) => w.startsWith(token)))
      ) {
        continue;
      }
      // final didn't match directly — try adjacency if token is sufficiently short
      if (token.length <= 2) {
        const prev = tokens[tokens.length - 2];
        const checkAdjacentArray = (arr: string[]) => {
          for (let k = 0; k < arr.length - 1; k++) {
            if (arr[k].startsWith(prev) && arr[k + 1].startsWith(token)) return true;
          }
          return false;
        };
        if (checkAdjacentArray(labelWords) || checkAdjacentArray(aliasWords) || (showInDescription && checkAdjacentArray(descWords))) {
          continue;
        }
      }

      return false;
    }

    return true;
  }

  researchFieldSelect(researchField: ResearchField | null) {
    if (!researchField) {
      this.selectedResearchField.setSelectedResearchField({
        id: 'all',
        name: 'all',
        description: '',
      });
    } else {
      this.selectedResearchField.setSelectedResearchField({
        id: researchField.id,
        name: researchField.name,
        description: researchField.description ?? '',
      });
      if (researchField.name === 'Paris' || researchField.name === 'Harmonia Universalis') {
        return;
      }
    }
    this.changeDetector.markForCheck();
  }

  public displayResearchField(researchField: ResearchField | string | null): string {
    if (typeof researchField === 'string') {
      return researchField;
    }
    return researchField && researchField.name ? researchField.name : '';
  }

  clearProjectSearch() {
    this.searchResearchField.setValue('');
    this.selectedResearchField.setSelectedResearchField({
      id: 'all',
      name: 'all',
      description: '',
    });
    this.selectedResearchField.setShowResearchField(false);
    this.changeDetector.markForCheck();
  }

  clearItemSearch() {
    this.searchInput.setValue('', { emitEvent: true });
    this.filterInput.setValue('', { emitEvent: false });
    this.items = [];
    this.items$.next([]);
    // pending delayed applies are handled by RXJS switchMap; we do not need
    // to manipulate timers from here.
    // pagination counters removed for compact-only mode
    this.changeDetector.markForCheck();
  }

  onProjectInputFocus() {
    this.showProjectDropdown = true;
    this.changeDetector.markForCheck();
  }

  onProjectInputBlur() {
    setTimeout(() => {
      this.showProjectDropdown = false;
      const selected = this.selectedResearchField.getSelectedResearchField();
      this.updateProjectDisplayValue(selected);
      this.changeDetector.markForCheck();
    }, 200);
  }

  onProjectInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    this.projectDisplayValue = value;
    this.searchResearchField.setValue(value);
    this.showProjectDropdown = true;
    this.changeDetector.markForCheck();
  }

  /** Toggle the compact projects overlay when clicking the left project button */
  toggleProjectOverlay() {
    this.showProjectDropdown = !this.showProjectDropdown;
    this.changeDetector.markForCheck();
  }

  onSearchFieldInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input?.value ?? '';
    // Ensure FormControl has the latest value and trigger valueChanges
    this.searchInput.setValue(value, { emitEvent: true });
  }

  updateProjectDisplayValue(field: ResearchField | null) {
    if (!field || field.id === 'all' || field.id === '-') {
      this.projectDisplayValue = '';
    } else {
      this.projectDisplayValue = field.name;
    }
  }

  selectProjectCompact(project: ResearchField) {
    this.researchFieldSelect(project);
    this.updateProjectDisplayValue(project);
    this.showProjectDropdown = false;
    this.changeDetector.markForCheck();
  }

  onShowInDescriptionChange(checked: boolean) {
    this.showInDescription = checked;
    this.showInDescriptionSubject.next(checked);
  }

  searchInputValue$: Observable<string> = this.searchInput.valueChanges.pipe(
    startWith(this.searchInput.value || '')
  );
}
