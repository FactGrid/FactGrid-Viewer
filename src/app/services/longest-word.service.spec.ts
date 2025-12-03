import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { LongestWordService } from './longest-word.service';

describe('LongestWordService', () => {
  let service: LongestWordService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(LongestWordService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
