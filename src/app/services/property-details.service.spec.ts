import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PropertyDetailsService } from './property-details.service';

describe('PropertyDetailsService', () => {
  let service: PropertyDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PropertyDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
