import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ViewContainerRef, ComponentRef, ChangeDetectorRef } from '@angular/core';
import { DisplayComponentLoaderService } from './display-component-loader.service';
import { SearchCacheService } from './search-cache.service';
import { SelectedLangService } from '../selected-lang.service';

describe('DisplayComponentLoaderService', () => {
  let service: DisplayComponentLoaderService;
  let searchCacheMock: any;
  let langServiceMock: any;

  beforeEach(() => {
    // Mock SearchCacheService
    searchCacheMock = {
      setItem: vi.fn(),
      getItemByPrefix: vi.fn()
    };

    // Mock SelectedLangService
    langServiceMock = {};

    TestBed.configureTestingModule({
      providers: [
        DisplayComponentLoaderService,
        { provide: SearchCacheService, useValue: searchCacheMock },
        { provide: SelectedLangService, useValue: langServiceMock }
      ]
    });

    service = TestBed.inject(DisplayComponentLoaderService);
  });

  describe('constants', () => {
    it('devrait avoir les bonnes valeurs de configuration', () => {
      expect(service.SPARQL_CACHE_THRESHOLD).toBe(300);
      expect(service.MAX_SPARQL_RETRY_ATTEMPTS).toBe(30);
      expect(service.MAX_ITEMINFO_RETRY_ATTEMPTS).toBe(10);
    });
  });

  describe('loadSparqlComponent', () => {
    it('devrait retourner null si host undefined après max attempts', async () => {
      const cdrMock = { detectChanges: vi.fn() } as any;
      
      const result = await service.loadSparqlComponent(
        0,
        { list: [], subject: 'test' },
        undefined, // no host
        null,
        langServiceMock,
        'Q123',
        cdrMock,
        service.MAX_SPARQL_RETRY_ATTEMPTS // start at max
      );

      expect(result).toBeNull();
    });

    it('devrait retourner le composant existant si fourni', async () => {
      const hostMock = { clear: vi.fn() } as any;
      const existingRefMock = {
        instance: { sparqlData: [], sparqlSubject: '' },
        changeDetectorRef: { detectChanges: vi.fn() }
      } as any;
      const cdrMock = { detectChanges: vi.fn() } as any;

      // Mock setInput
      (existingRefMock as any).setInput = vi.fn();

      const result = await service.loadSparqlComponent(
        0,
        { list: [{ test: 'data' }], subject: 'Q999', title: 'Test' },
        hostMock,
        existingRefMock,
        langServiceMock,
        'Q123',
        cdrMock
      );

      expect(result).toBe(existingRefMock);
      expect((existingRefMock as any).setInput).toHaveBeenCalledWith('sparqlType', 'sparql0');
      expect((existingRefMock as any).setInput).toHaveBeenCalledWith('sparqlData', [{ test: 'data' }]);
    });

    it('devrait cacher les listes volumineuses (>= 300 items)', async () => {
      const hostMock = { clear: vi.fn() } as any;
      const existingRefMock = {
        instance: {},
        changeDetectorRef: { detectChanges: vi.fn() }
      } as any;
      (existingRefMock as any).setInput = vi.fn();
      const cdrMock = { detectChanges: vi.fn() } as any;

      const largeList = Array.from({ length: 350 }, (_, i) => ({ id: i }));
      const card = { list: largeList, subject: 'Q999', title: 'Large' };

      await service.loadSparqlComponent(
        2,
        card,
        hostMock,
        existingRefMock,
        langServiceMock,
        'Q123',
        cdrMock
      );

      expect(searchCacheMock.setItem).toHaveBeenCalledWith(
        'Q123::2::Q999',
        { list: largeList, subject: 'Q999', title: 'Large' },
        undefined,
        undefined
      );
    });

    it('ne devrait pas cacher les petites listes (< 300 items)', async () => {
      const hostMock = { clear: vi.fn() } as any;
      const existingRefMock = {
        instance: {},
        changeDetectorRef: { detectChanges: vi.fn() }
      } as any;
      (existingRefMock as any).setInput = vi.fn();
      const cdrMock = { detectChanges: vi.fn() } as any;

      const smallList = Array.from({ length: 50 }, (_, i) => ({ id: i }));
      const card = { list: smallList, subject: 'Q888', title: 'Small' };

      await service.loadSparqlComponent(
        1,
        card,
        hostMock,
        existingRefMock,
        langServiceMock,
        'Q123',
        cdrMock
      );

      expect(searchCacheMock.setItem).not.toHaveBeenCalled();
    });
  });

  describe('getCachedSparqlCards', () => {
    it('devrait retourner tableau vide si itemId vide', () => {
      const results = service.getCachedSparqlCards('');
      expect(results).toEqual([]);
    });

    it('devrait récupérer les cards cachées pour chaque slot', () => {
      searchCacheMock.getItemByPrefix.mockImplementation((prefix: string) => {
        if (prefix === 'Q123::0::') {
          return { list: [{ id: 1 }], subject: 'S0', title: 'Card 0' };
        }
        if (prefix === 'Q123::2::') {
          return { list: [{ id: 3 }], subject: 'S2', title: 'Card 2' };
        }
        return null;
      });

      const results = service.getCachedSparqlCards('Q123', 5);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        index: 0,
        card: { subject: 'S0', list: [{ id: 1 }], title: 'Card 0' }
      });
      expect(results[1]).toEqual({
        index: 2,
        card: { subject: 'S2', list: [{ id: 3 }], title: 'Card 2' }
      });
    });

    it('devrait ignorer les entries cachées vides', () => {
      searchCacheMock.getItemByPrefix.mockImplementation((prefix: string) => {
        if (prefix === 'Q123::1::') {
          return { list: [], subject: 'S1', title: 'Empty' };
        }
        return null;
      });

      const results = service.getCachedSparqlCards('Q123', 5);
      expect(results).toEqual([]);
    });
  });

  describe('loadItemInfoComponent', () => {
    it('devrait retourner null si host undefined après max attempts', async () => {
      const cdrMock = { detectChanges: vi.fn() } as any;
      
      const result = await service.loadItemInfoComponent(
        0,
        undefined, // no host
        null,
        { instancesList: [] },
        cdrMock,
        service.MAX_ITEMINFO_RETRY_ATTEMPTS // start at max
      );

      expect(result).toBeNull();
    });

    it('devrait retourner null si infoList vide', async () => {
      const hostMock = { clear: vi.fn() } as any;
      const cdrMock = { detectChanges: vi.fn() } as any;

      const result = await service.loadItemInfoComponent(
        0,
        hostMock,
        null,
        [], // empty infoList
        cdrMock
      );

      expect(result).toBeNull();
    });

    it('devrait retourner le composant existant si fourni', async () => {
      const hostMock = { clear: vi.fn() } as any;
      const existingRefMock = { instance: {} } as any;
      const cdrMock = { detectChanges: vi.fn() } as any;

      const result = await service.loadItemInfoComponent(
        0,
        hostMock,
        existingRefMock,
        { instancesList: [{ id: 'Q1' }] },
        cdrMock
      );

      expect(result).toBe(existingRefMock);
      expect(hostMock.clear).not.toHaveBeenCalled(); // n'a pas recréé
    });
  });

  describe('destroyComponentRefs', () => {
    it('devrait détruire tous les refs sans erreur', () => {
      const ref1Mock = { destroy: vi.fn() } as any;
      const ref2Mock = { destroy: vi.fn() } as any;
      const ref3Mock = { destroy: vi.fn().mockImplementation(() => { throw new Error('destroy error'); }) } as any;

      service.destroyComponentRefs([ref1Mock, null, ref2Mock, ref3Mock]);

      expect(ref1Mock.destroy).toHaveBeenCalled();
      expect(ref2Mock.destroy).toHaveBeenCalled();
      expect(ref3Mock.destroy).toHaveBeenCalled();
      // Should not throw despite ref3 error
    });

    it('devrait gérer tableau vide', () => {
      expect(() => service.destroyComponentRefs([])).not.toThrow();
    });
  });

  describe('clearHosts', () => {
    it('devrait clear tous les hosts sans erreur', () => {
      const host1Mock = { clear: vi.fn() } as any;
      const host2Mock = { clear: vi.fn() } as any;
      const host3Mock = { clear: vi.fn().mockImplementation(() => { throw new Error('clear error'); }) } as any;

      service.clearHosts([host1Mock, undefined, host2Mock, host3Mock]);

      expect(host1Mock.clear).toHaveBeenCalled();
      expect(host2Mock.clear).toHaveBeenCalled();
      expect(host3Mock.clear).toHaveBeenCalled();
      // Should not throw despite host3 error
    });

    it('devrait gérer tableau vide', () => {
      expect(() => service.clearHosts([])).not.toThrow();
    });
  });
});
