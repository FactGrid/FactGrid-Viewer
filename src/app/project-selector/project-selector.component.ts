import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, Observable, map, startWith } from 'rxjs';
import { SelectedResearchFieldService, ResearchField } from '../services/selected-research-field.service';
import { RequestService } from '../services/request.service';
import { SelectedLangService } from '../selected-lang.service';

@Component({
  selector: 'app-project-selector',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './project-selector.component.html',
  styleUrls: ['./project-selector.component.scss']
})
export class ProjectSelectorComponent {
  private request = inject(RequestService);
  private selectedResearchFieldService = inject(SelectedResearchFieldService);
  private lang = inject(SelectedLangService);

  @Output() projectChanged = new EventEmitter<ResearchField>();

  searchResearchField = new FormControl<ResearchField | null>(null);
  researchFields: ResearchField[] = [];
  private researchFields$ = new BehaviorSubject<ResearchField[]>([]);
  filteredResearchFields$: Observable<ResearchField[]>;

  projectSearch: string = this.lang.getTranslation('projectSearch', this.lang.selectedLang);
  projectName: string = this.lang.getTranslation('projectName', this.lang.selectedLang);

  constructor() {
    const selected = this.selectedResearchFieldService.getSelectedResearchField();
    this.searchResearchField.setValue(selected);

    this.filteredResearchFields$ = this.searchResearchField.valueChanges.pipe(
      startWith(''),
      map(value => {
        const search = (typeof value === 'string' ? value : value?.name || '').toLowerCase();
        return this.researchFields.filter(f => f.name.toLowerCase().includes(search));
      })
    );

    this.loadProjects();
  }

  private getResearchFieldQuery(lang: string): string {
    return `https://database.factgrid.de/sparql?query=SELECT ?item ?itemLabel ?itemDescription  
    WHERE {
      SERVICE wikibase:label { bd:serviceParam wikibase:language "${lang},en". }
      ?item wdt:P2 wd:Q11295.
    }`;
  }

  private loadProjects(): void {
    this.request.getList(this.getResearchFieldQuery(this.lang.selectedLang))
      .pipe(
        map(res => this.listFromSparql(res)),
        map(res => [
          { name: '-', id: '-', description: '' },
          ...res.results.bindings.map(b => ({
            name: b.itemLabel.value,
            id: b.item.id,
            description: b.itemDescription?.value ?? ''
          }))
        ])
      )
      .subscribe(projects => {
        projects.sort((a, b) => a.name.localeCompare(b.name));
        this.researchFields = projects;
        this.researchFields$.next(projects);
      });
  }

  listFromSparql(res: any) {
    if (res && res.results) {
      for (let i = 0; i < res.results.bindings.length; i++) {
        res.results.bindings[i]['item'].id = res.results.bindings[i]['item'].value.replace(
          'https://database.factgrid.de/entity/', ''
        );
      }
    }
    return res;
  }

  displayResearchField(researchField: ResearchField | null): string {
    return researchField && researchField.name ? researchField.name : '-';
  }

  onProjectSelected(field: ResearchField): void {
    this.selectedResearchFieldService.setSelectedResearchField(field);
    this.projectChanged.emit(field);
  }

  clearSelection(): void {
    const field: ResearchField = { id: 'all', name: 'all', description: '' };
    this.selectedResearchFieldService.setSelectedResearchField(field);
    this.searchResearchField.setValue(field);
    this.projectChanged.emit(field);
  }
}
