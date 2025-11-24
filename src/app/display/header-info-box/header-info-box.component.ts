import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { GenericListDisplayComponent } from '../generic-list-display/generic-list-display.component';

@Component({
  selector: 'app-header-info-box',
  standalone: true,
  imports: [CommonModule, MatCardModule, GenericListDisplayComponent],
  templateUrl: './header-info-box.component.html',
  styleUrls: ['./header-info-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderInfoBoxComponent {
  @Input() items: any[] = [];
  @Input() title: string = '';
}
