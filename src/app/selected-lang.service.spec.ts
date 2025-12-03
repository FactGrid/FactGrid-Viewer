import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SelectedLangService } from './selected-lang.service';

describe('SelectedLangService', () => {
  let service: SelectedLangService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SelectedLangService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
