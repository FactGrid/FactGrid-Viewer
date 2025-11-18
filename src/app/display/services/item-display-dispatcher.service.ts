import { Injectable, inject } from '@angular/core';
import { BlockDisplayService } from './block-display.service';
//import { IframesDisplayService } from './iframes-display.service';
import { WikiDisplayService } from './wiki-display.service';


export interface DisplayFlags {
  isPlace: boolean;
  isCareer: boolean;
  isSociability: boolean;
  isTraining: boolean;
  isOrg: boolean;
  isActivity: boolean;
  isEvent: boolean;
  isSource: boolean;
  isDocument: boolean;
  isOther: boolean;
  isMain: boolean;
  isWikis: boolean;
  isInfoList: boolean;
  isFrames: boolean;
  isExternalLinks: boolean;
}

@Injectable({ providedIn: 'root' })
export class ItemDisplayDispatcherService {
  
  private blockDisplay = inject(BlockDisplayService);
  private wikiDisplay = inject(WikiDisplayService);
 // private iframesDisplay = inject(IframesDisplayService);

  dispatch(item: any, target: any): DisplayFlags {
    const claims = item[0].claims;

    //Excluded properties
    target.excludedProperties = [];
    this.blockDisplay.setExcludedProperties(item, target.excludedProperties);

    // Header
    target.headerDetail = [];
    this.blockDisplay.setHeaderDisplay(item, target.headerDetail);

    // Place
    target.locationAndSituation = [];
    let isPlace = false;
    if (claims.P2?.place !== undefined) {
      this.blockDisplay.setPlaceDisplay(item, target.locationAndSituation);
      isPlace = target.locationAndSituation.length > 0;
    }

    // Person
    target.lifeAndFamily = [];
    let isCareer = false;
    let isSociability = false;
    let isTraining = false;
    if (claims.P2?.person !== undefined) {
      this.blockDisplay.setPersonDisplay(item, target.lifeAndFamily);

      // Career
      target.careerAndActivities = [];
      this.blockDisplay.setCareerDisplay(item, target.careerAndActivities);
      isCareer = target.careerAndActivities.length > 0;
      if (isCareer && claims.P2?.career !== undefined) {
        target.career = claims.P2.career;
      }

      // Sociability
      target.sociabilityAndCulture = [];
      this.blockDisplay.setSociabilityDisplay(item, target.sociabilityAndCulture);
      isSociability = target.sociabilityAndCulture.length > 0;
      if (isSociability && claims.P2?.sociability !== undefined) {
        target.sociability = claims.P2.sociability;
      }

      // Education
      target.education = [];
      this.blockDisplay.setEducationDisplay(item, target.education);
      isTraining = target.education.length > 0;
      if (isTraining && claims.P2?.training !== undefined) {
        target.training = claims.P2.training;
      }
    }

    // Organization
    target.locationAndContext = [];
    let isOrg = false;
    if (claims.P2?.org !== undefined) {
      this.blockDisplay.setOrgDisplay(item, target.locationAndContext);
      isOrg = target.locationAndContext.length > 0;
    }


    // InfoList (remplie entièrement par setInfoDisplay)
    this.blockDisplay.setInfoDisplay(item, target);
    target.infoList = {
      instancesList: target.instancesList,
      subclassesList: target.subclassesList,
      classesList: target.classesList,
      natureOfList: target.natureOfList,
      technicalities: target.infoProperties, // alias pour compatibilité
      infoProperties: target.infoProperties
    };
    // isInfoList sera défini plus bas, une seule fois

    // Sources
    target.sourcesList = [];
    let isSource = false;
    this.blockDisplay.setSourcesDisplay(item, target.sourcesList);
    isSource = target.sourcesList.length > 0;
    target.sources = claims.P2?.sources;

    // External links
    target.externalLinks = [];
    let isExternalLinks = false;
    this.blockDisplay.setExternalLinksDisplay(item, target.externalLinks);
    isExternalLinks = target.externalLinks.length > 0;

    // Others
    target.otherClaims = [];
    let isOther = false;
    if (item[1] && Array.isArray(item[1])) {
      for (let i = 0; i < item[1].length; i++) {
        const P: string = item[1][i];
        if (claims[P] !== undefined) {
          target.otherClaims.push(claims[P]);
        }
      }
      if (claims.P2?.other !== undefined) {
        target.other = claims.P2.other;
      }
      isOther = target.otherClaims.length > 0;
    }

    // Item info

  // MainList
  target.mainList = [];
  let isMain = false;
  let isActivity = false;
  let isDocument = false;
  let isEvent = false;


    if (claims.P2 === undefined) {
      if (claims.P3 !== undefined) {
        target.mainList.push(claims.P3);
      }
    } else {
      // Concaténer toutes les sections sauf lifeAndFamily
      let allSections = []
        .concat(
          target.locationAndContext || [],
          target.locationAndSituation || [],
          target.activityDetail || [],
          target.eventDetail || [],
          target.documentDetail || [],
          target.otherClaims || []
        );
      // Exclure les propriétés qui sont dans technicalities (par propertyId)
      this.blockDisplay.setInfoDisplay(item, target); // S'assurer que infoList est à jour
      let technicalityProps = [];
      let tempTechnicalities = [];
      //  this.blockDisplay.setTechnicalitiesDisplay(item, tempTechnicalities);
      //  if (tempTechnicalities.length > 0) {
      //    technicalityProps = tempTechnicalities.map(t => t.propertyId);
      //  }
      // Filtrer chaque entrée de allSections pour retirer celles dont la propriété est dans technicalityProps
      target.mainList = allSections.filter(section => {
        // section peut être un tableau de claims, on vérifie le propertyId
        if (Array.isArray(section) && section.length > 0 && section[0].mainsnak && section[0].mainsnak.property) {
          return !technicalityProps.includes(section[0].mainsnak.property);
        }
        return true;
      });
    }
    isMain = target.mainList.length > 0;
    if (claims.P2 !== undefined && claims.P2[0]?.mainsnak?.label !== undefined) {
      target.mainTitle = claims.P2[0].mainsnak.label;
    }

    // ... après la construction de target.mainList


    let isFrames = false;

    /* iframes
    target.iframes = [];
    
    this.iframesDisplay.setIframesDisplay(item, target.iframes);
    isFrames = target.iframes.length > 0;
    */

    // InfoList (flag unique pour l'affichage)
    const isInfoList =
      (target.infoList.instancesList && target.infoList.instancesList.length > 0) ||
      (target.infoList.subclassesList && target.infoList.subclassesList.length > 0) ||
      (target.infoList.classesList && target.infoList.classesList.length > 0) ||
      (target.infoList.natureOfList && target.infoList.natureOfList.length > 0) ||
      (target.infoList.technicalities && target.infoList.technicalities.length > 0);


    // Wikis
    target.wikis = [];
    let isWikis = false;
    this.wikiDisplay.setWikiDisplay(item, target.wikis);
    isWikis = target.wikis.length > 0;


    // ... (autres propriétés comme dans votre code)

    // Retourne les flags utiles
    return {
      isPlace,
      isCareer,
      isSociability,
      isTraining,
      isActivity,
      isDocument,
      isEvent,
      isSource,
      isOrg,
      isOther,
      isInfoList,
      isMain,
      isWikis,
      isFrames,
      isExternalLinks
    };
  }
}
