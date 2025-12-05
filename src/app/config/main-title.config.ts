/**
 * Central configuration for picking the "main" textual title displayed on
 * an item's Main card.
 *
 * This file contains only declarative, data-driven configuration used by the
 * MainTitleSelectorService (and consumers). Keep selection logic in
 * MainTitleSelectorService; store only preference lists and type priorities here.
 *
 * Exports and their meaning:
 * - LOCALITY_TITLE / ORGANISATION_TITLE: Domain-specific ordered lists of
 *   class ids used when deciding whether a place-like or organisation-like
 *   title should be chosen.
 * - MAIN_TYPE_PRIORITY: Global ordering of general types (e.g. 'locality',
 *   'organisation', 'person'). When an item matches several general types,
 *   this array determines which general type the selector consults first.
 * - P3 behaviour: If an item carries a P3 claim (class membership), the
 *   selector will prefer that P3 value as the Main card title. This is used
 *   for items which are types/classes and therefore have a P3 pointing to the
 *   class they belong to.
 * - LOCALITY_TITLE / ORGANISATION_TITLE: Domain-specific ordered lists of
 *   class ids used when deciding whether a place-like or organisation-like
 *   title should be chosen.
 * - MAIN_TYPE_PRIORITY: Global ordering of general types (e.g. 'locality',
 *   'organisation', 'person'). When an item matches several general types,
 *   this array determines which general type the selector consults first.
 */
// Historically we used a preference-ordered list of P2 ids to pick a textual
// main title when multiple P2 types were present. Current selector behaviour
// prefers to use an item's type-specific lists first (LOCALITY_TITLE /
// ORGANISATION_TITLE); if none of those match the item, the selector will
// now pick the first P2 entry present on the item and prefer any label carried
// in the claim payload. Keep the below constants to encode domain knowledge
// (locality / organisation preference lists) and MAIN_TYPE_PRIORITY which
// determines which general type to consult first.

// Future main-title related constants may be added here to centralize title
// selection configuration across the application.

export const LOCALITY_TITLE: Array<{ id: string; comment: string }> = [
  // prefer specialized place type label Q890181 over generic 'Place'
  { id: 'Q11174', comment: 'City in Illuminati' },
  { id: 'Q164454', comment: 'US State' },
  { id: 'Q890181', comment: 'City' },
  { id: 'Q164494', comment: 'Commune (fr)' },
  { id: 'Q164343', comment: 'Departement (fr)' },
  { id: 'Q21876', comment: 'Region' },
  { id: 'Q21925', comment: 'Country' },
  { id: 'Q550945', comment: 'Sea' },
  { id: 'Q550501', comment: 'Ocean' },
  { id: 'Q8', comment: 'Place' },
  { id: 'Q164344', comment: 'Geographical entity' },
];

export const ORGANISATION_TITLE: Array<{ id: string; comment: string }> = [
  // common organisation-ish classes
  { id: 'Q12', comment: 'Organisation' },
  { id: 'Q77501', comment: 'Organisation (FactGrid specific)' },
  { id: 'Q220833', comment: 'Administrative organisation' },
  { id: 'Q11214', comment: 'Corporate body' },
];

/**
 * Global priority for choosing which general type should be used to pick a
 * Main card title when an item has multiple class signals (e.g. place + org).
 * The selector will walk this list and prefer the first type that matches an
 * item; this lets us prefer 'locality' over 'organisation', etc.
 */
export const MAIN_TYPE_PRIORITY: string[] = [
  'locality',
  'organisation',
  'person',
  'event',
  'document',
];

// Note: We do not rely on a specific TYPE_CLASS_QID to decide P3 behaviour.
// Presence of a valid P3 on an item is sufficient for the selector to
// prefer the P3-derived title for types/classes.
