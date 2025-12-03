import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ParisDatabaseService } from './paris-database.service';

describe('ParisDatabaseService', () => {
  let service: ParisDatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ParisDatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
