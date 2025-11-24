import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  ChangeDetectorRef,
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
import { HeaderDisplayComponent } from './header-display/header-display.component';
// ...
import { ThematicCardComponent } from './thematic-card/thematic-card.component';
import { SparqlDisplayComponent } from './sparql-display/sparql-display.component';
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
import { SelectedLangService } from '../selected-lang.service';
import {
  SelectedResearchFieldService,
  ResearchField,
} from '../services/selected-research-field.service';
import { MatTabsModule } from '@angular/material/tabs';
import { CommonModule } from '@angular/common';
import { ItemDisplayDispatcherService } from './services/item-display-dispatcher.service';
import { RouterModule } from '@angular/router';
import { SearchComponent } from '../search/search.component';

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
    SparqlDisplayComponent,
    ItemInfoComponent,
    HeaderDisplayComponent,
    SearchComponent,
    IframesDisplayComponent,
    ThematicCardComponent,
    JoinPipe,
    GenericListDisplayComponent,
  ],
})
export class DisplayComponent implements OnInit, AfterViewInit, OnDestroy {
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
  private changeTranscript = inject(TranscriptionService);
  private transcript = inject(TranscriptDisplayService);
  private iframesDisplay = inject(IframesDisplayService);
  private sanitizer = inject(DomSanitizer);
  private observer = inject(BreakpointObserver);
  private selectedResearchFieldService = inject(SelectedResearchFieldService);

  // Données principales
  item: any;
  claims: any;
  itemId: string;
  id: string;
  label: string;
  description: string;
  aliases: string[];
  mainTitle: string;
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
  sparqlSubscription: Subscription;
  selectedResearchFieldSubscription: Subscription;

  // Textes d’interface
  newSearch: string = 'new search';
  linkedPagesTitle: string = 'linked pages';
  mainPage: string = 'main page';
  externalLinksTitle: string = 'External links';
  formerVisitsTitle: string = 'you have visited:';
  careerTitle: string;
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
  }

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
          false;

      if (!item || !Array.isArray(item) || item.length === 0) {
        this.item = null;
        return;
      }
      this.item = item;
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
      this.event = this.claims.P2.event;
      this.listTitle = this.claims.P2.listTitle;
      this.main = this.claims.P2.main;
      if (this.mainTitle == 'Humain') {
        this.mainTitle = 'Personne';
      }
      if (['Q37073', 'Q257052'].includes(this.claims.P2[0].mainsnak.datavalue.value.id)) {
        this.mainTitle = this.lang.getTranslation('$1', this.lang.selectedLang);
      }
      this.urlId = this.factGridUrl + this.id;

      this.id = this.item[0].id;
      this.label = this.item[0].label;
      this.description = this.item[0].description;
      this.aliases = this.item[0].aliases;
      if (this.aliases) {
        this.isAliases === true;
      }

      // Flags d'affichage
      const flags = this.itemDisplayDispatcher.dispatch(this.item, this);
      Object.assign(this, flags);

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
            this.isPicture = false;
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
        } else {
          this.sparql$ = null;
          setTimeout(waitForSparqlObservable, 100);
        }
      };
      waitForSparqlObservable();

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

  ngAfterViewInit(): void {}

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
    this.selectedResearchFieldSubscription?.unsubscribe();
  }
}
