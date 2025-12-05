import { TestBed } from '@angular/core/testing';
import { MainTitleSelectorService } from './main-title-selector.service';

describe('MainTitleSelectorService', () => {
  let service: MainTitleSelectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MainTitleSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns person icon when P2.person flag present', () => {
    const p2 = { person: true } as any;
    const meta = service.decideMainMeta(p2);
    expect(meta.icon).toBe('person');
    expect(meta.title).toBe('');
  });

  it('returns person icon when P2 includes Q7 entry', () => {
    const p2 = [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }];
    const meta = service.decideMainMeta(p2);
    expect(meta.icon).toBe('person');
    expect(meta.title).toBe('');
  });

  it('selects preferred label when P2 contains a preferred id (Q890181)', () => {
    const p2 = [{ mainsnak: { datavalue: { value: { id: 'Q890181' } }, label: 'PlaceTypeX' } }];
    const meta = service.decideMainMeta(p2);
    expect(meta.title).toBe('PlaceTypeX');
  });

  it('uses first P2 entry when no type-specific lists apply', () => {
    const p2 = [
      { mainsnak: { datavalue: { value: { id: 'Q11111' } }, label: 'FirstType' } },
      { mainsnak: { datavalue: { value: { id: 'Q22222' } }, label: 'SecondType' } },
    ];
    const meta = service.decideMainMeta(p2);
    expect(meta.title).toBe('FirstType');
  });

  it('uses P3 as main title when P3 present regardless of infoList', () => {
    const p2 = [{ mainsnak: { datavalue: { value: { id: 'Q11111' } }, label: 'FirstType' } }];
    const p3 = [{ mainsnak: { datavalue: { value: { id: 'Q500' } }, label: 'BelongsToClass' } }];
    const meta = service.decideMainMeta(p2, undefined, p3);
    expect(meta.title).toBe('BelongsToClass');
  });

  it('P3 fallback to id when label not present', () => {
    const p2 = [{ mainsnak: { datavalue: { value: { id: 'Q11111' } }, label: 'FirstType' } }];
    const p3 = [{ mainsnak: { datavalue: { value: { id: 'Q500' } } } }];
    const meta = service.decideMainMeta(p2, undefined, p3);
    expect(meta.title).toBe('Q500');
  });

  it('when P3 contains multiple values, pick the first P3 value for title', () => {
    const p2 = [{ mainsnak: { datavalue: { value: { id: 'Q11111' } }, label: 'FirstType' } }];
    // P3 contains multiple values — we must pick the first one
    const p3 = [
      { mainsnak: { datavalue: { value: { id: 'Q500' } }, label: 'FirstClass' } },
      { mainsnak: { datavalue: { value: { id: 'Q501' } }, label: 'SecondClass' } },
    ];
    const meta = service.decideMainMeta(p2, undefined, p3);
    expect(meta.title).toBe('FirstClass');
  });

  it('if P3 absent, do not use P3 and continue with P2 rules', () => {
    const p2 = [{ mainsnak: { datavalue: { value: { id: 'Q11111' } }, label: 'FirstType' } }];
    const infoList = { classesList: [{ id: 'Q394251' }] } as any; // previously used marker
    const meta = service.decideMainMeta(p2, infoList, undefined);
    // Without P3, service should fall back to first P2 entry
    expect(meta.title).toBe('FirstType');
  });

  it('prefers locality over organisation when both types are present', () => {
    const p2 = [
      { mainsnak: { datavalue: { value: { id: 'Q12' } }, label: 'OrgType' } },
      { mainsnak: { datavalue: { value: { id: 'Q8' } }, label: 'PlaceType' } },
    ];
    // infoList contains both organisation and place signals
    const infoList = { classesList: [{ id: 'Q12' }, { id: 'Q8' }] } as any;
    const meta = service.decideMainMeta(p2, infoList);
    // LOCALITY_TITLE contains Q8 -> prefer locality title and prefer payload label
    expect(meta.title).toBe('PlaceType');
  });

  it('when P2.event is true should fallback to first P2 entry rather than returning empty title', () => {
    const p2 = [{ mainsnak: { datavalue: { value: { id: 'Q123' } }, label: 'FirstType' } }];
    // Also mark event flag true to simulate the problematic condition
    (p2 as any).event = true;

    // Because P2 is an array and no locality/organisation preference matches
    // the selector should fall back to the first P2 entry and return its label
    const meta = service.decideMainMeta(p2 as any);
    expect(meta.title).toBe('FirstType');
  });

  it('chooses organisation title when locality not present but org is', () => {
    const p2 = [{ mainsnak: { datavalue: { value: { id: 'Q12' } }, label: 'OrgTypeCustom' } }];
    const infoList = { classesList: [{ id: 'Q12' }] } as any;
    const meta = service.decideMainMeta(p2, infoList);
    // prefer organisation title (payload label preferred)
    expect(meta.title).toBe('OrgTypeCustom');
  });

  it('returns generic organisation title when P2 is object with org:true and no P2 array present', () => {
    const p2 = { org: true } as any;
    const meta = service.decideMainMeta(p2);
    expect(meta.title).toBe('Organisation');
  });

  it('prefers a matching organisation class from infoList when P2 indicates org and infoList contains org ids', () => {
    const p2 = { org: true } as any;
    const infoList = { classesList: [{ id: 'Q220833' }] } as any;
    const meta = service.decideMainMeta(p2, infoList);
    expect(meta.title).toBe('Administrative organisation');
  });

  it('falls back to textual P2.main when present', () => {
    const p2 = { main: 'Custom main string' } as any;
    const meta = service.decideMainMeta(p2);
    expect(meta.title).toBe('Custom main string');
  });
});
