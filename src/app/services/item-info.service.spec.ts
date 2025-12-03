import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ItemInfoService } from './item-info.service';

describe('ItemInfoService', () => {
  let service: ItemInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ItemInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
