import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ListDetailsService } from './list-details.service';

describe('ListDetailsService', () => {
  let service: ListDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ListDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
