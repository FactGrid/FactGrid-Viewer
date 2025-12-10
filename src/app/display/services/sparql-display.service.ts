import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SparqlTuple, SparqlBinding } from '../../services/sparql-types';
import { map } from 'rxjs/operators';

export type SparqlDisplayType = 'sparql0' | 'sparql1' | 'sparql2' | 'sparql3' | string;

export interface SparqlCardState {
  subject: string;
  list: SparqlBinding[];
  title: string;
}

export interface SparqlAllCardsState {
  sparql0: SparqlCardState;
  sparql1: SparqlCardState;
  sparql2: SparqlCardState;
  sparql3: SparqlCardState;
  sparql4: SparqlCardState;
}

@Injectable({ providedIn: 'root' })
export class SparqlDisplayService {
  constructor() {}
  /**
   * Retourne le titre à afficher selon le type et le sparqlSubject
   */
  getTitle(type: SparqlDisplayType, sparqlSubject: string, langService: any, list: any[]): string {
    switch (type) {
      case 'sparql0':
        if (sparqlSubject === 'Q945280' || sparqlSubject === 'Q960698') {
          return langService.getTranslation('subclassesListTitle', langService.selectedLang);
        }
        return '';
      case 'sparql1':
        if (sparqlSubject === 'Q8') {
          return langService.getTranslation('buildingTitle', langService.selectedLang);
        } else if (sparqlSubject === 'Q24499') {
          return langService.getTranslation('familyNameTitle', langService.selectedLang);
        } else if (sparqlSubject === 'Q12') {
          if (list[0] && list[0].activity) {
            return langService.getTranslation('activityTitle', langService.selectedLang);
          } else {
            return langService.getTranslation('organisationTitle', langService.selectedLang);
          }
        } else if (sparqlSubject === 'Q37073') {
          return langService.getTranslation('activityTitle', langService.selectedLang);
        } else if (sparqlSubject === 'Q16200') {
          return langService.getTranslation('addressTitle', langService.selectedLang);
        } else if (sparqlSubject === 'Q456376') {
          return langService.getTranslation('workTitle', langService.selectedLang);
        } else if (sparqlSubject === 'Q172192') {
          return langService.getTranslation('listTitle', langService.selectedLang);
        }
        return '';
      case 'sparql2':
        if (sparqlSubject === 'Q140759') {
          return langService.getTranslation('patientsTitle', langService.selectedLang);
        }
        return '';
      case 'sparql3':
        if (sparqlSubject === 'master') {
          return langService.getTranslation('pupilTitle', langService.selectedLang);
        } else if (sparqlSubject === 'Q945258') {
          return langService.getTranslation('setTitle', langService.selectedLang);
        } else if (sparqlSubject === 'Q172192') {
          return langService.getTranslation('listTitle', langService.selectedLang);
        } else if (sparqlSubject === 'current address:') {
          return langService.getTranslation('currentAddress', langService.selectedLang);
        }
        return '';
      case 'sparql4':
        // sparql4 is used for Q8 / GOV results: Q8 actually maps to
        // buildings/monuments in our vocabulary (buildingTitle), not
        // the generic locationHeader.
        if (sparqlSubject === 'Q8') {
          return langService.getTranslation('buildingTitle', langService.selectedLang);
        } else if (sparqlSubject === 'GOV') {
          return langService.getTranslation('workTitle', langService.selectedLang);
        }
        return '';
      default:
        return '';
    }
  }

  /**
   * À partir du flux brut `sparql$` (structure [[subject, rows], ...])
   * calcule pour toutes les cartes SPARQL les sujets, listes transformées
   * (sans doublons) et titres associés.
   */
  buildAllCardsState(
    sparql$: Observable<SparqlTuple[]>,
    langService: any
  ): Observable<SparqlAllCardsState> {
    return sparql$.pipe(
      map((data: SparqlTuple[]) => {
        const buildCard = (index: number, type: SparqlDisplayType): SparqlCardState => {
          const raw = data && data[index];
          if (!raw || !raw[1] || !raw[1].length) {
            return { subject: '', list: [], title: '' };
          }
          const subject = raw[0];
          const rawList: SparqlBinding[] = raw[1];
          const transformed = this.transformData(type, rawList);
          const list = this.removeDuplicates(transformed);
          const title = this.getTitle(type, subject, langService, list);
          return { subject, list, title };
        };

        return {
          sparql0: buildCard(0, 'sparql0'),
          sparql1: buildCard(1, 'sparql1'),
          sparql2: buildCard(2, 'sparql2'),
          sparql3: buildCard(3, 'sparql3'),
          sparql4: buildCard(4, 'sparql4'),
        };
      })
    );
  }

  /**
   * Transforme les données pour l'affichage (ex: ajout de itemText)
   */
  transformData(type: SparqlDisplayType, data: SparqlBinding[]): SparqlBinding[] {
    if (!data) return [];
    const result = data.map((el) => {
      if (el.itemDescription === undefined) {
        (el as any).itemText = el.itemLabel?.value || '';
      } else {
        (el as any).itemText = (el.itemLabel?.value || '') + (el.itemDescription?.value || '');
      }
      return el;
    });
    return result;
  }

  /**
   * Supprime les doublons selon itemText
   */
  removeDuplicates(data: SparqlBinding[]): SparqlBinding[] {
    if (!data) return [];
    // preserve last occurrence for duplicates (reverse behaviour) and calculate how many were removed
    const reversed = data.reverse();
    const mapEntries: [string, any][] = reversed.map(
      (v) => [JSON.stringify([(v as any).itemText]), v] as [string, any]
    );
    const unique = [...new Map<string, any>(mapEntries).values()].reverse();
    return unique;
  }

  /**
   * Prépare les données pour l'export CSV selon le type
   */
  prepareCsv(type: SparqlDisplayType, data: SparqlBinding[]): any[][] {
    const header = ['item.id', 'item.label', 'item.description'];
    const rows = data.map((el) => {
      if (type === 'sparql2' || type === 'sparql3') {
        return [el.item?.value, el.itemLabel?.value, el.itemDescription?.value];
      } else {
        return [el.item?.id, el.itemLabel?.value, el.itemDescription?.value];
      }
    });
    return [header, ...rows];
  }
}
