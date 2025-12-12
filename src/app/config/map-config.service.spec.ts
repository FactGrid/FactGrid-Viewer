import { describe, it, expect } from 'vitest';
import { getZoomForXY, getNameForXY, DEFAULT_MAP_CONFIG } from './map.config';

describe('Map config global functions', () => {
  it('returns the expected zoom for known P2 ids', () => {
    expect(getZoomForXY('Q16200')).toBe(18);
    expect(getZoomForXY('Q271221')).toBe(17);
    expect(getZoomForXY('Q176131')).toBe(3);
    expect(getZoomForXY('Q21925')).toBe(4);
    expect(getZoomForXY('Q550501')).toBe(3);
  });

  it('returns the default zoom for unknown P2', () => {
    expect(getZoomForXY('Q999999')).toBe(DEFAULT_MAP_CONFIG.defaultZoom);
  });

  it('returns the default zoom when P2 is falsey', () => {
    expect(getZoomForXY(null)).toBe(DEFAULT_MAP_CONFIG.defaultZoom);
    expect(getZoomForXY(undefined)).toBe(DEFAULT_MAP_CONFIG.defaultZoom);
  });

  it('returns the expected name for known P2', () => {
    expect(getNameForXY('Q176131')).toBe('Continent');
    expect(getNameForXY('Q16200')).toBe('Exact address');
    expect(getNameForXY('Q271221')).toBe('Administrative quarter in Paris');
    expect(getNameForXY('Q550501')).toBe('Ocean');
  });

  it('returns null for unknown name', () => {
    expect(getNameForXY('Q999999')).toBeNull();
  });

  it('normalizes different forms of P2 id (numeric, full URL, wd:Q...)', () => {
    expect(getZoomForXY('271221')).toBe(17);
    expect(getZoomForXY('http://database.factgrid.de/entity/Q271221')).toBe(17);
    expect(getZoomForXY('wd:Q271221')).toBe(17);
  });
});
