import { Injectable } from '@angular/core';
import type { ItemDisplayTuple } from '../../services/item-types';
import type { EnrichedItemTuple } from './display-item.utils';
import { getEntity, getRemainingProps, removeRemainingProp } from './display-item.utils';
import type { Entity, ClaimArray } from '../../interfaces/claims';
import {
  PERSON_DISPLAY_PROPERTIES,
  PLACE_DISPLAY_PROPERTIES,
  CAREER_DISPLAY_PROPERTIES,
  DOCUMENT_DISPLAY_PROPERTIES,
  ACTIVITY_DISPLAY_PROPERTIES,
  EDUCATION_DISPLAY_PROPERTIES,
  EVENT_DISPLAY_PROPERTIES,
  ORG_DISPLAY_PROPERTIES,
  SOCIABILITY_DISPLAY_PROPERTIES,
  HEADER_DISPLAY_PROPERTIES,
  INFO_DISPLAY_PROPERTIES,
  SOURCES_DISPLAY_PROPERTIES,
  EXTERNAL_LINKS_DISPLAY_PROPERTIES,
  EXCLUDED_DISPLAY_PROPERTIES,
} from '../../config/dispatcher.config';

@Injectable({
  providedIn: 'root',
})
export class BlockDisplayService {
  /**
   * Méthode générique pour peupler un tableau à partir d'une constante de propriétés.
   */
  private populateDisplay(
    item: ItemDisplayTuple | EnrichedItemTuple,
    targetArray: any[],
    properties: { property: string }[]
  ): any[] {
    const entity = getEntity(item) as Entity | undefined;
    const remaining = getRemainingProps(item);

    for (const { property } of properties) {
      if (entity?.claims?.[property] !== undefined) {
        // only remove property from index if it exists in the index list
        if (Array.isArray(remaining) && remaining.indexOf(property) >= 0) {
          removeRemainingProp(item, property);
        }
        // Avoid pushing the same claim object into the same target array
        // multiple times; this prevents intra-block duplication earlier
        // and saves the higher-cost de-duplication step later on.
        const claim = item[0].claims[property] as ClaimArray | undefined;
        if (!targetArray.includes(claim)) {
          targetArray.push(claim);
        }
      }
    }
    return targetArray;
  }

  setExcludedProperties(item: ItemDisplayTuple | EnrichedItemTuple, excludedProperties: any[]): any[] {
    return this.populateDisplay(item, excludedProperties, EXCLUDED_DISPLAY_PROPERTIES);
  }

  setInfoDisplay(item: ItemDisplayTuple | EnrichedItemTuple, infoDetail: any[]): any[] {
    return this.populateDisplay(item, infoDetail, INFO_DISPLAY_PROPERTIES);
  }

  setHeaderDisplay(item: ItemDisplayTuple | EnrichedItemTuple, headerDetail: any[]): any[] {
    // HEADER_DISPLAY_PROPERTIES is defined in dispatcher.config and lists P2/P3/P8 etc.
    // This keeps the header-focused properties grouped and presented in the top info card.
    // Reuse populateDisplay helper so behaviour matches other section builders.
    return this.populateDisplay(item, headerDetail, HEADER_DISPLAY_PROPERTIES);
  }

  setPlaceDisplay(item: ItemDisplayTuple | EnrichedItemTuple, locationAndSituation: any[]): any[] {
    // First handle the configured place properties
    this.populateDisplay(item, locationAndSituation, PLACE_DISPLAY_PROPERTIES);

    // In addition, support direct coordinate claims that are not part of
    // PLACE_DISPLAY_PROPERTIES (e.g. P48 and P625). Ensure we remove the
    // properties from the index and don't duplicate entries when called
    // multiple times.
    const claims = (getEntity(item) as Entity | undefined)?.claims || {};

    // P48 (geographic coordinates) fallback
    if ((claims as any).P48 !== undefined) {
      if (Array.isArray(getRemainingProps(item)) && getRemainingProps(item).indexOf('P48') >= 0) {
        removeRemainingProp(item, 'P48');
      }
      if (!locationAndSituation.includes(claims.P48)) locationAndSituation.push(claims.P48);
    }

    // P625 (another coordinate property) fallback
    if ((claims as any).P625 !== undefined) {
      if (Array.isArray(getRemainingProps(item)) && getRemainingProps(item).indexOf('P625') >= 0) {
        removeRemainingProp(item, 'P625');
      }
      if (!locationAndSituation.includes(claims.P625)) locationAndSituation.push(claims.P625);
    }

    return locationAndSituation;
  }

  setPersonDisplay(item: ItemDisplayTuple | EnrichedItemTuple, lifeAndFamily: any[]): any[] {
    return this.populateDisplay(item, lifeAndFamily, PERSON_DISPLAY_PROPERTIES);
  }

  setCareerDisplay(item: ItemDisplayTuple | EnrichedItemTuple, careerAndActivities: any[]): any[] {
    return this.populateDisplay(item, careerAndActivities, CAREER_DISPLAY_PROPERTIES);
  }

  setSociabilityDisplay(item: ItemDisplayTuple | EnrichedItemTuple, sociabilityAndCulture: any[]): any[] {
    return this.populateDisplay(item, sociabilityAndCulture, SOCIABILITY_DISPLAY_PROPERTIES);
  }

  setEducationDisplay(item: ItemDisplayTuple | EnrichedItemTuple, education: any[]): any[] {
    return this.populateDisplay(item, education, EDUCATION_DISPLAY_PROPERTIES);
  }

  setOrgDisplay(item: ItemDisplayTuple | EnrichedItemTuple, locationAndContext: any[]): any[] {
    return this.populateDisplay(item, locationAndContext, ORG_DISPLAY_PROPERTIES);
  }

  setActivityDisplay(item: ItemDisplayTuple | EnrichedItemTuple, activityDetail: any[]): any[] {
    return this.populateDisplay(item, activityDetail, ACTIVITY_DISPLAY_PROPERTIES);
  }

  setEventDisplay(item: ItemDisplayTuple | EnrichedItemTuple, eventDetail: any[]): any[] {
    return this.populateDisplay(item, eventDetail, EVENT_DISPLAY_PROPERTIES);
  }

  setDocumentDisplay(item: ItemDisplayTuple | EnrichedItemTuple, documentDetail: any[]): any[] {
    return this.populateDisplay(item, documentDetail, DOCUMENT_DISPLAY_PROPERTIES);
  }

  setSourcesDisplay(item: ItemDisplayTuple | EnrichedItemTuple, sourcesList: any[]): any[] {
    return this.populateDisplay(item, sourcesList, SOURCES_DISPLAY_PROPERTIES);
  }

  setItemInfoDisplay(item: ItemDisplayTuple | EnrichedItemTuple, target: any): void {
    const infoList = getEntity(item)?.infoList || [];

    target.instancesList = Array.isArray(infoList[0]) ? [...infoList[0]] : [];
    target.subclassesList = Array.isArray(infoList[1]) ? [...infoList[1]] : [];
    target.classesList = Array.isArray(infoList[2]) ? [...infoList[2]] : [];
    target.natureOfList = Array.isArray(infoList[3]) ? [...infoList[3]] : [];
  }

  setExternalLinksDisplay(item: ItemDisplayTuple | EnrichedItemTuple, externalLinks: any[]): any[] {
    return this.setUrlDisplay(item, externalLinks);
  }

  setUrlDisplay(item: ItemDisplayTuple | EnrichedItemTuple, externalLinks: any[]): any[] {
    const entity = getEntity(item);
    const properties = Object.keys(entity?.claims || {});
    for (const prop of properties) {
      if (prop === 'P1306' || prop === 'P650') continue; // Exclure les propriétés obsolètes
      const claim = item[0].claims[prop];
      if (!claim || claim.datatype !== 'external-id') continue;

      // Retirer la propriété de l'affichage général
      if (Array.isArray(getRemainingProps(item))) removeRemainingProp(item, prop);

      // Générer l'URL selon la logique métier
      this.setUrl(item, prop);

      // Ajouter à la liste des liens externes
      externalLinks.push(claim);
    }
    return externalLinks;
  }

  private setUrl(item: ItemDisplayTuple | EnrichedItemTuple, p: string): void {
    const claim = getEntity(item)?.claims?.[p];
    if (!claim) return;

    if (claim.externalLink !== undefined) {
      claim.url = claim.externalLink.replace('$1', claim[0].mainsnak.datavalue.value);
    }

    if (getEntity(item)?.claims?.P76 !== undefined) {
      getEntity(item)!.claims.P76.url =
        'https://explore.gnd.network/gnd/' + getEntity(item)!.claims.P76[0].mainsnak.datavalue.value;
    }
    if (getEntity(item)?.claims?.P368 !== undefined) {
      getEntity(item)!.claims.P368.url =
        'http://gateway-bayern.de/VD16+' + getEntity(item)!.claims.P368[0].mainsnak.datavalue.value;
    }
    if (getEntity(item)?.claims?.P369 !== undefined) {
      getEntity(item)!.claims.P369.url =
        'https://kxp.k10plus.de/DB=1.28/CMD?ACT=SRCHA&IKT=8079&TRM=%27:' +
        getEntity(item)!.claims.P369[0].mainsnak.datavalue.value +
        '%27';
    }
    if (getEntity(item)?.claims?.P370 !== undefined) {
      getEntity(item)!.claims.P370.url =
        'https://kxp.k10plus.de/DB=1.65/CMD?ACT=SRCHA&IKT=8080&TRM=VD18' +
        getEntity(item)!.claims.P370[0].mainsnak.datavalue.value;
    }
    if (getEntity(item)?.claims?.P650 !== undefined) {
      let value = getEntity(item)!.claims.P650[0].mainsnak.datavalue.value;
      let province = value.slice(0, 2);
      let municipality = value.slice(2, 5);
      let parish = value.slice(5, 7);
      let es = value.slice(7, 9);
      if (getEntity(item)!.claims.P650.externalLink !== undefined) {
        let url = getEntity(item)!.claims.P650.externalLink
          .replace('$1', province)
          .replace('$2', municipality)
          .replace('$3', parish)
          .replace('$4', es)
          .replace('$5', '00');
        // intentionally no debug log in production code
        getEntity(item)!.claims.P650.url = url;
      }
    }
    if (getEntity(item)?.claims?.P882 !== undefined) {
      getEntity(item)!.claims.P882.url =
        'https://drw-www.adw.uni-heidelberg.de/drw-cgi/zeige?index=lemmata&term=' +
        getEntity(item)!.claims.P882[0].mainsnak.datavalue.value +
        '&darstellung=V';
    }
  }
}
