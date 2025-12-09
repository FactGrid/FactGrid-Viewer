import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SelectedItemListService } from './selected-item-list.service';

describe('SelectedItemListService', () => {
  let service: SelectedItemListService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(SelectedItemListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setItems extracts IDs from qualifiers/references', () => {
    const arr = [{ someKey: [{ datavalue: { value: { id: 'Q10' } } }] }];
    expect(service.setItems(arr)).toEqual(['Q10']);
  });

  it('setProperties extracts property ids', () => {
    const arr = [{ someKey: [{ property: 'P42' }] }];
    expect(service.setProperties(arr)).toEqual(['P42']);
  });

  it('createList builds pipe-separated list and uniq removes duplicates', () => {
    const arr = ['Q1', 'Q2', 'Q1'];
    expect(service.createList(arr)).toBe('|Q1|Q2');
    expect(service.uniq(arr)).toEqual(['Q1', 'Q2']);
  });
});
