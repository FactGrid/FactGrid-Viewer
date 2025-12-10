import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import {
  RequestService,
  CommonsImageMetadata,
  WBSearchResponse,
  GetEntitiesResponse,
} from './request.service';

describe('RequestService (typed)', () => {
  let svc: RequestService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    svc = TestBed.inject(RequestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getCommonsImageMetadata returns null for empty input', async () => {
    svc.getCommonsImageMetadata('').subscribe((res) => {
      expect(res).toBeNull();
    });
  });

  it('getCommonsImageMetadata extracts extmetadata fields', async () => {
    const file = 'File:Example.jpg';
    const mockResponse: any = {
      query: {
        pages: {
          '123': {
            imageinfo: [
              {
                extmetadata: {
                  ImageDescription: { value: '<p>desc</p>' },
                  Artist: { value: 'Artist Name' },
                  Credit: { value: 'Credit' },
                  LicenseShortName: { value: 'CC-BY' },
                  UsageTerms: { value: 'Use freely' },
                },
              },
            ],
          },
        },
      },
    };

    svc.getCommonsImageMetadata(file).subscribe((meta: CommonsImageMetadata | null) => {
      expect(meta).toBeTruthy();
      expect(meta!.descriptionHtml).toContain('desc');
      expect(meta!.artist).toBe('Artist Name');
      expect(meta!.licenseShort).toBe('CC-BY');
    });

    const req = http.expectOne((r) => r.url.includes('commons.wikimedia.org'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('searchItem returns a WBSearchResponse shape', async () => {
    const resp: WBSearchResponse = {
      searchinfo: { totalhits: 1 },
      search: [{ id: 'Q1', label: 'Foo' }],
    };
    svc.searchItem('foo', 'en', 0, 10).subscribe((r) => {
      expect(r).toBeTruthy();
      expect(r.search && r.search.length).toBeGreaterThanOrEqual(0);
    });
    const req = http.expectOne(
      (r) => r.url.includes('database.factgrid.de') && r.params.get('action') === 'wbsearchentities'
    );
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });

  it('searchItem with explicit QID calls wbgetentities and returns entry', async () => {
    const sample: GetEntitiesResponse = {
      entities: {
        Q123: {
          id: 'Q123',
          labels: { en: { value: 'Sample Q123' } },
          descriptions: { en: { value: 'Desc' } },
          aliases: { en: [{ value: 'SampleAlias' }] },
        } as any,
      },
    };
    svc.searchItem('Q123', 'en', 0, 10).subscribe((r) => {
      expect(r).toBeTruthy();
      expect(r.search && r.search.length).toBeGreaterThan(0);
      expect(r.search![0].id).toBe('Q123');
      expect((r.search![0].label || '').length).toBeGreaterThan(0);
    });
    const req = http.expectOne((r) => r.url.includes('wbgetentities') && r.params.get('ids') === 'Q123');
    expect(req.request.method).toBe('GET');
    req.flush(sample);
  });

  it('getItem returns GetEntitiesResponse or undefined on error', async () => {
    const sample: GetEntitiesResponse = { entities: { Q123: { id: 'Q123', labels: {} } } };

    svc.getItem('https://example.test/').subscribe((res) => {
      expect(res && res.entities).toBeTruthy();
    });

    const req = http.expectOne((r) => r.url === 'https://example.test/');
    req.flush(sample);
  });
});
// kept single suite — additional basic creation test not needed here
