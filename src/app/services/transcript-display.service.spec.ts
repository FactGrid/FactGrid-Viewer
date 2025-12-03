import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { TranscriptDisplayService } from './transcript-display.service';

describe('TranscriptDisplayService', () => {
  let service: TranscriptDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TranscriptDisplayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
