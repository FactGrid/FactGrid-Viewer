// Shared claim-related interfaces used by details and subtitle services
// More precise union for common datavalue shapes we encounter in FactGrid
export type SnakValue =
  | string
  | number
  | boolean
  | { id: string }
  | { time: string; timezone?: number; precision?: number; calendarmodel?: string }
  | Record<string, any>;

export interface Snak {
  property: string;
  // datatype is present on most snaks (e.g. 'wikibase-item', 'time', 'string')
  datatype?: string;
  datavalue?: { value: SnakValue };
  // optional label used by some UI helpers/tests
  label?: string;
  // occasional extra fields used by display code
  description?: string;
  // helpers used by display layer (sorting / temporary state)
  timeOrder?: string | number;
}

export interface Reference {
  'snaks-order'?: string[];
  snaks: { [key: string]: Snak[] };
}

export interface Claim {
  mainsnak: Snak;
  qualifiers?: { [key: string]: Snak[] };
  'qualifiers-order'?: string[];
  references?: Reference[];
  // runtime/UI-only helpers
  references2?: any[];
  picture?: string;
  // UI helpers that are occasionally added at runtime
  qualifiers2?: any[];
}

// Claim arrays in the codebase are frequently augmented with helper
// properties (externalLink, url, localized labels, boolean flags). Model
// that by describing a ClaimArray type which is still an array of Claim
// but can carry extra UI fields.
export type ClaimArray = Claim[] &
  Partial<{
    datatype: string;
    externalLink: string;
    url: string;
    // often used localized labels and presence flags (P2 enrichment)
    main: string;
    person: boolean | string;
    personLabel: string;
    training: boolean | string;
    trainingLabel: string;
    career: boolean | string;
    careerLabel: string;
    sociability: boolean | string;
    sociabilityLabel: string;
    event: boolean | string;
    eventLabel: string;
    sources: any;
    other: any;
    infoList: any[];
  }> & { [key: string]: any };

export interface ClaimsObject {
  [property: string]: ClaimArray | undefined;
}

export interface Entity {
  id?: string;
  label?: string | Record<string, any>;
  description?: string | Record<string, any>;
  aliases?: any[];
  sitelinks?: Record<string, any>;
  // central payload of statements keyed by property id (e.g. P2, P3...)
  claims: ClaimsObject;
  // convenience helper used in some display code
  infoList?: any[];
  // runtime/UI-only helpers
  longestWordLength?: number;
}
