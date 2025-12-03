import { Injectable, inject } from '@angular/core';
import { DetailsService } from './details.service';

@Injectable({
  providedIn: 'root',
})
export class SetItemToDisplayService {
  private details = inject(DetailsService);

  setItemToDisplay(u) {
    let values: any[] = Object.values(u.claims);
    let mainsnaks = [];
    let mainsnaks2 = [];

    for (const val of values) {
      // mainsnaks
      for (let i = 0; i < val.length; i++) {
        if (val[0].mainsnak === undefined) continue;
        mainsnaks.push(val[i].mainsnak);
      }
    }
    for (const val of mainsnaks) {
      // array of objects {P:Q}
      if (val.datavalue.value.id === undefined) continue;
      mainsnaks2.push('{' + val.property + ':' + val.datavalue.value.id + '}');
    }

    return mainsnaks2;
  }

  addDetails(properties, claims) {
    for (let i = 0; i < properties.length; i++) {
      claims[i].label = properties[i].label;
    }
    return claims;
  }
}
