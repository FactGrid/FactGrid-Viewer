/**
 * Search-related configuration constants.
 *
 * EXPANSION_RELEVANCE_THRESHOLD controls when we apply a stricter
 * relevance filter (matchesAllTokens) to results coming from project-mode
 * `attemptProjectExpansion`. The intention is to avoid over-filtering small
 * expansions coming back from Cirrus/WBSearch while still protecting UX from
 * noise when large sets (>= threshold) are returned.
 *
 * Tweak this value to make the client more/less strict for expansion results.
 */
export const EXPANSION_RELEVANCE_THRESHOLD = 4;
