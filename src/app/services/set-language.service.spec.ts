import { TestBed } from '@angular/core/testing';

import { SetLanguageService } from './set-language.service';

describe('SetLanguageService', () => {
  let service: SetLanguageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SetLanguageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Test en attente : ajouter des assertions concrètes sur la gestion de la langue (get/set)
  xit('should allow setting and getting the current language (to be implemented)', () => {
    // ...existing code...
    // Exemple : service.setLanguage('fr'); expect(service.getLanguage()).toBe('fr');
  });
});
