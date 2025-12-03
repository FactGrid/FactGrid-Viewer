import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { SparqlDisplayComponent } from './sparql-display.component';

describe('SparqlDisplayComponent', () => {
  let component: SparqlDisplayComponent;
  let fixture: ComponentFixture<SparqlDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SparqlDisplayComponent, NoopAnimationsModule, RouterTestingModule] }).compileComponents();
    fixture = TestBed.createComponent(SparqlDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders empty state when no rows', () => {
    component.sparqlData = [];
    component.ngOnChanges({} as any);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('No results');
  });

  it('renders translated empty state when langService provided', () => {
    const mockLangService: any = { selectedLang: 'fr', getTranslation: (k: string, l?: string) => (k === 'no_results' ? 'Aucun résultat' : '') };
    component.langService = mockLangService;
    component.sparqlData = [];
    component.ngOnChanges({} as any);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Aucun résultat');
  });

  it('applyFilter is safe when itemText missing and searches itemLabel', () => {
    component.listWithoutDuplicate = [
      { itemLabel: { value: 'FooBar' }, item: { id: 'Q1' } },
      { itemText: 'baz', item: { id: 'Q2' } },
    ];
    component.list = component.listWithoutDuplicate.slice();

    component.applyFilter({ target: { value: 'foobar' } });
    expect(component.list.length).toBe(1);
    expect(component.list[0].itemLabel.value).toBe('FooBar');
  });

  it('download button is disabled when csv service missing', () => {
    // initial state: undefined csv service
    component.list = [];
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const button = el.querySelector('button[aria-label="Download CSV"]') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.disabled).toBeTrue();
  });

  it('renders items as visual cards when sparqlData has entries', () => {
    component.sparqlData = [
      { item: { id: 'Q1' }, itemLabel: { value: 'Item A' }, itemText: 'Item A' },
      { item: { id: 'Q2' }, itemLabel: { value: 'Item B' }, itemText: 'Item B' },
    ];
    component.ngOnChanges({} as any);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const cards = el.querySelectorAll('.sparql-card');
    expect(cards.length).toBeGreaterThan(0);
    // The first card should contain the item label
    expect(cards[0].textContent).toContain('Item A');
  });

  it('shows a temporary debug panel with count and sample ids when data present', () => {
    component.sparqlData = [
      { item: { id: 'Q1' }, itemLabel: { value: 'Item A' }, itemText: 'Item A' },
      { item: { id: 'Q2' }, itemLabel: { value: 'Item B' }, itemText: 'Item B' },
    ];
    component.ngOnChanges({} as any);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('DEBUG — list length:');
    expect(el.textContent).toContain('Q1');
    expect(el.textContent).toContain('Q2');
  });

  it('renders label, description and year in dedicated blocks', () => {
    component.sparqlData = [
      {
        item: { id: 'Q123' },
        itemLabel: { value: 'Label line' },
        itemDescription: { value: 'Description line' },
        year: { value: '1812' },
      },
    ];
    component.ngOnChanges({} as any);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const label = el.querySelector('.sparql-label');
    const description = el.querySelector('.sparql-description');
    const year = el.querySelector('.sparql-year');

    expect(label?.textContent?.trim()).toBe('Label line');
    expect(description?.textContent?.trim()).toBe('Description line, 1812');
    expect(year?.textContent).toContain('1812');
  });
});
