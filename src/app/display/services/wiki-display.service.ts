import { Injectable } from '@angular/core';
import type { ItemDisplayTuple } from '../../services/item-types';
import type { EnrichedItemTuple } from './display-item.utils';
import { getEntity } from './display-item.utils';
import type { Entity } from '../../interfaces/claims';

@Injectable({
  providedIn: 'root',
})
export class WikiDisplayService {
  url = '';

  constructor() {}

  setWikiDisplay(item: ItemDisplayTuple | EnrichedItemTuple, wikis: any[]) {
    const entity = getEntity(item) as Entity | undefined;
    if (entity?.sitelinks !== undefined) {
      if (entity.sitelinks.commonswiki !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.commonswiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'commonswiki|' + (obj.url || obj.title || 'commons');
        wikis.push(obj);
      }
      if (entity.sitelinks.enwiki !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.enwiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'enwiki|' + (obj.url || obj.title || 'en');
        wikis.push(obj);
      }
      if (entity.sitelinks.dewiki !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.dewiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'dewiki|' + (obj.url || obj.title || 'de');
        wikis.push(obj);
      }
      if (entity.sitelinks.frwiki !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.frwiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'frwiki|' + (obj.url || obj.title || 'fr');
        wikis.push(obj);
      }
      if (entity.sitelinks.itwiki !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.itwiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'itwiki|' + (obj.url || obj.title || 'it');
        wikis.push(obj);
      }
      if (entity.sitelinks.nlwiki !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.nlwiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'nlwiki|' + (obj.url || obj.title || 'nl');
        wikis.push(obj);
      }
      if (entity.sitelinks.eswiki !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.eswiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'eswiki|' + (obj.url || obj.title || 'es');
        wikis.push(obj);
      }
      if (entity.sitelinks.wikidatawiki !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.wikidatawiki);
        obj.url = obj.url || '';
        obj.uniqueKey = 'wikidatawiki|' + (obj.url || obj.title || 'wikidata');
        wikis.push(obj);
      }
      if (entity.sitelinks.enwikisource !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.enwikisource);
        this.url = obj.title.replace(/ /g, '_') + '_';
        this.url = 'https://en.wikisource.org/wiki/' + this.url;
        obj.url = this.url;
        obj.uniqueKey = 'enwikisource|' + (obj.url || obj.title || 'enwikisource');
        wikis.push(obj);
      }
      if (entity.sitelinks.dewikisource !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.dewikisource);
        this.url = obj.title.replace(/ /g, '_') + '_';
        this.url = 'https://de.wikisource.org/wiki/' + this.url;
        obj.url = this.url;
        obj.uniqueKey = 'dewikisource|' + (obj.url || obj.title || 'dewikisource');
        wikis.push(obj);
      }
      if (entity.sitelinks.frwikisource !== undefined) {
        const obj = Object.assign({}, entity.sitelinks.frwikisource);
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
