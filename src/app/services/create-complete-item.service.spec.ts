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

  it('waits for itemSparql to complete before emitting display', async () => {
    const createItemService = TestBed.inject<any>(CreateCompleteItemService as any)['createItem'];
    const itemSparqlService = TestBed.inject<any>(CreateCompleteItemService as any)['itemSparql'];
    // spy on createItemToDisplay to return immediately
    vi.spyOn(createItemService, 'createItemToDisplay').mockReturnValue(of(['display']));
    const firstItem = { id: 'QTEST' };
    // setLanguage.item should return an array where first equals firstItem
    const setLanguage = TestBed.inject<any>(CreateCompleteItemService as any)['setLanguage'];
    vi.spyOn(setLanguage, 'item').mockReturnValue([firstItem]);
    // itemSparql will return after a short delay
    vi.spyOn(itemSparqlService, 'itemSparql').mockReturnValue(of(firstItem).pipe(delay(30)));

    let received = false;
    service.completeItem([{}]).subscribe((res) => {
      received = true;
    });
    // With recent optimizations, timing may vary. Wait longer to ensure delay completes.
    await new Promise((r) => setTimeout(r, 20));
    expect(received).toBeFalsy();
    await new Promise((r) => setTimeout(r, 30));
    expect(received).toBeTruthy();
    expect(createItemService.createItemToDisplay).toHaveBeenCalled();
  });
});



