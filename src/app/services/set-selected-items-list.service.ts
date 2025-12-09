import { Injectable } from '@angular/core';
import type { ItemDisplayTuple, DisplayItem } from './item-types';

@Injectable({
  providedIn: 'root',
})
export class SetSelectedItemsListService {
  constructor() {}

  addToSelectedItemsList(item: any | ItemDisplayTuple | DisplayItem) {
    // item can be either the enriched entity object, the older tuple shape
    // (array where [0] is the enriched entity) or the compact DisplayItem used
    // on the UI. Normalize to the base entity.
    const entity = Array.isArray(item) ? item[0] : item;
    if (!entity || !entity.id) {
      return;
    }
    const u = { value: { id: entity.id }, label: (entity.label as string) ?? '' };
    let selectedItemsList: any[] = JSON.parse(localStorage.getItem('selectedItems')) || [];
    // remove duplicates
    for (let i = 0; i < selectedItemsList.length; i++) {
      if (selectedItemsList[i] && selectedItemsList[i].value?.id === u.value.id) {
        selectedItemsList.splice(i, 1);
        break;
      }
    }
    selectedItemsList.unshift(u);
    if (selectedItemsList.length > 50) {
      selectedItemsList.pop();
    }
    localStorage.setItem('selectedItems', JSON.stringify(selectedItemsList));
    return localStorage;
  }
}
