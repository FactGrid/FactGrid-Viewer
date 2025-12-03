import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { WikibaseSearchService } from './wikibase-search.service';

describe('WikibaseSearchService', () => {
  let service: WikibaseSearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(WikibaseSearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
