import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  ChangeDetectorRef,
  ViewChild,
  ViewContainerRef,
  ComponentRef as NgComponentRef,
  SimpleChange,
  signal,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { computed } from '@angular/core';
import { trigger, state, style, transition, animate, AnimationEvent } from '@angular/animations';
import { Observable, Subscription } from 'rxjs';
import { SparqlTuple } from '../services/sparql-types';
import { map, take } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { BackListDetailsService } from '../services/back-list-details.service';
import { IframesDisplayService } from './services/iframes-display.service';
import { SetDataService } from '../services/set-data.service';
import { TranscriptDisplayService } from '../services/transcript-display.service';
import { BackListService } from '../services/back-list.service';
import { SetSelectedItemsListService } from '../services/set-selected-items-list.service';
import { TranscriptionService } from './services/transcription.service';
import { DomSanitizer } from '@angular/platform-browser';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { JoinPipe } from '../join.pipe';
import { ItemInfoComponent } from './item-info/item-info.component';
import { GenericListDisplayComponent } from './generic-list-display/generic-list-display.component';
import { ThematicCardComponent } from './thematic-card/thematic-card.component';
// NOTE: SparqlDisplayComponent will be loaded dynamically to reduce initial bundle size
import { SparqlDisplayService, SparqlAllCardsState } from './services/sparql-display.service';
import { IframesDisplayComponent } from './iframes-display/iframes-display.component';
import { TextDisplayComponent } from './text-display/text-display.component';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { ItemDisplayDispatcherService } from './services/item-display-dispatcher.service';
import { ClaimsEnricherService } from './services/claims-enricher.service';
import { RouterModule } from '@angular/router';
import { SearchComponent } from '../search/search.component';
import { SelectedLangService } from '../selected-lang.service';
import {
  SelectedResearchFieldService,
  ResearchField,
} from '../services/selected-research-field.service';
import { SearchCacheService } from '../services/search-cache.service';
import { RequestService, CommonsImageMetadata } from '../services/request.service';
import { DisplayMediaService } from '../services/display-media.service';
import { DisplayComponentLoaderService } from '../services/display-component-loader.service';
import { ItemSparqlService } from '../services/item-sparql.service';
import { getZoomForXY } from '../config/map.config';
import type { DisplayItem, ItemDisplayTuple } from '../services/item-types';
import { ProjectsListService } from '../services/projects-list.service';

@Component({
  selector: 'app-display',
  templateUrl: 'display.component.html',
  styleUrls: ['./display.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    RouterModule,
    MatProgressSpinnerModule,
    MatSidenavModule,
    MatToolbarModule,
    MatBadgeModule,
    MatListModule,
    MatTooltipModule,
    MatIconModule,
    // mat-chip used for compact/closable project label on mobile
    // small import cost and keeps behaviour consistent with Material visuals
    MatCardModule,
    MatChipsModule,
    // ensure mat-chips are available in the standalone component
    // NOTE: using MatChipsModule below
    NgClass,
    //TextDisplayComponent,
    // SparqlDisplayComponent, // removed from static imports to enable lazy loading
    // ItemInfoComponent removed from static imports to enable lazy loading
    SearchComponent,
    IframesDisplayComponent,
    ThematicCardComponent,
    JoinPipe,
    GenericListDisplayComponent,
  ],
  animations: [
    // curtain-style header lift: scaleY with transform-origin bottom produces
    // a 'rideau' effect (collapsing upwards) that looks like a curtain lifting.
    trigger('homeHeader', [
      state(
        'home',
        style({ transform: 'scaleY(1)', opacity: 1, transformOrigin: 'bottom', height: '*' })
      ),
      state(
        'closed',
        style({ transform: 'scaleY(0)', opacity: 0, transformOrigin: 'bottom', height: 0 })
      ),
      // less pronounced timing (subtler curtain lift)
      transition('home => closed', [animate('320ms 60ms ease-out')]),
      transition('closed => home', [animate('280ms ease-in')]),
    ]),
    trigger('searchMove', [
      state('home', style({ transform: 'translateY(0)', width: 'min(720px, 86%)', opacity: 1 })),
      state(
        'pinned',
        style({ transform: 'translateY(-6px)', width: 'min(360px, 38%)', opacity: 0.95 })
      ),
      // subtle movement when pinning the search widget
      transition('home => pinned', [animate('220ms ease-out')]),
      transition('pinned => home', [animate('200ms ease-in')]),
    ]),
  ],
})
export class DisplayComponent implements OnInit, AfterViewInit, OnDestroy {
  [key: string]: any;
  title = 'FactGrid';
  subtitle: string;
  private sparqlDisplayService = inject(SparqlDisplayService);
  private itemSparql = inject(ItemSparqlService);
  constructor(private cdr: ChangeDetectorRef) {
    // debug: DisplayComponent constructor called log removed
    // Initialize reactive effects inside a valid injection context (constructor)

    // Route params -> convert to signal and reflect itemId
    const routeParamSignalCtor = toSignal(this.route.paramMap, {
      initialValue: this.route.snapshot.paramMap,
    });
    effect(() => {
      this.itemId = routeParamSignalCtor().get('id');
      // debug: Route params change log removed
      this.itemIdSignal.set(this.itemId);
      if (!this.itemId) {
        this.item = null;
        this.itemSignal.set(null);
        this.selectedItemsList = JSON.parse(localStorage.getItem('selectedItems')) || [];
        try {
          this.cdr.markForCheck();
          this.isSpinner = false;
        } catch {}
        try {
          this.cdr.detectChanges();
        } catch {}
      }
    });

    // Initialize the item-loading effect once (it will re-run on itemIdSignal changes)
    this.loadItem();

    // Whenever itemId becomes available, load back list
    effect(() => {
      if (this.itemIdSignal()) {
        this.loadBackList();
      }
    });

    // BreakpointObserver -> global mobile detection
    const bpSignalCtor = toSignal(
      this.observer.observe([
        Breakpoints.Handset,
        Breakpoints.HandsetPortrait,
        Breakpoints.HandsetLandscape,
      ]),
      { initialValue: { matches: false } as any }
    );
    effect(() => {
      Promise.resolve().then(() => {
        this.isMobile = !!bpSignalCtor().matches;
        try {
          this.cdr.detectChanges();
        } catch {}
      });
    });

    // Transcription: listen to itemSignal and subscribe to the transcription Observable
    effect((onCleanup) => {
      const currentItem = this.itemSignal();
      const claims = currentItem?.[0]?.claims as any | undefined;
      if (claims && claims.P251 && claims.P251[0]?.mainsnak?.datavalue?.value) {
        const a = this.transcript.transcript(claims.P251[0].mainsnak.datavalue.value);
        const sub = a.subscribe((res) => {
          this.trans = Object.keys(res)[0] == 'error' ? 'no transcription' : res.parse.text;
          this.trans = this.changeTranscript.cleaning(this.trans);
          try { this.cdr.detectChanges(); } catch {}
        });
        onCleanup(() => sub.unsubscribe());
      } else {
        this.trans = '';
      }
    });

    // SPARQL lists: subscribe to sparql observable driven by itemSignal
    effect((onCleanup) => {
      const currentItem = this.itemSignal();
      // debug: SPARQL effect triggered logging removed
      // Robust validation: ensure we have a valid item array with at least one element
      if (!currentItem || !Array.isArray(currentItem) || currentItem.length === 0 || !currentItem[0]) {
        // debug: no valid currentItem — logging removed
        this.sparql$ = null;
        this.sparqlCards$ = null;
        return;
      }
      // Additional safety: check if item[0] has the expected structure
      if (!currentItem[0].id || !currentItem[0].claims) {
        console.warn('[SPARQL DEBUG] Item has invalid structure:', currentItem[0]);
        this.sparql$ = null;
        this.sparqlCards$ = null;
        return;
      }
      // debug: currentItem[0].sparql exists? logging removed
      if (!currentItem[0].sparql) {
        // debug: no sparql property on item logging removed
        this.sparql$ = null;
        this.sparqlCards$ = null;
        return;
      }
      if (currentItem[0].sparql && typeof currentItem[0].sparql.subscribe === 'function') {
        this.sparql$ = currentItem[0].sparql as Observable<SparqlTuple[]>;
        this.sparqlCards$ = this.sparqlDisplayService.buildAllCardsState(
          this.sparql$,
          this.lang
        );
        const sub = this.sparqlCards$.subscribe((cards) => {
          if (!cards) return;
          // debug: Cards received and sparql counts logging removed
          try {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
          } catch {}
          setTimeout(() => {
            // debug: Loading components log removed
            if (cards.sparql0?.list?.length) this.loadSparqlAt(0, cards.sparql0);
            if (cards.sparql1?.list?.length) this.loadSparqlAt(1, cards.sparql1);
            if (cards.sparql2?.list?.length) this.loadSparqlAt(2, cards.sparql2);
            if (cards.sparql3?.list?.length) this.loadSparqlAt(3, cards.sparql3);
            if (cards.sparql4?.list?.length) this.loadSparqlAt(4, cards.sparql4);
          }, 100);
        });
        onCleanup(() => sub.unsubscribe());
      } else {
        this.sparql$ = null;
        this.sparqlCards$ = null;
      }
    });
  }

  private async fetchAndReplaceAddress(
    index: number,
    addressId: string,
    ref: NgComponentRef<any>
  ): Promise<void> {
    try {
      if (!addressId || addressId.indexOf(':') === -1) return;
      const parts = addressId.split(':');
      const itemId = parts[1];
      if (!itemId) return;

      // Find the item object loaded in the display
      const currentItem = this.item && Array.isArray(this.item) ? this.item[0] : null;
      if (!currentItem || !currentItem.id) return;
      if (currentItem.id !== itemId) {
        // In case the address belongs to a different item, we avoid fetching
        return;
      }

      // Call ItemSparqlService to fetch the address details
      const fetch$ = this.itemSparql.fetchCurrentAddress(currentItem);
      const sub = fetch$.subscribe((tuple: any) => {
        try {
          // tuple shape: [subject, [binding]]
          const binding = tuple && tuple[1] && tuple[1][0] ? tuple[1][0] : null;
          if (!binding) {
            // no result — clear fetching indicator
            if (ref && (ref.instance as any).setFetching) {
              try { (ref.instance as any).setFetching(addressId, false); } catch {};
            }
            return;
          }
          // Replace the placeholder row in the component data with the fetched binding
          const list = (ref.instance as any).sparqlData || (ref.instance as any).listSignal?.() || [];
          const newList = (list || []).slice();
          let replaced = false;
          for (let i = 0; i < newList.length; i++) {
            const row = newList[i];
            if (row && row.item && row.item.id && row.item.id === addressId) {
              newList[i] = binding;
              replaced = true;
              break;
            }
          }
          if (!replaced) {
            // If placeholder disappeared, append
            newList.push(binding);
          }
          // Update component input to refresh display
          try {
            if (typeof (ref as any).setInput === 'function') {
              (ref as any).setInput('sparqlData', newList);
            } else {
              ref.instance.sparqlData = newList;
              try { ref.changeDetectorRef.detectChanges(); } catch {}
            }
          } catch (e) {}
          // clear fetching indicator
          if (ref && (ref.instance as any).setFetching) {
            try { (ref.instance as any).setFetching(addressId, false); } catch {};
          }
        } catch (e) {}
      }, () => {
        // network error
        if (ref && (ref.instance as any).setFetching) {
          try { (ref.instance as any).setFetching(addressId, false); } catch {};
        }
      });
      this.subscriptions.push(sub);
    } catch (e) {}
  }

  public from: string;

  // Services
  private lang = inject(SelectedLangService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private setData = inject(SetDataService);
  private setList = inject(SetSelectedItemsListService);
  private backList = inject(BackListService);
  private backListDetails = inject(BackListDetailsService);
  private itemDisplayDispatcher = inject(ItemDisplayDispatcherService);
  private claimsEnricher = inject(ClaimsEnricherService);
  private changeTranscript = inject(TranscriptionService);
  private transcript = inject(TranscriptDisplayService);
  private iframesDisplay = inject(IframesDisplayService);
  private sanitizer = inject(DomSanitizer);
  private observer = inject(BreakpointObserver);
  private selectedResearchFieldService = inject(SelectedResearchFieldService);
  private projectsListService = inject(ProjectsListService);
  // Signals used to progressively replace older Observable subscriptions
  private selectedResearchFieldSignal = toSignal(
    this.selectedResearchFieldService.selectedResearchField$,
    { 
      initialValue: this.selectedResearchFieldService.getSelectedResearchField(),
      requireSync: false 
    }
  );

  // Computed signals for template-friendly access to project id & name
  readonly projectId = computed(() => {
    const signal = this.selectedResearchFieldSignal();
    const val = signal?.id ?? 'all';
    return val;
  });
  readonly projectName = computed(() => {
    const signal = this.selectedResearchFieldSignal();
    const val = signal?.name ?? '';
    return val;
  });

  private updateProjectNameFromCacheOrFetch(lang: string) {
    try {
      const sel = this.selectedResearchFieldService.getSelectedResearchField();
      if (!sel || !sel.id || sel.id === 'all' || sel.id === '-') {
        return;
      }
      // Use service to get cached or fetch
      const obs = this.projectsListService.getCachedOrFetchResearchFields(lang);
      if (obs && obs.subscribe) {
        obs.subscribe((projects: any[]) => {
          try {
            const found = (projects || []).find((p: any) => p.id === sel.id);
            if (found && found.name) {
              // Always update the name when language changes, even if it appears identical
              // (the cache might have the translated version we need)
              this.selectedResearchFieldService.setSelectedResearchField({
                id: sel.id,
                name: found.name,
                description: sel.description ?? '',
              });
            }
          } catch (e) {
            console.error('[Display] Error in project update:', e);
          }
        });
      }
    } catch (e) {
      console.error('[Display] Error in updateProjectNameFromCacheOrFetch:', e);
    }
  }

  // Données principales
  // raw array or typed tuple returned by CreateItemToDisplayService
  // keep both shapes to remain backward-compatible while we migrate
  item: any[] | ItemDisplayTuple | null = null;
  // Signal wrapper to drive effects when item changes
  private itemSignal = signal<any[] | ItemDisplayTuple | null>(null);
  // UI-focused, typed representation of the current item (mapped from the rich entity)
  displayItem: DisplayItem | null = null;
  claims: any;
  itemId: string;
  // Progressive signal wrapper for itemId to let effects re-run when the route changes
  private itemIdSignal = signal<string | null>(null);
  id: string;
  label: string;
  description: string;
  aliases: string[];
  mainTitle: string;
  mainIcon: string;
  personIcon: string;
  personTitle: string;
  main: any;
  career: any;
  sociability: any;
  training: any;
  other: any;
  listTitle: string;
  event: any;
  natureOf: any;
  urlId: string;
  linkedItems: any[];
  linkedItems2: any[];
  factGridUrl: string = 'https://database.factgrid.de/entity/';
  sources: any;
  mainList: any[] = [];
  list: any[] = [];
  selectedItemsList: any;
  wikis: any[] = [];
  pictures: any[] = [];
  sourcesList: any[] = [];
  externalLinks: any[] = [];
  iframes: any[] = [];
  iframeGroups: any[] = [];
  headerDetail: any[] = [];
  education: any[] = [];
  careerAndActivities: any[] = [];
  sociabilityAndCulture: any[] = [];
  locationAndSituation: any[] = [];
  technicalities: any[] = [];
  infoProperties: any[] = [];
  activityDetail: any[] = [];
  eventDetail: any[] = [];
  documentDetail: any[] = [];
  lifeAndFamily: any[] = [];
  otherClaims: any[] = [];
  locationAndContext: any[] = [];
  info: any[] = [];
  instancesList: any[] = [];
  subclassesList: any[] = [];
  classesList: any[] = [];
  natureOfList: any[] = [];
  selectedItems: any[];
  infoList: any;

  // Affichage
  isSpinner = false;
  isError = false;
  isMain = false;
  isExternalLinks = false;
  isWikis = false;
  isPicture = false;
  isTopPicture = false;
  isTraining = false;
  isCareer = false;
  isOther = false;
  isSource = false;
  isActivity = false;
  isDocument = false;
  isEvent = false;
  isList = false;
  isOrg = false;
  isPlace = false;
  isMap = false;
  isIframes = false;
  isStemma = false;
  isFamilyTree = false;
  isFrames = false;
  // Les cartes SPARQL sont affichées directement à partir de sparql$ | async
  isTechnicality = false;
  isTranscription = false;
  isInfo = false;
  isMobile = false;
  isAliases = false;

  // Address on-demand support
  addressLoading = false;
  addressFetched: any[] | null = null;

  // visual state for the startup header and search transition
  headerAnimState: 'home' | 'closed' = 'home';
  searchAnimState: 'home' | 'pinned' = 'home';
  // When user selects an item from the embedded search while on the homepage
  // we store the id and wait for the header animation to finish before navigating
  private pendingNavigationItemId: string | null = null;
  // used to show a transient overlay and visual cues while animation runs
  headerAnimating = false;

  // Divers
  trans: any = '';
  zoom: number;
  latitude: number;
  longitude: number;
  coords: any;
  urlSafe1: string;
  urlSafe2: string;
  urlSafe3: string;
  urlSafe4: string;
  urlSafe5: string;
  urlSafe6: string;
  urlSafe7: string;
  urlSafe8: string;
  urlSafe9: string;
  urlSafe10: string;
  urlSafe11: string;
  urlSafe12: string;
  urlSafe13: string;
  urlSafe14: string;
  urlSafe15: string;

  // SPARQL
  sparqlData0: any[] = [];
  sparqlData1: any[] = [];
  sparqlData2: any[] = [];
  sparqlData3: any[] = [];
  sparqlData4: any[] = [];
  sparqlSubject0: string;
  sparqlSubject1: string;
  sparqlSubject2: string;
  sparqlSubject3: string;
  sparqlSubject4: string;
  sparql$: Observable<SparqlTuple[]> | null = null;

  // Titres/listes calculés au niveau parent pour les cartes SPARQL (via le service)
  sparqlCards$: Observable<SparqlAllCardsState> | null = null;

  // Subscriptions (legacy: we keep certain subscriptions for non-intercepted services)
  // legacy subscription3 removed; transcript subscription handled via effect
  sparqlSubscription: Subscription | null = null;
  subscriptions: Subscription[] = [];

  // Textes d’interface
  newSearch: string = 'new search';
  linkedPagesTitle: string = 'linked pages';
  mainPage: string = 'main page';
  externalLinksTitle: string = 'External links';
  formerVisitsTitle: string = 'you have visited:';
  careerTitle: string;
  // Title strings (localized) used by the template for card headers
  trainingTitle: string;
  sociabilityTitle: string;
  eventTitle: string;
  factGridQuery: string = 'FactGrid query';
  clickToDisplay: string = 'click to display';
  clickToDownload: string = 'click to download';
  stemma: string = 'stemma';
  factGridLogo: string = 'https://upload.wikimedia.org/wikipedia/commons/b/b6/FactGrid-Logo4.png';

  ngOnInit(): void {
    this.subtitle = this.lang.getTranslation('subtitle', this.lang.selectedLang);

    // Gestion de l’ancien format (simple string) et du nouveau (JSON)
    const rawSelectedResearchField = localStorage.getItem('selectedResearchField');
    let researchFieldId = rawSelectedResearchField;
    if (rawSelectedResearchField && rawSelectedResearchField.startsWith('{')) {
      try {
        const parsed = JSON.parse(rawSelectedResearchField);
        researchFieldId = parsed.id || 'all';
      } catch {
        researchFieldId = 'all';
      }
    }
    this.from = researchFieldId === 'Q10441' ? 'paris' : 'search';

    this.isSpinner = true;
    this.isInfo = false;
    this.newSearch = this.lang.getTranslation('newSearch', this.lang.selectedLang);
    this.linkedPagesTitle = this.lang.getTranslation('linkedPagesTitle', this.lang.selectedLang);
    this.mainPage = this.lang.getTranslation('mainPage', this.lang.selectedLang);
    this.factGridQuery = this.lang.getTranslation('factGridQuery', this.lang.selectedLang);
    this.externalLinksTitle = this.lang.getTranslation(
      'externalLinksTitle',
      this.lang.selectedLang
    );
    this.formerVisitsTitle = this.lang.getTranslation('formerVisitsTitle', this.lang.selectedLang);
    // Titre pour la carte "Carrière" avec repli du header si absent dans la i18n
    this.careerTitle =
      this.lang.getTranslation('careerTitle', this.lang.selectedLang) ||
      this.lang.getTranslation('careerAndActivities', this.lang.selectedLang) ||
      this.lang.getTranslation('career', this.lang.selectedLang) ||
      'Career';
    this.clickToDownload = this.lang.getTranslation('clickToDownLoad', this.lang.selectedLang);
    this.clickToDisplay = this.lang.getTranslation('clickToDisplay', this.lang.selectedLang);
    this.stemma = this.lang.getTranslation('stemma', this.lang.selectedLang);

    // Provide sensible default titles until dispatcher overrides them
    this.trainingTitle =
      this.lang.getTranslation('subtitle_education', this.lang.selectedLang) ||
      this.lang.getTranslation('training', this.lang.selectedLang) ||
      'Education';
    this.sociabilityTitle =
      this.lang.getTranslation('subtitle_sociability_and_culture', this.lang.selectedLang) ||
      'Sociability & Culture';
    this.eventTitle = this.lang.getTranslation('subtitle_event', this.lang.selectedLang) || 'Event';
    // default for main card icon (dispatcher can override for person case)
    this.mainIcon = 'star';
    // default person card icon (displayed on the Life & Family card)
    this.personIcon = 'person';
    this.personTitle =
      this.lang.getTranslation('subtitle_life_and_family', this.lang.selectedLang) ||
      'Life and family';

    // Route params & item effects moved to constructor for injection safety

    // Drawer removed — no subscription needed.

    // Keep the component aware of small-handset viewports globally so that
    // template conditionals for mobile-only UI (e.g. .mobile-project-title)
    // work consistently at runtime and inside tests when needed.
    // BreakpointObserver handling is performed in constructor
    // Subscribe to language changes so the displayed project name can be updated
    const langSub = this.lang.language$?.subscribe((lang) => {
      try {
        this.subtitle = this.lang.getTranslation('subtitle', lang);
        this.linkedPagesTitle = this.lang.getTranslation('linkedPagesTitle', lang);
        this.mainPage = this.lang.getTranslation('mainPage', lang);
        this.factGridQuery = this.lang.getTranslation('factGridQuery', lang);
        this.externalLinksTitle = this.lang.getTranslation('externalLinksTitle', lang);
        this.formerVisitsTitle = this.lang.getTranslation('formerVisitsTitle', lang);
        this.careerTitle =
          this.lang.getTranslation('careerTitle', lang) ||
          this.lang.getTranslation('careerAndActivities', lang) ||
          this.lang.getTranslation('career', lang) ||
          'Career';
        this.clickToDownload = this.lang.getTranslation('clickToDownLoad', lang);
        this.clickToDisplay = this.lang.getTranslation('clickToDisplay', lang);
        this.stemma = this.lang.getTranslation('stemma', lang);
        this.trainingTitle =
          this.lang.getTranslation('subtitle_education', lang) ||
          this.lang.getTranslation('training', lang) ||
          'Education';
        this.sociabilityTitle =
          this.lang.getTranslation('subtitle_sociability_and_culture', lang) ||
          'Sociability & Culture';
        this.eventTitle = this.lang.getTranslation('subtitle_event', lang) || 'Event';
        this.personTitle =
          this.lang.getTranslation('subtitle_life_and_family', lang) || 'Life and family';
        // Update the project label if needed
        try {
          this.updateProjectNameFromCacheOrFetch(lang);
        } catch {}
      } catch {}
    });
    if (langSub) this.subscriptions.push(langSub);
  }

  /**
   * Clear the selected research field (reset to 'all').
   * If an event is provided, stop its propagation (prevent parent link clicks).
   */
  // The removed event from MatChip is not a DOM Event and won't have
  // stopPropagation — calling stopPropagation blindly can throw and prevent
  // the actual reset logic. Accept any type and call stopPropagation only
  // when it's a function (safe no-op otherwise).
  clearCurrentProject(event?: any) {
    if (event && typeof event.stopPropagation === 'function') {
      try {
        event.stopPropagation();
      } catch {}
    }
    try {
      this.selectedResearchFieldService.setSelectedResearchField({
        id: 'all',
        name: 'all',
        description: '',
      });
      try {
        this.cdr.detectChanges();
      } catch {}
    } catch (e) {
      // swallow — not critical
    }
  }

  // Dynamic component hosts for lazy-loading sparql display instances
  @ViewChild('sparqlDisplay0', { read: ViewContainerRef }) sparqlDisplay0Host?: ViewContainerRef;
  @ViewChild('sparqlDisplay1', { read: ViewContainerRef }) sparqlDisplay1Host?: ViewContainerRef;
  @ViewChild('sparqlDisplay2', { read: ViewContainerRef }) sparqlDisplay2Host?: ViewContainerRef;
  @ViewChild('sparqlDisplay3', { read: ViewContainerRef }) sparqlDisplay3Host?: ViewContainerRef;
  @ViewChild('sparqlDisplay4', { read: ViewContainerRef }) sparqlDisplay4Host?: ViewContainerRef;

  // Keep references to created components to manage lifecycle
  private sparqlComponentRefs: Array<NgComponentRef<any> | null> = [null, null, null, null, null];
  // use central SearchCacheService for generic cache storage
  private searchCache = inject(SearchCacheService);
  private request = inject(RequestService);
  private displayMediaService = inject(DisplayMediaService);
  private componentLoader = inject(DisplayComponentLoaderService);
  // typed metadata shape from RequestService
  // (import kept inline to avoid further circulars — RequestService exports CommonsImageMetadata)

  // --- Image caption helpers (Commons) -------------------------------------------------
  toggleCaption(picture: any) {
    if (!picture) return;
    const sub = this.displayMediaService.toggleCaptionAsync(picture).subscribe(() => {
      // ensure change detection updates
      try {
        this.cdr.detectChanges();
      } catch {}
    });
    this.subscriptions.push(sub);
  }

  // ItemInfo lazy host(s)
  @ViewChild('itemInfoHost', { read: ViewContainerRef }) itemInfoHost?: ViewContainerRef;
  @ViewChild('itemInfoHostHidden', { read: ViewContainerRef })
  itemInfoHostHidden?: ViewContainerRef;

  itemInfoLoading = false;
  itemInfoLoaded = false;
  private itemInfoRefs: Array<NgComponentRef<any> | null> = [null, null];

  private doBackListFetch(id: string) {
    // getBackList returns a pair of responses: [userLangResult, englishResult]
    const sub = this.backList
      .backList(id)
      .pipe(
        map((res: any[]) => {
          // Primary list for the user's language
          if (res[0] && res[0].query !== undefined) {
            this.linkedItems = this.backListDetails.setBackList(res[0].query.pages);
          } else {
            this.linkedItems = [
              { id: 'Q21898', label: this.lang.getTranslation('$1', this.lang.selectedLang) },
            ];
          }

          // Secondary list (English) used as a fallback
          let linkedItemsEn: any[] | null = null;
          if (res[1] && res[1].query !== undefined) {
            linkedItemsEn = this.backListDetails.setBackList(res[1].query.pages);
          }

          // Normalize labels: prefer label in user's lang, then English, finally the id
          for (let i = 0; i < this.linkedItems.length; i++) {
            const item = this.linkedItems[i];
            let label = item?.label;

            // treat empty string / null / undefined as missing
            if (!label || (typeof label === 'string' && label.trim() === '')) {
              if (linkedItemsEn && linkedItemsEn[i] && linkedItemsEn[i].label) {
                label = linkedItemsEn[i].label;
              } else {
                label = item?.id;
              }
            }

            this.linkedItems[i].label = label;
          }
        })
      )
      .subscribe();
    // Immediately unsubscribe would cancel work — rely on subscription lifecycle
    // or let the observable complete; if needed we can keep a ref to unsubscribe later.
    this.subscriptions.push(sub);
  }

  private loadBackList() {
    const id = this.itemIdSignal() || this.itemId;
    if (!id) return;
    this.doBackListFetch(id);
  }

  private getNoneLabel(lang: string): string {
    switch (lang) {
      case 'de':
        return 'keine';
      case 'fr':
        return 'aucune';
      case 'en':
        return 'none';
      case 'es':
        return 'ninguno';
      case 'hu':
        return 'nincs';
      case 'it':
        return 'nessuno';
      case 'zh':
        return '无';
      default:
        return 'none';
    }
  }

  private loadItem() {
    effect((onCleanup) => {
      const id = this.itemIdSignal() || this.itemId;
      // debug: loadItem effect triggered log removed
      if (!id) return;
      const sub = this.setData.itemToDisplay(id!).subscribe((item) => {
        // debug: Item received log removed
        // reset error flag for new load
        this.isError = false;

        this.isMain =
          this.isOther =
          this.isPicture =
          this.isSource =
          this.isTraining =
          this.isCareer =
          this.isFamilyTree =
          this.isIframes =
          this.isActivity =
          this.isWikis =
          this.isExternalLinks =
          this.isInfo =
          this.isMap =
            false;

        if (!item || !Array.isArray(item) || item.length === 0) {
          this.item = null;
          this.itemSignal.set(null);
          // Ensure homepage visuals are restored when there is no item
          this.headerAnimState = 'home';
          this.searchAnimState = 'home';
          return;
        }
        this.item = item;
        // debug: itemSignal set log removed
        // ensure the signal mirrors the legacy item field for new reactive patterns
        // CRITICAL: Set signal AFTER item assignment to trigger dependent effects
        this.itemSignal.set(this.item);
        // optional typed DisplayItem appended as the 5th element by CreateItemToDisplayService
        // read it type-safely from the ItemDisplayTuple
        this.displayItem =
          Array.isArray(item) && item.length >= 5 ? (item[4] as DisplayItem) : null;
        // Item present -> header should be closed and search pinned
        this.headerAnimState = 'closed';
        this.searchAnimState = 'pinned';
        // Ensure any previously created dynamic SPARQL components and subscriptions
        // are destroyed when switching items so new components can be created for
        // the newly selected item.
        this.clearSparqlComponents();
        // debug: Item loaded log removed
        this.setList.addToSelectedItemsList(item[0]);
        this.claims = item[0].claims;
        if (!this.claims.P2) {
          // mark as error so the template can display an explanatory message
          this.isError = true;
          this.item = null;
          this.itemSignal.set(null);
          this.isSpinner = false;
          return;
        }
        if (!this.claims.P320) {
          this.hideList();
        }
        this.natureOf = this.claims.P2[0].mainsnak.datavalue.value.id;
        if (this.mainTitle == 'Humain') {
          this.mainTitle = 'Personne';
        }
        if (['Q37073', 'Q257052'].includes(this.claims.P2[0].mainsnak.datavalue.value.id)) {
          this.mainTitle = this.lang.getTranslation('$1', this.lang.selectedLang);
        }
        this.urlId = this.factGridUrl + this.id;

        this.id = this.item[0].id;
        // Try to pre-load cached SPARQL lists for this item (if any).
        // Doing this before SPARQL observable resolution helps when navigating back
        // to an item that previously had expensive long lists.
        this.loadCachedSparqlComponents();
        this.label = this.item[0].label;
        this.description = this.item[0].description;
        this.aliases = this.item[0].aliases;
        if (this.aliases) {
          this.isAliases === true;
        }

        // Enrich claims (add presence flags on P2 etc.) then compute flags for display
        this.claimsEnricher.enrich(this.item);
        const flags = this.itemDisplayDispatcher.dispatch(this.item, this);
        Object.assign(this, flags);

        // Recompute display-level shortcuts from enriched claims now that P2 flags
        // and translated subtitles are available. We read these AFTER enrichment
        // so top-level properties like P242 cause P2.event to be marked.
        this.event = this.claims.P2?.event;
        this.listTitle = this.claims.P2?.listTitle;
        this.main = this.claims.P2?.main;

        // Carte
        if (this.claims.P48) {
          // Handle multiple P2 values: find the best matching zoom
          // Strategy: use the most specific (highest) zoom among configured P2s
          const defaultZoom = getZoomForXY(null);
          let bestZoom = 0; // Start at 0 to accept any configured zoom
          let bestP2: string | null = null;
          
          if (this.claims.P2 && Array.isArray(this.claims.P2)) {
            // Find the most specific (highest) zoom among configured P2s
            for (let i = 0; i < this.claims.P2.length; i++) {
              const p2Claim = this.claims.P2[i];
              const p2Id = p2Claim?.mainsnak?.datavalue?.value?.id;
              if (p2Id) {
                const zoom = getZoomForXY(p2Id);
                // Use highest non-default zoom (most specific = address > quarter > neighborhood > town)
                if (zoom !== defaultZoom && zoom > bestZoom) {
                  bestZoom = zoom;
                  bestP2 = p2Id;
                }
              }
            }
          } else if (this.claims.P2?.main) {
            bestP2 = this.claims.P2.main;
            bestZoom = getZoomForXY(bestP2);
          }
          
          // If no configured zoom was found, use default
          if (bestZoom === 0) {
            bestZoom = defaultZoom;
          }
          
          this.zoom = bestZoom;
          this.coords = this.claims.P48[0].mainsnak.datavalue.value;
          // mark presence of map data so template can show map card
          this.isMap = true;
          this.latitude = this.coords.latitude;
          this.longitude = this.coords.longitude;
          this.router.navigate([this.latitude, this.longitude, this.zoom], {
            relativeTo: this.route,
          });
        }

        // Selected Items
        this.selectedItemsList = JSON.parse(localStorage.getItem('selectedItems'));

        // Images
        this.pictures = this.displayMediaService.buildPicturesFromClaims(this.claims.P189);
        this.isPicture = this.pictures.length > 0;
        if (this.isPicture) {
          // If the global isMobile signals that we're on a handset, elevate the picture
          if (this.isMobile) {
            this.isTopPicture = true;
          }
        }

        // Iframes
        this.iframes = [];
        try {
          this.iframesDisplay.setIframesDisplay(this.item, this.iframes);
        } catch (e) {
          // noop
        }
        this.isIframes = this.iframes.length > 0;

        // Extraction des URLs brutes pour les iframes

        this.iframeGroups = [
          { property: 'P309', label: this.claims.P309?.label, claims: this.claims.P309 || [] },
          { property: 'P320', label: this.claims.P320?.label, claims: this.claims.P320 || [] },
          { property: 'P679', label: this.claims.P679?.label, claims: this.claims.P679 || [] },
          { property: 'P693', label: this.claims.P693?.label, claims: this.claims.P693 || [] },
          { property: 'P720', label: this.claims.P720?.label, claims: this.claims.P720 || [] },
        ].filter((g) => g.label && g.claims.length > 0);

        // Transcription: handled by constructor-level effect watching itemSignal
        // NOTE: Avoid creating `effect()` here — this callback is executed
        // outside of an injection context (Observable subscription `next` handler);
        // calling `effect()` from here leads to runtime NG0203 errors.
        if (!(this.claims.P251 && this.claims.P251[0].mainsnak.datavalue.value)) {
          this.trans = '';
        }

        // Info lists (préserver l'objet déjà construit par le dispatcher, et fusionner dès que les listes arrivent)
        const applyInfoList = () => {
          const raw = this.item?.[0]?.infoList as any[] | undefined;
          const rawInst = Array.isArray(raw?.[0]) ? raw![0] : [];
          const rawSub = Array.isArray(raw?.[1]) ? raw![1] : [];
          const rawCls = Array.isArray(raw?.[2]) ? raw![2] : [];
          const rawNat = Array.isArray(raw?.[3]) ? raw![3] : [];
          const rawHasAny = rawInst.length + rawSub.length + rawCls.length + rawNat.length > 0;

          // Si un infoList existe déjà (créé par le dispatcher) mais vide, on n'arrête PAS tant que les données brutes ne sont pas arrivées
          if (this.infoList && this.infoList.instancesList !== undefined) {
            const curInst = this.infoList.instancesList || [];
            const curSub = this.infoList.subclassesList || [];
            const curCls = this.infoList.classesList || [];
            const curNat = this.infoList.natureOfList || [];

            // Si les données brutes sont arrivées et apportent du contenu, on met à jour en préservant technicalities/infoProperties
            if (rawHasAny) {
              const existingTech = this.infoList?.technicalities || this.technicalities || [];
              const existingInfoProps = this.infoList?.infoProperties || this.infoProperties || [];
              this.instancesList = rawInst;
              this.subclassesList = rawSub;
              this.classesList = rawCls;
              this.natureOfList = rawNat;
              this.infoList = {
                instancesList: this.instancesList,
                subclassesList: this.subclassesList,
                classesList: this.classesList,
                natureOfList: this.natureOfList,
                technicalities: existingTech,
                infoProperties: existingInfoProps,
              };
              // Try to lazy-load ItemInfo component(s) now that infoList is available
              this.loadItemInfoAt(0);
              this.loadItemInfoAt(1);
            } else {
              // Pas encore de données brutes: conserver l'état actuel (techniques visibles) mais continuer à poller
              this.instancesList = curInst;
              this.subclassesList = curSub;
              this.classesList = curCls;
              this.natureOfList = curNat;
              return false; // continuer à vérifier jusqu'à l'arrivée des listes
            }
          } else if (rawHasAny) {
            // Aucun infoList actuel: construire à partir du brut et préserver technicalities/infoProperties si déjà collectés séparément
            const existingTech = this.infoList?.technicalities || this.technicalities || [];
            const existingInfoProps = this.infoList?.infoProperties || this.infoProperties || [];
            this.instancesList = rawInst;
            this.subclassesList = rawSub;
            this.classesList = rawCls;
            this.natureOfList = rawNat;
            this.infoList = {
              instancesList: this.instancesList,
              subclassesList: this.subclassesList,
              classesList: this.classesList,
              natureOfList: this.natureOfList,
              technicalities: existingTech,
              infoProperties: existingInfoProps,
            };
            // ensure the info component is loaded where present
            this.loadItemInfoAt(0);
            this.loadItemInfoAt(1);
          } else {
            // Rien à appliquer pour le moment => poursuivre le polling
            return false;
          }

          // Ne pas ouvrir automatiquement le panneau: laisser le contrôle à l'utilisateur via toggleInfo().
          return true;
        };

        if (!applyInfoList()) {
          // Rafraîchit dès que infoList est disponible (construit de façon asynchrone)
          const checkInfoList = () => {
            if (applyInfoList()) return;
            setTimeout(checkInfoList, 100);
          };
          checkInfoList();
        }

        // SPARQL lists: handled by constructor-level effect watching itemSignal
        // NOTE: Avoid creating `effect()` here — this callback is executed
        // outside of an injection context (Observable subscription `next` handler);
        // calling `effect()` from here leads to runtime NG0203 errors.

        // Some type hints (sparql batch ASK results) are attached asynchronously
        // to item[0].sparqlFlags by ItemSparqlService. When these flags arrive
        // we should re-run the enrichment + dispatch so blocks that depend on
        // P2 detection (e.g. organisation detection driven by Q12Test) get
        // surfaced into the mainList and UI without user navigation.
        const applySparqlFlags = () => {
          if (this.item && this.item[0] && (this.item[0] as any).sparqlFlags) {
            // re-enrich and re-dispatch so display state reflects new signals
            this.claimsEnricher.enrich(this.item);
            const flagsAfter = this.itemDisplayDispatcher.dispatch(this.item, this);
            Object.assign(this, flagsAfter);
            // also recompute some convenience fields used elsewhere
            this.event = this.claims.P2?.event;
            this.listTitle = this.claims.P2?.listTitle;
            this.main = this.claims.P2?.main;
            return true;
          }
          return false;
        };

        if (!applySparqlFlags()) {
          const checkSparqlFlags = () => {
            if (applySparqlFlags()) return;
            setTimeout(checkSparqlFlags, 100);
          };
          checkSparqlFlags();
        }

        // Spinner
        this.isSpinner = false;

        // Trees
        this.isFamilyTree = !!(this.claims.P150 || this.claims.P141 || this.claims.P142);
        this.isStemma = !!this.claims.P233;
      });
      onCleanup(() => sub.unsubscribe());
    });
  }

  private preloadImage(url: string): void {
    this.displayMediaService.preloadImage(url);
  }

  onThumbnailLoad(picture: any): void {}

  openImage(url: string): void {
    this.displayMediaService.openImage(url);
  }

  /**
   * Open the item page on FactGrid so the user can add missing properties
   * (e.g. P2). Use the route param id if present, otherwise fall back to
   * the component id or FactGrid root.
   */
  addInFactGrid(): void {
    const idToOpen = this.itemId || this.id;
    const url = idToOpen ? `${this.factGridUrl}${idToOpen}` : 'https://database.factgrid.de';
    try {
      // Use noopener,noreferrer for security when opening external links
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (e) {
      // As a fallback, navigate in-page if popups are blocked
      window.location.href = url;
    }
  }

  toggleInfo(): void {
    this.isInfo = !this.isInfo;
  }

  hideList() {
    const el = document.getElementById('listing');
    if (el) el.style.visibility = 'hidden';
  }

  getUrl(u) {
    return this.sanitizer.bypassSecurityTrustUrl(u);
  }

  trackById(index: number, item: any): any {
    return item?.id ?? item?.uniqueKey ?? item?.label ?? index;
  }

  ngAfterViewInit(): void {}

  private async loadSparqlAt(index: number, card: any, attempt = 0): Promise<void> {
    try {
      const host = this[`sparqlDisplay${index}Host`] as ViewContainerRef | undefined;
      const existingRef = this.sparqlComponentRefs[index];

      const ref = await this.componentLoader.loadSparqlComponent(
        index,
        card,
        host,
        existingRef,
        this.lang,
        this.id,
        this.cdr,
        attempt
      );

      if (ref && !existingRef) {
        // Nouveau composant créé, stocker la référence et écouter fetchAddress
        this.sparqlComponentRefs[index] = ref as NgComponentRef<any>;
        try {
          const instanceAny: any = ref.instance as any;
          if (instanceAny.fetchAddress && typeof instanceAny.fetchAddress.subscribe === 'function') {
            const sub = instanceAny.fetchAddress.subscribe((addressId: string) => {
              void this.fetchAndReplaceAddress(index, addressId, ref as NgComponentRef<any>);
            });
            this.subscriptions.push(sub);
          }
        } catch {}
      }
    } catch (e) {
      // swallow errors
    }
  }

  /**
   * Clear any previously-created SPARQL components and subscriptions.
   * Called when a new item is loaded so components are recreated for the
   * newly selected item.
   */
  private clearSparqlComponents(): void {
    // Destroy any dynamically created components and reset refs
    this.componentLoader.destroyComponentRefs(this.sparqlComponentRefs);
    this.sparqlComponentRefs = [null, null, null, null, null];

    // Clear the hosts if available (removes DOM content)
    const hosts: Array<ViewContainerRef | undefined> = [];
    for (let i = 0; i < 5; i++) {
      hosts.push(this[`sparqlDisplay${i}Host`] as ViewContainerRef | undefined);
    }
    this.componentLoader.clearHosts(hosts);
  }

  private loadCachedSparqlComponents(): void {
    // Try to create/update components using cached data for the current item
    if (!this.id) return;
    const cachedCards = this.componentLoader.getCachedSparqlCards(this.id, 5);
    cachedCards.forEach(({ index, card }) => {
      void this.loadSparqlAt(index, card);
    });
  }

  private async loadItemInfoAt(index: number, attempt = 0): Promise<void> {
    try {
      // index 0 -> itemInfoHost, index 1 -> itemInfoHostHidden
      const hostKey = index === 0 ? 'itemInfoHost' : 'itemInfoHostHidden';
      const host = this[hostKey] as ViewContainerRef | undefined;
      const existingRef = this.itemInfoRefs[index];

      this.itemInfoLoading = true;
      const ref = await this.componentLoader.loadItemInfoComponent(
        index,
        host,
        existingRef,
        this.infoList,
        this.cdr,
        attempt
      );

      if (ref && !existingRef) {
        this.itemInfoRefs[index] = ref as NgComponentRef<any>;
        this.itemInfoLoaded = true;
      }
      this.itemInfoLoading = false;
      try {
        this.cdr.detectChanges();
      } catch {}
    } catch (e) {
      // swallow errors

      // swallow lazy-load errors silently; avoid noisy console in production
      this.itemInfoLoading = false;
    }
  }

  // Réception de la sélection d'un item depuis le composant de recherche embarqué
  onSearchItemSelected(itemId: string): void {
    if (!itemId) {
      return;
    }
    // If we're on the homepage (no current item), animate header first

    if (!this.item) {
      // play header closing animation and pin the search
      this.pendingNavigationItemId = itemId;
      this.headerAnimState = 'closed';
      this.searchAnimState = 'pinned';
      // actual navigation will happen when animationDone fires
      return;
    }

    // Otherwise navigate immediately
    this.router.navigate(['/item', itemId]);
  }

  ngOnDestroy(): void {
    // subscription1 handled via effect cleanup; no explicit unsubscribe
    // subscription3 cleanup is handled by effects
    this.sparqlSubscription?.unsubscribe();
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Destroy any dynamically created component refs
    this.sparqlComponentRefs.forEach((ref) => {
      try {
        ref?.destroy();
      } catch {
        // noop
      }
    });
  }

  // Animation callback: when header closing animation completes, navigate to pending item
  onHeaderAnimationDone(e: AnimationEvent) {
    // animation finished — clear the visual flag so overlays and UI feedback hide
    this.headerAnimating = false;
    // ensure the animation finished going to 'closed'
    if (e.toState === 'closed' && this.pendingNavigationItemId) {
      const id = this.pendingNavigationItemId;
      this.pendingNavigationItemId = null;
      // perform navigation
      // debug: navigation after animation log removed
      this.router.navigate(['/item', id]);
    }
  }

  onHeaderAnimationStart(e: AnimationEvent) {
    // show overlay / visual cue — useful for debugging and user feedback
    this.headerAnimating = true;
    // debug: header animation started log removed
  }
}
