import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SetLanguageService {
  constructor() {}

  lang: string;

  /** Utility: get the value for a field in the preferred language, with fallback */
  private getLangValue(
    obj: any,
    lang: string,
    fallbackOrder: string[] = ['en', 'fr', 'de', 'es', 'zh', 'zh-hans', 'zh-hant', 'it', 'hu']
  ) {
    if (!obj) return undefined;

    // Si la langue demandée est "zh", privilégier zh puis zh-hans, puis zh-hant

    // Si la langue demandée est "zh", privilégier zh puis zh-cn
    if (lang === 'zh') {
      if (obj['zh']) return obj['zh'];
      if (obj['zh-cn']) return obj['zh-cn'];
      if (obj['zh-hans']) return obj['zh-hans'];
      if (obj['zh-hant']) return obj['zh-hant'];
    }
    // Si la langue demandée est "zh-hans" (chinois simplifié explicite)
    if (lang === 'zh-hans') {
      if (obj['zh-hans']) return obj['zh-hans'];
      if (obj['zh']) return obj['zh'];
      if (obj['zh-hant']) return obj['zh-hant'];
    }
    // Si la langue demandée est "zh-hant" (chinois traditionnel explicite)
    if (lang === 'zh-hant') {
      if (obj['zh-hant']) return obj['zh-hant'];
      if (obj['zh']) return obj['zh'];
      if (obj['zh-hans']) return obj['zh-hans'];
    }

    // Fallback général
    if (obj[lang]) return obj[lang];
    for (const code of fallbackOrder) {
      if (obj[code]) return obj[code];
    }
    // fallback: première langue disponible
    const keys = Object.keys(obj);
    return keys.length > 0 ? obj[keys[0]] : undefined;
  }

  /** Utility: get aliases as array of strings for the preferred language */
  private getAliases(
    obj: any,
    lang: string,
    fallbackOrder: string[] = ['en', 'fr', 'de', 'es', 'it', 'hu', 'zh']
  ) {
    if (!obj) return [];

    // prefer requested language, with sensible fallbacks similar to getLangValue
    const pick = (key: string | undefined) => (key ? obj[key] : undefined);

    // special handling for chinese variants
    if (lang === 'zh') {
      if (obj['zh']) return Array.isArray(obj['zh']) ? obj['zh'].map((a) => a.value) : [];
      if (obj['zh-cn']) return Array.isArray(obj['zh-cn']) ? obj['zh-cn'].map((a) => a.value) : [];
      if (obj['zh-hans'])
        return Array.isArray(obj['zh-hans']) ? obj['zh-hans'].map((a) => a.value) : [];
      if (obj['zh-hant'])
        return Array.isArray(obj['zh-hant']) ? obj['zh-hant'].map((a) => a.value) : [];
    }
    if (lang === 'zh-hans') {
      if (obj['zh-hans'])
        return Array.isArray(obj['zh-hans']) ? obj['zh-hans'].map((a) => a.value) : [];
      if (obj['zh']) return Array.isArray(obj['zh']) ? obj['zh'].map((a) => a.value) : [];
      if (obj['zh-hant'])
        return Array.isArray(obj['zh-hant']) ? obj['zh-hant'].map((a) => a.value) : [];
    }
    if (lang === 'zh-hant') {
      if (obj['zh-hant'])
        return Array.isArray(obj['zh-hant']) ? obj['zh-hant'].map((a) => a.value) : [];
      if (obj['zh']) return Array.isArray(obj['zh']) ? obj['zh'].map((a) => a.value) : [];
      if (obj['zh-hans'])
        return Array.isArray(obj['zh-hans']) ? obj['zh-hans'].map((a) => a.value) : [];
    }

    if (obj[lang]) return Array.isArray(obj[lang]) ? obj[lang].map((a) => a.value) : [];

    for (const code of fallbackOrder) {
      if (obj[code]) return Array.isArray(obj[code]) ? obj[code].map((a) => a.value) : [];
    }

    // last resort: take first available language
    const keys = Object.keys(obj);
    if (keys.length > 0 && Array.isArray(obj[keys[0]])) return obj[keys[0]].map((a) => a.value);

    return [];
  }

  /** Returns an array of items with id, label, description, aliases, claims, sitelinks, datatype */
  item(res, lang) {
    if (!Array.isArray(res)) return [];
    return res.map((item) => {
      const labelObj = this.getLangValue(item.labels, lang);
      const descObj = this.getLangValue(item.descriptions, lang);
      const aliases = this.getAliases(item.aliases, lang);

      const label = labelObj?.value ?? undefined;
      const description = descObj?.value ?? undefined;

      // Only add properties if they exist
      const result: any = {
        id: item.id,
        label,
        claims: item.claims ?? {},
        sitelinks: item.sitelinks,
        datatype: item.datatype,
      };
      if (description) result.description = description;
      if (aliases.length > 0) result.aliases = aliases;
      return result;
    });
  }

  /** Returns an array of items with id, label, description, aliases, externalLink */
  item2(res, lang) {
    if (!Array.isArray(res)) return [];
    return res.map((item) => {
      const labelObj = this.getLangValue(item.labels, lang);
      const descObj = this.getLangValue(item.descriptions, lang);
      const aliases = this.getAliases(item.aliases, lang);

      let label = labelObj?.value ?? undefined;
      const description = descObj?.value ?? undefined;

      let externalLink: string | undefined;
      if (item.datatype === 'external-id' && item.claims?.P236?.[0]?.mainsnak?.datavalue?.value) {
        externalLink = item.claims.P236[0].mainsnak.datavalue.value;
      }

      const result: any = {
        id: item.id,
        label,
        externalLink,
      };
      if (description) result.description = description;
      if (aliases.length > 0) result.aliases = aliases;
      return result;
    });
  }
}
