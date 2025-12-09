/**
 * Interface representing a Wikibase entity with its key properties
 */
export interface WikibaseEntity {
  id: string;
  label?: string;
  aliases?: string[];
  description?: string;
}

/**
 * Runtime-enriched display entity used by the search UI.
 * Contains optional helper fields that are added at runtime (eg. exactPhraseMatch).
 */
export interface EnrichedWikibaseEntity extends WikibaseEntity {
  exactPhraseMatch?: boolean;
  // allow future optional helper flags here
  [k: string]: any;
}
