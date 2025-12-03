import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SetSelectedItemsListService } from './set-selected-items-list.service';

describe('SetSelectedItemsListService', () => {
  let service: SetSelectedItemsListService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SetSelectedItemsListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
