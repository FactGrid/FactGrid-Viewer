import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SparqlInterceptor } from './sparql-interceptor.service';

describe('SparqlInterceptor', () => {
  let service: SparqlInterceptor;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SparqlInterceptor);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
