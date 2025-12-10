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
          {
            item: { value: 'https://database.factgrid.de/entity/Q1' },
            itemLabel: { value: 'Alpha' },
            fLabel: { value: 'Z' },
          },
          {
            item: { value: 'https://database.factgrid.de/entity/Q2' },
            itemLabel: { value: 'Beta' },
            fLabel: { value: 'A' },
          },
        ],
      },
    };

    const out = service.listFromSparql(mockRes);
    expect(out.results.bindings[0].item.id).toBe('Q2');
    expect(out.results.bindings[0].item.entity).toBe('item');
    expect(out.results.bindings.length).toBe(2);
  });

  it('should run itemSparql pipeline and produce non-empty list for Q38612 (mocked)', async () => {
    // Mock RequestService so the pipeline returns predictable data
    const mockRequest: any = {
      getList: (url: string) => {
        // detect the batchAskQuery call (contains BIND/EXISTS) and return ASK-like response
        if (url?.includes('BIND(EXISTS') || url?.includes('isList')) {
          return of({
            results: {
              bindings: [
                {
                  isLocality: { value: 'false' },
                  isOrganisation: { value: 'false' },
                  isCareer: { value: 'false' },
                  isFamilyName: { value: 'false' },
                  isAddress: { value: 'false' },
                  isFactGridClass: { value: 'false' },
                  isList: { value: 'true' },
                  isSet: { value: 'false' },
                  isSuperclass: { value: 'false' },
                  isSuperclass1: { value: 'false' },
                  isGOV: { value: 'false' },
                },
              ],
            },
          });
        }

        // Otherwise return a SELECT result with 3 members
        return of({
          results: {
            bindings: [
              {
                item: { value: 'https://database.factgrid.de/entity/Q100' },
                itemLabel: { value: 'Member Z' },
              },
              {
                item: { value: 'https://database.factgrid.de/entity/Q101' },
                itemLabel: { value: 'Member A' },
                fLabel: { value: 'A' },
              },
              {
                item: { value: 'https://database.factgrid.de/entity/Q102' },
                itemLabel: { value: 'Member B' },
                fLabel: { value: 'B' },
              },
            ],
          },
        });
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
    console.debug = (...args: any[]) => {
      logs.push(args);
    };

    const mockItem = {
      id: 'Q38612',
      claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q172192' } } } }], P165: [] },
    };

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
      });
    });
  });

  it('sparql0$ should return superclass list when superclassTest is true', async () => {
    const mockRequest: any = {
      getList: (url: string) => {
        if (url?.includes('BIND(EXISTS') || url?.includes('isSuperclass')) {
          return of({
            results: {
              bindings: [{ isSuperclass: { value: 'true' }, isSuperclass1: { value: 'false' } }],
            },
          });
        }
        // SELECT responses
        return of({
          results: {
            bindings: [
              {
                item: { value: 'https://database.factgrid.de/entity/Q10' },
                itemLabel: { value: 'SupX' },
              },
            ],
          },
        });
      },
      getAsk: (url: string) => of(false),
      getItem: (u: string) => of({}),
    };
    const mockLang: any = { selectedLang: 'en', getTranslation: (k: string) => k };

    const svc = TestBed.inject(ItemSparqlService);
    (svc as any).request = mockRequest;
    (svc as any).lang = mockLang;

    const mockItem = {
      id: 'Q38612',
      claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q1' } } } }], P165: [] },
    };

    svc.itemSparql(mockItem).subscribe((itemOut) => {
      (itemOut.sparql as any).subscribe((cards: any[]) => {
        // sparql0$ result should be a tuple where label is 'Q945280' (superclassSparql)
        const [label, rows] = cards[0];
        expect(label).toBe('Q945280');
        expect(Array.isArray(rows)).toBe(true);
      });
    });
  });

  it('sparql1$ should return Q12 list when Q12Test is true', async () => {
    const mockRequest: any = {
      getList: (url: string) => {
        if (url?.includes('BIND(EXISTS') || url?.includes('isOrganisation')) {
          return of({ results: { bindings: [{ isOrganisation: { value: 'true' } }] } });
        }
        return of({
          results: {
            bindings: [
              {
                item: { value: 'https://database.factgrid.de/entity/Q200' },
                itemLabel: { value: 'OrgMember' },
              },
            ],
          },
        });
      },
      getAsk: (url: string) => of(false),
      getItem: (u: string) => of({}),
    };
    const mockLang: any = { selectedLang: 'en', getTranslation: (k: string) => k };

    const svc = TestBed.inject(ItemSparqlService);
    (svc as any).request = mockRequest;
    (svc as any).lang = mockLang;

    const mockItem = {
      id: 'Q38612',
      claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q1' } } } }], P165: [] },
    };

    svc.itemSparql(mockItem).subscribe((itemOut) => {
      (itemOut.sparql as any).subscribe((cards: any[]) => {
        const [label, rows] = cards[1];
        expect(label).toBe('Q12');
        expect(Array.isArray(rows)).toBe(true);
        expect(rows.length).toBeGreaterThan(0);
      });
    });
  });

  it('sparql0$ and sparql1$ should return empty tuples when no tests are true', async () => {
    const mockRequest: any = {
      getList: (url: string) => {
        // Always return empty ASK/SELECT results (no tests true, no rows)
        if (
          url?.includes('BIND(EXISTS') ||
          url?.includes('isList') ||
          url?.includes('isOrganisation')
        ) {
          return of({ results: { bindings: [{ isLocality: { value: 'false' } }] } });
        }
        // default SELECT empty
        return of({ results: { bindings: [] } });
      },
      getAsk: (url: string) => of(false),
      getItem: (u: string) => of({}),
    };
    const mockLang: any = { selectedLang: 'en', getTranslation: (k: string) => k };

    const svc = TestBed.inject(ItemSparqlService);
    (svc as any).request = mockRequest;
    (svc as any).lang = mockLang;

    const mockItem = {
      id: 'Q38612',
      claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q1' } } } }], P165: [] },
    };

    svc.itemSparql(mockItem).subscribe((itemOut) => {
      (itemOut.sparql as any).subscribe((cards: any[]) => {
        // both sparql0$ and sparql1$ should be [undefined, []]
        const [label0, rows0] = cards[0];
        const [label1, rows1] = cards[1];
        expect(label0).toBeUndefined();
        expect(Array.isArray(rows0)).toBe(true);
        expect(rows0.length).toBe(0);

        expect(label1).toBeUndefined();
        expect(Array.isArray(rows1)).toBe(true);
        expect(rows1.length).toBe(0);
      });
    });
  });

  it('sparql3$ should return address tuple (Q16200) when address test is true', async () => {
    const mockRequest: any = {
      getList: (url: string) => {
        // detect the batchAskQuery call and return isAddress true
        if (url?.includes('BIND(EXISTS') || url?.includes('isAddress')) {
          return of({ results: { bindings: [{ isAddress: { value: 'true' } }] } });
        }
        // other SELECT empty
        return of({ results: { bindings: [] } });
      },
      getAsk: (url: string) => of(false),
      getItem: (u: string) => of({ display_name: 'Rue Example 1, Paris' }),
    };
    const mockLang: any = { selectedLang: 'en', getTranslation: (k: string) => k };

    const svc = TestBed.inject(ItemSparqlService);
    (svc as any).request = mockRequest;
    (svc as any).lang = mockLang;

    const mockItem = {
      id: 'Q38612',
      claims: {
        P48: [{ mainsnak: { datavalue: { value: { latitude: 48.8566, longitude: 2.3522 } } } }],
        P2: [],
        P165: [],
      },
    };

    svc.itemSparql(mockItem).subscribe((itemOut) => {
      (itemOut.sparql as any).subscribe((cards: any[]) => {
        const [label3, rows3] = cards[3];
        expect(label3).toBe('Q16200');
        expect(Array.isArray(rows3)).toBe(true);
        expect(rows3.length).toBe(1);
        expect(rows3[0].itemLabel.value).toContain('Rue Example');
      });
    });
  });
});
