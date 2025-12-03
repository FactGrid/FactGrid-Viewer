import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { StatementsControlsService } from './statements-controls.service';

describe('StatementsControlsService', () => {
  let service: StatementsControlsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(StatementsControlsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
