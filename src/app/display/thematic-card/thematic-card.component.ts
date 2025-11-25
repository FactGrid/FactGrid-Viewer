import { Component, Input, AfterContentInit, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-thematic-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './thematic-card.component.html',
  styleUrls: ['./thematic-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'thematic-card' },
  animations: [
    trigger('collapseExpand', [
      transition(':enter', [
        style({ height: 0, opacity: 0 }),
        animate('180ms ease', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1 }),
        animate('160ms ease', style({ height: 0, opacity: 0 })),
      ]),
    ]),
  ],
})
export class ThematicCardComponent implements AfterContentInit {
  @Input() title?: string;
  @Input() icon?: string;
  @Input() collapsible: boolean = false;
  @Input() startCollapsed: boolean = false;
  @Input() showHeader: boolean = false;
  @Input() loading: boolean = false;

  isCollapsed: boolean = false;
  hasProjectedHeader: boolean = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterContentInit(): void {
    // Détecter si un header personnalisé est projeté via attribut [card-header]
    this.hasProjectedHeader = !!this.el.nativeElement.querySelector('[card-header]');
    this.isCollapsed = this.collapsible && this.startCollapsed;
  }

  toggle(): void {
    if (!this.collapsible) return;
    this.isCollapsed = !this.isCollapsed;
  }
}
