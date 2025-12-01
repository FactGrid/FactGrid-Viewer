import { TestBed } from '@angular/core/testing';
import { ClaimsEnricherService } from './claims-enricher.service';

describe('ClaimsEnricherService', () => {
  let service: ClaimsEnricherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClaimsEnricherService);
  });

  it('should mark P2.person when Q7 is present', () => {
    const item = [
      {
        claims: {
          P2: [
            { mainsnak: { datavalue: { value: { id: 'Q7' } } } },
          ],
        },
      },
    ];

    service.enrich(item);
    expect(item[0].claims.P2.person).toBeTruthy();
  });

  it('should mark P2.event for Q9 and place for Q8', () => {
    const item = [
      {
        claims: {
          P2: [
            { mainsnak: { datavalue: { value: { id: 'Q9' } } } },
          ],
          P47: [{ mainsnak: {} }],
        },
      },
    ];

    service.enrich(item);
    expect(item[0].claims.P2.event).toBeTruthy();
  });
});
