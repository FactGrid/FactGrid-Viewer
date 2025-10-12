import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { UnitPipe } from '../../unit.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-header-display',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, RouterLink, UnitPipe, MatTooltipModule],
  templateUrl: './header-display.component.html',
  styleUrl: './header-display.component.scss'
})
export class HeaderDisplayComponent {

  @Input() headerDetail;

  // Optimized headerDetail for display in the template
  headerDetailOptimized: any[] = [];

  ngOnChanges() {
    if (this.headerDetail) {
      this.headerDetailOptimized = this.transformHeaderDetail(this.headerDetail);
    }
  }

  // Used for Angular's trackBy in @for loops
  trackById(index: number, item: any) {
    return item.id;
  }

  showReferences = false; // state for references panel

  toggleReferences() {
    this.showReferences = !this.showReferences;
  }

  /**
   * Transforms the raw headerDetail structure into an optimized array for display.
   * Each property object contains id, label, description, and a claims array.
   */
  transformHeaderDetail(rawHeaderDetail: any[]): any[] {
    return rawHeaderDetail.map((claimsArr: any) => {
      // Les propriétés id, label, description sont directement sur l'objet claimsArr
      // Les claims individuels sont dans le tableau claimsArr lui-même
      const claims = claimsArr.filter((obj: any) => obj?.mainsnak);
      
      return {
        id: claimsArr.id || '',
        label: claimsArr.label || claimsArr.id || '', // Use the label from the array properties
        description: claimsArr.description || '',
        claims: Array.isArray(claims) ? claims : []
      };
    });
  }

}
