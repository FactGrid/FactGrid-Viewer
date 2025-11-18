import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, Observable, map, startWith, combineLatest } from 'rxjs';
import { SlideUpAnimation } from './slide-up-animation';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDividerModule } from '@angular/material/divider';
import { FooterComponent } from './footer/footer.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RequestService } from './services/request.service';
import { SelectedResearchFieldService } from './services/selected-research-field.service';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { SelectedLangService } from './selected-lang.service';

export interface Lang {
  name: string;
  code: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [SlideUpAnimation],
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    RouterModule,
    FooterComponent,
    MatTooltipModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatDividerModule
  ]
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private request = inject(RequestService);
  private selectedResearchFieldService = inject(SelectedResearchFieldService);
  private lang = inject(SelectedLangService);

  langs: Lang[] = [
    { name: 'English', code: 'en' },
    { name: 'Deutsch', code: 'de' },
    { name: 'Français', code: 'fr' },
    { name: 'Español', code: 'es' },
    { name: '中文', code: 'zh' },
    { name: 'Italiano', code: 'it' },
    { name: 'Magyar', code: 'hu' },
    { name: 'Svenska', code: 'se' }
  ];

  specialPages = [
    { name: 'Harmonia Universalis', address: 'harmonia_universalis' },
    { name: 'Paris', address: 'paris' }
  ];

  researchFields: any[] = [];

  selectedLang: string = (localStorage['selectedLang'] === undefined) ? 'en' : localStorage['selectedLang'];
  selectedPage = (sessionStorage['selectedPage'] === undefined)
    ? JSON.stringify([{ name: 'FactGrid', address: '' }])
    : sessionStorage['selectedPage'];
  selectedItems: any[] = [];
  selectedParisItems: any[] = [];
  selectedResearchField: string = localStorage['selectedResearchField'];
  title = 'factgrid';
  subtitle: string;
  searchInput = new FormControl();
  public selectedItem: Observable<any>;
  searchToken: string = 'on';
  public isDown: boolean = true;
  u: string;
  labels;
  items = [];
  newItem;
  itemId: string;

  showResearchField = false;

  projectSearch: string = "Search a project";
  projectName: string = "Project name";

  constructor() { }

  ngOnInit(): void {
    if (localStorage['selectedLang'] === undefined) {
      localStorage.setItem('selectedLang', 'en');
    }
    if (localStorage['selectedItems'] === undefined) {
      localStorage.setItem('selectedItems', JSON.stringify([{ value: { id: 'Q152233' }, label: 'FactGrid' }]));
    }
    if (localStorage['selectedResearchField'] === undefined) {
      localStorage.setItem('selectedResearchField', 'all');
    }
    if (localStorage['selectedParisItems'] === undefined) {
      localStorage.setItem('selectedParisItems', JSON.stringify([{ value: { id: 'Q152233' }, label: 'FactGrid' }]));
    }

    this.projectSearch = this.lang.getTranslation('projectSearch', this.lang.selectedLang);
    this.projectName = this.lang.getTranslation('projectName', this.lang.selectedLang);

    this.selectedResearchFieldService.showResearchField$.subscribe(show => {
      this.showResearchField = show;
    })
  }

  langSetting(lang) {
    if (lang !== undefined) {
      this.selectedLang = lang.code;
    }
    localStorage['selectedLang'] = this.selectedLang;
    window.location.reload();
  }

  linking() {
    window.open('https://database.factgrid.de/wiki/Main_Page', '_blank');
  }

  toggleResearchField() {
    const current = this.selectedResearchFieldService.getShowResearchField();
    const next = !current;
    this.selectedResearchFieldService.setShowResearchField(next);
    this.showResearchField = next;
  }
}
