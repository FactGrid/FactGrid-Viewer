import { Injectable, inject } from '@angular/core';
import { SetTimeService } from './set-time.service';
import { FactgridSubtitlesService } from './factgrid-subtitles.service';
import { TypologyService } from './typology.service';
import { ItemInfoService } from './item-info.service';
import { LongestWordService } from './longest-word.service';
import { Entity, ClaimArray } from '../interfaces/claims';

@Injectable({
  providedIn: 'root',
})
export class ItemDetailsService {
  private setDate = inject(SetTimeService);
  private factgrid = inject(FactgridSubtitlesService);
  private typology = inject(TypologyService);
  private itemInfo = inject(ItemInfoService);
  private longestLength = inject(LongestWordService);

  private baseWikimediaURL = 'http://commons.wikimedia.org/wiki/Special:FilePath/';

  qualifiers2: any[];

  addLongestWordLength(re: Entity) {
    re.longestWordLength = this.longestLength.findLongestWord(re.label);
  }

  addClaimItemDetails(items: Entity[], re: Entity, itemProperties: string[], lang: string) {
    for (let i = 0; i < itemProperties.length; i++) {
      let timeOrder = 23000000;
      // Vérifie que la propriété existe et est un tableau non vide
      const claimsForProp = re.claims[itemProperties[i]] as ClaimArray | undefined;
      if (!claimsForProp || !Array.isArray(claimsForProp) || claimsForProp.length === 0) {
        continue;
      }
      claimsForProp.datatype = claimsForProp[0].mainsnak.datatype;
      for (let j = 0; j < claimsForProp.length; j++) {
        const statement = claimsForProp[j];
        statement.mainsnak.timeOrder = timeOrder;
        if (statement.mainsnak.datatype === 'time') {
          let value = (statement.mainsnak.datavalue.value as any).time;
          value = value.substring(0, value.length - 10);
          (statement.mainsnak.datavalue.value as any).date = this.setDate.setDate(value, lang);
        }
        if (
          itemProperties[i] === 'P189' ||
          itemProperties[i] === 'P556' ||
          itemProperties[i] === 'P181' ||
          itemProperties[i] === 'P1267'
        ) {
          statement.picture = this.baseWikimediaURL + (statement.mainsnak.datavalue.value as any);
        }
        if (itemProperties[i] === 'P188') {
          let u = (statement.mainsnak.datavalue.value as any).substring(0, 5);
          if (u !== 'http:') {
            statement.picture = (statement.mainsnak.datavalue.value as any);
          }
        }
        if (itemProperties[i] === 'P320') {
          statement.mainsnak.datatype = 'sparql';
          //   if(re.claims[itemProperties[i]][j].mainsnak.datavalue.value.includes("item")==false){ re.claims[itemProperties[i]][j].mainsnak.datavalue.value="undefined"};
        }

        this.factgrid.setSubtitle1(re, itemProperties[i], lang); // to set a subtitle

        if (
          re.claims[itemProperties[i]][j].mainsnak.datatype === 'wikibase-item' ||
          re.claims[itemProperties[i]][j].mainsnak.datatype === 'wikibase-property'
        ) {
          let number: number = j;
          this.factgrid.setSubtitle2(re, itemProperties[i], number, lang);
          for (let k = 0; k < items.length; k++) {
            const dv = statement.mainsnak.datavalue?.value as any;
            if (dv && dv.id === items[k].id) {
              // Enrichir l'objet value
              dv.label = items[k].label;
              if (items[k].description !== undefined) dv.description = items[k].description;
              dv.separator = items[k].description ? ', ' : '';
              if (items[k].aliases !== undefined) dv.aliases = items[k].aliases;
            }
          }

          const value = statement.mainsnak.datavalue?.value as any;
          const mainsnak = statement.mainsnak;

          // Fallback: si le label est toujours manquant sur la valeur, on utilise l'id.
          if (value && value.id && !value.label) {
            value.label = value.id;
          }

          // Assurer la redondance : copier le label de la valeur vers le mainsnak pour compatibilité
          if (value && value.label && !mainsnak.label) {
            mainsnak.label = value.label;
          }
        }
      }
    }
    return re;
  }

  /**
   * Enrichit chaque statement avec qualifiers2 (pour l'affichage)
   * et gère le tri chronologique via timeOrder si un qualifier de type "time" existe.
   */
  /**
   * Enrichit chaque statement avec qualifiers2 (pour l'affichage).
   * Pour chaque qualifier, ajoute dans display un objet enrichi (id, label, description, aliases...).
   * Gère aussi le tri chronologique via timeOrder si un qualifier de type "time" existe.
   */
  addQualifierItemDetails(items: Entity[], re: Entity, itemProperties: string[], lang: string) {
    for (const prop of itemProperties) {
      if (!re.claims[prop]) continue;
      const statements = re.claims[prop] as ClaimArray | undefined;
      if (!statements || !Array.isArray(statements)) continue;
      for (const statement of statements) {
        if (!statement.qualifiers || !statement.qualifiers2) continue;

        // Pour chaque propriété de qualifier
        for (const qualifier2 of statement.qualifiers2) {
          const qualifierProp = qualifier2.id;
          const qualifierValues = statement.qualifiers[qualifierProp];
          if (!Array.isArray(qualifierValues)) continue;

          // Préparation du display enrichi
          const display = [];

          for (const q of qualifierValues) {
            if (!q) continue;
            if (q.datatype === 'wikibase-item' && q.datavalue?.value) {
              const val = q.datavalue.value as any;
              const enriched = items.find((it) => it.id === val.id);
              // Substitution simple : label = label || id
              let label =
                enriched && enriched.label ? enriched.label : val.label ? val.label : val.id;
              display.push({
                id: val.id,
                label: label,
                description:
                  enriched && enriched.description ? enriched.description : val.description || '',
                aliases: enriched && enriched.aliases ? enriched.aliases : val.aliases || [],
                datatype: 'wikibase-item',
                separator: (enriched && enriched.description) || val.description ? ', ' : '',
              });
            } else if (q.datatype === 'commonsMedia' && q.datavalue?.value) {
              display.push({
                label: (q.datavalue.value as any).label || q.datavalue.value,
                description: (q.datavalue.value as any).description || '',
                aliases: (q.datavalue.value as any).aliases || [],
                datatype: 'commonsMedia',
              });
            } else if (q.datatype === 'external-id' && q.datavalue?.value) {
              display.push({
                value: q.datavalue.value,
                datatype: 'external-id',
              });
            } else if (q.datatype === 'time' && q.datavalue?.value) {
              let value = (q.datavalue.value as any).time;
              value = value.substring(0, value.length - 10);
              const date = this.setDate.setDate(value, lang);
              statement.mainsnak.timeOrder = value;
              let era = value.charAt(0);
              statement.mainsnak.timeOrder = Number(value.replace(/\-/g, '').replace(/\+/g, '').substring(0, 8));
              if (era !== '+') {
                statement.mainsnak.timeOrder = -Math.abs(statement.mainsnak.timeOrder);
              }
              display.push({
                value,
                date,
                datatype: 'time',
              });
            } else if (q.datatype === 'quantity' && q.datavalue?.value) {
              // Gestion du type quantity
              display.push({
                amount: (q.datavalue.value as any).amount,
                unit: (q.datavalue.value as any).unit,
                datatype: 'quantity',
              });
            } else if (q.datatype === 'string' && q.datavalue?.value) {
              display.push({
                string: q.datavalue.value,
                datatype: 'string',
              });
            } else if (q.datatype === 'monolingualtext' && q.datavalue?.value) {
              display.push({
                string: q.datavalue.value,
                datatype: 'monolingualtext',
              });
            } else if (q.datavalue?.value) {
              display.push({
                value: q.datavalue.value,
                datatype: q.datatype || 'unknown',
              });
            }
          }

          // Ajoute le display enrichi à l'objet de qualifiers2
          qualifier2.display = display;
        }

          // Si la propriété est "P2", on force timeOrder à "0"
        if (prop === 'P2') {
          statement.mainsnak.timeOrder = '0';
        }
      }

      // Tri chronologique des statements si un timeOrder a été trouvé
      const claims = re.claims[prop] as ClaimArray | undefined;
      if (claims && claims.length > 1 && claims[0].mainsnak.timeOrder !== undefined) {
        claims.sort((a, b) => {
          if (a.mainsnak.timeOrder < b.mainsnak.timeOrder) return -1;
          if (a.mainsnak.timeOrder > b.mainsnak.timeOrder) return 1;
          return 0;
        });
      }
    }
    return re;
  }

  addReferenceItemDetails(items: Entity[], re: Entity, itemProperties: string[], lang: string) {
    for (let i = 0; i < itemProperties.length; i++) {
      // Vérifie que la propriété existe et est un tableau non vide
      const claimsForProp = re.claims[itemProperties[i]] as ClaimArray | undefined;
      if (!claimsForProp || !Array.isArray(claimsForProp) || claimsForProp.length === 0) {
        continue;
      }
      for (let j = 0; j < claimsForProp.length; j++) {
        const statement = claimsForProp[j];
        if (statement.references === undefined) {
          continue;
        }
        for (let k = 0; k < statement.references.length; k++) {
          let props = Object.keys(statement.references[k].snaks);
          for (let l = 0; l < items.length; l++) {
            for (let a = 0; a < props.length; a++) {
              for (let b = 0; b < statement.references[k].snaks[props[a]].length; b++) {
                const refSnak = statement.references[k].snaks[props[a]][b];
                if (refSnak.datatype === 'time') {
                  let value = (refSnak.datavalue.value as any).time;
                  value = value.substring(0, value.length - 10);
                  (refSnak.datavalue.value as any).date = this.setDate.setDate(value, lang);
                }
                if (refSnak.datatype === 'external-id') {
                  this.setUrl(refSnak, props[a]);
                }
                if (refSnak.datatype !== 'wikibase-item') {
                  continue;
                }
                const dv = (refSnak.datavalue.value as any) || null;
                if (dv && dv.id === items[l].id) {
                  dv.label = items[l].label;
                  if (items[l].description !== undefined) dv.description = items[l].description;
                  dv.separator = items[l].description ? ', ' : '';
                  if (items[l].aliases !== undefined) dv.aliases = items[l].aliases;
                }
              }
            }
          }
        }
      }
    }
    return re;
  }

  addReference2ItemDetails(items: Entity[], re: Entity, itemProperties: string[]) {
    //add the items of the qualifiers to the array qualifiers

    for (let i = 0; i < itemProperties.length; i++) {
      const claimsForProp = re.claims[itemProperties[i]] as ClaimArray | undefined;
      if (!claimsForProp) continue;
      for (let j = 0; j < claimsForProp.length; j++) {
        if (re.claims[itemProperties[i]][j].references2 === undefined) {
          continue;
        }
        for (let k = 0; k < claimsForProp[j].references2.length; k++) {
          for (let l = 0; l < claimsForProp[j].references.length; l++) {
            let props = Object.keys(claimsForProp[j].references[l].snaks);
            let referencesArray = Object.values(claimsForProp[j].references[l].snaks);
            for (let m = 0; m < props.length; m++) {
              if (claimsForProp[j].references2[k][m] === undefined) {
                continue;
              }
              let display = [];
              for (
                let n = 0;
                n < claimsForProp[j].references[l].snaks[props[m]].length;
                n++
              ) {
                if (claimsForProp[j].references2[k][m].id === props[m]) {
                  const candidateSnak = claimsForProp[j].references[l].snaks[props[m]][n];
                  if (candidateSnak && candidateSnak.datavalue && candidateSnak.datavalue.value) {
                    if (candidateSnak.datatype === 'external-id') {
                      display.push(candidateSnak.datavalue);
                    } else if (candidateSnak.datatype === 'time') {
                      display.push((candidateSnak.datavalue.value as any).date);
                    } else {
                      display.push(candidateSnak.datavalue.value);
                    }
                  }
                  claimsForProp[j].references2[k][m].display = display;
                }
              }
            }
          }
        }
      }
    }
    // console.log(re);
    return re;
  }

  addSitelinksDetails(re: Entity) {
    if (re.sitelinks.commonswiki !== undefined) {
      let url = re.sitelinks.commonswiki.title.replace(' ', '_');
      re.sitelinks.commonswiki.url = 'https://commons.wikimedia.org/wiki/' + url;
    }
    if (re.sitelinks.enwiki !== undefined) {
      let url = re.sitelinks.enwiki.title.replace(' ', '_');
      re.sitelinks.enwiki.url = 'https://en.wikipedia.org/wiki/' + url;
    }
    if (re.sitelinks.dewiki !== undefined) {
      let url = re.sitelinks.dewiki.title.replace(' ', '_');
      re.sitelinks.dewiki.url = 'https://de.wikipedia.org/wiki/' + url;
    }
    if (re.sitelinks.frwiki !== undefined) {
      let url = re.sitelinks.frwiki.title.replace(' ', '_');
      re.sitelinks.frwiki.url = 'https://fr.wikipedia.org/wiki/' + url;
    }
    if (re.sitelinks.wikidatawiki !== undefined) {
      re.sitelinks.wikidatawiki.url =
        'https://www.wikidata.org/wiki/' + re.sitelinks.wikidatawiki.title;
    }
  }

  addItemInfo(re: Entity) {
    // re.info = this.itemInfo.infoListBuilding(re)
  }

  setUrl(u, p) {
    if (u.externalLink !== undefined) {
      u.datavalue.link = u.externalLink.replace('$1', u.datavalue.value);
    }

    if (p === 'P76') {
      // id GND
      u.datavalue.link = 'https://explore.gnd.network/gnd/' + u.datavalue.value;
    }
    if (p === 'P368') {
      // id VD16 +
      u.datavalue.link = 'http://gateway-bayern.de/VD16+' + u.datavalue.value;
    }
    if (p === 'P369') {
      //id VD17
      u.datavalue.link =
        'https://kxp.k10plus.de/DB=1.28/CMD?ACT=SRCHA&IKT=8079&TRM=%27:' +
        u.datavalue.value +
        '%27';
    }
    if (p === 'P370') {
      //id VD18
      u.datavalue.link =
        'https://kxp.k10plus.de/DB=1.65/CMD?ACT=SRCHA&IKT=8080&TRM=VD18' + u.datavalue.value;
    }
    if (p === 'P650') {
      // INE ID (Spain)
      let province = u.datavalue.value.slice(0, 2);
      let municipality = u.datavalue.value.slice(2, 5);
      let parish = u.datavalue.value.slice(5, 7);
      let es = u.datavalue.value.slice(7, 9);
      u.datavalue.link = u.externalLink.replace('$1', province);
      u.datavalue.link = u.datavalue.link.replace('$2', municipality);
      u.datavalue.link = u.datavalue.link.replace('$3', parish);
      u.datavalue.link = u.datavalue.link.replace('$4', es);
      u.datavalue.link = u.datavalue.link.replace('$5', '00');
    }
    if (p === 'P882') {
      // Deusches Rechtswörterbuch
      u.datavalue.link =
        'https://drw-www.adw.uni-heidelberg.de/drw-cgi/zeige?index=lemmata&term=' +
        u.datavalue.value +
        '&darstellung=V';
    }
  }
}
