import { Component, Input, OnChanges, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, SimpleChanges, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button'
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule} from '@angular/material/form-field';
import { RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { SelectedLangService } from '../../selected-lang.service';
import { ArrayToCsvService} from '../../services/array-to-csv.service';
import { ScrollingModule } from '@angular/cdk/scrolling';


@Component({
    selector: 'app-sparql0-display',
    templateUrl: 'sparql0-display.component.html',
    styleUrls: ['sparql0-display.component.scss'],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [MatCardModule, NgClass, RouterLink, MatIconModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, ScrollingModule]
})
export class Sparql0DisplayComponent implements OnChanges, OnDestroy {
  private lang = inject(SelectedLangService);
  private csv = inject(ArrayToCsvService);

 
  @Input() sparqlSubject;
  @Input() sparqlData;

  list:any[] = [];
  isList:boolean = false;
  isSearch:boolean = false;
  subTitle:string = "";
  instancesListTitle_50 = "Instances (limit: 50):";
  subclassesListTitle = "Subclasses:";
  isWorks:boolean=false ;
  query:string;
  listWithoutDuplicate:any[];
  rowHeight:number = 48; // hauteur d'une ligne
  maxViewportHeight:number = 400; // plafond pour les grandes listes

  getViewportHeightPx(length:number):number {
    // Ajoute un léger padding (+4) et limite à maxViewportHeight
    return Math.min(this.maxViewportHeight, Math.max(this.rowHeight, length * this.rowHeight + 4));
  }

  ngOnChanges(changes: SimpleChanges): void {

    // LOG pour debug affichage
    if (changes.sparqlData && changes.sparqlData.currentValue) {
      console.log('sparql0-display', changes.sparqlData.currentValue);
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

    // Ajout : gestion de sparqlSubject
    if (changes.sparqlSubject && changes.sparqlSubject.currentValue) {
      this.subTitle = this.sparqlSubject;
      if (this.subTitle == "Q945280" || this.subTitle == "Q960698") {  //FactGrid superclass
        this.isWorks = true;
        this.subTitle = this.lang.getTranslation('subclassesListTitle', this.lang.selectedLang);
      } else {
        this.subTitle = "";
        this.list = [];
      }
    }

  }

  // Méthode trackByFn pour virtual scroll (clé unique même en cas de doublon)
  trackByFn(index: number, item: any): any {
    return item && item.item && item.item.id ? item.item.id + '_' + index : index;
  }

  // Correction : déplacer la logique de changes.sparqlSubject dans ngOnChanges
  // (à placer à la fin de ngOnChanges, après le if sur sparqlData)

  applyFilter(event) {
    this.query = event.target.value.trim().toLowerCase();
    this.list = this.filterItem(this.listWithoutDuplicate, this.query)   ;
    }

  filterItem(arr:any[], query) { 
    return arr.filter((el) => el.itemText.toLowerCase().includes(this.query.toLowerCase()))
    }

   onClick(query){ //handling click for downlooding the filtered data
      let u= query;
       u = this.databaseToDownload(query);
      let v= this.csv.arrayToCsv(u);
       this.csv.downloadBlob(v, "factGrid", "text/csv;charset=utf-8;")
    }


   databaseToDownload(data){
      let dataToDownload:any[][] = [ ["item.id","item.label","item.description"] ];
      for (let i=0; i<data.length; i++){ dataToDownload[i+1] = [data[i].item.id, data[i].itemLabel.value, data[i].itemDescription.value] } 
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
   



