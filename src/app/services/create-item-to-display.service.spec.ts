import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { CreateItemToDisplayService } from './create-item-to-display.service';

describe('CreateItemToDisplayService', () => {
  let service: CreateItemToDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CreateItemToDisplayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
