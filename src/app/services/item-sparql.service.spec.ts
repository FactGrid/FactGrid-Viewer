import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { RequestService } from './request.service';
import { SelectedLangService } from '../selected-lang.service';

import { ItemSparqlService } from './item-sparql.service';

describe('ItemSparqlService', () => {
  let service: ItemSparqlService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ItemSparqlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('listFromSparql should add item.id and entity and sort by fLabel when present', () => {
    const mockRes: any = {
      head: { vars: ['item', 'itemLabel', 'itemDescription', 'fLabel'] },
      results: {
        bindings: [
          { item: { value: 'https://database.factgrid.de/entity/Q1' }, itemLabel: { value: 'Alpha' }, fLabel: { value: 'Z' } },
          { item: { value: 'https://database.factgrid.de/entity/Q2' }, itemLabel: { value: 'Beta' }, fLabel: { value: 'A' } },
        ],
      },
    };

    const out = service.listFromSparql(mockRes);
    expect(out.results.bindings[0].item.id).toBe('Q2');
    expect(out.results.bindings[0].item.entity).toBe('item');
    expect(out.results.bindings.length).toBe(2);
  });

  it('should run itemSparql pipeline and produce non-empty list for Q38612 (mocked)', (done) => {
    // Mock RequestService so the pipeline returns predictable data
    const mockRequest: any = {
      getList: (url: string) => {
        // detect the batchAskQuery call (contains BIND/EXISTS) and return ASK-like response
        if (url?.includes('BIND(EXISTS') || url?.includes('isList')) {
          return of({ results: { bindings: [
            {
              isLocality: { value: 'false' }, isOrganisation: { value: 'false' }, isCareer: { value: 'false' },
              isFamilyName: { value: 'false' }, isAddress: { value: 'false' }, isFactGridClass: { value: 'false' },
              isList: { value: 'true' }, isSet: { value: 'false' }, isSuperclass: { value: 'false' }, isSuperclass1: { value: 'false' }, isGOV: { value: 'false' }
            }
          ] } });
        }

        // Otherwise return a SELECT result with 3 members
        return of({ results: { bindings: [
          { item: { value: 'https://database.factgrid.de/entity/Q100' }, itemLabel: { value: 'Member Z' } },
          { item: { value: 'https://database.factgrid.de/entity/Q101' }, itemLabel: { value: 'Member A' }, fLabel: { value: 'A' } },
          { item: { value: 'https://database.factgrid.de/entity/Q102' }, itemLabel: { value: 'Member B' }, fLabel: { value: 'B' } },
        ] } });
      },
      getAsk: (url: string) => of(false),
      getItem: (u: string) => of({}),
    };

    const mockLang: any = { selectedLang: 'en', getTranslation: (k: string) => k };

    const svc = TestBed.inject(ItemSparqlService);
    // replace the request/lang used by the service with our mocks for this test
    (svc as any).request = mockRequest;
    (svc as any).lang = mockLang;

    // spy on console.debug to collect debug messages
    const logs: any[] = [];
    const orig = console.debug;
    console.debug = (...args: any[]) => { logs.push(args); };

    const mockItem = { id: 'Q38612', claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q172192' } } } }], P165: [] } };

    svc.itemSparql(mockItem).subscribe((itemOut) => {
      expect(itemOut.id).toBe('Q38612');
      // the service attaches a forkJoin observable on item.sparql
      expect(itemOut.sparql).toBeDefined();
      // subscribe to the forkJoin and assert the returned lists
      (itemOut.sparql as any).subscribe((cards: any[]) => {
        // cards is an array with 5 entries: for each sparqlN the tuple [subject, rows]
        // since our mocked getList returns data only for the select call, one of the cards should contain values
        const nonEmpty = cards.filter((c: any) => Array.isArray(c?.[1]) && c[1].length > 0);
        expect(nonEmpty.length).toBeGreaterThan(0);

        // restore console
        console.debug = orig;
        // optionally print debug messages so they appear in test output
        // logs.forEach(l => orig(...l));

        done();
      });
    });
  });
});
