import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { ItemSparqlService } from '../../services/item-sparql.service';
import { SparqlDisplayService } from './sparql-display.service';
import { SparqlTuple } from '../../services/sparql-types';

describe('Integration: ItemSparqlService -> SparqlDisplayService', () => {
  let itemSvc: ItemSparqlService;
  let sparqlDisplay: SparqlDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    itemSvc = TestBed.inject(ItemSparqlService);
    sparqlDisplay = new SparqlDisplayService();
  });

  it('should produce SPARQL tuples then build UI state for Q8 (Buildings)', (done) => {
    // Mock request service so itemSparql produces predictable tuples
    const mockRequest: any = {
      getList: (url: string) => {
        // batchAskQuery -> return isLocality true so selectSparql4 will run Q8Sparql
        if (url?.includes('BIND(EXISTS')) {
          return of({ results: { bindings: [{ isLocality: { value: 'true' } }] } });
        }

        // Q8Sparql SELECT response
        return of({ results: { bindings: [{ item: { value: 'https://database.factgrid.de/entity/Q1' }, itemLabel: { value: 'House' } }] } });
      },
      getAsk: (url: string) => of(false),
      getItem: (u: string) => of({}),
    };

    const mockLang: any = { selectedLang: 'en', getTranslation: (k: string) => (k === 'buildingTitle' ? 'Buildings' : '') };

    // inject mocks into itemSparql service instance
    (itemSvc as any).request = mockRequest;
    (itemSvc as any).lang = mockLang;

    const mockItem = { id: 'QINT', claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q8' } } } }], P165: [] } };

    itemSvc.itemSparql(mockItem).subscribe((itemOut) => {
      expect(itemOut.sparql).toBeDefined();

      // itemOut.sparql is a forkJoin observable producing SparqlTuple[]
      const sparql$ = (itemOut.sparql as any);

      sparqlDisplay.buildAllCardsState(sparql$, mockLang).subscribe((state) => {
        // sparql4 should have recognized Q8 -> 'Buildings'
        expect(state.sparql4.title).toBe('Buildings');
        expect(Array.isArray(state.sparql4.list)).toBeTrue();
        expect(state.sparql4.list.length).toBeGreaterThan(0);
        done();
      });
    });
  });

  it('should produce a current address tuple and preserve display_name in sparql3', (done) => {
    const mockRequest: any = {
      getList: (url: string) => {
        // batchAskQuery -> mark isAddress true so sparql3->currentAddress flows
        if (url?.includes('BIND(EXISTS') || url?.includes('isAddress')) {
          return of({ results: { bindings: [{ isAddress: { value: 'true' } }] } });
        }

        // other SELECT responses return empty by default
        return of({ results: { bindings: [] } });
      },
      getAsk: (url: string) => of(false),
      getItem: (u: string) => of({ display_name: 'Rue Example 1, Paris' }),
    };

    const mockLang: any = { selectedLang: 'en', getTranslation: (k: string) => (k === 'addressTitle' ? 'Address' : '') };

    (itemSvc as any).request = mockRequest;
    (itemSvc as any).lang = mockLang;

    const mockItem = { id: 'QINT2', claims: { P48: [{ mainsnak: { datavalue: { value: { latitude: 48.8566, longitude: 2.3522 } } } }], P2: [], P165: [] } };

    itemSvc.itemSparql(mockItem).subscribe((itemOut) => {
      const sparql$ = (itemOut.sparql as any);
      sparqlDisplay.buildAllCardsState(sparql$, mockLang).subscribe((state) => {
        // sparql3 should carry the current address tuple (label Q16200)
        expect(state.sparql3.subject).toBe('Q16200');
        expect(state.sparql3.list.length).toBeGreaterThan(0);
        expect(state.sparql3.list[0].itemLabel.value).toContain('Rue Example');
        done();
      });
    });
  });

  it('should build titles & lists for list (Q172192) and set (Q945258) on sparql3', (done) => {
    // We'll craft two separate mock runs: first list (Q172192), then set (Q945258)
    const run = (subjectId: string, expTitleKey: string, cb: () => void) => {
      const mockRequest: any = {
        getList: (url: string) => {
          // batchAskQuery -> mark list/set true as needed
          if (url?.includes('BIND(EXISTS')) {
            if (subjectId === 'Q172192') return of({ results: { bindings: [{ isList: { value: 'true' } }] } });
            if (subjectId === 'Q945258') return of({ results: { bindings: [{ isSet: { value: 'true' } }] } });
          }
          // SELECT response for list/set queries
          return of({ results: { bindings: [{ item: { value: 'https://database.factgrid.de/entity/Q10' }, itemLabel: { value: 'Member X' } }] } });
        },
        getAsk: (url: string) => of(false),
        getItem: (u: string) => of({}),
      };

      const mockLang: any = { selectedLang: 'en', getTranslation: (k: string) => (k === expTitleKey ? (expTitleKey === 'listTitle' ? 'List' : 'Set') : '') };

      (itemSvc as any).request = mockRequest;
      (itemSvc as any).lang = mockLang;

      const mockItem = { id: 'QINT3', claims: { P2: [{ mainsnak: { datavalue: { value: { id: subjectId } } } }], P165: [] } };

      itemSvc.itemSparql(mockItem).subscribe((itemOut) => {
        const sparql$ = (itemOut.sparql as any);
        sparqlDisplay.buildAllCardsState(sparql$, mockLang).subscribe((state) => {
          expect(state.sparql3.subject).toBe(subjectId);
          expect(state.sparql3.title).toBeTruthy();
          expect(state.sparql3.list.length).toBeGreaterThan(0);
          cb();
        });
      });
    };

    // run for list then set
    run('Q172192', 'listTitle', () => run('Q945258', 'setTitle', done));
  });
});
