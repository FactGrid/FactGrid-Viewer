import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DisplaySharedService } from './display-shared.service';

describe('DisplaySharedService', () => {
  let service: DisplaySharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DisplaySharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
