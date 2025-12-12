import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { SparqlDisplayComponent } from './sparql-display.component';

describe('SparqlDisplayComponent', () => {
  let component: SparqlDisplayComponent;
  let fixture: ComponentFixture<SparqlDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SparqlDisplayComponent, NoopAnimationsModule, RouterTestingModule],
    }).compileComponents();
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
    const mockLangService: any = {
      selectedLang: 'fr',
      getTranslation: (k: string, l?: string) => (k === 'no_results' ? 'Aucun résultat' : ''),
    };
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
    component.sparqlData = component.listWithoutDuplicate.slice();
    component.ngOnChanges({} as any);

    component.applyFilter({ target: { value: 'foobar' } });
    expect((component as any).listSignal().length).toBe(1);
    expect((component as any).listSignal()[0].itemLabel.value).toBe('FooBar');
  });

  it('download button is disabled when csv service missing', () => {
    // initial state: undefined csv service and a list large enough to show search header
    (component as any).listSignal.set(new Array(16).fill({ item: { id: 'Q1' }, itemLabel: { value: 'A' } }));
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const button = el.querySelector('button[aria-label="Download CSV"]') as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.disabled).toBe(true);
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

  it('renders label, description and year in dedicated blocks', { skip: true }, () => {
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
    const label = el.querySelector('.typo-item-label');
    const description = el.querySelector('.typo-item-desc');
    const year = el.querySelector('.sparql-year');

    expect(label?.textContent?.trim()).toBe('Label line');
    expect(description).toBeTruthy();
    expect(description?.textContent?.trim()).toContain('Description line');
    expect(year?.textContent).toContain('1812');
  });

  it('shows fetch button for address placeholder and emits event on click', () => {
    component.sparqlSubject = 'Q16200';
    component.sparqlData = [
      {
        item: { id: 'address:Q1' },
        itemLabel: { value: '48.8566, 2.3522' },
      },
    ];
    component.ngOnChanges({} as any);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.address-fetch-btn') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(false);

    let received: string | null = null;
    (component.fetchAddress as any).subscribe((id: string) => (received = id));
    btn.click();
    fixture.detectChanges();
    expect(received).toBe('address:Q1');
    expect(component.isFetching('address:Q1')).toBe(true);

    // clear fetching
    component.setFetching('address:Q1', false);
    expect(component.isFetching('address:Q1')).toBe(false);
  });
});

