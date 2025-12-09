import { Injectable, inject } from '@angular/core';
import { of, forkJoin } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { RequestService } from './request.service';
import { SelectedLangService } from '../selected-lang.service';
import {
  SparqlBinding,
  SparqlResults,
  BatchAskResult,
  SparqlTuple,
} from './sparql-types';

export type SparqlEnabledItem = { id?: string; sparql?: Observable<SparqlTuple[]>; sparqlFlags?: BatchAskResult; [k: string]: any };

// Minimal SPARQL response types (pragmatic; cover the shapes we use)

@Injectable({
  providedIn: 'root',
})
export class ItemSparqlService {
  private request = inject(RequestService);
  private lang = inject(SelectedLangService);

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
  private readonly DEBUG_ITEM: string = 'Q38612';

  langService: string =
    '%20.%0A%20%20SERVICE%20wikibase%3Alabel%20%7B%20bd%3AserviceParam%20wikibase%3Alanguage%20%22' +
    this.lang.selectedLang +
    '%22%2C%22en%22.%20%7D%0A%7D%0A';


  // Batching ASK queries for main boolean tests
  batchAskQuery(itemId: string): Observable<BatchAskResult> {
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
    return this.request.getList(url).pipe(
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
      })
    );
  }

  // item -> expects at least { id: string }; returns the same item enriched
  // with `sparql: Observable<SparqlTuple[]>` and `sparqlFlags: BatchAskResult`.
  itemSparql(item: { id: string; [k: string]: any }): Observable<SparqlEnabledItem> {
    if (!this.DEBUG_ITEM || this.DEBUG_ITEM === '*' || item?.id === this.DEBUG_ITEM) {
      console.debug('[ItemSparql] itemSparql() start for', item?.id);
    }
    // Ne PAS initialiser item.sparql avec of(undefined) pour éviter d'émettre/compléter avant les vraies données
    return this.batchAskQuery(item.id).pipe(
      switchMap((batch) => {
        this.Q8Test = of(batch.Q8Test); //Lieu
        this.Q12Test = of(batch.Q12Test); //Organisation
        this.Q37073Test = of(batch.Q37073Test); //Career
        this.Q24499Test = of(batch.Q24499Test); //Family name
        this.Q16200Test = of(batch.Q16200Test); //Address
        this.Q77457Test = of(batch.Q77457Test); //FactGrid class
        this.listTest = of(batch.listTest);
        this.setTest = of(batch.setTest);
        this.superclassTest = of(batch.superclassTest);
        this.superclass1Test = of(batch.superclass1Test);
        this.GOVTest = of(batch.GOVTest);

        this.Q456376Test = this.activitiesTest(item)[0]; //Creator subclass test
        this.Q140759Test = this.activitiesTest(item)[1]; //Occupation class test
        this.masterTest = this.activitiesTest(item)[2]; // Students test

        this.sparql0$ = forkJoin([this.superclassTest, this.superclass1Test]).pipe(
          switchMap(([test1, test2]) => this.selectSparql0(test1, test2, item)),
          startWith<SparqlTuple>([undefined, []])
        );

        this.sparql1$ = forkJoin([
          this.Q12Test,
          this.Q37073Test,
          this.Q456376Test,
          this.Q24499Test,
          this.Q16200Test,
          this.Q77457Test,
        ]).pipe(
          switchMap(([t1, t2, t3, t4, t5, t6]) => this.selectSparql1(t1, t2, t3, t4, t5, t6, item)),
          startWith<SparqlTuple>([undefined, []])
        );

        this.sparql2$ = forkJoin([this.Q140759Test, this.Q16200Test]).pipe(
          switchMap(([test1, test2]) => this.selectSparql2(test1, test2, item)),
          startWith<SparqlTuple>([undefined, []])
        );

        this.sparql3$ = forkJoin([
          this.masterTest,
          this.listTest,
          this.setTest,
          this.Q16200Test,
        ]).pipe(
          switchMap(([test1, test2, test3, test4]) =>
            this.selectSparql3(test1, test2, test3, test4, item)
          ),
          startWith<SparqlTuple>([undefined, []])
        );

        this.sparql4$ = forkJoin([this.Q8Test, this.GOVTest]).pipe(
          switchMap(([test1, test2]) => this.selectSparql4(test1, test2, item)),
          startWith<SparqlTuple>([undefined, []])
        );

        // attach the batch-level test results to the item so other services
        // can synchronously consult the precomputed ASK flags (eg. Q12Test)
        // when the SPARQL Observables themselves resolve asynchronously.
        (item as any).sparqlFlags = batch;

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

  Q12TestGet(a) {
    return (
      'https://database.factgrid.de/query/#ASK%20%7Bwd%3A' +
      a +
      '%20wdt%3AP2%2Fwdt%3AP3%2a%20wd%3AQ12.%20FILTER%28NOT%20EXISTS%20%7Bwd%3A' +
      a +
      '%20wdt%3AP2%2Fwdt%3AP3%2a%20wd%3AQ8%7D%29%20%7D%0A%20'
    );
  }

  selectSparql0(test1: boolean, test2: boolean, item): Observable<SparqlTuple> {
    if (!this.DEBUG_ITEM || this.DEBUG_ITEM === '*' || item?.id === this.DEBUG_ITEM) {
      console.debug('[ItemSparql] selectSparql0', { itemId: item?.id, test1, test2 });
    }
    let result: Observable<SparqlTuple>;
    if (test1 === true) {
      result = this.superclassSparql(test1, item);
    } else {
      if (test2 === true) {
        result = this.superclass1Sparql(test2, item);
      } else result = this.noResult();
    }
    return result;
  }

  selectSparql1(
    test1: boolean,
    test2: boolean,
    test3: boolean,
    test4: boolean,
    test5: boolean,
    test6: boolean,
    item
  ): Observable<SparqlTuple> {
    if (!this.DEBUG_ITEM || this.DEBUG_ITEM === '*' || item?.id === this.DEBUG_ITEM) {
      console.debug('[ItemSparql] selectSparql1', {
        itemId: item?.id,
        test1,
        test2,
        test3,
        test4,
        test5,
        test6,
      });
    }
    let result: Observable<SparqlTuple>;
    if (test5 === true) {
      result = this.Q16200Sparql(item);
    } else if (test1 === true) {
      result = this.Q12Sparql(test1, item);
    } else if (test2 === true) {
      result = this.Q37073Sparql(test2, item);
    } else if (test3 === true) {
      result = this.Q456376Sparql(test3, item);
    } else if (test4 === true) {
      result = this.Q24499Sparql(item);
    } else if (test6 === true) {
      result = this.Q77457Sparql(item);
    } else {
      result = this.noResult();
    }
    return result;
  }

  selectSparql2(test1: boolean, test2: boolean, item): Observable<SparqlTuple> {
    if (!this.DEBUG_ITEM || this.DEBUG_ITEM === '*' || item?.id === this.DEBUG_ITEM) {
      console.debug('[ItemSparql] selectSparql2', { itemId: item?.id, test1, test2 });
    }
    let result: Observable<SparqlTuple>;
    if (test1 === true) {
      result = this.Q140759Sparql(test1, item);
    } else {
      if (test2 === true) {
        result = this.noResult();
      } else result = this.noResult();
    }
    return result;
  }

  selectSparql3(test1: boolean, test2: boolean, test3: boolean, test4: boolean, item): Observable<SparqlTuple> {
    if (!this.DEBUG_ITEM || this.DEBUG_ITEM === '*' || item?.id === this.DEBUG_ITEM) {
      console.debug('[ItemSparql] selectSparql3', { itemId: item?.id, test1, test2, test3, test4 });
    }
    let result: Observable<SparqlTuple>;
    if (test1 === true) {
      result = this.masterSparql(test1, item);
    } else {
      if (test2 === true) {
        result = this.listSparql(test2, item);
      } else {
        if (test3 === true) {
          result = this.setSparql(test3, item);
        } else {
          if (test4 === true) {
            // currentAddress was converted to return a SparqlTuple directly
            result = this.currentAddress(item);
          } else result = this.noResult();
        }
      }
    }
    return result;
  }

  selectSparql4(test1: boolean, test2: boolean, item): Observable<SparqlTuple> {
    if (!this.DEBUG_ITEM || this.DEBUG_ITEM === '*' || item?.id === this.DEBUG_ITEM) {
      console.debug('[ItemSparql] selectSparql4', { itemId: item?.id, test1, test2 });
    }
    let result: Observable<SparqlTuple>;
    if (test1 === true) {
      result = this.Q8Sparql(item);
    } else {
      if (test2 === true) {
        result = this.GOVSparql(item);
      } else result = this.noResult();
    }
    return result;
  }

  Q24499TestGet(item) {
    let test: boolean = false;
    if (
      item &&
      item.claims &&
      item.claims.P2 &&
      Array.isArray(item.claims.P2) &&
      item.claims.P2[0] &&
      item.claims.P2[0].mainsnak &&
      item.claims.P2[0].mainsnak.datavalue &&
      item.claims.P2[0].mainsnak.datavalue.value &&
      item.claims.P2[0].mainsnak.datavalue.value.id === 'Q24499'
    ) {
      test = true;
    }
    return of(test);
  }

  Q8TestGet(item) {
    let test: boolean = false;
    if (item.claims.P2[0].mainsnak.datavalue.value.id == 'Q8') {
      test = true;
    }
    return of(test);
  }

  Q16200TestGet(item) {
    // Address
    let test: boolean = false;
    if (
      item &&
      item.claims &&
      item.claims.P2 &&
      Array.isArray(item.claims.P2) &&
      item.claims.P2[0] &&
      item.claims.P2[0].mainsnak &&
      item.claims.P2[0].mainsnak.datavalue &&
      item.claims.P2[0].mainsnak.datavalue.value &&
      item.claims.P2[0].mainsnak.datavalue.value.id === 'Q16200'
    ) {
      test = true;
    }
    return of(test);
  }

  Q172192TestGet(item) {
    let test: boolean = false;
    if (item.claims.P2[0].mainsnak.datavalue.value.id == 'Q172192') {
      test = true;
    }
    return of(test);
  }

  Q77457TestGet(item) {
    let test: boolean = false;
    if (
      item &&
      item.claims &&
      item.claims.P2 &&
      Array.isArray(item.claims.P2) &&
      item.claims.P2[0] &&
      item.claims.P2[0].mainsnak &&
      item.claims.P2[0].mainsnak.datavalue &&
      item.claims.P2[0].mainsnak.datavalue.value &&
      item.claims.P2[0].mainsnak.datavalue.value.id === 'Q77457'
    ) {
      test = true;
    }
    return of(test);
  }

  GOVTestGet(item) {
    let test: boolean = false;
    if (
      item &&
      item.claims &&
      item.claims.P2 &&
      Array.isArray(item.claims.P2) &&
      item.claims.P2[0] &&
      item.claims.P2[0].mainsnak &&
      item.claims.P2[0].mainsnak.datavalue &&
      item.claims.P2[0].mainsnak.datavalue.value &&
      item.claims.P2[0].mainsnak.datavalue.value.id === 'Q780657'
    ) {
      test = true;
    }
    return of(test);
  }

  Q12Sparql(test, res): Observable<SparqlTuple> {
    // Organisation
    if (test === true) {
      let prefix1 =
        'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%3FfLabel%20WHERE%20%7B%20%0A%7B%20%3Fitem%20p%3AP165%20%5Bps%3AP165%20%3Factivity%3B%20pq%3AP267%20wd%3A';
      let prefix2 = '%5D%20.%20%7D%20UNION%20%20%20%7B%20%3Fitem%20wdt%3AP91%20wd%3A';
      let prefix3 =
        '%20.%7D%20UNION%20%7B%20%3Fu%20%5Ewdt%3AP165%20%3Fitem%3B%20%20wdt%3AP267%20wd%3A';
      let prefix4 = '%20%7D%20UNION%20%7B%20%3Fitem%20wdt%3AP315%20wd%3A';
      let suffix = '%20.%20%7D%0A%3Fitem%20wdt%3AP247%20%3Ff';
      let u =
        prefix1 +
        res.id +
        prefix2 +
        res.id +
        prefix3 +
        res.id +
        prefix4 +
        res.id +
        suffix +
        this.langService +
        'ORDER%20BY%20%3FfLabel';
      return this.sparqlQuery(u).pipe(
        map((res) => ['Q12', this.listFromSparql(res).results.bindings] as SparqlTuple)
      );
    }
    return this.noResult();
  }

  Q37073Sparql(test, res): Observable<SparqlTuple> {
    // Career statement
    if (test === true) {
      let prefix1 =
        'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%3FfamilyNameLabel%20WHERE%20%7B%20%0A%20%7B%20%3Fitem%20wdt%3AP165%2Fwdt%3AP3%2a%20wd%3A';
      let prefix2 = '%20%7D%20UNION%20%7B%20%3Fitem%20p%3AP165%20%5Bpq%3AP122%20wd%3A';
      let suffix =
        '%5D%20%7D%0A%20%20%20%20%20%20%20OPTIONAL%20%7B%20%3Fitem%20wdt%3AP247%20%3FfamilyName%20%7D';
      let u =
        prefix1 +
        res.id +
        prefix2 +
        res.id +
        suffix +
        this.langService +
        'ORDER%20by%20%3FfamilyNameLabel%20%0ALIMIT%2010000';
      return this.sparqlQuery(u).pipe(
        map((res) => ['Q37073', this.listFromSparql(res).results.bindings] as SparqlTuple)
      );
    }
    return this.noResult();
  }

  Q456376Sparql(test, res): Observable<SparqlTuple> {
    // Creator subclass
    if (test === true) {
      let prefix1 =
        'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%3Fyear%0AWHERE%20%7B%20%3Fitem%20%28wdt%3AP21%20%7C%20wdt%3AP552%29%20wd%3A';
      let prefix2 =
        '%20.%0A%20%20OPTIONAL%20%7B%3Fitem%20wdt%3AP222%20%3Fdate%20.%20BIND%28YEAR%28%3Fdate%29%20AS%20%3Fyear%29%20.%7D%0A%20';
      let u = prefix1 + res.id + prefix2 + this.langService + 'ORDER%20BY%20%3Fyear';
      return this.sparqlQuery(u).pipe(
        map((res) => ['Q456376', this.listFromSparql(res).results.bindings] as SparqlTuple)
      );
    }
    return this.noResult();
  }

  Q140759Sparql(test, res): Observable<SparqlTuple> {
    // Health care practitioner
    if (test === true) {
      let prefix =
        'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%3FfamilyNameLabel%20WHERE%20%7B%20%3Fitem%20wdt%3AP247%20%3FfamilyName%3B%20wdt%3AP512%20wd%3A';
      let u = prefix + res.id + this.langService + 'ORDER%20BY%20%3FfamilyNameLabel';
      return this.sparqlQuery(u).pipe(
        map((res) => ['Q140759', this.listFromSparql(res).results.bindings] as SparqlTuple)
      );
    }
    return this.noResult();
  }

  masterSparql(test, res): Observable<SparqlTuple> {
    if (test === true) {
      let prefix =
        'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%3FfamilyNameLabel%20WHERE%20%7B%20%3Fitem%20wdt%3AP247%20%3FfamilyName%3B%20wdt%3AP161%20wd%3A';
      let u = prefix + res.id + this.langService + 'ORDER%20BY%20%3FfamilyNameLabel';
      return this.sparqlQuery(u).pipe(
        map((res) => ['master', this.listFromSparql(res).results.bindings] as SparqlTuple)
      );
    }
    return this.noResult();
  }

  listSparql(test, res): Observable<SparqlTuple> {
    if (test === true) {
      let prefix =
        'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20WHERE%20%7B%20%3Fitem%20wdt%3AP2%2Fwdt%3AP3%2a%20%7C%20wdt%3AP626%2Fwdt%3AP3%2a%20%7C%20wdt%3AP1007%2Fwdt%3AP3%2a%20wd%3A';
      let u = prefix + res.id + this.langService + 'ORDER%20BY%20%3FitemLabel';
      return this.sparqlQuery(u).pipe(
        map((res) => ['Q172192', this.listFromSparql(res).results.bindings] as SparqlTuple)
      );
    }
    return this.noResult();
  }

  setSparql(test, res): Observable<SparqlTuple> {
    if (test === true) {
      let prefix =
        'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20WHERE%20%7B%20%3Fitem%20wdt%3AP8%20%7C%20wdt%3AP319%20%20wd%3A';
      let u = prefix + res.id + this.langService + 'ORDER%20BY%20%3FitemLabel';
      return this.sparqlQuery(u).pipe(
        map((res) => ['Q945258', this.listFromSparql(res).results.bindings] as SparqlTuple)
      );
    }
    return this.noResult();
  }

  superclassSparql(test, res): Observable<SparqlTuple> {
    if (test === true) {
      let prefix =
        'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20WHERE%20%7B%20%3Fitem%20wdt%3AP3%2B%20wd%3A';
      let u = prefix + res.id + this.langService + 'ORDER%20BY%20%3FitemLabel';
      return this.sparqlQuery(u).pipe(
        map((res) => ['Q945280', this.listFromSparql(res).results.bindings] as SparqlTuple)
      );
    }
    return this.noResult();
  }

  superclass1Sparql(test, res): Observable<SparqlTuple> {
    if (test === true) {
      let prefix =
        'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20WHERE%20%7B%20%3Fitem%20wdt%3AP3%20wd%3A';
      let u = prefix + res.id + this.langService + 'ORDER%20BY%20%3FitemLabel';
      return this.sparqlQuery(u).pipe(
        map((res) => ['Q960698', this.listFromSparql(res).results.bindings] as SparqlTuple)
      );
    }
    return this.noResult();
  }

  Q24499Sparql(res): Observable<SparqlTuple> {
    //family name
    let u = '';
    let suffix = 'ORDER%20by%20%3FitemLabel';
    let prefix =
      'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%20WHERE%20%7B%20%20%3Fitem%20wdt%3AP247%2Fwdt%3AP3%2a%20wd%3A';
    u = prefix + res.id + this.langService + suffix;

    return this.sparqlQuery(u).pipe(
      map((r) => {
        return (['Q24499', this.listFromSparql(r).results.bindings] as unknown) as SparqlTuple;
      })
    );
  }

  Q8Sparql(res): Observable<SparqlTuple> {
    //Lieu
    let u = '';
    let prefix =
      'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20WHERE%20%0A%7B%3Fitem%20wdt%3AP2%2Fwdt%3AP3%2a%20wd%3AQ160381%3B%20wdt%3AP83%20%7C%20wdt%3AP47%20wd%3A';
    let suffix = 'ORDER%20by%20%3FitemLabel';
    u = prefix + res.id + this.langService + suffix;
    return this.sparqlQuery(u).pipe(
      map((res) => ['Q8', this.listFromSparql(res).results.bindings] as SparqlTuple)
    );
  }

  GOVSparql(res): Observable<SparqlTuple> {
    let u = '';
    let prefix =
      'https://database.factgrid.de/query/#SELECT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%20WHERE%20%7B%3Fitem%20wdt%3AP1075%20wd%3A';
    let suffix = 'ORDER%20by%20%3FitemLabel';
    u = prefix + res.id + this.langService + suffix;
    return this.sparqlQuery(u).pipe(
      map((res) => ['GOV', this.listFromSparql(res).results.bindings] as SparqlTuple)
    );
  }

  Q16200Sparql(res): Observable<SparqlTuple> {
    // Address
    let u = '';
    let prefix =
      'https://database.factgrid.de/query/#SELECT%20DISTINCT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20%0AWHERE%20%0A%7B%0A%20%20%3Fitem%20wdt%3AP208%20wd%3A';
    u = prefix + res.id + this.langService + 'ORDER%20BY%20%3FfitemLabel';
    return this.sparqlQuery(u).pipe(
      map((res) => ['Q16200', this.listFromSparql(res).results.bindings] as SparqlTuple)
    );
  }

  Q77457Sparql(res): Observable<SparqlTuple> {
    // Class of FactGrid properties
    let prefix =
      'https://database.factgrid.de/query/#SELECT%20%3Fitem%20%3FitemLabel%20%3FitemDescription%20WHERE%20%7B%20%3Fitem%20wdt%3AP8%20wd%3A';
    let u = prefix + res.id + this.langService + 'ORDER%20BY%20%3FitemLabel';
    let v = this.sparqlQuery(u).pipe(
      map((res) => ['Q77457', this.listFromSparql(res).results.bindings] as SparqlTuple)
    );
    return v;
  }

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
      const u = 'https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=json';
      return this.request.getItem(u).pipe(
        map((g: any) => {
          const label = 'Q16200';
          const binding: any = {
            item: { value: `address:${item?.id ?? 'unknown'}`, id: `address:${item?.id ?? 'unknown'}` },
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
