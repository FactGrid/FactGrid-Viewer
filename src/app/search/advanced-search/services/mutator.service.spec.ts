import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MutatorService } from './mutator.service';

describe('MutatorService', () => {
  let service: MutatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(MutatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
