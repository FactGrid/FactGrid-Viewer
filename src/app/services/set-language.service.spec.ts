import { SetLanguageService } from './set-language.service';

describe('SetLanguageService', () => {
  let service: SetLanguageService;

  beforeEach(() => {
    // instantiate directly to avoid spinning up TestBed / Angular injector
    service = new SetLanguageService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('item() should pick the preferred language for labels and descriptions', () => {
    const res = [
      {
        id: 'Q1',
        labels: { en: { value: 'English' }, fr: { value: 'Français' } },
        descriptions: { en: { value: 'Desc EN' }, fr: { value: 'Desc FR' } },
        aliases: { en: [{ value: 'alias1' }] },
        claims: {},
        sitelinks: {},
        datatype: 'string',
      },
    ];

    const outEn = service.item(res, 'en');
    expect(outEn.length).toBe(1);
    expect(outEn[0].label).toBe('English');
    expect(outEn[0].description).toBe('Desc EN');

    const outFr = service.item(res, 'fr');
    expect(outFr[0].label).toBe('Français');
    expect(outFr[0].description).toBe('Desc FR');
    expect(outFr[0].aliases).toEqual(['alias1']);
  });

  it('item2() should expose external link when datatype is external-id and claim P236 exists', () => {
    const res = [
      {
        id: 'Q2',
        labels: { en: { value: 'Some' } },
        descriptions: {},
        aliases: {},
        datatype: 'external-id',
        claims: {
          P236: [{ mainsnak: { datavalue: { value: 'http://example.org/external' } } }],
        },
      },
    ];

    const out = service.item2(res, 'en');
    expect(out.length).toBe(1);
    expect(out[0].externalLink).toBe('http://example.org/external');
  });
});
