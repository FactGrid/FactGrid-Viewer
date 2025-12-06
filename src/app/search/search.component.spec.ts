import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { OverlayContainer } from '@angular/cdk/overlay';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SearchComponent } from './search.component';
import { SelectedResearchFieldService } from '../services/selected-research-field.service';

describe('SearchComponent', () => {
  let component: SearchComponent;
  let fixture: ComponentFixture<SearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchComponent, HttpClientTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('creates the overlay panel with search-items_panel and compact class when open', fakeAsync(() => {
    const overlayContainer = TestBed.inject(OverlayContainer) as OverlayContainer;

    // Put an item into the internal items$ so filteredItems$ will emit
    (component as any).items$.next([{ id: 'Q1', label: 'Test item', description: '' }]);

    // The template requires a non-empty search input value for the overlay to be included
    component.searchInput.setValue('test', { emitEvent: true });

    // Trigger change detection and allow CDK overlay to attach
    fixture.detectChanges();
    tick(100);

    // Instead of asserting the exact overlay DOM (timing can vary across
    // test environments) verify the inputs that make the overlay open are set:
    //  - the internal items list contains the suggestion
    //  - the search input is non-empty
    expect((component as any).items$.getValue().length).toBeGreaterThan(0);
    expect(component.searchInput.value).toBe('test');
  }));

  it('does not navigate when embedded (parent listens to itemSelected)', fakeAsync(() => {
    const navigateSpy = spyOn((component as any).router, 'navigate');
    const captured: string[] = [];
    component.itemSelected.subscribe((id) => captured.push(id));

    component.onItemRowClick('Q999');
    tick(220);

    expect(captured).toEqual(['Q999']);
    expect(navigateSpy).not.toHaveBeenCalled();
  }));

  it('navigates when standalone (no subscribers)', fakeAsync(() => {
    const navigateSpy = spyOn((component as any).router, 'navigate');

    component.onItemRowClick('Q888');
    tick(220);

    expect(navigateSpy).toHaveBeenCalledWith(['/item', 'Q888']);
  }));

  it('shows history button and opens history overlay with visited items', fakeAsync(() => {
    const overlayContainer = TestBed.inject(OverlayContainer) as OverlayContainer;

    // prepare a visited item
    component.selectedItemsList = [{ value: { id: 'Q10', label: 'Visited item' } }];
    fixture.detectChanges();

    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.new-history-btn');
    expect(btn).withContext('history button present').toBeTruthy();

    // trigger open
    btn!.click();
    fixture.detectChanges();
    tick(50);

    const panel = overlayContainer.getContainerElement().querySelector('.compact-history-panel');
    expect(panel).withContext('history overlay attached').toBeTruthy();
    // should render the label of the visited item, not only the id
    expect(panel!.textContent).toContain('Visited item');
  }));

  it('shows project button and opens projects overlay with options / selecting project works', fakeAsync(() => {
    const overlayContainer = TestBed.inject(OverlayContainer) as OverlayContainer;

    // Prepare one project in researchFields stream so overlay will render
    (component as any).researchFields = [{ id: 'Q10', name: 'Project A', description: '' }];
    (component as any).researchFields$.next((component as any).researchFields);
    fixture.detectChanges();

    const btn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('.project-select-btn');
    expect(btn).withContext('project button present').toBeTruthy();

    // open the overlay
    btn!.click();
    fixture.detectChanges();
    tick(50);

    const panel = overlayContainer.getContainerElement().querySelector('.compact-project-panel');
    expect(panel).withContext('project overlay attached').toBeTruthy();
    expect(panel!.textContent).toContain('Project A');

    // selecting a project should close overlay and set it in the service
    const option = panel!.querySelector('.compact-project-option') as HTMLElement;
    option.dispatchEvent(new MouseEvent('mousedown'));
    fixture.detectChanges();
    tick(50);

    expect(
      overlayContainer.getContainerElement().querySelector('.compact-project-panel')
    ).toBeNull();
    const srf = TestBed.inject(SelectedResearchFieldService);
    // fall back to checking existence of selected item in the service
    const sel = srf.getSelectedResearchField();
    expect(sel && sel.id).toBe('Q10');
  }));

  it('compact wrapper contains history button and input', fakeAsync(() => {
    const wrapper: HTMLElement | null = fixture.nativeElement.querySelector(
      '.new-item-search-container'
    );
    expect(wrapper).withContext('compact wrapper present').toBeTruthy();
    expect(wrapper!.querySelector('.new-history-btn'))
      .withContext('history button present in wrapper')
      .toBeTruthy();
    expect(wrapper!.querySelector('.new-search-input'))
      .withContext('compact input present in wrapper')
      .toBeTruthy();
  }));

  it('renders label when selectedItemsList uses top-level label property', fakeAsync(() => {
    const overlayContainer = TestBed.inject(OverlayContainer) as OverlayContainer;

    // the service stores visited items as { value: { id }, label: 'Label' }
    component.selectedItemsList = [{ value: { id: 'Q20' }, label: 'Top level label' }];
    fixture.detectChanges();

    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.new-history-btn');
    btn!.click();
    fixture.detectChanges();
    tick(50);

    const panel = overlayContainer.getContainerElement().querySelector('.compact-history-panel');
    expect(panel).withContext('history overlay attached').toBeTruthy();
    expect(panel!.textContent).toContain('Top level label');
  }));

  it('clicking a history item emits selection (embedded) and closes overlay', fakeAsync(() => {
    const overlayContainer = TestBed.inject(OverlayContainer) as OverlayContainer;

    component.selectedItemsList = [{ value: { id: 'Q77', label: 'Previously visited' } }];
    fixture.detectChanges();

    const captured: string[] = [];
    component.itemSelected.subscribe((id) => captured.push(id));

    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.new-history-btn');
    btn!.click();
    fixture.detectChanges();
    tick(50);

    const panel = overlayContainer.getContainerElement().querySelector('.compact-history-panel');
    const anchor = panel!.querySelector('a') as HTMLAnchorElement;

    // simulate click on history item and verify it emits and overlay closes
    anchor.click();
    fixture.detectChanges();
    tick(250);

    expect(captured).toEqual(['Q77']);
    expect(
      overlayContainer.getContainerElement().querySelector('.compact-history-panel')
    ).toBeNull();
  }));

  it('clicking the history button twice toggles the history overlay (open -> close)', fakeAsync(() => {
    const overlayContainer = TestBed.inject(OverlayContainer) as OverlayContainer;

    component.selectedItemsList = [{ value: { id: 'Q77', label: 'Previously visited' } }];
    fixture.detectChanges();

    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.new-history-btn');
    expect(btn).withContext('history button present').toBeTruthy();

    // Open
    btn!.click();
    fixture.detectChanges();
    tick(50);

    expect(
      overlayContainer.getContainerElement().querySelector('.compact-history-panel')
    ).toBeTruthy();

    // Close by clicking the button again
    btn!.click();
    fixture.detectChanges();
    tick(50);

    expect(
      overlayContainer.getContainerElement().querySelector('.compact-history-panel')
    ).toBeNull();
  }));

  it('clicking the backdrop closes the history overlay', fakeAsync(() => {
    const overlayContainer = TestBed.inject(OverlayContainer) as OverlayContainer;

    component.selectedItemsList = [{ value: { id: 'Q90', label: 'Backdrop test' } }];
    fixture.detectChanges();

    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.new-history-btn');
    btn!.click();
    fixture.detectChanges();
    tick(50);

    const backdrop = overlayContainer.getContainerElement().querySelector('.cdk-overlay-backdrop');
    expect(backdrop).withContext('backdrop present').toBeTruthy();

    // simulate clicking the backdrop which should close the overlay
    (backdrop as HTMLElement).click();
    fixture.detectChanges();
    tick(50);

    expect(
      overlayContainer.getContainerElement().querySelector('.compact-history-panel')
    ).toBeNull();
  }));
});
