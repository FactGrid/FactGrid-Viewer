import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SetTimeService } from './set-time.service';

describe('SetTimeService', () => {
  let service: SetTimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SetTimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
