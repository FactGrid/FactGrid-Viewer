import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class WikiDisplayService {
  url = '';

  constructor() {}

  setWikiDisplay(item, wikis) {
    if (item[0].sitelinks !== undefined) {
      if (item[0].sitelinks.commonswiki !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.commonswiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'commonswiki|' + (obj.url || obj.title || 'commons');
        wikis.push(obj);
      }
      if (item[0].sitelinks.enwiki !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.enwiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'enwiki|' + (obj.url || obj.title || 'en');
        wikis.push(obj);
      }
      if (item[0].sitelinks.dewiki !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.dewiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'dewiki|' + (obj.url || obj.title || 'de');
        wikis.push(obj);
      }
      if (item[0].sitelinks.frwiki !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.frwiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'frwiki|' + (obj.url || obj.title || 'fr');
        wikis.push(obj);
      }
      if (item[0].sitelinks.itwiki !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.itwiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'itwiki|' + (obj.url || obj.title || 'it');
        wikis.push(obj);
      }
      if (item[0].sitelinks.nlwiki !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.nlwiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'nlwiki|' + (obj.url || obj.title || 'nl');
        wikis.push(obj);
      }
      if (item[0].sitelinks.eswiki !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.eswiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'eswiki|' + (obj.url || obj.title || 'es');
        wikis.push(obj);
      }
      if (item[0].sitelinks.wikidatawiki !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.wikidatawiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'wikidatawiki|' + (obj.url || obj.title || 'wikidata');
        wikis.push(obj);
      }
      if (item[0].sitelinks.enwikisource !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.enwikisource);
        this.url = obj.title.replace(/ /g, '_') + '_';
        this.url = 'https://en.wikisource.org/wiki/' + this.url;
        obj.url = this.url;
        obj.uniqueKey = 'enwikisource|' + (obj.url || obj.title || 'enwikisource');
        wikis.push(obj);
      }
      if (item[0].sitelinks.dewikisource !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.dewikisource);
        this.url = obj.title.replace(/ /g, '_') + '_';
        this.url = 'https://de.wikisource.org/wiki/' + this.url;
        obj.url = this.url;
        obj.uniqueKey = 'dewikisource|' + (obj.url || obj.title || 'dewikisource');
        wikis.push(obj);
      }
      if (item[0].sitelinks.frwikisource !== undefined) {
        const obj = Object.assign({}, item[0].sitelinks.frwikisource);
        this.url = obj.title.replace(/ /g, '_') + '_';
        this.url = 'https://fr.wikisource.org/wiki/' + this.url;
        obj.url = this.url;
        obj.uniqueKey = 'frwikisource|' + (obj.url || obj.title || 'frwikisource');
        wikis.push(obj);
      }
    }
    return wikis;
  }
}
