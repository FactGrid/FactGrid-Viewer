import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ArrayToCsvService } from './array-to-csv.service';

describe('ArrayToCsvService', () => {
  let service: ArrayToCsvService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ArrayToCsvService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
