import { Injectable } from '@angular/core';

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

    // Ensure P2 exists
    const p2 = claims.P2;
    if (!p2) return item;

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

    // Person (Q7)
    if (p2HasId('Q7')) {
      // keep presence marker so other modules can test for existence
      claims.P2.person = claims.P2.person ?? true;
    }

    // Organization (various IDs)
    const orgIds = ['Q12', 'Q220833', 'Q140806', 'Q11214'];
    if (orgIds.some((id) => p2HasId(id))) {
      claims.P2.org = claims.P2.org ?? true;
    }

    // Event (Q9)
    if (p2HasId('Q9')) {
      claims.P2.event = claims.P2.event ?? true;
    }

    // Document / publication
    if (p2HasId('Q20') || p2HasId('Q257227')) {
      claims.P2.document = claims.P2.document ?? true;
    }

    // Activity-like types
    const activityIds = ['Q146602', 'Q21909', 'Q37073'];
    if (activityIds.some((id) => p2HasId(id))) claims.P2.activity = claims.P2.activity ?? true;

    return item;
  }
}
