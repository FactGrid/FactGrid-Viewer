import { Injectable, inject } from '@angular/core';
import { BlockDisplayService } from './block-display.service';
import { TechnicalitiesDisplayService } from './technicalities-display.service';
import { ClaimsEnricherService } from './claims-enricher.service';
import { WikiDisplayService } from './wiki-display.service';

export interface DisplayFlags {
  isPerson: boolean;
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
  isInfo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ItemDisplayDispatcherService {
  constructor(
    private blockDisplay: BlockDisplayService,
    private wikiDisplay: WikiDisplayService,
    // iframes handled separately if/when needed
    private technicalitiesDisplay: TechnicalitiesDisplayService,
    private claimsEnricher: ClaimsEnricherService
  ) {}

  dispatch(item: any, target: any): DisplayFlags {
    // Enrich P2-derived flags so dispatcher can rely on normalized presence markers
    this.claimsEnricher.enrich(item);
    const claims = item[0].claims;

    //Excluded properties
    target.excludedProperties = [];
    this.processExcludedProperties(item, target);

    // Info
    const isInfo = this.processInfo(item, target);

    // Place
    const isPlace = this.processPlace(item, target);

    // Person — detect either the parsed "person" marker or the P2 value Q7
    target.lifeAndFamily = [];
    let isCareer = false;
    let isSociability = false;
    let isTraining = false;
    let isPerson = false;
    // detect Q7 anywhere in P2 entries (some items may use multiple P2 entries)
    // be permissive: P2 can have various shapes, so string-search the value as a fallback
    // prefer explicit enrichment flags; fallback to scanning raw payload if needed
    const p2IsQ7 = claims.P2?.person === true ||
      (Array.isArray(claims.P2) && claims.P2.some((p: any) => p?.mainsnak?.datavalue?.value?.id === 'Q7')) ||
      (claims.P2 && JSON.stringify(claims.P2).includes('"Q7"'));

    if (claims.P2?.person !== undefined || p2IsQ7) {
      const personFlags = this.processPerson(item, target, claims);
      isPerson = personFlags.isPerson;
      isCareer = personFlags.isCareer;
      isSociability = personFlags.isSociability;
      isTraining = personFlags.isTraining;
    }
    // ensure isPerson is available to consumers

    // Organization
    const isOrg = this.processOrg(item, target);

    // Activity
    const isActivity = this.processActivity(item, target);

    // Event
    target.eventDetail = [];
    let isEvent = false;

    // Event — build eventDetail when P2.event marker is present
    if (claims.P2?.event !== undefined) {
      this.blockDisplay.setEventDisplay(item, target.eventDetail);
      isEvent = target.eventDetail.length > 0;
    }

    // Only show Event card for persons.
    if (!isPerson) isEvent = false;

    // Document
    const isDocument = this.processDocument(item, target);

    // Sources
    const isSource = this.processSources(item, target);

    // External links
    const isExternalLinks = this.processExternalLinks(item, target);

    // Others
    const isOther = this.processOthers(item, target);

    // MainList
    target.mainList = [];
    let isMain = false;

    // MainList
    this.buildMainList(item, target, isPerson);
      // (previous experimenting code removed)
    isMain = target.mainList.length > 0;
    // Prefer localized main label produced by FactgridSubtitlesService
    // Fall back to the raw payload label only when no localized value exists.
    if (claims.P2 !== undefined) {
      // Avoid mapping the generic P2.main localized label into the main card
      // when P2 explicitly contains a personLabel (that indicates a person
      // context and we want the main card to be icon-only). Map P2.main only
      // when it is a string and not a person context.
      if (typeof claims.P2.main === 'string' && typeof claims.P2.personLabel !== 'string') {
        target.mainTitle = claims.P2.main;
      } else if (Array.isArray(claims.P2) && claims.P2[0]?.mainsnak?.label !== undefined) {
        target.mainTitle = claims.P2[0].mainsnak.label;
      }
    }

    // Main card icon/title behaviour: for person items we want the main card to
    // show an icon (no textual title). Theming is handled in the component's
    // template: when icon is present and title is falsy, only the icon is shown.
    // Use a semantic icon 'more_horiz' for "others".
    target.mainIcon = target.mainIcon ?? 'star'; // default that was used before
    // Consider P2 a person entry when either the presence flag is set, the P2 payload
    // contains the Q7 id, or when an explicit localized person label exists (subtitle service).
    const isPersonP2 =
      claims.P2?.person === true ||
      (Array.isArray(claims.P2) && claims.P2.some((p: any) => p?.mainsnak?.datavalue?.value?.id === 'Q7')) ||
      typeof claims.P2?.personLabel === 'string';
    if (isPersonP2) {
      // hide textual title and show the 'others' icon for human main cards
      // only clear textual main title when it's coming from the generic P2/main label
      // avoid accidentally wiping other localized main titles for non-person contexts
      target.mainTitle = '';
      target.mainIcon = 'more_horiz';
    }

    // Map localized subtitle strings created by FactgridSubtitlesService
    // into explicit title fields for the template to consume.
    // This keeps FactgridSubtitlesService as single source of localized
    // labels while the dispatcher exposes title properties for binding.
    if (claims.P2) {
      // Only map when the corresponding presence flags are present (set by ClaimsEnricher)
      // Prefer explicit label fields set by FactgridSubtitlesService
      if (typeof claims.P2.sociabilityLabel === 'string') {
        target.sociabilityTitle = claims.P2.sociabilityLabel;
      } else if (claims.P2.sociability === true || typeof claims.P2.sociability === 'string') {
        target.sociabilityTitle = claims.P2.sociability as any;
      }

      if (typeof claims.P2.careerLabel === 'string') {
        target.careerTitle = claims.P2.careerLabel;
      } else if (claims.P2.career === true || typeof claims.P2.career === 'string') {
        target.careerTitle = claims.P2.career as any;
      }

      // trainingTitle (education) — map only when training flag exists
      if (typeof claims.P2.trainingLabel === 'string') {
        target.trainingTitle = claims.P2.trainingLabel;
      } else if (claims.P2.training === true || typeof claims.P2.training === 'string') {
        target.trainingTitle = claims.P2.training as any;
      }

      // eventTitle — ONLY use an explicit localized value from claims.P2.event
      // If P2.event is a boolean flag (true) we avoid using P2.main (which is
      // the generic 'main' label and may be 'Life and family' for persons).
      // Keep the existing target.eventTitle (initialized in the component)
      // unless there is a concrete string label present in claims.P2.event.
      if (typeof claims.P2.eventLabel === 'string') {
        target.eventTitle = claims.P2.eventLabel;
      } else if (typeof claims.P2.event === 'string') {
        target.eventTitle = claims.P2.event;
      }
    }

    // ... après la construction de target.mainList

    let isFrames = false;

    // iframes are currently disabled — handled in separate service when needed

    // InfoList

    this.blockDisplay.setItemInfoDisplay(item, target);

    let technicalities: any[] = [];
    this.technicalitiesDisplay.setTechnicalitiesDisplay(item, technicalities);

    target.infoList = {
      instancesList: target.instancesList,
      subclassesList: target.subclassesList,
      classesList: target.classesList,
      natureOfList: target.natureOfList,
      technicalities: technicalities,
    };

    // Flag unique pour l'affichage
    let isInfoList =
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
      isPerson,
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
      isInfo,
      isMain,
      isWikis,
      isFrames,
      isExternalLinks,
    };
  }

  // --- Small helpers to break dispatch up for readability & testability ---
  private processExcludedProperties(item: any, target: any): void {
    this.blockDisplay.setExcludedProperties(item, target.excludedProperties);
  }

  private processInfo(item: any, target: any): boolean {
    target.info = [];
    this.blockDisplay.setInfoDisplay(item, target.info);
    // no debug logging in helpers
    return target.info.length > 0;
  }

  private processPlace(item: any, target: any): boolean {
    const claims = item[0].claims;
    target.locationAndSituation = [];
    if (claims.P2?.place !== undefined) {
      this.blockDisplay.setPlaceDisplay(item, target.locationAndSituation);
    }
    return target.locationAndSituation.length > 0;
  }

  private processPerson(item: any, target: any, claims: any): { isPerson: boolean; isCareer: boolean; isSociability: boolean; isTraining: boolean } {
    const result = { isPerson: false, isCareer: false, isSociability: false, isTraining: false };
    result.isPerson = true;
    this.blockDisplay.setPersonDisplay(item, target.lifeAndFamily);

    // Ensure person UI hints
    target.personIcon = target.personIcon ?? 'person';
    // prefer subtitle label created by FactgridSubtitlesService when present
    if (claims.P2?.personLabel !== undefined) target.personTitle = claims.P2.personLabel;
    else target.personTitle = target.personTitle ?? 'Life and family';

    // Career
    target.careerAndActivities = [];
    this.blockDisplay.setCareerDisplay(item, target.careerAndActivities);
    result.isCareer = target.careerAndActivities.length > 0;
    if (result.isCareer && claims.P2?.career !== undefined) target.career = claims.P2.career;

    // Sociability
    target.sociabilityAndCulture = [];
    this.blockDisplay.setSociabilityDisplay(item, target.sociabilityAndCulture);
    result.isSociability = target.sociabilityAndCulture.length > 0;
    if (result.isSociability && claims.P2?.sociability !== undefined) target.sociability = claims.P2.sociability;

    // Education
    target.education = [];
    this.blockDisplay.setEducationDisplay(item, target.education);
    result.isTraining = target.education.length > 0;
    if (result.isTraining && claims.P2?.training !== undefined) target.training = claims.P2.training;

    return result;
  }

  private processOrg(item: any, target: any): boolean {
    const claims = item[0].claims;
    target.locationAndContext = [];
    if (claims.P2?.org !== undefined) {
      this.blockDisplay.setOrgDisplay(item, target.locationAndContext);
    }
    return target.locationAndContext.length > 0;
  }

  private processActivity(item: any, target: any): boolean {
    const claims = item[0].claims;
    target.activityDetail = [];
    if (claims.P2?.activity !== undefined) {
      this.blockDisplay.setActivityDisplay(item, target.activityDetail);
    }
    return target.activityDetail.length > 0;
  }

  private processDocument(item: any, target: any): boolean {
    const claims = item[0].claims;
    target.documentDetail = [];
    if (claims.P2?.document !== undefined) {
      this.blockDisplay.setDocumentDisplay(item, target.documentDetail);
    }
    return target.documentDetail.length > 0;
  }

  private processSources(item: any, target: any): boolean {
    const claims = item[0].claims;
    target.sourcesList = [];
    this.blockDisplay.setSourcesDisplay(item, target.sourcesList);
    target.sources = claims.P2?.sources;
    return target.sourcesList.length > 0;
  }

  private processExternalLinks(item: any, target: any): boolean {
    target.externalLinks = [];
    this.blockDisplay.setExternalLinksDisplay(item, target.externalLinks);
    return target.externalLinks.length > 0;
  }

  private processOthers(item: any, target: any): boolean {
    const claims = item[0].claims;
    target.otherClaims = [];
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
      return target.otherClaims.length > 0;
    }
    return false;
  }

  private buildMainList(item: any, target: any, isPerson: boolean): void {
    const claims = item[0].claims;
    if (claims.P2 === undefined) {
      if (claims.P3 !== undefined) target.mainList.push(claims.P3);
      return;
    }
    target.mainList = [].concat(
      target.locationAndContext || [],
      target.locationAndSituation || [],
      target.activityDetail || [],
      ...(isPerson ? [] : target.eventDetail || []),
      target.documentDetail || [],
      target.otherClaims || []
    );
  }
}
