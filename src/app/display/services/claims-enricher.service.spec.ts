import { TestBed } from '@angular/core/testing';
import { ClaimsEnricherService } from './claims-enricher.service';

describe('ClaimsEnricherService', () => {
  let service: ClaimsEnricherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClaimsEnricherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('enrich should set person and sub-flags for P2 with Q7', () => {
    const item = [
      {
        claims: {
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }],
        },
      },
    ];

    const out = service.enrich(item);
    expect(out[0].claims.P2.person).toBe(true);
    expect(out[0].claims.P2.career).toBe(true);
    expect(out[0].claims.P2.training).toBe(true);
    expect(out[0].claims.P2.sociability).toBe(true);
  });

  it('enrich should set org/event/document/activity flags', () => {
    const item = [
      {
        claims: {
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q12' } } } }],
        },
      },
    ];

    const out = service.enrich(item);
    expect(out[0].claims.P2.org).toBe(true);

    // event
    out[0].claims.P2 = [{ mainsnak: { datavalue: { value: { id: 'Q9' } } } }];
    const out2 = service.enrich(out);
    expect(out2[0].claims.P2.event).toBe(true);
    // main flag must NOT be created automatically by the enricher; keep
    // P2.main reserved for explicit values coming from the payload.
    expect(out2[0].claims.P2.main).toBeUndefined();
  });

  it('should mark P2.person when Q7 is present (alternate check)', () => {
    const item = [
      {
        claims: {
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }],
        },
      },
    ];

    service.enrich(item);
    expect((item[0].claims.P2 as any).person).toBeTruthy();
  });

  it('should mark P2.event for Q9 when P47 is present and event id in P2', () => {
    const item = [
      {
        claims: {
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q9' } } } }],
          P47: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any).event).toBeTruthy();
  });

  it('should mark P2.event when top-level P242 is present (no P2 event id)', () => {
    const item = [
      {
        claims: {
          P242: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any).event).toBeTruthy();
  });

  it('should NOT mark P2.event when only ambiguous top-level props (P47) are present', () => {
    const item = [
      {
        claims: {
          P47: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any)?.event).toBeUndefined();
  });

  it('should mark P2.person when top-level person props are present (P77) and add sub-flags', () => {
    const item = [
      {
        claims: {
          P77: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    const p2 = ((item[0].claims as any).P2 as any) || {};
    expect(p2.person).toBeTruthy();
    expect(p2.career).toBeTruthy();
    expect(p2.training).toBeTruthy();
    expect(p2.sociability).toBeTruthy();
  });

  it('should mark P2.career when top-level career props (P164) are present', () => {
    const item = [
      {
        claims: {
          P164: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any).career).toBeTruthy();
  });

  it('should mark P2.training when top-level education props (P160) are present', () => {
    const item = [
      {
        claims: {
          P160: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any).training).toBeTruthy();
  });

  it('should mark P2.sociability when top-level sociability props (P91) are present', () => {
    const item = [
      {
        claims: {
          P91: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any).sociability).toBeTruthy();
  });

  it('should mark P2.place when P2 contains a place id (e.g. Q8)', () => {
    const item = [
      {
        claims: {
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q8' } } } }],
        },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any).place).toBeTruthy();
  });

  it('should mark P2.place when top-level place props (e.g. P48) are present', () => {
    const item = [
      {
        claims: {
          P48: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any).place).toBeTruthy();
  });

  it('should NOT mark P2.place when top-level place props are present but P2 indicates an organisation', () => {
    const item = [
      {
        claims: {
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q12' } } } }],
          P48: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    // P2:Q12 is an organisation id — place should not be set by top-level props
    expect(((item[0].claims as any).P2 as any).org).toBe(true);
    expect(((item[0].claims as any).P2 as any).place).toBeUndefined();
  });

  it('should mark P2.org when SPARQL batch Q12Test indicates an organisation', () => {
    const item = [
      {
        claims: {
          // no direct org id in P2
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q890181' } } } }],
        },
        // SPARQL result attached by ItemSparqlService should be consulted
        sparqlFlags: { Q12Test: true },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any).org).toBeTruthy();
  });

  it('should mark P2.place when SPARQL batch Q8Test indicates a place and not org', () => {
    const item = [
      {
        claims: {
          P2: [{ mainsnak: { datavalue: { value: { id: 'Q890181' } } } }],
        },
        sparqlFlags: { Q8Test: true },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any).place).toBeTruthy();
  });

  it('should mark P2.place when top-level coordinates are present as P625', () => {
    const item = [
      {
        claims: {
          P625: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    expect(((item[0].claims as any).P2 as any).place).toBeTruthy();
  });
});
