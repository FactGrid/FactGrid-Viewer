import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { RoleOfObjectRenderingService } from './role-of-object-rendering.service';

describe('RoleOfObjectRenderingService', () => {
  let service: RoleOfObjectRenderingService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(RoleOfObjectRenderingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
