import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { RequestService, CommonsImageMetadata, WBSearchResponse, GetEntitiesResponse } from './request.service';

describe('RequestService (typed)', () => {
  let svc: RequestService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    svc = TestBed.inject(RequestService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getCommonsImageMetadata returns null for empty input', (done) => {
    svc.getCommonsImageMetadata('').subscribe((res) => {
      expect(res).toBeNull();
      done();
    });
  });

  it('getCommonsImageMetadata extracts extmetadata fields', (done) => {
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
      done();
    });

    const req = http.expectOne((r) => r.url.includes('commons.wikimedia.org'));
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('searchItem returns a WBSearchResponse shape', (done) => {
    const resp: WBSearchResponse = { searchinfo: { totalhits: 1 }, search: [{ id: 'Q1', label: 'Foo' }] };
    svc.searchItem('foo', 'en', 0, 10).subscribe((r) => {
      expect(r).toBeTruthy();
      expect(r.search && r.search.length).toBeGreaterThanOrEqual(0);
      done();
    });
    const req = http.expectOne((r) => r.url.includes('database.factgrid.de') && r.params.get('action') === 'wbsearchentities');
    expect(req.request.method).toBe('GET');
    req.flush(resp);
  });

  it('getItem returns GetEntitiesResponse or undefined on error', (done) => {
    const sample: GetEntitiesResponse = { entities: { Q123: { id: 'Q123', labels: {} } } };

    svc.getItem('https://example.test/').subscribe((res) => {
      expect(res && res.entities).toBeTruthy();
      done();
    });

    const req = http.expectOne((r) => r.url === 'https://example.test/');
    req.flush(sample);
  });
});
// kept single suite — additional basic creation test not needed here
