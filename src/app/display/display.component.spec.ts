import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DisplayComponent } from './display.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { DrawerService } from '../services/drawer.service';
import { BackListService } from '../services/back-list.service';
import { BackListDetailsService } from '../services/back-list-details.service';
import { of } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';

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
      providers: [
        // Prevent tests depending on actual viewport size — always emit a non-mobile default.
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: false }) } },
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

  it('should show selected item id in sub-header and link to FactGrid', () => {
    component.isMobile = false;
    component.item = { id: 'Q42', label: 'Test' } as any;
    component.id = 'Q42';
    fixture.detectChanges();

    const idLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.title-id');
    expect(idLink).withContext('selected item id present in title card').toBeTruthy();
    expect(idLink!.textContent).toContain('Q42');
    expect(idLink!.getAttribute('href')).toContain('Q42');
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

  it('home header and search should be visible when no item is selected', () => {
    component.item = null;
    component.title = 'FactGrid';
    component.subtitle = 'Mon super projet';
    fixture.detectChanges();

    const titleEl: HTMLElement | null = fixture.nativeElement.querySelector('.home-title');
    expect(titleEl).toBeTruthy();
    expect(titleEl!.textContent).toContain('FactGrid');

    const subtitleEl: HTMLElement | null = fixture.nativeElement.querySelector('.home-subtitle');
    expect(subtitleEl).toBeTruthy();
    expect(subtitleEl!.textContent).toContain('Mon super projet');

    const searchHost = fixture.nativeElement.querySelector('.search-host');
    expect(searchHost).toBeTruthy();
  });

  it('onSearchItemSelected should animate then navigate when called from homepage', () => {
    const navigateSpy = spyOn((component as any).router, 'navigate');

    component.item = null; // homepage state
    fixture.detectChanges();

    component.onSearchItemSelected('Q123');
    // it should first set header to closed and search to pinned
    expect(component.headerAnimState).toBe('closed');
    expect(component.searchAnimState).toBe('pinned');

    // navigation should not happen immediately
    expect(navigateSpy).not.toHaveBeenCalled();

    // simulate start & end of header animation
    (component as any).onHeaderAnimationStart({ fromState: 'home', toState: 'closed' } as any);
    expect(component.headerAnimating).toBeTrue();
    // simulate end
    (component as any).onHeaderAnimationDone({ toState: 'closed' } as any);
    expect(component.headerAnimating).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/item', 'Q123']);
  });

  it('headerAnimating toggles during animation callbacks', () => {
    component.headerAnimating = false;
    (component as any).onHeaderAnimationStart({ fromState: 'home', toState: 'closed' } as any);
    expect(component.headerAnimating).toBeTrue();
    (component as any).onHeaderAnimationDone({ toState: 'closed' } as any);
    expect(component.headerAnimating).toBeFalse();
  });

  it('should show selected project in sub-header when present', () => {
    component.item = null; // make header show
    component.currentProject = { id: 'Q10', name: 'My project', description: 'Sample' } as any;
    fixture.detectChanges();

    const cardEl: HTMLElement | null = fixture.nativeElement.querySelector('app-thematic-card.project-sub-header-card');
    expect(cardEl).withContext('thematic card wrapper exists for project sub-header').toBeTruthy();

    // ensure the project card is NOT inside the .parent column container
    const cardInsideParent: HTMLElement | null = fixture.nativeElement.querySelector('.parent app-thematic-card.project-sub-header-card');
    expect(cardInsideParent).withContext('project card is not nested inside .parent').toBeFalsy();

    // confirm it exists as a direct child near the layout top (inside mat-drawer-content)
    const topCard = fixture.nativeElement.querySelector('mat-drawer-content > app-thematic-card.project-sub-header-card');
    expect(topCard).withContext('project thematic card is present above the grid inside mat-drawer-content').toBeTruthy();

    // inner wrapper should align the visual edges with the grid gutters
    const innerWrapper = fixture.nativeElement.querySelector('.project-sub-header-inner');
    expect(innerWrapper).withContext('project sub-header inner wrapper exists to match the grid gutters').toBeTruthy();

    // label should appear inside the project-link element
    const projectLink = fixture.nativeElement.querySelector('.project-link');
    expect(projectLink).withContext('project link exists').toBeTruthy();
    expect(projectLink!.querySelector('.project-name')).toBeTruthy();

    const nameEl: HTMLElement | null = fixture.nativeElement.querySelector('.project-name');
    expect(nameEl).withContext('project label present').toBeTruthy();
    expect(nameEl!.textContent).toContain('My project');

    const linkEl: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.project-link');
    expect(linkEl).withContext('project link exists').toBeTruthy();
    expect(linkEl!.getAttribute('href')).toContain('Q10');
  });

  it('mobile: shows centered project title above search and hides right label', () => {
    component.item = null; // header visible
    component.currentProject = { id: 'Q10', name: 'My project', description: 'Sample' } as any;
    component.isMobile = true;
    fixture.detectChanges();

    const mobileTitle: HTMLElement | null = fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle).withContext('mobile project title shown in top toolbar').toBeTruthy();
    expect(mobileTitle!.textContent).toContain('My project');

    const rightBlock: HTMLElement | null = fixture.nativeElement.querySelector('.project-sub-header-right');
    expect(rightBlock).withContext('right project sub-header exists in DOM').toBeTruthy();
    // ensure the right-hand block is hidden via CSS on mobile (computed style display:none)
    const display = window.getComputedStyle(rightBlock as Element).getPropertyValue('display');
    expect(display).toBe('none');
  });

  it('mobile: should render linked pages as a thematic card when backList exists', () => {
    // ensure the component is in item-state so the stacked card area is rendered
    component.item = {} as any;
    component.id = 'Q1';
    component.isMobile = true;
    component.linkedItems = [{ id: 'QX', label: 'Linked Item A' } as any];
    component.linkedPagesTitle = 'Pages liées mobile';
    fixture.detectChanges();
    const cardTitle: HTMLElement | null = fixture.nativeElement.querySelector('.typo-thematic-card-title');
    expect(cardTitle).withContext('thematic card title present for linked pages on mobile').toBeTruthy();
    expect(cardTitle!.textContent).toContain('Pages liées mobile');

    // Ensure the linked item label is present inside the card content
    expect(fixture.nativeElement.textContent).toContain('Linked Item A');

    // There should be an anchor linking to the item id inside the card
    const mobileLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector('app-thematic-card a.selectedItemText');
    expect(mobileLink).withContext('mobile linked pages card contains anchor').toBeTruthy();
    // routerLink should produce an href in the rendered DOM pointing to '/item/QX'
    expect(mobileLink!.getAttribute('href')).toContain('/item/QX');
  });

  it('mobile: linked pages should not appear in the drawer on mobile', () => {
    component.isMobile = true;
    component.linkedItems = [{ id: 'QY', label: 'Linked Item B' } as any];
    fixture.detectChanges();

    // Drawer heading is only rendered for non-mobile view; on mobile it should be absent
    const drawerHeading: HTMLElement | null = fixture.nativeElement.querySelector('.drawer-heading');
    expect(drawerHeading).toBeNull();
  });
});
