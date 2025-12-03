import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TypologyService } from './typology.service';

describe('TypologyService', () => {
  let service: TypologyService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TypologyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
