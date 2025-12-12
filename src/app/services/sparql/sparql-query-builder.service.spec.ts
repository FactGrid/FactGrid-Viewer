import { TestBed } from '@angular/core/testing';
import { SparqlQueryBuilderService } from './sparql-query-builder.service';
import { SelectedLangService } from '../../selected-lang.service';

describe('SparqlQueryBuilderService', () => {
  let service: SparqlQueryBuilderService;
  let mockLangService: any;

  beforeEach(() => {
    mockLangService = { selectedLang: 'fr' } as any;

    TestBed.configureTestingModule({
      providers: [
        SparqlQueryBuilderService,
        { provide: SelectedLangService, useValue: mockLangService },
      ],
    });
    service = TestBed.inject(SparqlQueryBuilderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('select()', () => {
    it('should build a simple SELECT query', () => {
      const query = service
        .select(['item', 'itemLabel'])
        .where(['?item wdt:P2 wd:{{itemId}}'])
        .buildRawSparql({ itemId: 'Q12345' });

      expect(query).toContain('SELECT ?item ?itemLabel');
      expect(query).toContain('?item wdt:P2 wd:Q12345');
      expect(query).toContain('SERVICE wikibase:label');
      expect(query).toContain('"fr"');
    });

    it('should build a DISTINCT SELECT query', () => {
      const query = service
        .select(['item'], true)
        .where(['?item wdt:P2 wd:Q123'])
        .buildRawSparql();

      expect(query).toContain('SELECT DISTINCT ?item');
    });

    it('should handle variables without ? prefix', () => {
      const query = service
        .select(['item', 'label'])
        .where(['?item rdfs:label ?label'])
        .buildRawSparql();

      expect(query).toContain('SELECT ?item ?label');
    });
  });

  describe('where() and union()', () => {
    it('should build UNION queries', () => {
      const query = service
        .select(['item'])
        .union(['?item wdt:P91 wd:{{id}}'], ['?item wdt:P315 wd:{{id}}'])
        .buildRawSparql({ id: 'Q999' });

      expect(query).toContain('{ ?item wdt:P91 wd:Q999 } UNION { ?item wdt:P315 wd:Q999 }');
    });

    it('should build complex WHERE with multiple patterns', () => {
      const query = service
        .select(['item'])
        .where(['?item wdt:P2 wd:Q12', '?item wdt:P3 wd:Q34'])
        .buildRawSparql();

      expect(query).toContain('?item wdt:P2 wd:Q12');
      expect(query).toContain('?item wdt:P3 wd:Q34');
    });
  });

  describe('optional()', () => {
    it('should add OPTIONAL clauses', () => {
      const query = service
        .select(['item', 'year'])
        .where(['?item wdt:P2 wd:Q123'])
        .optional(['?item wdt:P222 ?date', 'BIND(YEAR(?date) AS ?year)'])
        .buildRawSparql();

      expect(query).toContain('OPTIONAL { ?item wdt:P222 ?date');
      expect(query).toContain('BIND(YEAR(?date) AS ?year) }');
    });
  });

  describe('orderBy() and limit()', () => {
    it('should add ORDER BY clause', () => {
      const query = service
        .select(['item'])
        .where(['?item wdt:P2 wd:Q123'])
        .orderBy('itemLabel')
        .buildRawSparql();

      expect(query).toContain('ORDER BY ?itemLabel');
    });

    it('should add DESC ORDER BY', () => {
      const query = service
        .select(['item'])
        .where(['?item wdt:P2 wd:Q123'])
        .orderBy('year', 'DESC')
        .buildRawSparql();

      expect(query).toContain('ORDER BY DESC(?year)');
    });

    it('should add LIMIT clause', () => {
      const query = service
        .select(['item'])
        .where(['?item wdt:P2 wd:Q123'])
        .limit(10000)
        .buildRawSparql();

      expect(query).toContain('LIMIT 10000');
    });
  });

  describe('build()', () => {
    it('should return endpoint URL by default', () => {
      const url = service
        .select(['item'])
        .where(['?item wdt:P2 wd:Q123'])
        .build();

      expect(url).toContain('https://database.factgrid.de/sparql?query=');
      expect(url).toContain('SELECT');
    });

    it('should return query UI URL when useEndpoint=false', () => {
      const url = service
        .select(['item'])
        .where(['?item wdt:P2 wd:Q123'])
        .build({}, false);

      expect(url).toContain('https://database.factgrid.de/query/#');
    });

    it('should encode special characters', () => {
      const url = service
        .select(['item'])
        .where(['?item rdfs:label "Test Label"@en'])
        .build();

      expect(url).toContain('%');
    });
  });

  describe('buildAsk()', () => {
    it('should build ASK query', () => {
      const url = service.buildAsk('wd:{{id}} wdt:P2/wdt:P3* wd:Q12', { id: 'Q999' });
      const decoded = decodeURIComponent(url);

      expect(url).toContain('ASK');
      expect(url).toContain('Q999');
      expect(decoded).toContain('wdt:P2/wdt:P3*');
      expect(decoded).toContain('wd:Q12');
    });
  });

  describe('convertToEndpoint()', () => {
    it('should convert query/# URL to sparql endpoint', () => {
      const old = 'https://database.factgrid.de/query/#SELECT%20...';
      const converted = service.convertToEndpoint(old);

      expect(converted).toContain('https://database.factgrid.de/sparql?query=');
      expect(converted).not.toContain('query/#');
    });

    it('should convert embed.html URL to sparql endpoint', () => {
      const old = 'https://database.factgrid.de/query/embed.html#SELECT%20...';
      const converted = service.convertToEndpoint(old);

      expect(converted).toContain('https://database.factgrid.de/sparql?query=');
      expect(converted).not.toContain('embed.html');
    });
  });

  describe('placeholder replacement', () => {
    it('should replace multiple occurrences of same placeholder', () => {
      const query = service
        .select(['item'])
        .union(
          ['?item wdt:P91 wd:{{id}}'],
          ['?item wdt:P315 wd:{{id}}'],
          ['?item wdt:P267 wd:{{id}}']
        )
        .buildRawSparql({ id: 'Q777' });

      const matches = query.match(/Q777/g);
      expect(matches).toBeTruthy();
      expect(matches!.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle multiple different placeholders', () => {
      const query = service
        .select(['item'])
        .where(['?item wdt:P2 wd:{{id1}}', '?item wdt:P3 wd:{{id2}}'])
        .buildRawSparql({ id1: 'Q111', id2: 'Q222' });

      expect(query).toContain('wd:Q111');
      expect(query).toContain('wd:Q222');
    });
  });
});


