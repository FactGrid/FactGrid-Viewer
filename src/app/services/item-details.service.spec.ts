import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ItemDetailsService } from './item-details.service';

describe('ItemDetailsService', () => {
  let service: ItemDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ItemDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
