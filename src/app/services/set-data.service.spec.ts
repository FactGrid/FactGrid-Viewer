import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SetDataService } from './set-data.service';

describe('SetItemService', () => {
  let service: SetDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SetDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
