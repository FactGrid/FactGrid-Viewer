import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { BackListService } from './back-list.service';

describe('BackListService', () => {
  let service: BackListService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(BackListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
