import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

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
});
