import { Injectable } from '@angular/core';
import { TRANSLATIONS } from './config/translations.config';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SelectedLangService {
  /**
   * Ordre de fallback des langues supportées.
   * Ajoutez ou retirez des codes selon vos besoins.
   */
  private fallbackOrder: string[] = ['en', 'fr', 'de', 'es', 'it', 'zh', 'hu'];

  /**
   * Langue sélectionnée :
   * - d'abord celle du localStorage si présente,
   * - sinon celle du navigateur si supportée,
   * - sinon la première du fallback (anglais).
   */
  private _selectedLang: string;
  private langSubject: BehaviorSubject<string>;
  public language$: Observable<string>;

  constructor() {
    const storedLang = localStorage['selectedLang'];
    const browserLang = navigator.language?.split('-')[0]; // ex: 'fr' pour 'fr-FR'
    if (storedLang) {
      this._selectedLang = storedLang;
    } else if (browserLang && this.fallbackOrder.includes(browserLang)) {
      this._selectedLang = browserLang;
    } else {
      this._selectedLang = this.fallbackOrder[0];
    }
    this.langSubject = new BehaviorSubject<string>(this._selectedLang);
    this.language$ = this.langSubject.asObservable();
  }

  /** Returns the fallback order / supported languages as an array. */
  getSupportedLanguages(): string[] {
    return [...this.fallbackOrder];
  }

  /**
   * Récupère la traduction pour une clé et la langue courante.
   * Utilise le fallback si la traduction n'existe pas dans la langue demandée.
   */
  getTranslation(
    key: string,
    lang?: string,
    fallbackOrder: string[] = this.fallbackOrder
  ): string | undefined {
    const language = lang ?? this.selectedLang;
    const entry = TRANSLATIONS[key];
    if (!entry) return undefined;
    if (entry[language]) return entry[language];
    for (const code of fallbackOrder) {
      if (entry[code]) return entry[code];
    }
    // fallback: première langue disponible
    const keys = Object.keys(entry);
    return keys.length > 0 ? entry[keys[0]] : undefined;
  }

  /**
   * Permet de changer la langue courante et de la stocker.
   */
  get selectedLang(): string {
    return this._selectedLang;
  }

  set selectedLang(lang: string) {
    if (!this.fallbackOrder.includes(lang)) return;
    this._selectedLang = lang;
    localStorage['selectedLang'] = lang;
    try {
      this.langSubject?.next(lang);
    } catch {}
  }

  setLang(lang: string) {
    this.selectedLang = lang; // use the setter to ensure emission
  }
}
