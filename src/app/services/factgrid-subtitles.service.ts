//service to set the subtitles of the FactGrid queries. It is used in the item-details.service.ts

import { Injectable } from '@angular/core';
import { SelectedLangService } from '../selected-lang.service';
import type { Entity, Claim } from '../interfaces/claims';

type ClaimEntry = Claim[] | Record<string, any>;

@Injectable({
  providedIn: 'root',
})
export class FactgridSubtitlesService {
  constructor(private lang: SelectedLangService) {}

  //TODO: pass the lang selection to the SelectedLangService

  setSubtitle1(re: Entity | any, propertyId: string, lang?: string): void {
    // to add a subtitle with a condition on the property
    if (!re?.claims || !re.claims[propertyId]) return;
    const lng = lang ?? this.lang.selectedLang;

    // set the P320 sparql/title via centralized translations
    const entry: ClaimEntry = re.claims[propertyId] as ClaimEntry;
    if (propertyId === 'P320') {
      // P320 is stored as a metadata object-like entry on claims[propertyId]
      (entry as Record<string, any>).sparql = this.lang.getTranslation('subtitle_members', lng);
    }

    // 'other' label and 'sources' should also be localized
    (entry as Record<string, any>).other = this.lang.getTranslation('subtitle_further', lng);
    (entry as Record<string, any>).sources = this.lang.getTranslation('subtitle_sources', lng);
  }

  setSubtitle2(re: Entity | any, propertyId: string, number: number, lang?: string): void {
    // to add a subtitle depending on the value of a claim (often P2)
    if (!re?.claims || !re.claims[propertyId]) return;
    const j = Number(number);
    const lng = lang ?? this.lang.selectedLang;

    const arr = re.claims[propertyId] as Claim[] | undefined;
    const entry: Claim | undefined = arr?.[j];
    if (!entry?.mainsnak?.datavalue) return;
    const dv = entry.mainsnak.datavalue;
    const valueId = (dv?.value as any)?.id ?? dv?.value;

    // Use enriched P2 flags when present, otherwise fall back to the detected wikibase type
    const p2: any = re.claims.P2;
    const isPerson = p2?.person === true || valueId == 'Q7';
    const isEvent = p2?.event === true || valueId == 'Q9';

    if (isPerson) {
      // localized labels only (presence flags are set by ClaimsEnricher)
      re.claims[propertyId].main = this.lang.getTranslation('subtitle_life_and_family', lng);
      // Dedicated label fields to avoid reusing `main` across types
      re.claims[propertyId].personLabel = this.lang.getTranslation('subtitle_life_and_family', lng);
      re.claims[propertyId].training = this.lang.getTranslation('subtitle_education', lng);
      re.claims[propertyId].trainingLabel = this.lang.getTranslation('subtitle_education', lng);
      re.claims[propertyId].career = this.lang.getTranslation(
        'subtitle_career_and_activities',
        lng
      );
      re.claims[propertyId].careerLabel = this.lang.getTranslation(
        'subtitle_career_and_activities',
        lng
      );
      re.claims[propertyId].sociability = this.lang.getTranslation(
        'subtitle_sociability_and_culture',
        lng
      );
      re.claims[propertyId].sociabilityLabel = this.lang.getTranslation(
        'subtitle_sociability_and_culture',
        lng
      );
    }
    /*   if (re.claims[propertyId][j].mainsnak.datavalue.value.id !== "Q7") { //person
      re.claims[propertyId].person = undefined;
      re.claims[propertyId].training = undefined;
      re.claims[propertyId].career = undefined;
      re.claims[propertyId].sociability = undefined;
       } ;
*/

    if (valueId == 'Q22') {
      //basic object
      // keep fallback for now
      re.claims[propertyId].main = 'Basic object';
    }

    if (valueId == 'Q147829') {
      //basic object
      re.claims[propertyId].main = this.lang.getTranslation('subtitle_database', lng);
    }

    if (valueId == 'Q8' || valueId == 'Q11174' || valueId == 'Q21925' || valueId == 'Q164344') {
      // place -> localized via translations
      re.claims[propertyId].main = this.lang.getTranslation('subtitle_place', lng);
    }
    //   if (re.claims[propertyId][j].mainsnak.datavalue.value.id !== "Q8") { //place
    //     re.claims[propertyId].place = undefined; }
    if (isEvent) {
      // event
      re.claims[propertyId].main = this.lang.getTranslation('subtitle_event', lng);
      // write an explicit event label so we don't reuse generic `main` for other contexts
      re.claims[propertyId].eventLabel = this.lang.getTranslation('subtitle_event', lng);
    }
    //   if (re.claims[propertyId][j].mainsnak.datavalue.value.id !== "Q9") { //event
    //     re.claims[propertyId].event = undefined; }
    if (valueId == 'Q12' || valueId == 'Q220833' || valueId == 'Q140806' || valueId == 'Q11214') {
      re.claims[propertyId].main =
        this.lang.getTranslation('organisationTitle', lng) ??
        this.lang.getTranslation('subtitle_place', lng);
    }
    //  else re.claims[propertyId].org = undefined;
    if (valueId == 'Q20' || valueId == 'Q257227') {
      //publication (localized title set below)
      re.claims[propertyId].main =
        this.lang.getTranslation('subtitle_document', lng) ?? 'Print publication';
    }
    // if (re.claims[propertyId][j].mainsnak.datavalue.value.id !== "Q20") { //publication
    //     re.claims[propertyId].document = undefined; }
    if (valueId == 'Q146602' || valueId == 'Q21909' || valueId == 'Q37073') {
      re.claims[propertyId].main = this.lang.getTranslation('activity', lng) || 'Activity';
    }
    if (valueId == 'Q10671' || valueId == 'Q21407') {
      re.claims[propertyId].document = 'document';
      re.claims[propertyId].main = this.lang.getTranslation('subtitle_document', lng);
    }
    //  else re.claims[propertyId].document = undefined;
  }
}
