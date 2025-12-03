import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { IframesDisplayService } from './iframes-display.service';

describe('IframesDisplayService', () => {
  let service: IframesDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(IframesDisplayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
