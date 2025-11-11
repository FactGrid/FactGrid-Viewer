import { Component, Input, OnChanges, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, SimpleChanges, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button'
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { SelectedLangService } from '../../selected-lang.service';
import { ArrayToCsvService } from '../../services/array-to-csv.service';


@Component({
  selector: 'app-sparql2-display',
  standalone: true,
  imports: [MatCardModule, NgClass, RouterLink, MatIconModule, MatFormFieldModule, MatInputModule, MatButtonModule, FormsModule, ScrollingModule],
  templateUrl: './sparql2-display.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './sparql2-display.component.scss'
})
export class Sparql2DisplayComponent implements OnChanges, OnDestroy {
  // Méthode trackByFn pour virtual scroll (clé unique même en cas de doublon)
  trackByFn(index: number, item: any): any {
    return item && item.item && item.item.id ? item.item.id + '_' + index : index;
  }
  private lang = inject(SelectedLangService);
  private csv = inject(ArrayToCsvService);


  @Input() sparqlSubject;
  @Input() sparqlData;

  list: any[] = [];
  isList: boolean = false;
  isSearch: boolean = false;
  subTitle: string = "";
  isWorks: boolean = false;
  patientsTitle: string = "Patients";
  listTitle: string = "List";
  query: string;
  listWithoutDuplicate: any[];
  rowHeight:number = 48;
  maxViewportHeight:number = 400;
  getViewportHeightPx(length:number):number {
    return Math.min(this.maxViewportHeight, Math.max(this.rowHeight, length * this.rowHeight + 4));
  }

  ngOnChanges(changes: SimpleChanges): void {

    // LOG pour debug affichage
    if (changes.sparqlData && changes.sparqlData.currentValue) {
      console.log('sparql2-display', changes.sparqlData.currentValue);
    }

    this.query = "";
    this.isWorks = false;
    this.isList = false;
    this.isSearch = false;

    if (changes.sparqlData && changes.sparqlData.currentValue) {
      if (this.sparqlData[0] !== undefined) { this.isList = true };

      changes.sparqlData.currentValue.forEach(function (el) {
        if (el.itemDescription === undefined) { el.itemText = el.itemLabel.value }
        else el.itemText = el.itemLabel.value + el.itemDescription.value
      })

      this.listWithoutDuplicate = [...new Map(changes.sparqlData.currentValue.reverse().map(v => [JSON.stringify([v.itemText]), v])).values()].reverse();  // remove the duplicates 

      this.list = this.listWithoutDuplicate;

      if (this.list.length > 15) this.isSearch = true;

    }

    if (changes.sparqlSubject && changes.sparqlSubject.currentValue) {
      this.subTitle = this.sparqlSubject;

      if (this.subTitle == "Q140759") {  //patients
        this.isWorks = true;
        this.subTitle = this.lang.getTranslation('patientsTitle', this.lang.selectedLang);
      }
      else {
        this.subTitle = "";
        this.list = [];
      }
    }
  }

  applyFilter(event) {
    this.query = event.target.value.trim().toLowerCase();
    this.list = this.filterItem(this.listWithoutDuplicate, this.query);
  }

  filterItem(arr: any[], query) {
    return arr.filter((el) => el.itemText.toLowerCase().includes(this.query.toLowerCase()))
  }

  onClick(query) { //handling click for downlooding the filtered data
    let u = query;
    u = this.databaseToDownload(query);
    let v = this.csv.arrayToCsv(u);
    this.csv.downloadBlob(v, "factGrid", "text/csv;charset=utf-8;")
  }

  databaseToDownload(data) {
    let dataToDownload: any[][] = [["item.id", "item.label", "item.description"]];
    for (let i = 0; i < data.length; i++) { dataToDownload[i + 1] = [data[i].item.value, data[i].itemLabel.value, data[i].itemDescription.value] }
    return dataToDownload
  }

  ngOnDestroy(): void {
    this.sparqlSubject = "";
    this.sparqlData = "";
    this.list = [];
    this.query = "";
    this.isSearch = false;
    this.isList = false;
  }

} 
