import {
  Component,
  Input,
  AfterContentInit,
  ElementRef,
  ViewEncapsulation,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-thematic-card',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './thematic-card.component.html',
  styleUrls: ['./thematic-card.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'thematic-card',
    '[class.thematic-card--compact]': 'compact',
    '[class.thematic-card--flush]': 'flush',
    '[class.thematic-card--image-only]': 'imageOnly',
  },
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
export class ThematicCardComponent implements AfterContentInit, OnChanges {
  @Input() title?: string;
  @Input() icon?: string;
  @Input() collapsible: boolean = false;
  @Input() startCollapsed: boolean = false;
  // Optional key that can be changed by parent on navigation to signal the
  // card instance that it should re-initialize its collapsed state. Useful
  // when the host re-uses the same ThematicCard instance for different
  // items so previous user toggles don't leak into a newly-loaded item.
  @Input() resetKey?: string | number | null;
  @Input() showHeader: boolean = false;
  @Input() loading: boolean = false;

  // New: accept a compact UI shape (DisplayItem) or the older tuple/enriched shapes
  // so the component can derive a title or show image-related behaviour when an
  // item is provided by parent components.
  @Input() item?: import('../../services/item-types').DisplayItem | import('../../services/item-types').ItemDisplayTuple | import('../../services/item-types').EnrichedItem;

  isCollapsed: boolean = false;
  hasProjectedHeader: boolean = false;
  @Input() compact: boolean = false;
  @Input() flush: boolean = false;
  @Input() imageOnly: boolean = false;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterContentInit(): void {
    // Détecter si un header personnalisé est projeté via attribut [card-header]
    this.hasProjectedHeader = !!this.el.nativeElement.querySelector('[card-header]');
    // initialize collapsed state based on inputs
    this.isCollapsed = this.collapsible && !!this.startCollapsed;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When the parent provides a new startCollapsed value (e.g. when navigating to a
    // different item), reset the collapsed state to match it. This prevents previous
    // user toggles from leaking into the next item when the host component reuses
    // the same ThematicCard instance.
    if (changes['startCollapsed'] || changes['collapsible'] || changes['resetKey']) {
      this.isCollapsed = this.collapsible && !!this.startCollapsed;
    }
    // If the content may change, re-check for projected header
    if (changes['title']) {
      try {
        this.hasProjectedHeader = !!this.el.nativeElement.querySelector('[card-header]');
      } catch {}
    }

    // If an item input is provided and no explicit title prop set by host, try to
    // derive a sensible header title from the item (prefer compact DisplayItem.label
    // else fallback to enriched entity labels/ids).
    if (changes['item'] && !this.title) {
      try {
        // support both tuple and compact shapes
        const itm = changes['item'].currentValue as any;
        let displayCandidate: any = undefined;
        if (Array.isArray(itm)) {
          // ItemDisplayTuple: last optional entry may be a compact DisplayItem
          if (itm.length >= 5 && itm[4]) displayCandidate = itm[4];
          else displayCandidate = itm[0];
        } else {
          displayCandidate = itm;
        }

        // prefer label properties used by the UI
        this.title = displayCandidate?.label || displayCandidate?.title || displayCandidate?.id || this.title;
      } catch {}
    }
  }

  toggle(): void {
    if (!this.collapsible) return;
    this.isCollapsed = !this.isCollapsed;
  }
}
