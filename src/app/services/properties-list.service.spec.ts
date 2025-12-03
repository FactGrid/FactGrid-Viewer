import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PropertiesListService } from './properties-list.service';

describe('PropertiesListService', () => {
  let service: PropertiesListService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(PropertiesListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
