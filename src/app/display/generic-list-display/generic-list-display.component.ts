import { Component, Input, ViewEncapsulation, signal } from '@angular/core';
import { DisplayItem, ItemDisplayTuple, EnrichedItem } from '../../services/item-types';
import { UnitPipe } from '../../unit.pipe';
import { ProtectShortWordsPipe } from './protect-short-words.pipe';
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
  imports: [
    CommonModule,
    UnitPipe,
    ProtectShortWordsPipe,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    RouterModule,
  ],
})
export class GenericListDisplayComponent {
  @Input() title: string;

  // Accept either legacy raw shapes (any) or the newer compact UI-level DisplayItem
  // and the tuple/enriched shapes used by the display pipeline. Keep permissive to
  // remain backward compatible during the gradual migration.
  // single source of truth for items
  // signal-backed items so templates may react directly
  readonly itemsSignal = signal<Array<DisplayItem | ItemDisplayTuple | EnrichedItem | any>>(
    []
  );

  @Input()
  set items(
    v:
      | DisplayItem
      | ItemDisplayTuple
      | EnrichedItem
      | Array<DisplayItem | ItemDisplayTuple | EnrichedItem | any>
      | any
  ) {
    // Normalize to array so the template can always iterate safely and set signal
    const normalized = v === undefined || v === null ? [] : Array.isArray(v) ? (v as any[]) : [v];
    this.itemsSignal.set(normalized);
  }

  // track expanded reference blocks using a signal of Set
  openReferences = signal(new Set<string>());

  toggleReferences(key: string): void {
    this.openReferences.update((s) => {
      const next = new Set(s as Set<string>);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next as Set<string>;
    });
  }

  // Template helper so we don't call global Array.isArray from templates
  // (avoids runtime issues in some test environments)
  isArray(v: any): boolean {
    return Array.isArray(v);
  }

  openImage(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }
}
