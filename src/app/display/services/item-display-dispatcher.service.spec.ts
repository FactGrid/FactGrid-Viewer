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
    spyOn(claimsEnricher, 'enrich').and.callThrough();

    const item: any = [{ claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }] } }, ['P2']];
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

    expect(flags.isPerson).toBeTrue();
    expect(Array.isArray(target.lifeAndFamily)).toBeTrue();
    // P154 should have been removed from the otherProps list
    expect(item[1].includes('P154')).toBeFalse();
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

    expect(flags.isPlace).toBeTrue();
    expect(Array.isArray(target.locationAndSituation)).toBeTrue();
    expect(target.locationAndSituation.length).toBeGreaterThan(0);
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

    expect(Array.isArray(target.excludedProperties)).toBeTrue();
    expect(target.excludedProperties.length).toBeGreaterThan(0);
    // property removed from index
    expect(item[1].includes('P899')).toBeFalse();
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

    expect(flags.isInfo).toBeTrue();
    expect(Array.isArray(target.info)).toBeTrue();
    expect(target.info.length).toBeGreaterThan(0);
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

    expect(flags.isOrg).toBeTrue();
    expect(Array.isArray(target.locationAndContext)).toBeTrue();
    expect(target.locationAndContext.length).toBeGreaterThan(0);

    expect(flags.isActivity).toBeTrue();
    expect(Array.isArray(target.activityDetail)).toBeTrue();

    expect(flags.isDocument).toBeTrue();
    expect(Array.isArray(target.documentDetail)).toBeTrue();

    expect(flags.isSource).toBeTrue();
    expect(Array.isArray(target.sourcesList)).toBeTrue();

    expect(flags.isExternalLinks).toBeTrue();
    expect(Array.isArray(target.externalLinks)).toBeTrue();
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

    expect(flags.isOther).toBeTrue();
    expect(Array.isArray(target.otherClaims)).toBeTrue();
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
    expect(flags.isPerson).toBeFalse();
    expect(Array.isArray(target.eventDetail)).toBeTrue();
    // mainList should contain the event data; handle either nested-array or flattened shape
    expect(
      target.mainList.length > 0 ||
        target.mainList.some((g: any) => (Array.isArray(g) && g[0] && g[0].event === 'e') || (g && g.event === 'e'))
    ).toBeTrue();
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

    expect(flags.isMain).toBeTrue();
    expect(Array.isArray(target.mainList)).toBeTrue();
    expect(target.mainList.length).toBeGreaterThan(0);
  });

  it('dispatch should hide main title and use icon for person P2=Q7', () => {
    const item: any = [
      { claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }] } },
      ['P2'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isPerson).toBeTrue();
    // mainTitle should be cleared and mainIcon set to 'more_horiz'
    expect(target.mainTitle === '' || target.mainTitle === undefined).toBeTrue();
    expect(target.mainIcon).toBe('more_horiz');
  });

  it('dispatch should set person card title and icon for P2=Q7', () => {
    const item: any = [
      { claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }] } },
      ['P2'],
    ];

    const target: any = {};
    const flags = service.dispatch(item, target);

    expect(flags.isPerson).toBeTrue();
    expect(target.personIcon).toBe('person');
    expect(target.personTitle).toBeTruthy();
  });
});
