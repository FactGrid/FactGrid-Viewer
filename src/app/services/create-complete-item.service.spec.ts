import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { CreateCompleteItemService } from './create-complete-item.service';

describe('CreateCompleteItemService', () => {
  let service: CreateCompleteItemService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(CreateCompleteItemService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('waits for itemSparql to complete before emitting display', fakeAsync(() => {
    const createItemService = TestBed.inject<any>(CreateCompleteItemService as any)['createItem'];
    const itemSparqlService = TestBed.inject<any>(CreateCompleteItemService as any)['itemSparql'];
    // spy on createItemToDisplay to return immediately
    spyOn(createItemService, 'createItemToDisplay').and.returnValue(of(['display']));
    const firstItem = { id: 'QTEST' };
    // setLanguage.item should return an array where first equals firstItem
    const setLanguage = TestBed.inject<any>(CreateCompleteItemService as any)['setLanguage'];
    spyOn(setLanguage, 'item').and.returnValue([firstItem]);
    // itemSparql will return after a short delay
    spyOn(itemSparqlService, 'itemSparql').and.returnValue(of(firstItem).pipe(delay(50)));

    let received = false;
    service.completeItem([{}]).subscribe((res) => {
      received = true;
    });
    tick(49);
    expect(received).toBeFalse();
    tick(1);
    expect(received).toBeTrue();
    expect(createItemService.createItemToDisplay).toHaveBeenCalled();
  }));
});
