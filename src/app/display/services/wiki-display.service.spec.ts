import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { WikiDisplayService } from './wiki-display.service';

describe('WikiDisplayService', () => {
  let service: WikiDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(WikiDisplayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
