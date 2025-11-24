import { Injectable, inject } from '@angular/core';
import { CreateItemToDisplayService } from './create-item-to-display.service';
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

  completeItem(res) {
    const itemArray = this.setLanguage.item(res, this.lang.selectedLang);
    const firstItem = itemArray[0];

    // Lancement SPARQL en tâche de fond (pas besoin d'attendre)
    this.itemSparql.itemSparql(firstItem).subscribe({
      error: (err) => console.error('Error while populating SPARQL data:', err),
    });

    // Rendu immédiat de l'item d'affichage, récupération des listes en arrière-plan
    return this.createItem.createItemToDisplay(firstItem, this.lang.selectedLang).pipe(
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
