import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SortingDataAccessorService } from './sorting-data-accessor.service';

describe('SortingDataAccessorService', () => {
  let service: SortingDataAccessorService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SortingDataAccessorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
