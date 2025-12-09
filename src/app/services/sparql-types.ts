// Shared, minimal SPARQL response types used across services.
export interface SparqlBindingValue {
  type?: string;
  value?: string;
  'xml:lang'?: string;
  datatype?: string;
  // Some code paths (listFromSparql) add runtime helper properties below
  id?: string;
  entity?: 'item' | 'property' | string;
  // allow other arbitrary properties for forward compatibility
  [k: string]: any;
}

export interface SparqlBinding {
  [key: string]: SparqlBindingValue | undefined;
}

export interface SparqlResults {
  head?: { vars?: string[] };
  results: { bindings: SparqlBinding[] };
}

export interface BatchAskResult {
  Q8Test: boolean;
  Q12Test: boolean;
  Q37073Test: boolean;
  Q24499Test: boolean;
  Q16200Test: boolean;
  Q77457Test: boolean;
  listTest: boolean;
  setTest: boolean;
  superclassTest: boolean;
  superclass1Test: boolean;
  GOVTest: boolean;
}

// tuple used in many selectSparql* returns: [label, bindings]
export type SparqlTuple = [string | undefined, SparqlBinding[]];
