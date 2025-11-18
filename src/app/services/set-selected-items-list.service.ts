import { Injectable } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class SetSelectedItemsListService {

  constructor() { }

  addToSelectedItemsList(item: any) {
    if (!item || !item.id) {
      return;
    }
    const u = { value: { id: item.id }, label: item.label };
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



