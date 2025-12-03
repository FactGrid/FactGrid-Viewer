import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SearchEngineService } from './search-engine.service';

describe('SearchEngineService', () => {
  let service: SearchEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SearchEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
