import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ItemTypeResolverService, SparqlQueryStrategy } from './item-type-resolver.service';
import { BatchAskResult, SparqlTuple } from '../sparql-types';

describe('ItemTypeResolverService', () => {
  let service: ItemTypeResolverService;

  // Stratégies mock pour tests
  const mockStrategy1: SparqlQueryStrategy = {
    id: 'TEST1',
    priority: 100,
    test: (flags: BatchAskResult, item: any) => flags.Q12Test === true,
    query: (item: any) => of(['TEST1', []] as SparqlTuple),
  };

  const mockStrategy2: SparqlQueryStrategy = {
    id: 'TEST2',
    priority: 50,
    test: (flags: BatchAskResult, item: any) => flags.Q8Test === true,
    query: (item: any) => of(['TEST2', []] as SparqlTuple),
  };

  const mockStrategy3: SparqlQueryStrategy = {
    id: 'TEST3',
    priority: 75,
    test: (flags: BatchAskResult, item: any) => flags.Q12Test === true, // Même condition que mockStrategy1
    query: (item: any) => of(['TEST3', []] as SparqlTuple),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ItemTypeResolverService],
    });
    service = TestBed.inject(ItemTypeResolverService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('registerStrategy()', () => {
    it('should register a single strategy', () => {
      service.registerStrategy(mockStrategy1);
      const strategy = service.getStrategy('TEST1');
      expect(strategy).toBe(mockStrategy1);
    });

    it('should allow overwriting a strategy with the same ID', () => {
      service.registerStrategy(mockStrategy1);
      const newStrategy = { ...mockStrategy1, priority: 200 };
      service.registerStrategy(newStrategy);

      const strategy = service.getStrategy('TEST1');
      expect(strategy!.priority).toBe(200);
    });
  });

  describe('registerStrategies()', () => {
    it('should register multiple strategies at once', () => {
      service.registerStrategies([mockStrategy1, mockStrategy2, mockStrategy3]);

      expect(service.getStrategy('TEST1')).toBe(mockStrategy1);
      expect(service.getStrategy('TEST2')).toBe(mockStrategy2);
      expect(service.getStrategy('TEST3')).toBe(mockStrategy3);
    });
  });

  describe('getStrategy()', () => {
    beforeEach(() => {
      service.registerStrategy(mockStrategy1);
    });

    it('should return a strategy by ID', () => {
      const strategy = service.getStrategy('TEST1');
      expect(strategy).toBe(mockStrategy1);
    });

    it('should return undefined for non-existent ID', () => {
      const strategy = service.getStrategy('NON_EXISTENT');
      expect(strategy).toBeUndefined();
    });
  });

  describe('resolveStrategy()', () => {
    beforeEach(() => {
      service.registerStrategies([mockStrategy1, mockStrategy2, mockStrategy3]);
    });

    it('should return the highest priority matching strategy', () => {
      const flags: BatchAskResult = {
        Q12Test: true,
        Q8Test: false,
        Q37073Test: false,
        Q24499Test: false,
        Q16200Test: false,
        Q77457Test: false,
        listTest: false,
        setTest: false,
        superclassTest: false,
        superclass1Test: false,
        GOVTest: false,
      };

      const strategy = service.resolveStrategy(flags, {});
      // mockStrategy1 a priorité 100, mockStrategy3 a priorité 75, tous deux matchent Q12Test
      expect(strategy).toBe(mockStrategy1);
      expect(strategy!.priority).toBe(100);
    });

    it('should return undefined when no strategy matches', () => {
      const flags: BatchAskResult = {
        Q12Test: false,
        Q8Test: false,
        Q37073Test: false,
        Q24499Test: false,
        Q16200Test: false,
        Q77457Test: false,
        listTest: false,
        setTest: false,
        superclassTest: false,
        superclass1Test: false,
        GOVTest: false,
      };

      const strategy = service.resolveStrategy(flags, {});
      expect(strategy).toBeUndefined();
    });

    it('should return Q8 strategy when Q8Test is true', () => {
      const flags: BatchAskResult = {
        Q12Test: false,
        Q8Test: true,
        Q37073Test: false,
        Q24499Test: false,
        Q16200Test: false,
        Q77457Test: false,
        listTest: false,
        setTest: false,
        superclassTest: false,
        superclass1Test: false,
        GOVTest: false,
      };

      const strategy = service.resolveStrategy(flags, {});
      expect(strategy).toBe(mockStrategy2);
    });
  });

  describe('resolveAllStrategies()', () => {
    beforeEach(() => {
      service.registerStrategies([mockStrategy1, mockStrategy2, mockStrategy3]);
    });

    it('should return all matching strategies sorted by priority', () => {
      const flags: BatchAskResult = {
        Q12Test: true,
        Q8Test: false,
        Q37073Test: false,
        Q24499Test: false,
        Q16200Test: false,
        Q77457Test: false,
        listTest: false,
        setTest: false,
        superclassTest: false,
        superclass1Test: false,
        GOVTest: false,
      };

      const strategies = service.resolveAllStrategies(flags, {});
      expect(strategies.length).toBe(2); // mockStrategy1 et mockStrategy3
      expect(strategies[0].id).toBe('TEST1'); // Priority 100
      expect(strategies[1].id).toBe('TEST3'); // Priority 75
    });

    it('should return empty array when no strategy matches', () => {
      const flags: BatchAskResult = {
        Q12Test: false,
        Q8Test: false,
        Q37073Test: false,
        Q24499Test: false,
        Q16200Test: false,
        Q77457Test: false,
        listTest: false,
        setTest: false,
        superclassTest: false,
        superclass1Test: false,
        GOVTest: false,
      };

      const strategies = service.resolveAllStrategies(flags, {});
      expect(strategies).toEqual([]);
    });
  });

  describe('getAllStrategies()', () => {
    it('should return all registered strategies', () => {
      service.registerStrategies([mockStrategy1, mockStrategy2]);
      const all = service.getAllStrategies();

      expect(all.length).toBe(2);
      expect(all).toContain(mockStrategy1);
      expect(all).toContain(mockStrategy2);
    });

    it('should return empty array when no strategies registered', () => {
      const all = service.getAllStrategies();
      expect(all).toEqual([]);
    });
  });

  describe('clear()', () => {
    it('should remove all strategies', () => {
      service.registerStrategies([mockStrategy1, mockStrategy2, mockStrategy3]);
      expect(service.getAllStrategies().length).toBe(3);

      service.clear();
      expect(service.getAllStrategies()).toEqual([]);
      expect(service.getStrategy('TEST1')).toBeUndefined();
    });
  });
});
