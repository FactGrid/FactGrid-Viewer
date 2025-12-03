import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { FactgridSubtitlesService } from './factgrid-subtitles.service';
import { SelectedLangService } from '../selected-lang.service';

describe('FactgridSubtitlesService', () => {
  let service: FactgridSubtitlesService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(FactgridSubtitlesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setSubtitle1 should set labels for P320 and localized other/sources', () => {
    const re: any = { claims: { P320: {} } };

    service.setSubtitle1(re, 'P320', 'de');

    expect(re.claims.P320.sparql).toBe('Mitgliederverzeichnis');
    expect(re.claims.P320.other).toBe('weiteren');
    expect(re.claims.P320.sources).toBe('Quellen');
  });

  it('setSubtitle2 should set main/training/career/sociability and label fields for Q7 (person) in fr', () => {
    const re: any = { claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q7' } } } }] } };

    service.setSubtitle2(re, 'P2', 0, 'fr');

    // Backwards compatible fields
    expect(re.claims.P2.main).toBe('Vie et famille');
    expect(re.claims.P2.training).toBe('Éducation');
    expect(re.claims.P2.career).toBe('Carrière et activités');
    expect(re.claims.P2.sociability).toBe('Sociabilité et culture');

    // New dedicated label fields
    expect(re.claims.P2.personLabel).toBe('Vie et famille');
    expect(re.claims.P2.trainingLabel).toBe('Éducation');
    expect(re.claims.P2.careerLabel).toBe('Carrière et activités');
    expect(re.claims.P2.sociabilityLabel).toBe('Sociabilité et culture');
  });

  it('setSubtitle1 should use the service selectedLang when no lang passed', () => {
    const selectedLang = TestBed.inject(SelectedLangService);
    // set selectedLang to French for this test
    selectedLang.selectedLang = 'fr';

    const re: any = { claims: { P320: {} } };
    service.setSubtitle1(re, 'P320');
    expect(re.claims.P320.sparql).toBe('Liste des membres');
  });

  it('setSubtitle1 should no-op when claims or property missing', () => {
    const re1: any = {};
    expect(() => service.setSubtitle1(re1, 'P320')).not.toThrow();

    const re2: any = { claims: {} };
    expect(() => service.setSubtitle1(re2, 'P320')).not.toThrow();
  });

  it('setSubtitle2 should do nothing when mainsnak/datavalue absent', () => {
    const re: any = { claims: { P2: [{}] } };
    expect(() => service.setSubtitle2(re, 'P2', 0, 'en')).not.toThrow();
    expect(re.claims.P2.main).toBeUndefined();
  });
});
