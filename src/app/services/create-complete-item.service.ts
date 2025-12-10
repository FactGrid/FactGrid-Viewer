import { Injectable, inject } from '@angular/core';
import { CreateItemToDisplayService } from './create-item-to-display.service';
import { ItemDisplayTuple } from './item-types';
import { ItemInfoService } from './item-info.service';
import { SetLanguageService } from './set-language.service';
import { SelectedLangService } from '../selected-lang.service';
import { ItemSparqlService } from './item-sparql.service';
import { map, takeWhile, tap, switchMap, take } from 'rxjs/operators';
import { Observable, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CreateCompleteItemService {
  private createItem = inject(CreateItemToDisplayService);
  private itemInfo = inject(ItemInfoService);
  private itemSparql = inject(ItemSparqlService);
  private setLanguage = inject(SetLanguageService);
  private lang = inject(SelectedLangService);

  completeItem(res: any[]): Observable<ItemDisplayTuple> {
    const itemArray = this.setLanguage.item(res, this.lang.selectedLang);
    const firstItem = itemArray[0];

    // CRITICAL: Wait for SPARQL data to be attached to the item BEFORE emitting
    // This ensures item.sparql is defined when the display component receives it
    return this.itemSparql.itemSparql(firstItem).pipe(
      switchMap((itemWithSparql) => {
        // Now create the display item with SPARQL data attached
        return this.createItem.createItemToDisplay(itemWithSparql, this.lang.selectedLang);
      }),
      tap((display) => {
        // Déclenche les listes sans bloquer l'émission principale
        this.itemInfo.infoListBuilding(firstItem).subscribe({
          next: (infoList) => {
            if (firstItem && infoList && !firstItem.infoList) {
              firstItem.infoList = infoList;
            }
          },
          error: (err) => console.error('Error while building infoList:', err),
        });
      })
    );
  }
}
