import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AutocompleteIndexService } from './autocomplete-index.service';

describe('AutocompleteIndexService', () => {
  let service: AutocompleteIndexService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [AutocompleteIndexService] });
    service = TestBed.inject(AutocompleteIndexService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads index and returns matches by prefix', async () => {
    const testIndex = [
      { label: 'Frédéric', id: 'Q1', categories: ['firstName'] },
      { label: 'Fred', id: 'Q2', categories: ['firstName'] },
      { label: 'Pierre', id: 'Q3', categories: ['firstName'] }
    ];

    const p = service.getMatches('Fred', 2, ['firstName']).then((res) => {
      expect(res.length).toBeGreaterThan(0);
      // labels may contain diacritics; use normalized form present on the entries
      expect(res[0].norm).toContain('fred');
    });

    const req = httpMock.expectOne('/assets/data/autocomplete-index.json');
    req.flush(testIndex as any);

    return p;
  });
});
