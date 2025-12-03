import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ResearchProjectService } from './research-projects.service';

describe('ResearchProjectService', () => {
  let service: ResearchProjectService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ResearchProjectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
