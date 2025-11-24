import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  SimpleChanges,
  inject,
  TemplateRef,
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
  constructor() {}
  @Input() sparqlType: SparqlDisplayType = 'sparql0';
  @Input() sparqlSubject: string;
  @Input() sparqlData: any[];
  @Input() langService: any; // doit être passé depuis le parent
  // Optionnel: si le parent fournit déjà un titre, on peut l'utiliser
  @Input() parentTitle?: string;
  @Input() customRowTemplate?: TemplateRef<any>; // pour ultra-flexibilité

  list: any[] = [];
  isList: boolean = false;
  isSearch: boolean = false;
  private subTitleSubject = new BehaviorSubject<string>('SPARQL 1');
  subTitle$ = this.subTitleSubject.asObservable();
  isWorks: boolean = false;
  query: string = '';
  listWithoutDuplicate: any[] = [];
  rowHeight: number = 48;
  maxViewportHeight: number = 400;

  private sparqlDisplayService = inject(SparqlDisplayService);

  getViewportHeightPx(length: number): number {
    return Math.min(this.maxViewportHeight, Math.max(this.rowHeight, length * this.rowHeight + 4));
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.query = '';
    this.isWorks = false;
    this.isList = false;
    this.isSearch = false;

    // La liste est déjà transformée/dédupliquée côté parent
    if (this.sparqlData && this.sparqlData.length > 0) {
      this.isList = true;
      this.listWithoutDuplicate = this.sparqlData;
      this.list = this.sparqlData;
      if (this.list.length > 15) this.isSearch = true;
    } else {
      this.list = [];
    }

    // Titre dynamique: si le parent fournit un titre, on le privilégie, sinon on calcule ici.
    const newTitle = this.parentTitle
      ? this.parentTitle
      : this.sparqlDisplayService.getTitle(
          this.sparqlType,
          this.sparqlSubject,
          this.langService,
          this.list
        );
    this.subTitleSubject.next(newTitle);
    this.isWorks = !!newTitle;
  }

  trackByFn(index: number, item: any): any {
    return item && item.item && item.item.id ? item.item.id + '_' + index : index;
  }

  applyFilter(event: any) {
    this.query = event.target.value.trim().toLowerCase();
    this.list = this.sparqlDisplayService.removeDuplicates(
      this.listWithoutDuplicate.filter((el) => el.itemText.toLowerCase().includes(this.query))
    );
  }

  onClickDownload(csvService: any) {
    const dataToDownload = this.sparqlDisplayService.prepareCsv(this.sparqlType, this.list);
    const csv = csvService.arrayToCsv(dataToDownload);
    csvService.downloadBlob(csv, 'factGrid', 'text/csv;charset=utf-8;');
  }

  ngOnDestroy(): void {
    this.sparqlSubject = '';
    this.sparqlData = [];
    this.list = [];
    this.query = '';
    this.isSearch = false;
    this.isList = false;
  }
}
