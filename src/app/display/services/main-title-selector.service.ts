import { Injectable } from '@angular/core';
import { LOCALITY_TITLE, ORGANISATION_TITLE, MAIN_TYPE_PRIORITY } from '../../config/main-title.config';

export interface MainCardMeta {
  title?: string | undefined;
  icon?: string | undefined;
}

@Injectable({ providedIn: 'root' })
export class MainTitleSelectorService {
  constructor() {}

  /**
   * Decide what title and icon the Main card should show based on `claims.P2`.
   *
   * Rules implemented:
   * - If P2 is missing, return empty result (dispatcher can fall back to P3 behavior)
   * - If claims.P2.main is a string 'life and family' -> no textual title, icon 'person'
  * - If P2 payload is an array and none of the configured type lists apply, the
  *   selector will pick the first P2 entry and prefer a label carried in the
  *   claim payload. This keeps behaviour deterministic without requiring a
  *   separate preference list.
   * - If none of the above match, but `claims.P2.main` is a string, use that string as title.
   */
  decideMainMeta(p2: any, infoList?: any, p3?: any): MainCardMeta {
    if (!p2) return {};

    // p2.main could be a localized string or boolean — prefer explicit string-case
    const mainMarker = p2.main;

    // If the P2 payload indicates a person (presence flag) or contains Q7, treat
    // this as a 'life and family' person main card: icon-only 'person'.
    if (p2?.person === true || (Array.isArray(p2) && p2.some((e: any) => e?.mainsnak?.datavalue?.value?.id === 'Q7'))) {
      return { title: '', icon: 'person' };
    }

    // Special-case textual P2.main labels 'life and family' -> person icon as well
    if (typeof mainMarker === 'string') {
      const normalized = mainMarker.toLowerCase();
      if (normalized.includes('life') || normalized.includes('family') || normalized.includes('life and family')) {
        return { title: '', icon: 'person' };
      }
    }

    // Helper: extract ids from P2 array or infoList arrays.
    const extractIds = (arr: any[]): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr
        .map((entry: any) => entry?.mainsnak?.datavalue?.value?.id || entry?.id || (typeof entry === 'string' ? entry : undefined))
        .filter((id: any) => !!id);
    };

    const p2Ids = Array.isArray(p2) ? extractIds(p2) : [];

    // Gather class ids from infoList (classesList/subclassesList/instancesList)
    const infoIds: string[] = [];
    if (infoList) {
      for (const key of ['classesList', 'subclassesList', 'instancesList', 'natureOfList']) {
        const list = infoList[key];
        if (Array.isArray(list)) infoIds.push(...extractIds(list));
      }
    }

    // If the item carries a P3 claim (class membership), prefer that P3
    // entry as the Main card title. This handles the common case where an
    // item is itself a 'type' (e.g. a type of organization) and P3 points to
    // the class it belongs to — in those cases users expect the Main title to
    // be the class (P3) label rather than a generic P2 type name.
    if (p3) {
      const first = Array.isArray(p3) ? p3[0] : p3;
      const labelFromP3 = first?.mainsnak?.label || (typeof first === 'string' ? first : first?.id || first?.mainsnak?.datavalue?.value?.id);
      if (labelFromP3) return { title: labelFromP3 };
      // if p3 exists but we could not extract a string, continue to fallback
    }

    // Special case: some payloads mark P2 as an object containing presence
    // flags (e.g. { org: true }) rather than an array of values. In those
    // situations the type-specific matching below (which looks for class ids
    // inside arrays) will not detect that we know the item is an organisation.
    // Provide a sensible fallback title when P2 indicates `org` but no exact
    // class id from ORGANISATION_TITLE appears in P2/infoList.
    if (!Array.isArray(p2) && p2?.org === true) {
      // try to pick a more specific org title via infoList if possible
      const orgIds = ORGANISATION_TITLE.map((i) => i.id);
      const matches = infoIds.filter((id) => orgIds.includes(id));
      if (matches.length > 0) {
        for (const pref of ORGANISATION_TITLE) {
          if (matches.includes(pref.id)) return { title: pref.comment };
        }
      }
      // fallback to a generic organisation label when we only have the
      // presence flag
      return { title: ORGANISATION_TITLE[0].comment };
    }

    // Try to use configured type priority (locality before organisation, etc.)
    for (const type of MAIN_TYPE_PRIORITY) {
      if (type === 'locality') {
        const localityIds = LOCALITY_TITLE.map((i) => i.id);
        const matches = p2Ids.concat(infoIds).filter((id: any) => localityIds.includes(id));
        if (matches.length > 0) {
          // pick first preferred locality id
          for (const pref of LOCALITY_TITLE) {
            if (matches.includes(pref.id)) {
              // Prefer payload label if present
              const entry = Array.isArray(p2) ? p2.find((e: any) => e?.mainsnak?.datavalue?.value?.id === pref.id) : undefined;
              const labelFromPayload = entry?.mainsnak?.label;
              return { title: labelFromPayload || pref.comment };
            }
          }
        }
      }
      if (type === 'organisation') {
        const orgIds = ORGANISATION_TITLE.map((i) => i.id);
        const matches = p2Ids.concat(infoIds).filter((id: any) => orgIds.includes(id));
        if (matches.length > 0) {
          for (const pref of ORGANISATION_TITLE) {
            if (matches.includes(pref.id)) {
              const entry = Array.isArray(p2) ? p2.find((e: any) => e?.mainsnak?.datavalue?.value?.id === pref.id) : undefined;
              const labelFromPayload = entry?.mainsnak?.label;
              return { title: labelFromPayload || pref.comment };
            }
          }
        }
      }
      if (type === 'person') {
        if (p2?.person === true || p2Ids.includes('Q7') || infoIds.includes('Q7')) {
          return { title: '', icon: 'person' };
        }
      }
      if (type === 'event') {
        // Don't block fallback when an item has event-like signals. Previously
        // we returned {} here (no title) which prevented the final P2-first
        // fallback from running. That produced untitled Main cards when P2
        // carried an event flag but the developer still wanted the first P2
        // value to be used as a sensible textual title. Now we only short-
        // circuit when a concrete localized label exists on P2.event itself
        // (handled elsewhere in dispatcher). Otherwise continue and allow
        // later fallback to pick a textual P2 value.
        if (typeof p2?.event === 'string') {
          // if P2.event is a localized string use it as title
          return { title: p2.event };
        }
        // otherwise allow fallback
      }
      if (type === 'document') {
        if (p2?.document === true || p2Ids.includes('Q20') || infoIds.includes('Q20')) {
          // fallback handled further down
          break;
        }
      }
    }

    // If P2 is an array of types and we haven't returned yet, pick the first
    // P2 entry as the main title. Prefer a label carried in the claim's mainsnak
    // (this handles cases where the payload provides a localized/explicit title).
    if (Array.isArray(p2) && p2.length > 0) {
      const first = p2[0];
      const labelFromPayload = first?.mainsnak?.label;
      // Fall back to any id label if payload doesn't carry a label
      const id = first?.mainsnak?.datavalue?.value?.id || first?.id || undefined;
      return { title: labelFromPayload || id };
    }

    // As a last resort, if P2.main is a string use it as title
    if (typeof mainMarker === 'string') return { title: mainMarker };

    return {};
  }
}
