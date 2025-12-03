import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ProjectsListService } from './projects-list.service';

describe('ProjectsListService', () => {
  let service: ProjectsListService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ProjectsListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
