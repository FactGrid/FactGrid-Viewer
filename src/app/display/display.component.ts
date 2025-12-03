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
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
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
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgClass } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { DrawerService } from '../services/drawer.service';
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
import { RequestService } from '../services/request.service';

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
    MatCardModule,
    NgClass,
    TextDisplayComponent,
    // SparqlDisplayComponent, // removed from static imports to enable lazy loading
    // ItemInfoComponent removed from static imports to enable lazy loading
    SearchComponent,
    IframesDisplayComponent,
    ThematicCardComponent,
    JoinPipe,
    GenericListDisplayComponent,
  ],
})
export class DisplayComponent implements OnInit, AfterViewInit, OnDestroy {
  [key: string]: any;
  subtitle: string;
  private sparqlDisplayService = inject(SparqlDisplayService);
  constructor(private cdr: ChangeDetectorRef) {}

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
  private drawerService = inject(DrawerService);

  // Données principales
  item: any;
  claims: any;
  itemId: string;
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
  drawerOpened = false;
  isAliases = false;

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
  sparql$: Observable<any[][]> | null = null;

  // Titres/listes calculés au niveau parent pour les cartes SPARQL (via le service)
  sparqlCards$: Observable<SparqlAllCardsState> | null = null;

  // Subscriptions
  subscription0: Subscription;
  subscription1: Subscription;
  subscription2: Subscription;
  subscription3: Subscription;
  sparqlSubscription: Subscription | null = null;
  sparqlCardsSubscription: Subscription | null = null;
  selectedResearchFieldSubscription: Subscription;
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
  currentProject: ResearchField | null = null;

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

    // Projet sélectionné (pour l'affichage sur la page d'accueil)
    this.currentProject = this.selectedResearchFieldService.getSelectedResearchField();
    this.selectedResearchFieldSubscription =
      this.selectedResearchFieldService.selectedResearchField$.subscribe((field) => {
        this.currentProject = field;
      });

    this.isSpinner = true;
    this.isInfo = false;
    this.drawerOpened = false;
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
    this.personTitle = this.lang.getTranslation('subtitle_life_and_family', this.lang.selectedLang) || 'Life and family';

    // Abonnement aux commandes du drawer
    this.subscription0 = this.route.paramMap.subscribe((params) => {
      this.itemId = params.get('id');
      this.drawerOpened = false; // Fermer le drawer à chaque changement d'item
      if (this.itemId) {
        this.loadBackList();
        this.loadItem();
      } else {
        // Aucun item au démarrage : afficher directement la page d'accueil
        this.item = null;
        // Charger la liste des items visités pour la page d'accueil
        this.selectedItemsList = JSON.parse(localStorage.getItem('selectedItems')) || [];
        this.isSpinner = false;
      }
    });

    // Abonnement aux commandes du drawer depuis app.component
    const drawerSubscription = this.drawerService.commands$.subscribe((command) => {
      if (command === 'toggle') {
        this.drawerOpened = !this.drawerOpened;
      } else if (command === 'open') {
        this.drawerOpened = true;
      } else if (command === 'close') {
        this.drawerOpened = false;
      }
      this.drawerService.setState(this.drawerOpened);
    });
    this.subscriptions.push(drawerSubscription);
  }

  // Dynamic component hosts for lazy-loading sparql display instances
  @ViewChild('sparqlDisplay0', { read: ViewContainerRef }) sparqlDisplay0Host?: ViewContainerRef;
  @ViewChild('sparqlDisplay1', { read: ViewContainerRef }) sparqlDisplay1Host?: ViewContainerRef;
  @ViewChild('sparqlDisplay2', { read: ViewContainerRef }) sparqlDisplay2Host?: ViewContainerRef;
  @ViewChild('sparqlDisplay3', { read: ViewContainerRef }) sparqlDisplay3Host?: ViewContainerRef;
  @ViewChild('sparqlDisplay4', { read: ViewContainerRef }) sparqlDisplay4Host?: ViewContainerRef;

  // Keep references to created components to manage lifecycle
  private sparqlComponentRefs: Array<NgComponentRef<any> | null> = [null, null, null, null, null];
  // cache threshold for storing large SPARQL lists
  private sparqlCacheThreshold = 300; // only cache lists >= this length
  // use central SearchCacheService for generic cache storage
  private searchCache = inject(SearchCacheService);
  private request = inject(RequestService);

  // --- Image caption helpers (Commons) -------------------------------------------------
  private filenameFromUrl(url?: string) {
    if (!url) return null;
    try {
      if (/^File:/i.test(url)) return url;
      const u = new URL(url);
      const last = u.pathname.split('/').pop() || '';
      if (!last) return null;
      return `File:${decodeURIComponent(last)}`;
    } catch (e) {
      const last = url.split('/').pop() || url;
      return `File:${decodeURIComponent(last)}`;
    }
  }

  toggleCaption(picture: any) {
    if (!picture) return;
    // toggle if already loaded
    if (picture.captionVisible && !picture.captionLoading) {
      picture.captionVisible = false;
      return;
    }
    if (picture.captionHtml) {
      // already loaded, just toggle visible
      picture.captionVisible = !picture.captionVisible;
      return;
    }

    // fetch caption
    picture.captionLoading = true;
    const candidate = picture.full || picture.thumbnail || picture.uniqueKey;
    const fileName = this.filenameFromUrl(candidate);
    this.request.getCommonsImageMetadata(fileName || candidate).subscribe((meta) => {
      picture.captionLoading = false;
      if (meta && meta.descriptionHtml) {
        try {
          picture.captionHtml = this.sanitizer.bypassSecurityTrustHtml(meta.descriptionHtml);
        } catch (e) {
          picture.captionHtml = meta.descriptionHtml;
        }
      } else {
        picture.captionHtml = null;
      }
      picture.captionVisible = true;
      // ensure change detection updates
      try {
        this.cdr.detectChanges();
      } catch {}
    }, () => {
      picture.captionLoading = false;
      picture.captionHtml = null;
      picture.captionVisible = true;
    });
  }

  // ItemInfo lazy host(s)
  @ViewChild('itemInfoHost', { read: ViewContainerRef }) itemInfoHost?: ViewContainerRef;
  @ViewChild('itemInfoHostHidden', { read: ViewContainerRef })
  itemInfoHostHidden?: ViewContainerRef;

  itemInfoLoading = false;
  itemInfoLoaded = false;
  private itemInfoRefs: Array<NgComponentRef<any> | null> = [null, null];

  private loadBackList() {
    this.subscription1 = this.backList
      .backList(this.itemId)
      .pipe(
        map((res) => {
          if (res[0].query !== undefined) {
            this.linkedItems = this.backListDetails.setBackList(res[0].query.pages);
          } else {
            this.linkedItems = [
              { id: 'Q21898', label: this.lang.getTranslation('$1', this.lang.selectedLang) },
            ];
          }
        })
      )
      .subscribe();
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
    this.subscription2 = this.setData.itemToDisplay(this.itemId).subscribe((item) => {
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
        return;
      }
      this.item = item;
      // Ensure any previously created dynamic SPARQL components and subscriptions
      // are destroyed when switching items so new components can be created for
      // the newly selected item.
      this.clearSparqlComponents();
      console.log('Item loaded:', this.item);
      this.setList.addToSelectedItemsList(item[0]);
      this.claims = item[0].claims;
      if (!this.claims.P2) {
        // mark as error so the template can display an explanatory message
        this.isError = true;
        this.item = null;
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
        this.zoom = 12;
        let xy = this.claims.P2[0].mainsnak.datavalue.value.id;
        if (xy == 'Q176131') this.zoom = 3;
        if (xy == 'Q21925') this.zoom = 4;
        if (xy == 'Q21876') this.zoom = 6;
        if (xy == 'Q16200') this.zoom = 18;
        if (
          [
            'Q266101',
            'Q469609',
            'Q172249',
            'Q36239',
            'Q164328',
            'Q36251',
            'Q141472',
            'Q395380',
            'Q375357',
          ].includes(xy)
        )
          this.zoom = 16;
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
      this.pictures = this.claims.P189
        ? this.claims.P189.map((picture, index) => {
            const imageUrl = picture.picture;
            const thumbnailUrl = `${imageUrl}?width=300`;
            this.preloadImage(thumbnailUrl);
            this.preloadImage(imageUrl);
            return {
              thumbnail: thumbnailUrl,
              full: imageUrl,
              uniqueKey: imageUrl || `picture-${index}`,
            };
          })
        : [];
      this.isPicture = this.pictures.length > 0;
      if (this.isPicture) {
        this.observer.observe([Breakpoints.HandsetPortrait]).subscribe((result) => {
          if (result.matches) {
            this.isMobile = true;
            this.isTopPicture = true;
            // Supprimer cette ligne pour garder isPicture à true sur mobile
          }
        });
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

      // Transcription
      if (this.claims.P251 && this.claims.P251[0].mainsnak.datavalue.value) {
        let a = this.transcript.transcript(this.claims.P251[0].mainsnak.datavalue.value);
        this.subscription3 = a.subscribe((res) => {
          this.trans = Object.keys(res)[0] == 'error' ? 'no transcription' : res.parse.text;
          this.trans = this.changeTranscript.cleaning(this.trans);
        });
      } else {
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

      // sparql lists (async pipe) : attendre explicitement que le champ soit bien initialisé
      const waitForSparqlObservable = () => {
        if (this.item[0].sparql && typeof this.item[0].sparql.subscribe === 'function') {
          this.sparql$ = this.item[0].sparql as Observable<any[][]>;
          // Délègue la construction des titres/listes au service
          this.sparqlCards$ = this.sparqlDisplayService.buildAllCardsState(this.sparql$, this.lang);
          // Subscribe and create the SPARQL components dynamically when data arrives
          this.sparqlCardsSubscription = this.sparqlCards$.subscribe((cards) => {
            if (!cards) return;
            try {
              console.debug('[Display] sparqlCards arrived', {
                sparql0: cards.sparql0?.list?.length ?? 0,
                sparql1: cards.sparql1?.list?.length ?? 0,
                sparql2: cards.sparql2?.list?.length ?? 0,
                sparql3: cards.sparql3?.list?.length ?? 0,
                sparql4: cards.sparql4?.list?.length ?? 0,
              });
            } catch (e) {}
            if (cards.sparql0?.list?.length) this.loadSparqlAt(0, cards.sparql0);
            if (cards.sparql1?.list?.length) this.loadSparqlAt(1, cards.sparql1);
            if (cards.sparql2?.list?.length) this.loadSparqlAt(2, cards.sparql2);
            if (cards.sparql3?.list?.length) this.loadSparqlAt(3, cards.sparql3);
            if (cards.sparql4?.list?.length) this.loadSparqlAt(4, cards.sparql4);
          });
        } else {
          this.sparql$ = null;
          setTimeout(waitForSparqlObservable, 100);
        }
      };
      waitForSparqlObservable();

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
  }

  private preloadImage(url: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  }

  onThumbnailLoad(picture: any): void {}

  openImage(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
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
      // The host element may not be present yet when called from the subscription
      // (template is rendered after async data). Retry a few times before giving up.
      if (!host) {
        if (attempt < 10) {
          // small delay then retry
          setTimeout(() => this.loadSparqlAt(index, card, attempt + 1), 50);
        }
        return;
      }
      // If a component already exists for this index, update its inputs
      // so it can react to new data instead of being destroyed/recreated.
      const existingRef = this.sparqlComponentRefs[index];
      if (existingRef) {
        try {
                if (card) {
            // prefer setInput when available (Ivy)
            // setInput triggers ngOnChanges automatically
            // @ts-ignore
            if (typeof (existingRef as any).setInput === 'function') {
              (existingRef as any).setInput('sparqlType', `sparql${index}`);
              (existingRef as any).setInput('sparqlData', card.list);
              (existingRef as any).setInput('sparqlSubject', card.subject);
              (existingRef as any).setInput('langService', this.lang);
              (existingRef as any).setInput('parentTitle', card.title);
                } else {
                  console.debug('[Display] loadSparqlAt: clearing component', { index, prevLength: Array.isArray(existingRef.instance?.sparqlData) ? existingRef.instance.sparqlData.length : 'unknown' });
              // fallback: assign to instance and call ngOnChanges manually
              try {
                // capture previous values before overwrite so ngOnChanges receives
                // a meaningful previous/new payload
                const prevData = existingRef.instance.sparqlData;
                const prevSubject = existingRef.instance.sparqlSubject;

                existingRef.instance.sparqlType = `sparql${index}`;
                existingRef.instance.sparqlData = card.list;
                existingRef.instance.sparqlSubject = card.subject;
                existingRef.instance.langService = this.lang;
                existingRef.instance.parentTitle = card.title;

                // build SimpleChanges so ngOnChanges runs properly
                const changes: any = {};
                changes['sparqlData'] = new SimpleChange(prevData, card.list, false);
                changes['sparqlSubject'] = new SimpleChange(prevSubject, card.subject, false);
                try {
                  if (typeof existingRef.instance.ngOnChanges === 'function') {
                    existingRef.instance.ngOnChanges(changes);
                  }
                } catch (e) {
                  // ignore
                }

                try {
                  existingRef.changeDetectorRef.detectChanges();
                } catch {}
              } catch (err) {
                // ignore shape mismatch
              }
            }
          } else {
            // No card data -> clear the existing component
            try {
              if (typeof (existingRef as any).setInput === 'function') {
                (existingRef as any).setInput('sparqlData', []);
                (existingRef as any).setInput('sparqlSubject', undefined);
              } else {
                existingRef.instance.sparqlData = [];
                existingRef.instance.sparqlSubject = '';
                try {
                  if (typeof existingRef.instance.ngOnChanges === 'function') {
                    existingRef.instance.ngOnChanges({ sparqlData: new SimpleChange(undefined, [], false) });
                  }
                } catch {}
                try {
                  existingRef.changeDetectorRef.detectChanges();
                } catch {}
              }
            } catch {}
          }
        } catch (e) {
          // ignore update failures and fallback to re-creation below
        }
        // component updated, no need to (re)create
        // Store large lists in cache so we can show them quickly if the user
        // returns to this item soon.
        try {
          if (card && card.list && Array.isArray(card.list) && card.list.length >= this.sparqlCacheThreshold && this.id) {
            try {
              const key = `${this.id}::${index}::${card.subject || ''}`;
              this.searchCache.setItem(key, { list: card.list, subject: card.subject, title: card.title }, undefined, undefined);
            } catch {}
          }
        } catch {}
        return;
      }
      host.clear();
      const module = await import('./sparql-display/sparql-display.component');
      const Comp = module.SparqlDisplayComponent;
      const ref = host.createComponent(Comp);
      // set inputs using setInput() when available (safer) or by assigning instance and forcing CD
      try {
        if (card) {
          // prefer setInput if runtime provides it (Ivy)
          // setInput ensures ngOnChanges is executed as expected
          // @ts-ignore - setInput is present on ComponentRef in newer Angular versions
          if (typeof (ref as any).setInput === 'function') {
            (ref as any).setInput('sparqlType', `sparql${index}`);
            (ref as any).setInput('sparqlData', card.list);
            (ref as any).setInput('sparqlSubject', card.subject);
            (ref as any).setInput('langService', this.lang);
            (ref as any).setInput('parentTitle', card.title);
          } else {
            // fallback: assign to instance and manually call ngOnChanges to trigger update
            try {
              ref.instance.sparqlType = `sparql${index}`;
              ref.instance.sparqlData = card.list;
              ref.instance.sparqlSubject = card.subject;
              ref.instance.langService = this.lang;
              ref.instance.parentTitle = card.title;

                // create minimal SimpleChanges payload so ngOnChanges runs
                const changes: any = {};
                changes['sparqlData'] = new SimpleChange(undefined, card.list, true);
                changes['sparqlSubject'] = new SimpleChange(undefined, card.subject, true);
              try {
                if (typeof ref.instance.ngOnChanges === 'function') {
                  ref.instance.ngOnChanges(changes);
                }
              } catch (e) {
                // ignore
              }

              try {
                ref.changeDetectorRef.detectChanges();
              } catch {}
            } catch (err) {
              // ignore if instance shape doesn't match
            }
          }
        }
      } catch (err) {
        // ignore if instance shape doesn't match
      }

      this.sparqlComponentRefs[index] = ref as NgComponentRef<any>;
      // Cache very large lists so we can restore them quickly on reload/back
      try {
        if (card && card.list && Array.isArray(card.list) && card.list.length >= this.sparqlCacheThreshold && this.id) {
          try {
            const key = `${this.id}::${index}::${card.subject || ''}`;
            this.searchCache.setItem(key, { list: card.list, subject: card.subject, title: card.title }, undefined, undefined);
          } catch {}
        }
      } catch {}
      // trigger change detection in case host was created after view init
      try {
        this.cdr.detectChanges();
      } catch {}
    } catch (e) {
      // swallow import error to avoid breaking display
    }
  }

  /**
   * Clear any previously-created SPARQL components and subscriptions.
   * Called when a new item is loaded so components are recreated for the
   * newly selected item.
   */
  private clearSparqlComponents(): void {
    // Unsubscribe from cards subscription to avoid duplicate handling
    try {
      this.sparqlCardsSubscription?.unsubscribe();
    } catch {}

    // Destroy any dynamically created components and reset refs
    this.sparqlComponentRefs.forEach((ref, idx) => {
      try {
        ref?.destroy();
      } catch {}
      this.sparqlComponentRefs[idx] = null;
    });

    // Clear the hosts if available (removes DOM content)
    for (let i = 0; i < this.sparqlComponentRefs.length; i++) {
      try {
        const host = this[`sparqlDisplay${i}Host`] as ViewContainerRef | undefined;
        host?.clear();
      } catch {}
    }
  }

  private loadCachedSparqlComponents(): void {
    // Try to create/update components using cached data for the current item
    if (!this.id) return;
    for (let idx = 0; idx < this.sparqlComponentRefs.length; idx++) {
      try {
        const prefix = `${this.id}::${idx}::`;
        const cached: any = this.searchCache.getItemByPrefix(prefix);
        if (cached && cached.list && cached.list.length) {
          const card = { subject: cached.subject || '', list: cached.list, title: cached.title || '' };
          void this.loadSparqlAt(idx, card);
        }
      } catch {}
    }
  }

  private async loadItemInfoAt(index: number, attempt = 0): Promise<void> {
    try {
      // index 0 -> itemInfoHost, index 1 -> itemInfoHostHidden
      const hostKey = index === 0 ? 'itemInfoHost' : 'itemInfoHostHidden';
      const host = this[hostKey] as ViewContainerRef | undefined;
      if (!host) {
        if (attempt < 10) {
          setTimeout(() => this.loadItemInfoAt(index, attempt + 1), 60);
        }
        return;
      }

      // no info to show
      if (!this.infoList || (Array.isArray(this.infoList) && this.infoList.length === 0)) return;

      // already loaded
      if (this.itemInfoRefs[index]) return;

      this.itemInfoLoading = true;
      host.clear();
      const module = await import('./item-info/item-info.component');
      const Comp = module.ItemInfoComponent;
      const ref = host.createComponent(Comp);

      try {
        if (typeof (ref as any).setInput === 'function') {
          // use setInput so OnChanges is invoked
          (ref as any).setInput('infoList', this.infoList);
        } else {
          ref.instance.infoList = this.infoList;
          try {
            ref.changeDetectorRef.detectChanges();
          } catch {}
        }
      } catch (err) {}

      this.itemInfoRefs[index] = ref as NgComponentRef<any>;
      this.itemInfoLoading = false;
      this.itemInfoLoaded = true;
      try {
        this.cdr.detectChanges();
      } catch {}
    } catch (e) {
      // setInput fallback failed silently

      // swallow lazy-load errors silently; avoid noisy console in production
      this.itemInfoLoading = false;
    }
  }

  // Réception de la sélection d'un item depuis le composant de recherche embarqué
  onSearchItemSelected(itemId: string): void {
    if (!itemId) {
      return;
    }
    this.router.navigate(['/item', itemId]);
  }

  ngOnDestroy(): void {
    this.subscription0?.unsubscribe();
    this.subscription1?.unsubscribe();
    this.subscription2?.unsubscribe();
    this.subscription3?.unsubscribe();
    this.sparqlSubscription?.unsubscribe();
    this.sparqlCardsSubscription?.unsubscribe();
    this.selectedResearchFieldSubscription?.unsubscribe();
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
}
