export interface MapConfigItem {
  zoom: number;
  name: string; // English name (natural language) for the P2 id
}

export interface MapConfig {
  defaultZoom: number;
  byP2: Record<string, MapConfigItem>;
}

/**
 * Unified map zoom configuration.
 * Single source of truth for all P2 ID zoom levels.
 */
export const DEFAULT_MAP_CONFIG: MapConfig = {
  defaultZoom: 12,
  byP2: {
    // Countries and large regions

    'Q550501': { zoom: 3, name: 'Ocean' },
    'Q176131': { zoom: 3, name: 'Continent' },
    'Q1306138': { zoom: 3, name: 'Global Region' },
    'Q94416': { zoom: 4, name: 'Sovereign state' },
    'Q21925': { zoom: 4, name: 'Country' },
    'Q11317': { zoom: 4, name: 'Nation' },
    'Q21876': { zoom: 6, name: 'Region' },
    'Q534544': { zoom: 6, name: 'Oblast' },
    'Q485731': { zoom: 6, name: 'Spanish Province' },

    // Urban areas - zoom 16
    'Q266101': { zoom: 16, name: 'Small locality' },
    'Q469609': { zoom: 16, name: 'Locality' },
    'Q172249': { zoom: 16, name: 'Neighborhood' },
    'Q36239': { zoom: 16, name: 'Town' },
    'Q164328': { zoom: 16, name: 'Village' },
    'Q36251': { zoom: 16, name: 'Hamlet' },
    'Q141472': { zoom: 16, name: 'Suburb' },
    'Q395380': { zoom: 16, name: 'Municipality' },
    'Q375357': { zoom: 16, name: 'Local area' },

    // Precise locations - zoom 18
    'Q16200': { zoom: 18, name: 'Exact address' },
    'Q271221': { zoom: 17, name: 'Administrative quarter in Paris' },
  },
};

/**
 * Helper: normalize P2 id formats to canonical 'Q123' form.
 * Handles: 'Q123', '123', 'wd:Q123', 'http://database.factgrid.de/entity/Q123'
 */
export function normalizeP2Id(xy?: string | null): string | null {
  if (!xy) return null;
  const s = String(xy).trim();
  // match an id ending with Q12345
  const qMatch = s.match(/(Q\d+)$/);
  if (qMatch) return qMatch[1];
  // match standalone numeric id
  const nMatch = s.match(/^(\d+)$/);
  if (nMatch) return `Q${nMatch[1]}`;
  return null;
}

/**
 * Global helper: return zoom for given P2 ID using DEFAULT_MAP_CONFIG.
 * Use this in contexts where injection is not available.
 */
export function getZoomForXY(xy?: string | null): number {
  if (!xy) return DEFAULT_MAP_CONFIG.defaultZoom;
  const normalized = normalizeP2Id(xy);
  if (!normalized) return DEFAULT_MAP_CONFIG.defaultZoom;
  const item = DEFAULT_MAP_CONFIG.byP2[normalized];
  return item ? item.zoom : DEFAULT_MAP_CONFIG.defaultZoom;
}

/**
 * Global helper: get English name for a P2 id using DEFAULT_MAP_CONFIG.
 */
export function getNameForXY(xy?: string | null): string | null {
  if (!xy) return null;
  const normalized = normalizeP2Id(xy);
  if (!normalized) return null;
  const item = DEFAULT_MAP_CONFIG.byP2[normalized];
  return item ? item.name : null;
}
