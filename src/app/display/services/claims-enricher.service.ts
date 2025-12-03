import { Injectable } from '@angular/core';
import {
  PERSON_DISPLAY_PROPERTIES,
  EVENT_DISPLAY_PROPERTIES,
  CAREER_DISPLAY_PROPERTIES,
  EDUCATION_DISPLAY_PROPERTIES,
  SOCIABILITY_DISPLAY_PROPERTIES,
  PLACE_DISPLAY_PROPERTIES,
} from '../../config/dispatcher.config';

/**
 * ClaimsEnricherService
 * - centralise la détection / annotation des payloads claims.P2.*
 * - marque des flags (presence) utilisés par le dispatcher (isPerson/isOrg/...)
 * - ne doit pas ajouter de chaînes localisées (ceci reste la responsabilité
 *   de FactgridSubtitlesService)
 */
@Injectable({ providedIn: 'root' })
export class ClaimsEnricherService {
  constructor() {}

  enrich(item: any): any {
    if (!item || !Array.isArray(item) || item.length === 0) return item;
    const claims = item[0].claims || {};

    // Ensure P2 exists (we still want to enrich based on top-level properties)
    const p2 = claims.P2 || {};

    // Helper: detect Q id anywhere in P2 payload
    const p2HasId = (id: string): boolean => {
      if (Array.isArray(p2)) {
        return p2.some((p: any) => p?.mainsnak?.datavalue?.value?.id === id);
      }
      try {
        return JSON.stringify(p2).includes(`"${id}"`);
      } catch {
        return false;
      }
    };

    // Historically we set a boolean `P2.main = true` to mark presence of a P2
    // payload. This is redundant (the P2 payload itself indicates presence) and
    // conflates a boolean presence flag with the textual `P2.main` value that
    // can come from the source. Do not set a default boolean here — reserve
    // `P2.main` for the actual value coming from the data (string) or for
    // explicit cases where the backend provides it.
    if (p2 && Object.keys(p2).length > 0) {
      claims.P2 = claims.P2 || {};
      // no automatic assignment of claims.P2.main — leave it undefined unless
      // the payload contains an explicit value.
    }

    // Person (Q7) OR top-level person-like properties
    const personProps = PERSON_DISPLAY_PROPERTIES.map((p) => p.property);
    const hasPersonProps = personProps.some((pr) => claims[pr] !== undefined);

    if (p2HasId('Q7') || hasPersonProps) {
      // keep presence marker so other modules can test for existence
      claims.P2 = claims.P2 || {};
      claims.P2.person = claims.P2.person ?? true;
      // ensure presence markers for subcategories used by dispatcher
      if (claims.P2.career === undefined) claims.P2.career = true;
      if (claims.P2.training === undefined) claims.P2.training = true;
      if (claims.P2.sociability === undefined) claims.P2.sociability = true;
    }

    // Organization (various IDs) — also consult sparql batch flags when
    // available. SPARQL batch queries detect whether any P2 value (or its
    // P3 ancestry) implies an organisation class; that signal is exposed
    // as item.sparqlFlags.Q12Test by ItemSparqlService.
    const orgIds = ['Q12', 'Q220833', 'Q140806', 'Q11214'];
    const sparqlIndicatesOrg = !!(item[0] && (item[0] as any).sparqlFlags && (item[0] as any).sparqlFlags.Q12Test === true);
    if (orgIds.some((id) => p2HasId(id)) || sparqlIndicatesOrg) {
      claims.P2.org = claims.P2.org ?? true;
    }

    // Event (Q9) OR top-level event properties
    // Use a conservative subset of event-like props here. Some properties
    // such as P47 (localisation) are ambiguous and apply to places as much
    // as to events; they produced false positives (e.g. camps). Only mark
    // P2.event when we see less ambiguous indicators like:
    // - P106 (date), P119 (active participant), P242 (events witness), P133 (participants)
    const eventSignalProps = ['P106', 'P119', 'P242', 'P133'];
    const hasTopLevelEvent = eventSignalProps.some((pr) => claims[pr] !== undefined);
    if (p2HasId('Q9') || hasTopLevelEvent) {
      claims.P2 = claims.P2 || {};
      claims.P2.event = claims.P2.event ?? true;
    }

    // Document / publication
    if (p2HasId('Q20') || p2HasId('Q257227')) {
      claims.P2.document = claims.P2.document ?? true;
    }

    // Activity-like types
    const activityIds = ['Q146602', 'Q21909', 'Q37073'];
    if (activityIds.some((id) => p2HasId(id))) claims.P2.activity = claims.P2.activity ?? true;

    // Place detection: treat P2 as place when either the P2 value is a known place id
    // or when top-level place-related properties are present on the item.
    const placeIds = ['Q8', 'Q11174', 'Q21925', 'Q164344'];
    // Avoid depending on config import shape at runtime for tests — enumerate
    // the typical place-related property ids here.
    const placePropNames = ['P48', 'P58', 'P297', 'P466', 'P538', 'P34', 'P461', 'P140', 'P139', 'P267', 'P625'];
    const hasPlaceProps = placePropNames.some((pr) => claims[pr] !== undefined);
    // SPARQL may detect place ancestry via Q8Test — check it as an additional
    // signal when deciding whether the item should be considered a place.
    const sparqlIndicatesPlace = !!(item[0] && (item[0] as any).sparqlFlags && (item[0] as any).sparqlFlags.Q8Test === true);
    // Prefer explicit P2-derived signals (e.g. P2.org) over top-level place
    // props. Items like organisations may legitimately carry coordinates — in
    // such cases we prefer the P2 classification (organisation) unless P2
    // actually claims the item is a place. Therefore only set P2.place when
    // either the P2 value is a known place id OR there are top-level place
    // props *and* P2 does not identify the item as an organisation.
    const p2IndicatesOrg = claims.P2?.org === true || ['Q12', 'Q220833', 'Q140806', 'Q11214'].some((id) => p2HasId(id));
    if (placeIds.some((id) => p2HasId(id)) || ((hasPlaceProps || sparqlIndicatesPlace) && !p2IndicatesOrg)) {
      claims.P2 = claims.P2 || {};
      claims.P2.place = claims.P2.place ?? true;
    }

    // Career, Education, Sociability detection from top-level properties
    const careerProps = CAREER_DISPLAY_PROPERTIES.map((p) => p.property);
    if (careerProps.some((pr) => claims[pr] !== undefined)) {
      claims.P2 = claims.P2 || {};
      claims.P2.career = claims.P2.career ?? true;
    }

    const educationProps = EDUCATION_DISPLAY_PROPERTIES.map((p) => p.property);
    if (educationProps.some((pr) => claims[pr] !== undefined)) {
      claims.P2 = claims.P2 || {};
      claims.P2.training = claims.P2.training ?? true;
    }

    const sociabilityProps = SOCIABILITY_DISPLAY_PROPERTIES.map((p) => p.property);
    if (sociabilityProps.some((pr) => claims[pr] !== undefined)) {
      claims.P2 = claims.P2 || {};
      claims.P2.sociability = claims.P2.sociability ?? true;
    }

    return item;
  }
}
