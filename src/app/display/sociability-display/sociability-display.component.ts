import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { UnitPipe } from '../../unit.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sociability-display',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, RouterLink, UnitPipe, MatTooltipModule],
  templateUrl: './sociability-display.component.html',
  styleUrl: './sociability-display.component.scss'
})
export class SociabilityDisplayComponent {

@Input() sociabilityAndCulture;
@Input() sociability;

openReferences = new Set<string>();

toggleReferences(key: string) {
  if (this.openReferences.has(key)) {
    this.openReferences.delete(key);
  } else {
    this.openReferences.add(key);
  }
}

openImage(image){ //handling click for picture (open in new tab) 
  window.open(image);
}

}
