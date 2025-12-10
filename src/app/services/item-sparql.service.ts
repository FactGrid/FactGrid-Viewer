import { Injectable, inject } from '@angular/core';
import { of, forkJoin } from 'rxjs';
import { map, switchMap, startWith, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { SelectedLangService } from '../selected-lang.service';
import { SparqlBinding, SparqlResults, BatchAskResult, SparqlTuple } from './sparql-types';
import { SparqlQueryBuilderService } from './sparql/sparql-query-builder.service';
import { ItemTypeResolverService } from './sparql/item-type-resolver.service';
import {
  ALL_SPARQL_STRATEGIES,
  AddressStrategy,
  OrganisationStrategy,
  CareerStrategy,
  FamilyNameStrategy,
  CreatorStrategy,
  LocationStrategy,
  HealthPractitionerStrategy,
  MasterStrategy,
  FactGridPropertyClassStrategy,
  ListStrategy,
  SetStrategy,
  GOVStrategy,
  SuperclassStrategy,
  Superclass1Strategy,
} from './sparql/sparql-strategies';

export type SparqlEnabledItem = {
  id?: string;
  sparql?: Observable<SparqlTuple[]>;
  sparqlFlags?: BatchAskResult;
  [k: string]: any;
};

/**
 * Service d'enrichissement SPARQL pour les items FactGrid.
 * Version refactorisée utilisant le pattern Strategy et des services dédiés.
 * 
 * Améliorations:
 * - Cache des batchAskQuery pour éviter requêtes redondantes
 * - Construction d'URLs SPARQL via SparqlQueryBuilderService
 * - Résolution de types via ItemTypeResolverService et stratégies
 * - Code plus maintenable et testable
 */
@Injectable({
  providedIn: 'root',
})
export class ItemSparqlService {
  private request = inject(RequestService);
  private lang = inject(SelectedLangService);
  private builder = inject(SparqlQueryBuilderService);
  private resolver = inject(ItemTypeResolverService);

  // Injection des stratégies
  private addressStrategy = inject(AddressStrategy);
  private organisationStrategy = inject(OrganisationStrategy);
  private careerStrategy = inject(CareerStrategy);
  private familyNameStrategy = inject(FamilyNameStrategy);
  private creatorStrategy = inject(CreatorStrategy);
  private locationStrategy = inject(LocationStrategy);
  private healthPractitionerStrategy = inject(HealthPractitionerStrategy);
  private masterStrategy = inject(MasterStrategy);
  private factGridPropertyClassStrategy = inject(FactGridPropertyClassStrategy);
  private listStrategy = inject(ListStrategy);
  private setStrategy = inject(SetStrategy);
  private govStrategy = inject(GOVStrategy);
  private superclassStrategy = inject(SuperclassStrategy);
  private superclass1Strategy = inject(Superclass1Strategy);

  // Cache pour les batchAskQuery (key = itemId, value = Observable<BatchAskResult>)
  private batchAskCache = new Map<string, Observable<BatchAskResult>>();

  // Tests observables (conservés pour compatibilité avec l'ancien code)
  Q12Test: Observable<boolean>; //Organisation
  Q37073Test: Observable<boolean>; //Career
  Q456376Test: Observable<boolean>; //Creator subclass
  Q24499Test: Observable<boolean>; //Family name
  Q77457Test: Observable<boolean>; // Class of FactGrid properties
  GOVTest: Observable<boolean>;
  Q8Test: Observable<boolean>; //Lieu
  Q16200Test: Observable<boolean>; // address
  Q140759Test: Observable<boolean>; // Health care practitioner
  masterTest: Observable<boolean>;
  listTest: Observable<boolean>;
  setTest: Observable<boolean>;
  superclassTest: Observable<boolean>;
  superclass1Test: Observable<boolean>;

  sparql0$: Observable<SparqlTuple>;
  sparql1$: Observable<SparqlTuple>;
  sparql2$: Observable<SparqlTuple>;
  sparql3$: Observable<SparqlTuple>;
  sparql4$: Observable<SparqlTuple>;

  // Focused console debug filter: set to an item id like 'Q38612' or '*' for verbose
  private readonly DEBUG_ITEM: string = '';

  langService: string =
    '%20.%0A%20%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22' +
    this.lang.selectedLang +
    '%22%2C%22en%22.%20%7D%0A%7D%0A';

  constructor() {
    // Enregistre toutes les stratégies au démarrage
    this.registerAllStrategies();
  }

  /**
   * Enregistre toutes les stratégies SPARQL dans le resolver.
   */
  private registerAllStrategies(): void {
    this.resolver.registerStrategies([
      this.addressStrategy,
      this.organisationStrategy,
      this.careerStrategy,
      this.familyNameStrategy,
      this.creatorStrategy,
      this.locationStrategy,
      this.healthPractitionerStrategy,
      this.masterStrategy,
      this.factGridPropertyClassStrategy,
      this.listStrategy,
      this.setStrategy,
      this.govStrategy,
      this.superclassStrategy,
      this.superclass1Strategy,
    ]);
  }

  /**
   * Vide le cache des batchAskQuery (utile pour tests ou rafraîchissement).
   */
  clearCache(): void {
    this.batchAskCache.clear();
  }

  // Batching ASK queries for main boolean tests (avec cache)
  batchAskQuery(itemId: string): Observable<BatchAskResult> {
    // Vérifie le cache
    if (this.batchAskCache.has(itemId)) {
      if (this.DEBUG_ITEM === '*' || itemId === this.DEBUG_ITEM) {
        console.debug('[ItemSparql] batchAskQuery cache HIT for', itemId);
      }
      return this.batchAskCache.get(itemId)!;
    }

    if (this.DEBUG_ITEM === '*' || itemId === this.DEBUG_ITEM) {
      console.debug('[ItemSparql] batchAskQuery cache MISS for', itemId);
    }

    const sparql = `
    SELECT ?isLocality ?isOrganisation ?isCareer ?isFamilyName ?isAddress ?isFactGridClass ?isList ?isSet ?isSuperclass ?isSuperclass1 ?isGOV WHERE {
      BIND(EXISTS { wd:${itemId} wdt:P2/wdt:P3* wd:Q8 } AS ?isLocality)
      BIND(EXISTS { wd:${itemId} wdt:P2/wdt:P3* wd:Q12 } AS ?isOrganisation)
      BIND(EXISTS { wd:${itemId} wdt:P2/wdt:P3* wd:Q37073 } AS ?isCareer)
      BIND(EXISTS { wd:${itemId} wdt:P2/wdt:P3* wd:Q24499 } AS ?isFamilyName)
      BIND(EXISTS { wd:${itemId} wdt:P2/wdt:P3* wd:Q16200 } AS ?isAddress)
      BIND(EXISTS { wd:${itemId} wdt:P2/wdt:P3* wd:Q77457 } AS ?isFactGridClass)
      BIND(EXISTS { wd:${itemId} wdt:P1132 wd:Q945294 } AS ?isList)
      BIND(EXISTS { wd:${itemId} wdt:P1132 wd:Q945258 } AS ?isSet)
      BIND(EXISTS { wd:${itemId} wdt:P1132 wd:Q945280 } AS ?isSuperclass)
      BIND(EXISTS { wd:${itemId} wdt:P1132 wd:Q960698 } AS ?isSuperclass1)
      BIND(EXISTS { wd:${itemId} wdt:P1075 wd:Q780657 } AS ?isGOV)
    }
  `;
    const url = this.newSparqlAdress(
      'https://database.factgrid.de/query/#' + encodeURIComponent(sparql)
    );
    
    const query$ = this.request.getList(url).pipe(
      map((res: SparqlResults) => {
        const b = res.results?.bindings?.[0];
        return {
          Q8Test: b?.isLocality?.value === 'true',
          Q12Test: b?.isOrganisation?.value === 'true',
          Q37073Test: b?.isCareer?.value === 'true',
          Q24499Test: b?.isFamilyName?.value === 'true',
          Q16200Test: b?.isAddress?.value === 'true',
          Q77457Test: b?.isFactGridClass?.value === 'true',
          listTest: b?.isList?.value === 'true',
          setTest: b?.isSet?.value === 'true',
          superclassTest: b?.isSuperclass?.value === 'true',
          superclass1Test: b?.isSuperclass1?.value === 'true',
          GOVTest: b?.isGOV?.value === 'true',
        };
      }),
      shareReplay(1) // Partage le résultat pour éviter requêtes multiples
    );

    // Met en cache
    this.batchAskCache.set(itemId, query$);
    return query$;
  }

  // item -> expects at least { id: string }; returns the same item enriched
  // with `sparql: Observable<SparqlTuple[]>` and `sparqlFlags: BatchAskResult`.
  itemSparql(item: { id: string; [k: string]: any }): Observable<SparqlEnabledItem> {
    if (!this.DEBUG_ITEM || this.DEBUG_ITEM === '*' || item?.id === this.DEBUG_ITEM) {
      console.debug('[ItemSparql] itemSparql() start for', item?.id);
    }

    return this.batchAskQuery(item.id).pipe(
      switchMap((batch) => {
        // Popule les tests observables pour compatibilité avec l'ancien code
        this.Q8Test = of(batch.Q8Test);
        this.Q12Test = of(batch.Q12Test);
        this.Q37073Test = of(batch.Q37073Test);
        this.Q24499Test = of(batch.Q24499Test);
        this.Q16200Test = of(batch.Q16200Test);
        this.Q77457Test = of(batch.Q77457Test);
        this.listTest = of(batch.listTest);
        this.setTest = of(batch.setTest);
        this.superclassTest = of(batch.superclassTest);
        this.superclass1Test = of(batch.superclass1Test);
        this.GOVTest = of(batch.GOVTest);

        // Tests dynamiques pour activités
        this.Q456376Test = this.activitiesTest(item)[0];
        this.Q140759Test = this.activitiesTest(item)[1];
        this.masterTest = this.activitiesTest(item)[2];

        // Approche optimisée: lance les requêtes SPARQL en parallèle via stratégies
        // sparql0: superclass ou superclass1
        this.sparql0$ = forkJoin([this.superclassTest, this.superclass1Test]).pipe(
          switchMap(([testSuperclass, testSuperclass1]) => {
            if (testSuperclass) return this.superclassStrategy.query(item);
            if (testSuperclass1) return this.superclass1Strategy.query(item);
            return this.noResult();
          }),
          startWith<SparqlTuple>([undefined, []])
        );

        // sparql1: priorité Address > Organisation > Career > Creator > FamilyName > FactGridClass
        this.sparql1$ = forkJoin([
          this.Q12Test,
          this.Q37073Test,
          this.Q456376Test,
          this.Q24499Test,
          this.Q16200Test,
          this.Q77457Test,
        ]).pipe(
          switchMap(([q12, q37073, q456376, q24499, q16200, q77457]) => {
            if (q16200) return this.addressStrategy.query(item);
            if (q12) return this.organisationStrategy.query(item);
            if (q37073) return this.careerStrategy.query(item);
            if (q456376) return this.creatorStrategy.query(item);
            if (q24499) return this.familyNameStrategy.query(item);
            if (q77457) return this.factGridPropertyClassStrategy.query(item);
            return this.noResult();
          }),
          startWith<SparqlTuple>([undefined, []])
        );

        // sparql2: HealthPractitioner
        this.sparql2$ = forkJoin([this.Q140759Test, this.Q16200Test]).pipe(
          switchMap(([q140759, q16200]) => {
            if (q140759) return this.healthPractitionerStrategy.query(item);
            return this.noResult();
          }),
          startWith<SparqlTuple>([undefined, []])
        );

        // sparql3: Master > List > Set > CurrentAddress
        this.sparql3$ = forkJoin([
          this.masterTest,
          this.listTest,
          this.setTest,
          this.Q16200Test,
        ]).pipe(
          switchMap(([master, list, set, address]) => {
            if (master) return this.masterStrategy.query(item);
            if (list) return this.listStrategy.query(item);
            if (set) return this.setStrategy.query(item);
            if (address) return this.currentAddress(item);
            return this.noResult();
          }),
          startWith<SparqlTuple>([undefined, []])
        );

        // sparql4: Location > GOV
        this.sparql4$ = forkJoin([this.Q8Test, this.GOVTest]).pipe(
          switchMap(([q8, gov]) => {
            if (q8) return this.locationStrategy.query(item);
            if (gov) return this.govStrategy.query(item);
            return this.noResult();
          }),
          startWith<SparqlTuple>([undefined, []])
        );

        // Attache les flags au niveau item pour consultation synchrone
        (item as any).sparqlFlags = batch;

        // Combine toutes les requêtes en parallèle
        item.sparql = forkJoin([
          this.sparql0$,
          this.sparql1$,
          this.sparql2$,
          this.sparql3$,
          this.sparql4$,
        ]);

        return of(item);
      })
    );
  }

  // Méthodes utilitaires pour générer des requêtes ASK dynamiques
  keywordTest(a, type) {
    return (
      'https://database.factgrid.de/query/#ASK%7Bwd%3A' +
      a +
      '%20wdt%3AP1132%20wd%3A' +
      type +
      '%7D'
    );
  }

  classTest(a, type) {
    return (
      'https://database.factgrid.de/query/#ASK%20%7Bwd%3A' +
      a +
      '%20wdt%3AP3%2a%20wd%3A' +
      type +
      '.%7D%0A%20'
    );
  }

  subclassTest(a, type) {
    return (
      'https://database.factgrid.de/query/#ASK%20%7Bwd%3A' +
      a +
      '%20wdt%3AP2%2Fwdt%3AP3%2a%20wd%3A' +
      type +
      '.%7D%0A%20'
    );
  }

  masterSubclassTest(a) {
    return (
      'https://database.factgrid.de/query/#ASK%7BVALUES%3Fsuperclass%7Bwd%3AQ456376%20wd%3AQ140743%20wd%3AQ36765%7Dwd%3A' +
      a +
      '%20wdt%3AP3%2a%3Fsuperclass.%7D'
    );
  }

  // ========================================================================
  // MÉTHODES OBSOLÈTES CONSERVÉES POUR COMPATIBILITÉ (utilisent maintenant les stratégies)
  // ========================================================================
  // Ces méthodes sont dépréciées mais conservées pour éviter de casser le code existant.
  // Elles délèguent désormais aux stratégies correspondantes.

  /** @deprecated Utilisez directement les stratégies via ItemTypeResolverService */
  selectSparql0(test1: boolean, test2: boolean, item: any): Observable<SparqlTuple> {
    if (test1) return this.superclassStrategy.query(item);
    if (test2) return this.superclass1Strategy.query(item);
    return this.noResult();
  }

  /** @deprecated Utilisez directement les stratégies via ItemTypeResolverService */
  selectSparql1(t1: boolean, t2: boolean, t3: boolean, t4: boolean, t5: boolean, t6: boolean, item: any): Observable<SparqlTuple> {
    if (t5) return this.addressStrategy.query(item);
    if (t1) return this.organisationStrategy.query(item);
    if (t2) return this.careerStrategy.query(item);
    if (t3) return this.creatorStrategy.query(item);
    if (t4) return this.familyNameStrategy.query(item);
    if (t6) return this.factGridPropertyClassStrategy.query(item);
    return this.noResult();
  }

  /** @deprecated Utilisez directement les stratégies via ItemTypeResolverService */
  selectSparql2(test1: boolean, test2: boolean, item: any): Observable<SparqlTuple> {
    if (test1) return this.healthPractitionerStrategy.query(item);
    return this.noResult();
  }

  /** @deprecated Utilisez directement les stratégies via ItemTypeResolverService */
  selectSparql3(t1: boolean, t2: boolean, t3: boolean, t4: boolean, item: any): Observable<SparqlTuple> {
    if (t1) return this.masterStrategy.query(item);
    if (t2) return this.listStrategy.query(item);
    if (t3) return this.setStrategy.query(item);
    if (t4) return this.currentAddress(item);
    return this.noResult();
  }

  /** @deprecated Utilisez directement les stratégies via ItemTypeResolverService */
  selectSparql4(test1: boolean, test2: boolean, item: any): Observable<SparqlTuple> {
    if (test1) return this.locationStrategy.query(item);
    if (test2) return this.govStrategy.query(item);
    return this.noResult();
  }

  /** @deprecated Utilisez directement OrganisationStrategy */
  Q12Sparql(test: boolean, item: any): Observable<SparqlTuple> {
    return test ? this.organisationStrategy.query(item) : this.noResult();
  }

  /** @deprecated Utilisez directement CareerStrategy */
  Q37073Sparql(test: boolean, item: any): Observable<SparqlTuple> {
    return test ? this.careerStrategy.query(item) : this.noResult();
  }

  /** @deprecated Utilisez directement CreatorStrategy */
  Q456376Sparql(test: boolean, item: any): Observable<SparqlTuple> {
    return test ? this.creatorStrategy.query(item) : this.noResult();
  }

  /** @deprecated Utilisez directement HealthPractitionerStrategy */
  Q140759Sparql(test: boolean, item: any): Observable<SparqlTuple> {
    return test ? this.healthPractitionerStrategy.query(item) : this.noResult();
  }

  /** @deprecated Utilisez directement MasterStrategy */
  masterSparql(test: boolean, item: any): Observable<SparqlTuple> {
    return test ? this.masterStrategy.query(item) : this.noResult();
  }

  /** @deprecated Utilisez directement ListStrategy */
  listSparql(test: boolean, item: any): Observable<SparqlTuple> {
    return test ? this.listStrategy.query(item) : this.noResult();
  }

  /** @deprecated Utilisez directement SetStrategy */
  setSparql(test: boolean, item: any): Observable<SparqlTuple> {
    return test ? this.setStrategy.query(item) : this.noResult();
  }

  /** @deprecated Utilisez directement SuperclassStrategy */
  superclassSparql(test: boolean, item: any): Observable<SparqlTuple> {
    return test ? this.superclassStrategy.query(item) : this.noResult();
  }

  /** @deprecated Utilisez directement Superclass1Strategy */
  superclass1Sparql(test: boolean, item: any): Observable<SparqlTuple> {
    return test ? this.superclass1Strategy.query(item) : this.noResult();
  }

  /** @deprecated Utilisez directement FamilyNameStrategy */
  Q24499Sparql(item: any): Observable<SparqlTuple> {
    return this.familyNameStrategy.query(item);
  }

  /** @deprecated Utilisez directement LocationStrategy */
  Q8Sparql(item: any): Observable<SparqlTuple> {
    return this.locationStrategy.query(item);
  }

  /** @deprecated Utilisez directement GOVStrategy */
  GOVSparql(item: any): Observable<SparqlTuple> {
    return this.govStrategy.query(item);
  }

  /** @deprecated Utilisez directement AddressStrategy */
  Q16200Sparql(item: any): Observable<SparqlTuple> {
    return this.addressStrategy.query(item);
  }

  /** @deprecated Utilisez directement FactGridPropertyClassStrategy */
  Q77457Sparql(item: any): Observable<SparqlTuple> {
    return this.factGridPropertyClassStrategy.query(item);
  }

  // ========================================================================
  // MÉTHODES DE TEST OBSOLÈTES (remplacées par batchAskQuery)
  // ========================================================================

  /** @deprecated Utilisez batchAskQuery à la place */
  Q24499TestGet(item: any): Observable<boolean> {
    return of(item?.claims?.P2?.[0]?.mainsnak?.datavalue?.value?.id === 'Q24499');
  }

  /** @deprecated Utilisez batchAskQuery à la place */
  Q8TestGet(item: any): Observable<boolean> {
    return of(item?.claims?.P2?.[0]?.mainsnak?.datavalue?.value?.id === 'Q8');
  }

  /** @deprecated Utilisez batchAskQuery à la place */
  Q16200TestGet(item: any): Observable<boolean> {
    return of(item?.claims?.P2?.[0]?.mainsnak?.datavalue?.value?.id === 'Q16200');
  }

  /** @deprecated Utilisez batchAskQuery à la place */
  Q172192TestGet(item: any): Observable<boolean> {
    return of(item?.claims?.P2?.[0]?.mainsnak?.datavalue?.value?.id === 'Q172192');
  }

  /** @deprecated Utilisez batchAskQuery à la place */
  Q77457TestGet(item: any): Observable<boolean> {
    return of(item?.claims?.P2?.[0]?.mainsnak?.datavalue?.value?.id === 'Q77457');
  }

  /** @deprecated Utilisez batchAskQuery à la place */
  GOVTestGet(item: any): Observable<boolean> {
    return of(item?.claims?.P2?.[0]?.mainsnak?.datavalue?.value?.id === 'Q780657');
  }

  // ========================================================================
  // FIN DES MÉTHODES OBSOLÈTES
  // ========================================================================

  // Méthode de requête SPARQL réutilisable (conservée)
  sparqlQuery(sparql: string): Observable<SparqlResults> {
    sparql = this.newSparqlAdress(sparql);
    // log the actual sparql query URL (truncate long queries for readability)
    try {
      const short = sparql?.length && sparql.length > 200 ? sparql.slice(0, 200) + '…' : sparql;
      if (!this.DEBUG_ITEM || this.DEBUG_ITEM === '*')
        console.debug('[ItemSparql] sparqlQuery ->', short);
    } catch (e) {
      // defensive: don't throw from logging
      if (!this.DEBUG_ITEM || this.DEBUG_ITEM === '*')
        console.debug('[ItemSparql] sparqlQuery -> (unable to format url)');
    }
    return this.request.getList(sparql).pipe(map((res: SparqlResults) => this.listFromSparql(res)));
  }

  sparqlAsk(sparql) {
    let selectedSparql = this.newSparqlAdress(sparql);
    // RequestService.getAsk already returns Observable<boolean>
    return this.request.getAsk(selectedSparql);
  }

  // Return a SparqlTuple describing the current address for an item.
  // Always returns Observable<SparqlTuple> — when no address exists we return this.noResult().
  currentAddress(item): Observable<SparqlTuple> {
    if (item?.claims?.P48 && Array.isArray(item.claims.P48) && item.claims.P48.length > 0) {
      const lat = item.claims.P48[0].mainsnak.datavalue.value.latitude;
      const lon = item.claims.P48[0].mainsnak.datavalue.value.longitude;
      const u =
        'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json';
      return this.request.getItem(u).pipe(
        map((g: any) => {
          const label = 'Q16200';
          const binding: any = {
            item: {
              value: `address:${item?.id ?? 'unknown'}`,
              id: `address:${item?.id ?? 'unknown'}`,
            },
            itemLabel: { value: g?.display_name ?? 'Address' },
            itemDescription: { value: JSON.stringify(g || {}) },
          } as SparqlBinding;
          return [label, [binding]] as SparqlTuple;
        })
      );
    }
    return this.noResult();
  }

  activitiesTest(item) {
    let Q456376Tests = [];
    let Q140759Tests = [];
    let masterTests = [];
    let b: boolean = false;
    if (
      item &&
      item.claims &&
      item.claims.P165 &&
      Array.isArray(item.claims.P165) &&
      item.claims.P165.length > 0
    ) {
      for (let i = 0; i < item.claims.P165.length; i++) {
        Q456376Tests.push(
          this.sparqlAsk(
            this.classTest(item.claims.P165[i].mainsnak.datavalue.value.id, 'Q456376')
          ).pipe(startWith(false))
        );
        Q140759Tests.push(
          this.sparqlAsk(
            this.classTest(item.claims.P165[i].mainsnak.datavalue.value.id, 'Q140759')
          ).pipe(startWith(false))
        );
        masterTests.push(
          this.sparqlAsk(
            this.masterSubclassTest(item.claims.P165[i].mainsnak.datavalue.value.id)
          ).pipe(startWith(false))
        );
      }
    } else {
      Q456376Tests.push(of(b));
      (Q140759Tests.push(of(b)), masterTests.push(of(b)));
    }
    return [
      forkJoin(Q456376Tests).pipe(switchMap((res) => this.testArrayGet(res))),
      forkJoin(Q140759Tests).pipe(switchMap((res) => this.testArrayGet(res))),
      forkJoin(masterTests).pipe(switchMap((res) => this.testArrayGet(res))),
    ];
  }

  testArrayGet(res) {
    let result;
    for (let i = 0; i < res.length; i++) {
      if (res[i] === true) {
        result = res[i];
        break;
      } else {
        result = false;
      }
    }
    return of(result);
  }

  newSparqlAdress(address: string): string {
    const newPrefix = 'https://database.factgrid.de/sparql?query=';
    let oldPrefix = 'https://database.factgrid.de/query/#';
    if (address.includes('embed.html')) {
      oldPrefix = 'https://database.factgrid.de/query/embed.html#';
    }
    if (address !== undefined) address = address.replace(oldPrefix, newPrefix);
    return address;
  }

  listFromSparql(res?: SparqlResults | any): SparqlResults {
    // Track incoming SPARQL result shape & length to detect where lists vanish
    try {
      const len = res?.results?.bindings?.length ?? 'undefined';
      // listFromSparql is often called for many items; restrict to verbose only
      if (this.DEBUG_ITEM === '*')
        console.debug('[ItemSparql] listFromSparql called, incoming bindings length =', len);
    } catch (e) {
      if (this.DEBUG_ITEM === '*')
        console.debug('[ItemSparql] listFromSparql called, error reading length');
    }

    if (res !== undefined) {
      if (res.results !== undefined) {
        for (let i = 0; i < res.results.bindings.length; i++) {
          res.results.bindings[i]['item'].id = res.results.bindings[i]['item'].value.replace(
            'https://database.factgrid.de/entity/',
            ''
          );
          res.results.bindings[i]['item'].id.startsWith('P')
            ? (res.results.bindings[i]['item'].entity = 'property')
            : (res.results.bindings[i]['item'].entity = 'item');
        }
        // Tri alphabétique "à la française" sur fLabel si présent, sinon itemLabel
        res.results.bindings.sort((a, b) => {
          const getLabel = (x) => x.fLabel?.value || x.itemLabel?.value || '';
          return getLabel(a).localeCompare(getLabel(b), 'fr', {
            sensitivity: 'base',
            ignorePunctuation: true,
          });
        });
        // After sorting, log first few ids (if any) for tracing
        try {
          const summaries = res.results.bindings
            .slice(0, 5)
            .map((b) => ({ id: b.item?.id, label: b.fLabel?.value || b.itemLabel?.value }));
          if (this.DEBUG_ITEM === '*')
            console.debug('[ItemSparql] listFromSparql sorted preview =', summaries);
        } catch (e) {
          /* ignore */
        }
      }
    } else {
      res = {
        head: { vars: ['item', 'itemLabel', 'itemDescription', 'fLabel', 'activityLabel'] },
        results: { bindings: [] },
      };
    }
    return res;
  }

  noResult(): Observable<SparqlTuple> {
    // return an empty pair compatible with other sparql returns ([label, bindings[]])
    return of([undefined, []] as SparqlTuple);
  }
}
