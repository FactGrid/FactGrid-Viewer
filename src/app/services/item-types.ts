// Typages pour les items fournis par le service de recherche (cirrus/search)
// Ce type est volontairement minimaliste et orienté UI : on l'étendra au besoin.
export interface DisplayItem {
  id: string; // ex: 'Q1234' or 'Page:Q123'
  label?: string;
  description?: string;
  aliases?: string[];
  project?: string; // projet / espace source (optionnel)
  bestImageUrl?: string;
  classes?: { id: string; label?: string }[]; // instance-of / types
  // Generic holder for extra properties used by UI (statements rendered, links...)
  extra?: Record<string, unknown>;
}

export interface DisplayItemStatement {
  propertyId: string;
  valueId?: string;
  valueLabel?: string;
  qualifiers?: Array<{ propertyId: string; valueLabel?: string; valueId?: string }>;
}

export default DisplayItem;

/**
 * Tuple returned by CreateItemToDisplayService.createItemToDisplay
 * [
 *   enrichedItem: any,                // item object enriched with sitelinks, claim details, etc.
 *   remainingPropertyIds: string[],   // array of remaining property ids
 *   qualifierProperties: string[],    // qualifier property list used by the UI
 *   referenceProperties: string[],    // reference property list used by the UI
 *   displayItem?: DisplayItem         // optional compact, UI-focused DisplayItem
 * ]
 */
export type ItemDisplayTuple = [any, string[], string[], string[], DisplayItem?];

/** Enriched entity shape (returned by addReference2ItemDetails) used across the pipeline.
 *  Kept intentionally permissive for now — will refine gradually as we migrate.
 */
export type EnrichedItem = any;
