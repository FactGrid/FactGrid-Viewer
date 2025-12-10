import { Injectable, inject } from '@angular/core';
import { SelectedLangService } from '../../selected-lang.service';

/**
 * Service de construction de requêtes SPARQL avec API fluide.
 * Remplace les concaténations manuelles d'URLs par une interface déclarative.
 * 
 * @example
 * this.builder
 *   .select(['item', 'itemLabel', 'itemDescription'])
 *   .where(['?item wdt:P91 wd:{{itemId}}'])
 *   .orderBy('itemLabel')
 *   .build({ itemId: 'Q12345' });
 */
@Injectable({
  providedIn: 'root',
})
export class SparqlQueryBuilderService {
  private lang = inject(SelectedLangService);

  private readonly BASE_URL = 'https://database.factgrid.de/query/#';
  private readonly SPARQL_ENDPOINT = 'https://database.factgrid.de/sparql?query=';

  private selectClause: string[] = [];
  private whereClause: string[] = [];
  private optionalClause: string[] = [];
  private orderByClause: string = '';
  private limitClause: string = '';
  private distinctFlag: boolean = false;

  /**
   * Définit les variables à sélectionner.
   */
  select(vars: string[], distinct: boolean = false): this {
    this.selectClause = vars.map(v => v.startsWith('?') ? v : `?${v}`);
    this.distinctFlag = distinct;
    return this;
  }

  /**
   * Ajoute des clauses WHERE.
   * Supporte les patterns avec placeholders {{variable}}.
   */
  where(patterns: string[]): this {
    this.whereClause.push(...patterns);
    return this;
  }

  /**
   * Ajoute une clause UNION de plusieurs patterns WHERE.
   */
  union(...groups: string[][]): this {
    const unionParts = groups.map(g => `{ ${g.join(' . ')} }`).join(' UNION ');
    this.whereClause.push(unionParts);
    return this;
  }

  /**
   * Ajoute des clauses OPTIONAL.
   */
  optional(patterns: string[]): this {
    this.optionalClause.push(...patterns);
    return this;
  }

  /**
   * Définit l'ordre de tri.
   */
  orderBy(variable: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    const v = variable.startsWith('?') ? variable : `?${variable}`;
    this.orderByClause = direction === 'DESC' ? `ORDER BY DESC(${v})` : `ORDER BY ${v}`;
    return this;
  }

  /**
   * Définit la limite de résultats.
   */
  limit(count: number): this {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  /**
   * Construit la requête SPARQL complète et retourne l'URL d'endpoint.
   * 
   * @param params - Variables à injecter dans les placeholders {{key}}
   * @param useEndpoint - Si true, retourne l'URL d'endpoint (/sparql?query=), sinon l'URL du query UI (query/#)
   */
  build(params: Record<string, string> = {}, useEndpoint: boolean = true): string {
    let sparql = this.buildRawSparql(params);
    
    // Encode pour URL
    const encoded = encodeURIComponent(sparql);
    
    // Reset pour réutilisation
    this.reset();
    
    return useEndpoint 
      ? `${this.SPARQL_ENDPOINT}${encoded}`
      : `${this.BASE_URL}${encoded}`;
  }

  /**
   * Construit la requête SPARQL brute (non encodée).
   */
  buildRawSparql(params: Record<string, string> = {}): string {
    const distinct = this.distinctFlag ? 'DISTINCT ' : '';
    const select = `SELECT ${distinct}${this.selectClause.join(' ')}`;
    
    let where = 'WHERE {';
    if (this.whereClause.length > 0) {
      where += '\n  ' + this.whereClause.join(' .\n  ');
    }
    if (this.optionalClause.length > 0) {
      this.optionalClause.forEach(opt => {
        where += `\n  OPTIONAL { ${opt} }`;
      });
    }
    
    // Ajoute le service de label avec langue
    const langService = this.buildLangService();
    where += `\n  ${langService}`;
    where += '\n}';

    let sparql = `${select}\n${where}`;
    
    if (this.orderByClause) {
      sparql += `\n${this.orderByClause}`;
    }
    if (this.limitClause) {
      sparql += `\n${this.limitClause}`;
    }

    // Remplace les placeholders {{key}} par les valeurs
    Object.entries(params).forEach(([key, value]) => {
      sparql = sparql.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return sparql;
  }

  /**
   * Construit le service de labels Wikibase.
   */
  private buildLangService(): string {
    const lang = this.lang.selectedLang;
    return `SERVICE wikibase:label { bd:serviceParam wikibase:language "${lang}","en". }`;
  }

  /**
   * Réinitialise le builder pour une nouvelle requête.
   */
  private reset(): void {
    this.selectClause = [];
    this.whereClause = [];
    this.optionalClause = [];
    this.orderByClause = '';
    this.limitClause = '';
    this.distinctFlag = false;
  }

  /**
   * Crée une requête ASK simple.
   */
  buildAsk(pattern: string, params: Record<string, string> = {}, useEndpoint: boolean = true): string {
    let sparql = `ASK { ${pattern} }`;
    
    // Remplace les placeholders
    Object.entries(params).forEach(([key, value]) => {
      sparql = sparql.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    const encoded = encodeURIComponent(sparql);
    return useEndpoint 
      ? `${this.SPARQL_ENDPOINT}${encoded}`
      : `${this.BASE_URL}${encoded}`;
  }

  /**
   * Convertit une ancienne URL query/# vers l'endpoint sparql?query=.
   */
  convertToEndpoint(url: string): string {
    const oldPrefix = 'https://database.factgrid.de/query/#';
    const embedPrefix = 'https://database.factgrid.de/query/embed.html#';
    
    if (url.includes('embed.html')) {
      return url.replace(embedPrefix, this.SPARQL_ENDPOINT);
    }
    return url.replace(oldPrefix, this.SPARQL_ENDPOINT);
  }
}
