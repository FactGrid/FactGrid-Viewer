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
  tap,
  debounceTime,
  combineLatest,
  filter,
  startWith,
  of,
  take,
  catchError,
  forkJoin,
  distinctUntilChanged,
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
import { RequestService } from '../services/request.service';
import { SelectedLangService } from '../selected-lang.service';
import { SelectedResearchFieldService } from '../services/selected-research-field.service';
import { WikibaseSearchService } from '../services/wikibase-search.service';
import { SearchFilterService } from '../services/search-filter.service';
import { SearchCacheService } from '../services/search-cache.service';

import { WikibaseEntity } from '../models/wikibase-entity.model';
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
  items: WikibaseEntity[] = [];
  private items$ = new BehaviorSubject<WikibaseEntity[]>([]);
  filteredItems$: Observable<WikibaseEntity[]>;
  // Observable indiquant si l'overlay doit être ouvert (utilisé pour debug/contrôle)
  overlayOpen$: Observable<boolean>;
  // history overlay behaviour (for visited items panel)
  historyOverlayOpen$ = new BehaviorSubject<boolean>(false);
  // pagination/pages removed for compact-only mode
  selectedItemsList: any[] = [];
  selectedResearchField$ = this.selectedResearchField.selectedResearchField$;

  // ========== SUBSCRIPTIONS ==========
  private subscriptions: Subscription[] = [];

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
  private termCache: { [term: string]: WikibaseEntity[] } = {};
  private broadCacheInput: string = '';
  private broadCacheItems: WikibaseEntity[] = [];
  private broadCacheComplete: boolean = false;

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
  trackById(index: number, item: any): any {
    if (!item) return index;
    // support objects wrapped in { value: { id, label } }
    if (item.value && (item.value.id || item.value.label)) return item.value.id ?? item.value.label;
    return item.id ?? item.label ?? index;
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
    console.log(
      '[Search] onItemRowClick',
      itemId,
      'clicked, current clickedItemId:',
      this.clickedItemId
    );
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
        console.log('[Search] no parent subscriber: navigating to', itemId);
        this.router.navigate(['/item', itemId]);
      } else {
        console.log('[Search] parent listening — parent should control navigation for', itemId);
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
    this.selectedItemsList = stored ? JSON.parse(stored).filter((el: any) => el !== null) : [];
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
          ...res.results.bindings.map((b: any) => ({
            name: b.itemLabel.value,
            id: b.item.id,
            description: b.itemDescription?.value ?? '',
          })),
        ])
      )
      .subscribe((projects) => {
        projects.sort((a: any, b: any) => a.name.localeCompare(b.name));
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
    maxResults: number = 50,
    selectedProjectId?: string
  ): Observable<{ items: WikibaseEntity[]; total: number }> {
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
        // Use fetchEntities (which has entity-level caching) to return typed results
        return this.fetchEntities(ids).pipe(map((items) => ({ items, total: items.length })));
      }
      // getQidsList returns page titles (e.g. Q123). Use it to then fetch entities data.
      return this.request.getQidsList(srsearch, maxResults).pipe(
        switchMap((titles: string[]) => {
          // cache titles list for a short time (2 minutes) to avoid re-requesting repeated searches
          try {
            this.searchCache.setItem(qidsKey, titles, 1000 * 60 * 2);
          } catch (e) {}
          const ids = (titles || [])
            .map((t) => (t ? String(t).split(':').pop() : ''))
            .filter(Boolean);
          return this.fetchEntities(ids).pipe(map((items) => ({ items, total: items.length })));
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
      map((res: any) => {
        const total = res.searchinfo?.totalhits ?? res.search?.length ?? 0;
        const items = (res.search || []).map((e: any) => ({
          id: e.id,
          label: e.label,
          aliases: (e.aliases || [])
            .filter((a: any) => a.language === lang)
            .map((a: any) => a.value),
          description: e.description || '',
        }));
        const out = { items, total };
        try {
          // cache fast search results for a short TTL to reduce duplicate requests when typing
          this.searchCache.setItem(wbsearchKey, out, 1000 * 60 * 2);

          // OPTIMIZATION: Warm up the individual entity cache with these results.
          // If the user later switches to a project search that returns these same IDs,
          // we won't need to fetch their details again via wbgetentities.
          items.forEach((item: WikibaseEntity) => {
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
          if (!searchTerm) {
            this.searchCache.invalidateCache();
            this.resetSearchState();
            return of([] as WikibaseEntity[]);
          }
          const selected = this.selectedResearchField.getSelectedResearchField();
          const selectedId = selected?.id;
          return this.fetchAutocompleteEntities(
            searchTerm,
            this.lang.selectedLang,
            50,
            selectedId
          ).pipe(
            map(({ items }) => {
              this.updateItemsList(items);
              return items;
            }),
            catchError((err) => {
              console.error('[SearchComponent] fetchAutocompleteEntities error', err);
              this.resetSearchState();
              return of([] as WikibaseEntity[]);
            })
          );
        })
      )
      .subscribe();
    this.subscriptions.push(sub);
  }

  private resetSearchState(): void {
    this.items = [];
    this.items$.next([]);
    this.changeDetector.markForCheck();
    this.termCache = {};
    this.broadCacheInput = '';
    this.broadCacheItems = [];
    this.broadCacheComplete = false;
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
    // Use OR to match both exact term and prefix. 
    // This fixes issues where "Pierre*" might fail but "Pierre" would succeed (e.g. stop words or exact matches).
    filters.push(`(${searchTerm} OR ${searchTerm}*)`);
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

  private fetchEntities(ids: string[]): Observable<WikibaseEntity[]> {
    if (ids.length === 0) return of([]);
    // Try to reuse per-entity cache entries before issuing any network requests
    const lang = this.lang.selectedLang;
    const cached: WikibaseEntity[] = [];
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
        map((res: any) => {
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
    const fetched$ = requests.length > 0 ? forkJoin(requests).pipe(map((results) => results.flat())) : of([] as WikibaseEntity[]);
    return fetched$.pipe(map((fetched) => [...cached, ...fetched]));
  }

  private filterResultsLocally(
    entities: WikibaseEntity[],
    searchTerm: string,
    showInDescription: boolean
  ): WikibaseEntity[] {
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
    item: WikibaseEntity,
    searchTerm: string,
    showInDescription: boolean
  ): boolean {
    const normalizedLabel = normalizeString(item.label);
    const normalizedAliases = (item.aliases || []).map(normalizeString);
    const normalizedDesc = normalizeString(item.description);
    if (normalizedLabel.includes(searchTerm)) return true;
    if (normalizedAliases.some((alias) => alias.includes(searchTerm))) return true;
    if (showInDescription && normalizedDesc.includes(searchTerm)) return true;
    return false;
  }

  private updateItemsList(items: WikibaseEntity[]): void {
    this.items = items;
    this.items$.next(items);
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
    const overlayScrollSub = this.overlayOpen$.subscribe((open) => {
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

  // hintValue/pages removed for compact-only mode

  isArray(val: any): boolean {
    return Array.isArray(val);
  }

  createList(re: any): string {
    let arr = re.search ?? [];
    let list = arr.map((item: any) => item.id).join('|');
    return this.baseGetURL + list + this.getUrlSuffix;
  }

  listFromSparql(res: any) {
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

  private adaptEntities(entities: any[], lang: string): WikibaseEntity[] {
    return entities.map((e) => ({
      id: e.id,
      label: e.labels?.[lang]?.value || '',
      aliases: e.aliases?.[lang]?.map((a: any) => a.value) || [],
      description: e.descriptions?.[lang]?.value || '',
    }));
  }

  researchFieldSelect(researchField: any) {
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

  public displayResearchField(researchField: any): string {
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
    console.log('[SearchComponent] onSearchFieldInput value =', value);
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
