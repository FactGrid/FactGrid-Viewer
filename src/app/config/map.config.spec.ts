import { describe, it, expect } from 'vitest';
import { getZoomForXY, getNameForXY, normalizeP2Id, DEFAULT_MAP_CONFIG } from './map.config';

describe('map.config', () => {
  describe('normalizeP2Id', () => {
    it('should normalize various P2 id formats to Q123', () => {
      expect(normalizeP2Id('Q271221')).toBe('Q271221');
      expect(normalizeP2Id('271221')).toBe('Q271221');
      expect(normalizeP2Id('wd:Q271221')).toBe('Q271221');
      expect(normalizeP2Id('http://database.factgrid.de/entity/Q271221')).toBe('Q271221');
    });

    it('should return null for invalid inputs', () => {
      expect(normalizeP2Id(null)).toBe(null);
      expect(normalizeP2Id('')).toBe(null);
      expect(normalizeP2Id('invalid')).toBe(null);
    });
  });

  describe('getZoomForXY', () => {
    it('should return correct zoom for known P2 ids', () => {
      expect(getZoomForXY('Q16200')).toBe(18);
      expect(getZoomForXY('Q271221')).toBe(17);
      expect(getZoomForXY('Q176131')).toBe(3);
      expect(getZoomForXY('Q21925')).toBe(4);
      expect(getZoomForXY('Q36239')).toBe(16);
    });

    it('should normalize ids before lookup', () => {
      expect(getZoomForXY('271221')).toBe(17);
      expect(getZoomForXY('wd:Q271221')).toBe(17);
      expect(getZoomForXY('http://database.factgrid.de/entity/Q271221')).toBe(17);
    });

    it('should fall back to default zoom for unknown ids', () => {
      expect(getZoomForXY('Q999999')).toBe(DEFAULT_MAP_CONFIG.defaultZoom);
      expect(getZoomForXY(null)).toBe(DEFAULT_MAP_CONFIG.defaultZoom);
      expect(getZoomForXY('')).toBe(DEFAULT_MAP_CONFIG.defaultZoom);
    });
  });

  describe('getNameForXY', () => {
    it('should return name for known P2 ids', () => {
      expect(getNameForXY('Q271221')).toBe('Administrative quarter in Paris');
      expect(getNameForXY('Q16200')).toBe('Exact address');
      expect(getNameForXY('Q176131')).toBe('Continent');
    });

    it('should return null for unknown ids', () => {
      expect(getNameForXY('Q999999')).toBe(null);
      expect(getNameForXY(null)).toBe(null);
    });
  });
});
