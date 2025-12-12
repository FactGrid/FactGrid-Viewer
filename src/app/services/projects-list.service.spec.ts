import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ProjectsListService } from './projects-list.service';
import { RequestService } from './request.service';
import { of } from 'rxjs';

describe('ProjectsListService', () => {
  let service: ProjectsListService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ProjectsListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('prefetchResearchFieldsCachesForLanguages populates cache for en', async () => {
    const req = TestBed.inject(RequestService) as RequestService;
    localStorage.removeItem('researchFieldsCacheV1');
    const makeRes = (name: string) => ({ results: { bindings: [{ item: { id: 'Q1', value: 'https://database.factgrid.de/entity/Q1' }, itemLabel: { value: name } }] } });
    vi.spyOn(req, 'getList').mockImplementation((url: string) => {
      if (url.includes('wikibase:language "en')) return of(makeRes('EN')) as any;
      if (url.includes('wikibase:language "fr')) return of(makeRes('FR')) as any;
      return of(makeRes('EN')) as any;
    });

    const langs = service['lang'].getSupportedLanguages();
    const priority = Array.from(new Set([service['lang'].selectedLang, 'en']));
    const others = langs.filter((l) => !priority.includes(l));
    await new Promise((r) => service.prefetchResearchFieldsWithPriority(priority, others, 2, 10).subscribe({ next: r, error: r }));
    const raw = localStorage.getItem('researchFieldsCacheV1');
    expect(raw).toBeTruthy();
    const parsed = raw ? JSON.parse(raw) : {};
    expect(parsed['en']).toBeDefined();
    expect(Array.isArray(parsed['en'].projects)).toBe(true);
  });
});
