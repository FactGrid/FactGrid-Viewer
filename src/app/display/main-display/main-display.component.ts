import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { UnitPipe } from '../../unit.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-main-display',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatCardModule, RouterLink, RouterOutlet, UnitPipe, MatTooltipModule],
  templateUrl: './main-display.component.html',
  styleUrl: './main-display.component.scss'
})
export class MainDisplayComponent {

  @Input() mainList;
  @Input() mainTitle;
  @Input() list;

  

 
  showReferences = false; // état du volet

  toggleReferences() {
    this.showReferences = !this.showReferences;
  }


 openImage(image){ //handling click for picture (open in new tab) 
    window.open(image);
  }

}
