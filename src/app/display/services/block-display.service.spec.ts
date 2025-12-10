import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { BlockDisplayService } from './block-display.service';

describe('BlockDisplayService', () => {
  let service: BlockDisplayService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(BlockDisplayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setActivityDisplay should not push the same claim twice when called repeatedly', () => {
    const item: any = [
      {
        claims: {
          P267: [{ act: 'a' }],
        },
      },
      ['P267'],
    ];

    const target: any[] = [];
    // first call pushes the claim
    service.setActivityDisplay(item, target);
    expect(target.length).toBe(1);

    // second call should not push the same claim again
    service.setActivityDisplay(item, target);
    expect(target.length).toBe(1);
  });

  it('setOrgDisplay should not duplicate a claim that was already present in the target array', () => {
    const claim = [{ org: 'o' }];
    const item: any = [
      {
        claims: {
          P267: claim,
        },
      },
      ['P267'],
    ];

    const target: any[] = [];
    // simulate pre-existing push
    target.push(item[0].claims.P267);

    // now call setOrgDisplay — should detect existing and not re-push
    service.setOrgDisplay(item, target);
    expect(target.length).toBe(1);
    expect(target[0]).toBe(claim);
  });

  it('setPlaceDisplay should handle P625 (coordinates) without duplicating and remove index entry', () => {
    const claim = [{ coords: 'c' }];
    const item: any = [
      {
        claims: {
          P625: claim,
        },
      },
      ['P625'],
    ];

    const target: any[] = [];
    service.setPlaceDisplay(item, target);
    expect(target.length).toBe(1);
    // ensure index entry removed
    expect(item[1].includes('P625')).toBe(false);

    // calling again should not duplicate
    service.setPlaceDisplay(item, target);
    expect(target.length).toBe(1);
  });
});
