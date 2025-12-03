import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { NgClass } from '@angular/common';
import { SelectedLangService } from '../../selected-lang.service';
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  selector: 'app-item-info',
  templateUrl: './item-info.component.html',
  styleUrls: ['./item-info.component.scss'],
  standalone: true,
  imports: [CommonModule, NgClass, MatCardModule, RouterLink, MatIconModule, ScrollingModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemInfoComponent implements OnChanges {
  private lang = inject(SelectedLangService);
  private cdr = inject(ChangeDetectorRef);

  @Input() infoList;

  selectedLang: string =
    localStorage['selectedLang'] === undefined ? 'en' : localStorage['selectedLang'];
  list1: any[] = [];
  list2: any[] = [];
  list3: any[] = [];
  list4: any[] = [];
  technicalities: any[] = [];
  infoProperties: any[] = [];
  list1Number;
  list2Number;
  list3Number;
  list4Number;
  technicalitiesNumber;
  isList1: boolean = false;
  isList2: boolean = false;
  isList3: boolean = false;
  isList4: boolean = false;
  isInfo: boolean = false;
  instancesListTitle = 'instances of the Q-item:';
  subclassesListTitle = 'subclasses of the Q-item:';
  subInfoTitle: string = 'Information on the Q-item';
  classesListTitle: string = 'classes of the Q-item:';
  natureOfListTitle: string = 'instance of';
  prefix1: string = 'class hierarchy: class depending on ';
  prefix2: string = 'class hierarchy: class with ';
  suffix1: string = 'classes:';

  // Virtual scroll
  readonly virtualThreshold = 20;
  readonly rowHeight = 36;

  // Track function: returns a stable, unique key for an item.
  // Treat empty strings as missing values (avoid returning '')
  trackListKey = (index: number, L: any) => {
    const id = L?.item?.id ?? L?.item?.value ?? L?.mainsnak?.datavalue?.value?.id;
    if (id) return id;
    const label = (L?.itemLabel?.value ?? L?.itemLabel ?? '').toString().trim();
    if (label) return label;
    // fallback: use index (unique per iteration) — stable only for append-only lists
    return index;
  };

  // Track function for technicalities inner statements
  trackTechKey = (index: number, val: any) => {
    const dataValue = val?.mainsnak?.datavalue?.value;
    if (dataValue !== undefined && dataValue !== null) {
      if (typeof dataValue === 'object' && dataValue.id) return dataValue.id;
      if (typeof dataValue === 'string' && dataValue.toString().trim() !== '') return dataValue.toString().trim();
    }
    const label = (val?.mainsnak?.label ?? val?.itemLabel ?? '').toString().trim();
    if (label) return label;
    return index;
  };

  // Track function for technicalities outer list (tech)
  trackTechPropKey = (index: number, tech: any) => {
    const id = tech?.propertyId ?? tech?.property ?? '';
    if (id && (typeof id !== 'string' || id.toString().trim() !== '')) return id;
    const label = (tech?.propertyLabel ?? tech?.label ?? '').toString().trim();
    if (label) return label;
    return index;
  };

  getViewportPx(len: number): string {
    const max = 320; // px
    const h = Math.min(max, Math.max(this.rowHeight * Math.min(len, 50), this.rowHeight * 6));
    return `${h}px`;
  }

  openImage(image) {
    //handling click for picture (open in new tab)
    window.open(image);
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Traductions avec fallback si la clé est introuvable
    const tr = (key: string, fallback: string) => {
      const v = this.lang.getTranslation(key, this.lang.selectedLang);
      return v === undefined || v === null || v === '' || v === key ? fallback : v;
    };

    this.instancesListTitle = tr('instancesListTitle', 'instances of the Q-item:');
    this.subclassesListTitle = tr('subclassesListTitle', 'subclasses of the Q-item:');
    this.classesListTitle = tr('classesListTitle', 'classes of the Q-item:');
    this.natureOfListTitle = tr('natureOfListTitle', 'instance of');
    this.subInfoTitle = tr('subInfoTitle', 'Information on the Q-item');
    this.prefix1 = tr('classesPrefix1', 'class hierarchy: class depending on');
    this.prefix2 = tr('classesPrefix2', 'class hierarchy: class with');
    this.suffix1 = tr('classesSuffix', 'classes:');

    // Utilisation des listes depuis infoList
    this.list1 = this.infoList?.subclassesList ?? [];
    this.list2 = this.infoList?.instancesList ?? [];
    this.list3 = this.infoList?.classesList ?? [];
    this.list4 = this.infoList?.natureOfList ?? [];
    this.technicalities = this.infoList?.technicalities ?? [];
    this.infoProperties = this.infoList?.infoProperties ?? [];

    this.list1Number = this.list1.length;
    this.list2Number = this.list2.length;
    this.list3Number = this.list3.length;
    this.list4Number = this.list4.length;
    this.technicalitiesNumber = this.technicalities.length;

    this.isInfo =
      this.list1Number +
        this.list2Number +
        this.list3Number +
        this.list4Number +
        this.technicalitiesNumber >
      0;

    this.isList1 = this.list1.length > 0;
    this.isList2 = this.list2.length > 0;
    this.isList3 = this.list3.length > 0;
    this.isList4 = this.list4.length > 0;
    // ensure OnPush components detect these changes
    this.cdr.markForCheck();
  }
}
