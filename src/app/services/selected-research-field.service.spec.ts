import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SelectedResearchFieldService } from './selected-research-field.service';

describe('SelectedResearchFieldService', () => {
  let service: SelectedResearchFieldService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SelectedResearchFieldService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
