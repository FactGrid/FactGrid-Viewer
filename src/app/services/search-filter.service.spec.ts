import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SearchFilterService } from './search-filter.service';

describe('SearchFilterService', () => {
  let service: SearchFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SearchFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
