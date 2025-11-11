import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { UnitPipe } from '../../unit.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sources-display',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, RouterLink, UnitPipe, MatTooltipModule],
  templateUrl: './sources-display.component.html',
  styleUrl: './sources-display.component.scss'
})

export class SourcesDisplayComponent {

  @Input() sourcesList ;
  @Input() sources;

  openReferences = new Set<string>();

  ngOninit() {
    console.log('Sources List:', this.sourcesList);
  }

  toggleReferences(key: string) {
    if (this.openReferences.has(key)) {
      this.openReferences.delete(key);
    } else {
      this.openReferences.add(key);
    }
  }

  openImage(image){ //handling click for picture (open in new tab) 
    window.open(image);}

}
