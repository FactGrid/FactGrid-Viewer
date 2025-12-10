import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { SparqlQueryStrategy } from './item-type-resolver.service';
import { BatchAskResult, SparqlTuple } from '../sparql-types';
import { SparqlQueryBuilderService } from './sparql-query-builder.service';
import { RequestService } from '../request.service';

/**
 * Classe de base abstraite pour les stratégies SPARQL.
 * Fournit les utilitaires communs et force l'implémentation des méthodes requises.
 */
export abstract class BaseSparqlStrategy implements SparqlQueryStrategy {
  protected builder = inject(SparqlQueryBuilderService);
  protected request = inject(RequestService);

  abstract readonly id: string;
  abstract readonly priority: number;
  abstract test(flags: BatchAskResult, item: any): boolean;
  abstract query(item: any): Observable<SparqlTuple>;

  /**
   * Exécute une requête SPARQL et transforme le résultat en SparqlTuple.
   */
  protected executeSparql(url: string, label: string): Observable<SparqlTuple> {
    return this.request.getList(url).pipe(
      map((res: any) => {
        const bindings = res?.results?.bindings || [];
        // Traite les IDs des items
        bindings.forEach((b: any) => {
          if (b.item?.value) {
            b.item.id = b.item.value.replace('https://database.factgrid.de/entity/', '');
            b.item.entity = b.item.id.startsWith('P') ? 'property' : 'item';
          }
        });
        // Tri alphabétique français
        bindings.sort((a: any, b: any) => {
          const getLabel = (x: any) => x.fLabel?.value || x.itemLabel?.value || '';
          return getLabel(a).localeCompare(getLabel(b), 'fr', {
            sensitivity: 'base',
            ignorePunctuation: true,
          });
        });
        return [label, bindings] as SparqlTuple;
      })
    );
  }

  /**
   * Retourne un résultat vide.
   */
  protected noResult(): Observable<SparqlTuple> {
    return of([undefined, []] as SparqlTuple);
  }
}

/**
 * Stratégie pour les Organisations (Q12).
 */
@Injectable({ providedIn: 'root' })
export class OrganisationStrategy extends BaseSparqlStrategy {
  readonly id = 'Q12';
  readonly priority = 80;

  test(flags: BatchAskResult, item: any): boolean {
    return flags.Q12Test === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription', 'fLabel'], true)
      .union(
        ['?item p:P165 [ps:P165 ?activity; pq:P267 wd:{{itemId}}]'],
        ['?item wdt:P91 wd:{{itemId}}'],
        ['?u ^wdt:P165 ?item', '?u wdt:P267 wd:{{itemId}}'],
        ['?item wdt:P315 wd:{{itemId}}']
      )
      .where(['?item wdt:P247 ?f'])
      .orderBy('fLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q12');
  }
}

/**
 * Stratégie pour les Carrières (Q37073).
 */
@Injectable({ providedIn: 'root' })
export class CareerStrategy extends BaseSparqlStrategy {
  readonly id = 'Q37073';
  readonly priority = 70;

  test(flags: BatchAskResult, item: any): boolean {
    return flags.Q37073Test === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription', 'familyNameLabel'], true)
      .union(
        ['?item wdt:P165/wdt:P3* wd:{{itemId}}'],
        ['?item p:P165 [pq:P122 wd:{{itemId}}]']
      )
      .optional(['?item wdt:P247 ?familyName'])
      .orderBy('familyNameLabel')
      .limit(10000)
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q37073');
  }
}

/**
 * Stratégie pour les Créateurs (Q456376 - sous-classe).
 */
@Injectable({ providedIn: 'root' })
export class CreatorStrategy extends BaseSparqlStrategy {
  readonly id = 'Q456376';
  readonly priority = 60;

  test(flags: BatchAskResult, item: any): boolean {
    // Test géré dynamiquement dans itemSparql via activitiesTest
    return false; // Sera testé via Q456376Test Observable
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription', 'year'], true)
      .where(['?item (wdt:P21 | wdt:P552) wd:{{itemId}}'])
      .optional(['?item wdt:P222 ?date', 'BIND(YEAR(?date) AS ?year)'])
      .orderBy('year')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q456376');
  }
}

/**
 * Stratégie pour les Praticiens de santé (Q140759).
 */
@Injectable({ providedIn: 'root' })
export class HealthPractitionerStrategy extends BaseSparqlStrategy {
  readonly id = 'Q140759';
  readonly priority = 50;

  test(flags: BatchAskResult, item: any): boolean {
    // Test géré dynamiquement via activitiesTest
    return false;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription', 'familyNameLabel'], true)
      .where(['?item wdt:P247 ?familyName', '?item wdt:P512 wd:{{itemId}}'])
      .orderBy('familyNameLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q140759');
  }
}

/**
 * Stratégie pour les Noms de famille (Q24499).
 */
@Injectable({ providedIn: 'root' })
export class FamilyNameStrategy extends BaseSparqlStrategy {
  readonly id = 'Q24499';
  readonly priority = 65;

  test(flags: BatchAskResult, item: any): boolean {
    return flags.Q24499Test === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'], true)
      .where(['?item wdt:P247/wdt:P3* wd:{{itemId}}'])
      .orderBy('itemLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q24499');
  }
}

/**
 * Stratégie pour les Adresses (Q16200).
 */
@Injectable({ providedIn: 'root' })
export class AddressStrategy extends BaseSparqlStrategy {
  readonly id = 'Q16200';
  readonly priority = 100; // Plus haute priorité

  test(flags: BatchAskResult, item: any): boolean {
    return flags.Q16200Test === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'], true)
      .where(['?item wdt:P208 wd:{{itemId}}'])
      .orderBy('itemLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q16200');
  }
}

/**
 * Stratégie pour les Classes de propriétés FactGrid (Q77457).
 */
@Injectable({ providedIn: 'root' })
export class FactGridPropertyClassStrategy extends BaseSparqlStrategy {
  readonly id = 'Q77457';
  readonly priority = 40;

  test(flags: BatchAskResult, item: any): boolean {
    return flags.Q77457Test === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'])
      .where(['?item wdt:P8 wd:{{itemId}}'])
      .orderBy('itemLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q77457');
  }
}

/**
 * Stratégie pour les Lieux (Q8).
 */
@Injectable({ providedIn: 'root' })
export class LocationStrategy extends BaseSparqlStrategy {
  readonly id = 'Q8';
  readonly priority = 90;

  test(flags: BatchAskResult, item: any): boolean {
    return flags.Q8Test === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'], true)
      .where([
        '?item wdt:P2/wdt:P3* wd:Q160381',
        '?item (wdt:P83 | wdt:P47) wd:{{itemId}}'
      ])
      .orderBy('itemLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q8');
  }
}

/**
 * Stratégie pour GOV (Q780657).
 */
@Injectable({ providedIn: 'root' })
export class GOVStrategy extends BaseSparqlStrategy {
  readonly id = 'GOV';
  readonly priority = 30;

  test(flags: BatchAskResult, item: any): boolean {
    return flags.GOVTest === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'])
      .where(['?item wdt:P1075 wd:{{itemId}}'])
      .orderBy('itemLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'GOV');
  }
}

/**
 * Stratégie pour les Maîtres (master).
 */
@Injectable({ providedIn: 'root' })
export class MasterStrategy extends BaseSparqlStrategy {
  readonly id = 'master';
  readonly priority = 45;

  test(flags: BatchAskResult, item: any): boolean {
    // Test géré dynamiquement via activitiesTest
    return false;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription', 'familyNameLabel'], true)
      .where(['?item wdt:P247 ?familyName', '?item wdt:P161 wd:{{itemId}}'])
      .orderBy('familyNameLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'master');
  }
}

/**
 * Stratégie pour les Listes (Q945294).
 */
@Injectable({ providedIn: 'root' })
export class ListStrategy extends BaseSparqlStrategy {
  readonly id = 'Q172192';
  readonly priority = 35;

  test(flags: BatchAskResult, item: any): boolean {
    return flags.listTest === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'], true)
      .where(['?item (wdt:P2/wdt:P3* | wdt:P626/wdt:P3* | wdt:P1007/wdt:P3*) wd:{{itemId}}'])
      .orderBy('itemLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q172192');
  }
}

/**
 * Stratégie pour les Ensembles (Q945258).
 */
@Injectable({ providedIn: 'root' })
export class SetStrategy extends BaseSparqlStrategy {
  readonly id = 'Q945258';
  readonly priority = 33;

  test(flags: BatchAskResult, item: any): boolean {
    return flags.setTest === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'], true)
      .where(['?item (wdt:P8 | wdt:P319) wd:{{itemId}}'])
      .orderBy('itemLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q945258');
  }
}

/**
 * Stratégie pour les Superclasses (Q945280).
 */
@Injectable({ providedIn: 'root' })
export class SuperclassStrategy extends BaseSparqlStrategy {
  readonly id = 'Q945280';
  readonly priority = 25;

  test(flags: BatchAskResult, item: any): boolean {
    return flags.superclassTest === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'], true)
      .where(['?item wdt:P3+ wd:{{itemId}}'])
      .orderBy('itemLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q945280');
  }
}

/**
 * Stratégie pour les Superclasses directes (Q960698).
 */
@Injectable({ providedIn: 'root' })
export class Superclass1Strategy extends BaseSparqlStrategy {
  readonly id = 'Q960698';
  readonly priority = 20;

  test(flags: BatchAskResult, item: any): boolean {
    return flags.superclass1Test === true;
  }

  query(item: any): Observable<SparqlTuple> {
    const url = this.builder
      .select(['item', 'itemLabel', 'itemDescription'], true)
      .where(['?item wdt:P3 wd:{{itemId}}'])
      .orderBy('itemLabel')
      .build({ itemId: item.id });

    return this.executeSparql(url, 'Q960698');
  }
}

/**
 * Liste de toutes les stratégies disponibles.
 */
export const ALL_SPARQL_STRATEGIES = [
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
];
