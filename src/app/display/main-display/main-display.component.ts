import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { UnitPipe } from '../../unit.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';

// Importez vos pipes personnalisés
import { ObjectKeysPipe, FilterNotP499Pipe, OrderByP499Pipe } from '../../main-display.pipes';

@Component({
  selector: 'app-main-display',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    RouterLink,
    RouterOutlet,
    UnitPipe,
    MatTooltipModule,
    ObjectKeysPipe,
    FilterNotP499Pipe,
    OrderByP499Pipe
  ],
  templateUrl: './main-display.component.html',
  styleUrl: './main-display.component.scss'
})
export class MainDisplayComponent {
  @Input() mainList;
  @Input() mainTitle;
  @Input() list;

  openReferences = new Set<string>();

  // TrackBy pour la liste principale (P)
  trackByMain(index: number, item: any): any {
    // Utilise id+label+length pour garantir unicité même si id dupliqué
    return item && item.id ? `${item.id}_${item.label || ''}_${item.length || 0}_${index}` : index;
  }

  // TrackBy pour les sous-éléments (M)
  trackByM(index: number, item: any): any {
    // Utilise id+label+datatype+valeur pour garantir unicité même si id dupliqué
    if (item && item.mainsnak) {
      const id = item.mainsnak.datavalue?.value?.id || '';
      const label = item.mainsnak.label || '';
      const datatype = item.mainsnak.datatype || '';
      const value = item.mainsnak.datavalue?.value?.value || item.mainsnak.datavalue?.value || '';
      return `${id}_${label}_${datatype}_${JSON.stringify(value)}_${index}`;
    }
    return index;
  }

  ngOnChanges() {
    if (this.mainList) {
      console.log(this.mainList)
    }
  }

  toggleReferences(key: string) {
    if (this.openReferences.has(key)) {
      this.openReferences.delete(key);
    } else {
      this.openReferences.add(key);
    }
  }

  openImage(image) {
    window.open(image);
  }
}
