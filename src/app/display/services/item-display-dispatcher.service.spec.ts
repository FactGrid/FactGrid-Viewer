import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ItemDisplayDispatcherService } from './item-display-dispatcher.service';
import { ClaimsEnricherService } from './claims-enricher.service';

describe('ItemDisplayDispatcherService', () => {
  let service: ItemDisplayDispatcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ItemDisplayDispatcherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('dispatch should call ClaimsEnricherService.enrich', () => {
    const claimsEnricher = TestBed.inject(ClaimsEnricherService);
    vi.vi.vi.spyOn(claimsEnricher, 'enrich');

    const item: any = [
      { claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }] } },
      ['P2'],
    ];
    const target: any = {};

    service.dispatch(item, target);

    expect(claimsEnricher.enrich).toHaveBeenCalledWith(item);
  });

  it('dispatch should detect person and remove person props from otherProps list', () => {
    // Prepare a minimal item where P2 contains Q7 and a person property P154 is present
    const item: any = [
      {
        claims: {
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }],
          P154: [{ some: 'data' }],
        },
      },
      ['P2', 'P154'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isPerson).toBe(true);
    expect(Array.isArray(target.lifeAndFamily)).toBe(true);
    // P154 should have been removed from the otherProps list
    expect(item[1].includes('P154')).toBe(false);
  });

  it('dispatch should populate place block when P2.place and place claims are present', () => {
    const item: any = [
      {
        claims: {
          P2: { place: true },
          P48: [{ lat: 10, lon: 20 }],
        },
      },
      ['P2', 'P48'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isPlace).toBe(true);
    expect(Array.isArray(target.locationAndSituation)).toBe(true);
    expect(target.locationAndSituation.length).toBeGreaterThan(0);
  });

  it('dispatch should populate place block when only P625 coords are present and P2.place is set', () => {
    const item: any = [
      {
        claims: {
          P2: { place: true },
          P625: [{ lat: 10, lon: 20 }],
        },
      },
      ['P2', 'P625'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isPlace).toBe(true);
    expect(Array.isArray(target.locationAndSituation)).toBe(true);
    expect(target.locationAndSituation.length).toBeGreaterThan(0);
  });

  it('dispatch should prefer organisation when P2 indicates org even if coords exist', () => {
    const item: any = [
      {
        claims: {
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q12' } } } }],
          P48: [{ lat: 10, lon: 20 }],
          P8: [{ org: 'o' }],
        },
      },
      ['P2', 'P48', 'P8'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    // Since P2 indicates an organisation (Q12) we should treat item as org
    expect(flags.isOrg).toBe(true);
    expect(flags.isPlace).toBe(false);
    // Org display should be populated, place display should be empty
    expect(Array.isArray(target.locationAndContext)).toBe(true);
    expect(target.locationAndContext.length).toBeGreaterThan(0);
    expect(
      target.locationAndSituation === undefined || target.locationAndSituation.length === 0
    ).toBe(true);
  });

  it('dispatch should populate excludedProperties and remove them from the index list', () => {
    const item: any = [
      {
        claims: {
          P899: [{ test: 'x' }],
        },
      },
      ['P899'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(Array.isArray(target.excludedProperties)).toBe(true);
    expect(target.excludedProperties.length).toBeGreaterThan(0);
    // property removed from index
    expect(item[1].includes('P899')).toBe(false);
  });

  it('dispatch should set info block and isInfo flag when INFO properties exist', () => {
    const item: any = [
      {
        claims: {
          P3: [{ id: 'Q200' }],
        },
      },
      ['P3'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isInfo).toBe(true);
    expect(Array.isArray(target.info)).toBe(true);
    expect(target.info.length).toBeGreaterThan(0);
  });

  it('dispatch should populate headerDetail and set isHeader when header properties exist', () => {
    const item: any = [
      {
        claims: {
          P2: [{ id: 'Q7' }],
          P3: [{ id: 'Q8' }],
          P8: [{ id: 'Q9' }],
        },
      },
      ['P2', 'P3', 'P8'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isHeader).toBe(true);
    expect(Array.isArray(target.headerDetail)).toBe(true);
    expect(target.headerDetail.length).toBeGreaterThan(0);
  });

  it('dispatch should populate org/activity/document/source/external lists when P2 flags + claims present', () => {
    const item: any = [
      {
        claims: {
          P2: { org: true, activity: true, document: true, sources: true },
          P8: [{ org: 'o' }],
          P267: [{ act: 'a' }],
          P21: [{ doc: 'd' }],
          P12: [{ src: 's' }],
          P76: { datatype: 'external-id', 0: { mainsnak: { datavalue: { value: 'x' } } } },
        },
      },
      ['P2', 'P8', 'P267', 'P21', 'P12', 'P76'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isOrg).toBe(true);
    expect(Array.isArray(target.locationAndContext)).toBe(true);
    expect(target.locationAndContext.length).toBeGreaterThan(0);

    expect(flags.isActivity).toBe(true);
    expect(Array.isArray(target.activityDetail)).toBe(true);

    expect(flags.isDocument).toBe(true);
    expect(Array.isArray(target.documentDetail)).toBe(true);

    expect(flags.isSource).toBe(true);
    expect(Array.isArray(target.sourcesList)).toBe(true);

    expect(flags.isExternalLinks).toBe(true);
    expect(Array.isArray(target.externalLinks)).toBe(true);
  });

  it('mainList should not contain duplicate claim arrays (e.g. P267) when present in multiple blocks', () => {
    const item: any = [
      {
        claims: {
          P2: { org: true, activity: true },
          P8: [{ org: 'o' }],
          P267: [{ act: 'a' }],
        },
      },
      ['P2', 'P8', 'P267'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isOrg).toBe(true);
    expect(flags.isActivity).toBe(true);

    // mainList is built from locationAndContext + activityDetail etc.
    // Ensure the same claim array (item[0].claims.P267) appears only once
    const occurrences = (target.mainList || []).filter(
      (g: any) => g === item[0].claims.P267
    ).length;
    expect(occurrences).toBe(1);
  });

  it('dispatch should populate otherClaims and mark isOther when item[1] contains unknown props', () => {
    const item: any = [
      {
        claims: {
          P2: { other: true },
          P999: [{ foo: 'bar' }],
        },
      },
      ['P2', 'P999'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isOther).toBe(true);
    expect(Array.isArray(target.otherClaims)).toBe(true);
    expect(target.otherClaims.length).toBeGreaterThan(0);
  });

  it('dispatch should include eventDetail in mainList for non-person items', () => {
    const item: any = [
      {
        claims: {
          P2: { event: true },
          P47: [{ event: 'e' }],
        },
      },
      ['P2', 'P47'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    // not a person, eventDetail should be included in mainList
    expect(flags.isPerson).toBe(false);
    expect(Array.isArray(target.eventDetail)).toBe(true);
    // mainList should contain the event data; handle either nested-array or flattened shape
    expect(
      target.mainList.length > 0 ||
        target.mainList.some(
          (g: any) => (Array.isArray(g) && g[0] && g[0].event === 'e') || (g && g.event === 'e')
        )
    ).toBe(true);
  });

  it('dispatch should include P3 in mainList when P2 undefined', () => {
    const item: any = [
      {
        claims: {
          P3: [{ id: 'Q100' }],
        },
      },
      ['P3'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isMain).toBe(true);
    expect(Array.isArray(target.mainList)).toBe(true);
    expect(target.mainList.length).toBeGreaterThan(0);
  });

  it('dispatch should include P3 in mainList when P2 present but produced no block content', () => {
    const item: any = [
      {
        claims: {
          // P2 exists but doesn't match any known flags / block types
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q999999' } } } }],
          P3: [{ id: 'Q100' }],
        },
      },
      ['P2', 'P3'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    // We should still show a main card by falling back to P3 list
    expect(flags.isMain).toBe(true);
    expect(Array.isArray(target.mainList)).toBe(true);
    expect(target.mainList.length).toBeGreaterThan(0);
    // ensure the P3 array was added into the mainList
    expect(target.mainList).toContain(item[0].claims.P3);
  });

  it('dispatch should hide main title and use icon for person P2=Q7', () => {
    const item: any = [
      { claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }] } },
      ['P2'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isPerson).toBe(true);
    // mainTitle should be cleared and mainIcon set to 'person' (life & family)
    expect(target.mainTitle === '' || target.mainTitle === undefined).toBe(true);
    expect(target.mainIcon).toBe('person');
  });

  it('dispatch should set person card title and icon for P2=Q7', () => {
    const item: any = [
      { claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }] } },
      ['P2'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isPerson).toBe(true);
    expect(target.personIcon).toBe('person');
    expect(target.personTitle).toBeTruthy();
  });

  it('dispatch should use P2[0].mainsnak.label as mainTitle when P2 is Q890181', () => {
    const item: any = [
      {
        claims: {
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q890181' } }, label: 'PlaceTypeX' } }],
        },
      },
      ['P2'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isPerson).toBe(false);
    expect(target.mainTitle).toBe('PlaceTypeX');
  });
});

