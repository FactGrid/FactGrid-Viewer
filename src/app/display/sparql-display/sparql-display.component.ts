import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  SimpleChanges,
  inject,
  TemplateRef,
  ChangeDetectorRef,
  signal,
  computed,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterLink } from '@angular/router';
import { CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SparqlDisplayService, SparqlDisplayType } from '../services/sparql-display.service';

@Component({
  selector: 'app-sparql-display',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    NgClass,
    RouterLink,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    ScrollingModule,
    NgTemplateOutlet,
  ],
  templateUrl: './sparql-display.component.html',
  styleUrls: ['./sparql-display.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SparqlDisplayComponent implements OnChanges, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  constructor() {}
  @Input() sparqlType: SparqlDisplayType = 'sparql0';
  @Input() sparqlSubject: string;
  private _sparqlData: any[];
  @Input() 
  set sparqlData(value: any[]) {
    this._sparqlData = value;
    if (value && value.length > 0) {
      this.listWithoutDuplicateSignal.set(value);
      this.listSignal.set(value);
    } else {
      this.listSignal.set([]);
      this.listWithoutDuplicateSignal.set([]);
    }
    // Trigger change detection for OnPush strategy
    this.cdr.markForCheck();
  }
  get sparqlData(): any[] {
    return this._sparqlData;
  }
  @Input() langService: any; // doit être passé depuis le parent
  // Optionnel: si le parent fournit déjà un titre, on peut l'utiliser
  @Input() parentTitle?: string;
  @Input() customRowTemplate?: TemplateRef<any>; // pour ultra-flexibilité

  public listSignal = signal<any[]>([]);
  private listWithoutDuplicateSignal = signal<any[]>([]);
  // list is now signal-only via `listSignal`
  readonly isList = computed(() => this.listSignal().length > 0);
  readonly isSearch = computed(() => this.listSignal().length > 15);
  // title derived as a computed signal (maintains previous behavior)
  readonly subTitle = computed(() =>
    this.parentTitle
      ? this.parentTitle
      : this.sparqlDisplayService.getTitle(
          this.sparqlType,
          this.sparqlSubject,
          this.langService,
          this.listSignal()
        )
  );
  isWorks = computed(() => !!this.subTitle());
  private querySignal = signal('');
  get query(): string {
    return this.querySignal();
  }
  set query(v: string) {
    this.querySignal.set(v);
  }
  get listWithoutDuplicate(): any[] {
    return this.listWithoutDuplicateSignal();
  }
  set listWithoutDuplicate(v: any[]) {
    this.listWithoutDuplicateSignal.set(v ?? []);
  }
  rowHeight: number = 48;
  maxViewportHeight: number = 400;

  private sparqlDisplayService = inject(SparqlDisplayService);

  getViewportHeightPx(length: number): number {
    return Math.min(this.maxViewportHeight, Math.max(this.rowHeight, length * this.rowHeight + 4));
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.querySignal.set('');

    // Le setter sparqlData gère déjà la mise à jour des signals
    // On s'assure juste que le ChangeDetection est marqué
    this.cdr.markForCheck();
  }

  trackByFn(index: number, item: any): any {
    return item && item.item && item.item.id ? item.item.id + '_' + index : index;
  }

  applyFilter(event: any) {
    const q = (event?.target?.value || '').toString().trim().toLowerCase();
    this.querySignal.set(q);
    const filtered = this.listWithoutDuplicateSignal()
      .filter((el) => {
        const txt = (el?.itemText ?? el?.itemLabel?.value ?? '').toString().toLowerCase();
        return txt.includes(q);
      })
      .slice();
    this.listSignal.set(this.sparqlDisplayService.removeDuplicates(filtered));
  }

  onClickDownload(csvService: any) {
    if (!csvService) return;
    const dataToDownload = this.sparqlDisplayService.prepareCsv(this.sparqlType, this.listSignal());
    try {
      const csv = csvService.arrayToCsv(dataToDownload);
      csvService.downloadBlob(csv, 'factGrid', 'text/csv;charset=utf-8;');
    } catch (e) {
      // fail silently — download is optional
    }
  }

  ngOnDestroy(): void {
    this.sparqlSubject = '';
    this.sparqlData = [];
    this.listSignal.set([]);
    this.querySignal.set('');
  }
}
