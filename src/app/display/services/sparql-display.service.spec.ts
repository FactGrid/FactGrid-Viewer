import { of } from 'rxjs';
import { SparqlDisplayService } from './sparql-display.service';

describe('SparqlDisplayService', () => {
  let service: SparqlDisplayService;

  beforeEach(() => {
    service = new SparqlDisplayService();
  });

  it('should return the building title for sparql4 when subject is Q8', (done) => {
    const mockLangService: any = {
      selectedLang: 'en',
      getTranslation: (k: string) => (k === 'buildingTitle' ? 'Buildings' : ''),
    };

    const sampleRows = [
      ['', []],
      ['', []],
      ['', []],
      ['', []],
      ['Q8', [{ item: { id: 'Q1' }, itemLabel: { value: 'House' } }]],
    ];

    service.buildAllCardsState(of(sampleRows), mockLangService).subscribe((state) => {
      expect(state.sparql4.title).toBe('Buildings');
      done();
    });
  });

  it('should fall back to the work title when sparql4 subject is GOV', (done) => {
    const mockLangService: any = {
      selectedLang: 'en',
      getTranslation: (k: string) => (k === 'workTitle' ? 'Work' : ''),
    };

    const sampleRows = [
      ['', []],
      ['', []],
      ['', []],
      ['', []],
      ['GOV', [{ item: { id: 'Q9' }, itemLabel: { value: 'Office' } }]],
    ];

    service.buildAllCardsState(of(sampleRows), mockLangService).subscribe((state) => {
      expect(state.sparql4.title).toBe('Work');
      done();
    });
  });
});
