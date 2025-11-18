import { Component, Input, ViewEncapsulation } from '@angular/core';
import { UnitPipe } from '../../unit.pipe';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-generic-list-display',
  templateUrl: './generic-list-display.component.html',
  styleUrls: ['./generic-list-display.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, UnitPipe, MatIconModule, MatButtonModule, MatTooltipModule, RouterModule]
})
export class GenericListDisplayComponent {
  @Input() title: string;
  @Input() items: any[];
  
  openReferences = new Set<string>();
  
  toggleReferences(key: string): void {
    if (this.openReferences.has(key)) {
      this.openReferences.delete(key);
    } else {
      this.openReferences.add(key);
    }
  }
  
  openImage(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
