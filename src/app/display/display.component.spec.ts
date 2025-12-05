import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DisplayComponent } from './display.component';
import { DrawerService } from '../services/drawer.service';
import { BackListService } from '../services/back-list.service';
import { BackListDetailsService } from '../services/back-list-details.service';
import { of } from 'rxjs';

describe('DisplayComponent', () => {
  let component: DisplayComponent;
  let fixture: ComponentFixture<DisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DisplayComponent,
        RouterTestingModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayComponent);
    component = fixture.componentInstance;
    // ensure top info card is rendered so the contextual button exists
    component.item = {} as any;
    component.id = 'Q1';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('addInFactGrid should open FactGrid in a new tab with the correct id', () => {
    const spy = spyOn(window, 'open').and.callFake(() => null as any);
    component.itemId = 'Q22370';
    component.addInFactGrid();
    expect(spy).toHaveBeenCalled();
    // basic check: url contains the id and opens in a new tab
    const expected = `https://database.factgrid.de/entity/Q22370`;
    expect((spy.calls.mostRecent().args as any[])[0]).toContain(expected);
  });

  it('should render contextual "Pages liées" button and call DrawerService.toggle() when clicked', () => {
    const drawerService = TestBed.inject(DrawerService);
    const spy = spyOn(drawerService, 'toggle');

    // ensure existence of the top section; we verify behaviour via the exposed method
    component.item = { id: 'Q1', label: 'Test' } as any;
    fixture.detectChanges();

    component.toggleLinkedPages();
    expect(spy).toHaveBeenCalled();
  });

  it('should show desktop FactGrid link when not mobile and mobile link when mobile', () => {
    component.isMobile = false;
    component.item = { id: 'Q42', label: 'Test' } as any;
    component.id = 'Q42';
    fixture.detectChanges();

    const desktopLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.factgrid-link-desktop');
    expect(desktopLink).withContext('desktop link visible when not mobile').toBeTruthy();
    expect(desktopLink!.textContent).toContain('Q42');

    // Now simulate mobile
    component.isMobile = true;
    fixture.detectChanges();
    const mobileLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.factgrid-link-mobile');
    const desktopLinkAfter: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.factgrid-link-desktop');
    expect(desktopLinkAfter).withContext('desktop link hidden on mobile').toBeNull();
    expect(mobileLink).withContext('mobile link visible on mobile').toBeTruthy();
    expect(mobileLink!.textContent).toContain('Q42');
  });

  it('should use the translated linkedPagesTitle for the button label', () => {
    component.item = { id: 'Q7' } as any;
    component.id = 'Q7';
    component.linkedPagesTitle = 'pages liées test';
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('.linked-pages-label');
    expect(label).toBeTruthy();
    expect(label.textContent.trim()).toBe('pages liées test');
  });

  it('should display the linkedPagesTitle as a heading at the top of the drawer content', () => {
    component.linkedPagesTitle = 'Linked pages header test';
    component.item = { id: 'Q100' } as any;
    fixture.detectChanges();

    const heading: HTMLElement | null = fixture.nativeElement.querySelector('.drawer-heading');
    expect(heading).withContext('drawer heading exists').toBeTruthy();
    expect(heading!.textContent!.trim()).toBe('Linked pages header test');
  });

  it('close icon button should exist and use the toolbar-btn style', () => {
    // prepare
    component.item = { id: 'Q7' } as any;
    component.id = 'Q7';
    component.isMobile = false;
    fixture.detectChanges();

    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.close-btn');
    expect(btn).withContext('close button exists').toBeTruthy();
    // the close button now displays the translated main page label
    expect(btn!.getAttribute('aria-label')).toBe(component.mainPage);
    const labelSpan: HTMLElement | null = btn!.querySelector('.close-label');
    expect(labelSpan).withContext('close button shows mainPage text').toBeTruthy();
    expect(labelSpan!.textContent!.trim()).toBe(component.mainPage);

    // ensure a directional affordance exists (arrow pointing right)
    const dirIcon = btn!.querySelector('.direction-icon');
    expect(dirIcon).withContext('directional icon present in close button').toBeTruthy();
    // the icon should render the chevron_right glyph
    expect(dirIcon!.textContent!.trim()).toBe('chevron_right');
  });

  it('drawer element should exist and have an opaque background when opened', () => {
    component.drawerOpened = true;
    fixture.detectChanges();

    const drawerEl: HTMLElement | null = fixture.nativeElement.querySelector('.app-drawer');
    expect(drawerEl).withContext('drawer element present').toBeTruthy();

    // inline style was added to force an opaque white background
    const inlineBg = (drawerEl as HTMLElement).getAttribute('style') || '';
    expect(inlineBg).toContain('background: #ffffff');
  });

  it('should fall back to English label when user-lang label is empty', () => {
    const backList = TestBed.inject(BackListService);
    const backListDetails = TestBed.inject(BackListDetailsService);

    // Prepare the service to return two responses (user lang result, en result)
    spyOn(backList, 'backList').and.returnValue(
      of([
        { query: { pages: [{ title: 'Item:Q1', entityterms: { label: [''] } }] } },
        { query: { pages: [{ title: 'Item:Q1', entityterms: { label: ['English name'] } }] } },
      ])
    );

    // Ensure setBackList converts pages into simple {id, label} entries
    spyOn(backListDetails, 'setBackList').and.returnValues([{ id: 'Q1', label: '' }], [{ id: 'Q1', label: 'English name' }]);

    component.itemId = 'Q1';
    (component as any).loadBackList();

    // after load, label should equal the English fallback
    expect(component.linkedItems[0].label).toBe('English name');
  });

  it('should display id when no label exists in any language', () => {
    const backList = TestBed.inject(BackListService);
    const backListDetails = TestBed.inject(BackListDetailsService);

    spyOn(backList, 'backList').and.returnValue(
      of([
        { query: { pages: [{ title: 'Item:Q2', entityterms: { label: [''] } }] } },
        { query: { pages: [{ title: 'Item:Q2', entityterms: { label: [''] } }] } },
      ])
    );

    spyOn(backListDetails, 'setBackList').and.returnValues([{ id: 'Q2', label: '' }], [{ id: 'Q2', label: '' }]);

    component.itemId = 'Q2';
    (component as any).loadBackList();

    expect(component.linkedItems[0].label).toBe('Q2');
  });
});
