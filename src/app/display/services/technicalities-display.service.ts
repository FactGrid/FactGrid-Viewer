import { Injectable } from '@angular/core';
import type { ItemDisplayTuple } from '../../services/item-types';
import type { EnrichedItemTuple } from './display-item.utils';
import { getEntity, getRemainingProps, removeRemainingProp } from './display-item.utils';
import type { Entity, ClaimArray } from '../../interfaces/claims';

@Injectable({
  providedIn: 'root',
})
export class TechnicalitiesDisplayService {
  constructor() {}

  setTechnicalitiesDisplay(item: ItemDisplayTuple | EnrichedItemTuple, technicalities: any[]) {
    // technicalities
    const entity = getEntity(item) as Entity | undefined;
    // P994: vocabulary PhiloBiblon-terms
    if ((entity?.claims as any)?.P994 !== undefined) {
      if (Array.isArray(getRemainingProps(item))) removeRemainingProp(item, 'P994');
      technicalities.push((entity.claims as any).P994 as ClaimArray);
    }

    // P1132: FactGrid keyword
    if ((entity?.claims as any)?.P1132 !== undefined) {
      if (Array.isArray(getRemainingProps(item))) removeRemainingProp(item, 'P1132');
      technicalities.push((entity.claims as any).P1132 as ClaimArray);
    }
  }
}
