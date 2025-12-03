import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SetSubtitleService } from './set-subtitle.service';

describe('SetSubtitleService', () => {
  let service: SetSubtitleService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SetSubtitleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
