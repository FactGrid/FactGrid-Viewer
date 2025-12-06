import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DisplayComponent } from './display.component';
import { BreakpointObserver } from '@angular/cdk/layout';
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

  it('should render linked pages as a thematic card when item and linkedItems exist', () => {
    component.item = { id: 'Q1', label: 'Test' } as any;
    component.id = 'Q1';
    component.linkedItems = [{ id: 'QZ', label: 'Linked Z' } as any];
    component.linkedPagesTitle = 'Linked pages now';
    fixture.detectChanges();

    const cardTitle = fixture.nativeElement.querySelector('.typo-thematic-card-title');
    expect(cardTitle).toBeTruthy();
    expect(cardTitle!.textContent).toContain('Linked pages now');
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

  it('should show linkedPagesTitle on the linked pages card when linkedItems are present', () => {
    component.item = { id: 'Q7' } as any;
    component.id = 'Q7';
    component.linkedPagesTitle = 'pages liées test';
    component.linkedItems = [{ id: 'Q1', label: 'L1' } as any];
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector('.typo-thematic-card-title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('pages liées test');
  });

  // drawer no longer used: we render linked pages as thematic card inside the grid

  it('close icon / drawer button should not exist (drawer removed)', () => {
    // prepare
    component.item = { id: 'Q7' } as any;
    component.id = 'Q7';
    component.isMobile = false;
    fixture.detectChanges();

    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.close-btn');
    expect(btn).withContext('close button should not be present since drawer removed').toBeNull();
  });

  it('drawer UI removed — app-drawer should not be present', () => {
    component.item = { id: 'Q1' } as any;
    fixture.detectChanges();

    const drawerEl: HTMLElement | null = fixture.nativeElement.querySelector('.app-drawer');
    expect(drawerEl).withContext('drawer element should not be present after refactor').toBeNull();
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
    spyOn(backListDetails, 'setBackList').and.returnValues(
      [{ id: 'Q1', label: '' }],
      [{ id: 'Q1', label: 'English name' }]
    );

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

    spyOn(backListDetails, 'setBackList').and.returnValues(
      [{ id: 'Q2', label: '' }],
      [{ id: 'Q2', label: '' }]
    );

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

  it('shows the selected project label above the search when present', () => {
    component.item = null; // make header show
    component.currentProject = { id: 'Q10', name: 'My project', description: 'Sample' } as any;
    fixture.detectChanges();

    // Since the project sub-header card is removed, we should see the project title above the search
    const mobileTitle: HTMLElement | null =
      fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle).withContext('project title shown in top toolbar').toBeTruthy();
    expect(mobileTitle!.textContent).toContain('My project');

    // project-sub-header-card should not be present
    const cardEl: HTMLElement | null = fixture.nativeElement.querySelector(
      'app-thematic-card.project-sub-header-card'
    );
    expect(cardEl).withContext('project sub-header card should not be present').toBeNull();
  });

  it('mobile: shows centered project title above search and hides right label', () => {
    component.item = null; // header visible
    component.currentProject = { id: 'Q10', name: 'My project', description: 'Sample' } as any;
    component.isMobile = true;
    fixture.detectChanges();

    const mobileTitle: HTMLElement | null =
      fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle).withContext('mobile project title shown in top toolbar').toBeTruthy();
    expect(mobileTitle!.textContent).toContain('My project');

    // on mobile the right-hand project block is not rendered (we show a compact title above the search)
    const rightBlock: HTMLElement | null = fixture.nativeElement.querySelector(
      '.project-sub-header-right'
    );
    expect(rightBlock)
      .withContext('right project sub-header should be absent on mobile')
      .toBeNull();

    // on mobile the project sub-header card should not be rendered (we show a centered title instead)
    const projectCardMobile: HTMLElement | null = fixture.nativeElement.querySelector(
      'app-thematic-card.project-sub-header-card'
    );
    expect(projectCardMobile)
      .withContext('project sub-header card should be absent on mobile')
      .toBeNull();
  });

  it("doesn't render project title when project is the '-' placeholder (desktop)", () => {
    component.item = null; // header visible
    component.currentProject = { id: '-', name: '-' } as any;
    fixture.detectChanges();

    const mobileTitle: HTMLElement | null =
      fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle)
      .withContext("project title placeholder '-' should not be rendered")
      .toBeNull();
  });

  it("doesn't render project title when project is the '-' placeholder (mobile)", () => {
    component.item = null; // header visible
    component.currentProject = { id: '-', name: '-' } as any;
    component.isMobile = true;
    fixture.detectChanges();

    const mobileTitle: HTMLElement | null =
      fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle)
      .withContext("mobile project title placeholder '-' should not be rendered")
      .toBeNull();
  });

  it("doesn't render project title when selected research field is the default 'all'", () => {
    component.item = null; // header visible
    component.currentProject = { id: 'all', name: 'all' } as any;
    fixture.detectChanges();

    const mobileTitle: HTMLElement | null =
      fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle)
      .withContext("default 'all' selection should not render the project title")
      .toBeNull();
  });

  it('mobile: should render linked pages as a thematic card when backList exists', () => {
    // ensure the component is in item-state so the stacked card area is rendered
    component.item = {} as any;
    component.id = 'Q1';
    component.isMobile = true;
    component.linkedItems = [{ id: 'QX', label: 'Linked Item A' } as any];
    component.linkedPagesTitle = 'Pages liées mobile';
    fixture.detectChanges();
    const cardTitle: HTMLElement | null = fixture.nativeElement.querySelector(
      '.typo-thematic-card-title'
    );
    expect(cardTitle)
      .withContext('thematic card title present for linked pages on mobile')
      .toBeTruthy();
    expect(cardTitle!.textContent).toContain('Pages liées mobile');

    // Ensure the linked item label is present inside the card content
    expect(fixture.nativeElement.textContent).toContain('Linked Item A');

    // There should be an anchor linking to the item id inside the card
    const mobileLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector(
      'app-thematic-card a.selectedItemLink'
    );
    expect(mobileLink).withContext('mobile linked pages card contains anchor').toBeTruthy();
    // routerLink should produce an href in the rendered DOM pointing to '/item/QX'
    expect(mobileLink!.getAttribute('href')).toContain('/item/QX');
  });

  it('mobile: linked pages should not appear in the drawer on mobile', () => {
    component.isMobile = true;
    component.linkedItems = [{ id: 'QY', label: 'Linked Item B' } as any];
    fixture.detectChanges();

    // Drawer heading is only rendered for non-mobile view; on mobile it should be absent
    const drawerHeading: HTMLElement | null =
      fixture.nativeElement.querySelector('.drawer-heading');
    expect(drawerHeading).toBeNull();
  });

  it('mobile: should render the FactGrid id above the title in the item header', () => {
    component.item = { id: 'Q1', label: 'Un titre très long pour tester le wrapping' } as any;
    component.id = 'Q1';
    component.isMobile = true;
    fixture.detectChanges();

    const itemRow: HTMLElement | null = fixture.nativeElement.querySelector('.itemTitle-row');
    expect(itemRow).withContext('item title row exists').toBeTruthy();

    const children = Array.from(itemRow!.children).filter((n: any) => n.nodeType === 1) as HTMLElement[];
    const idxId = children.findIndex((c) => c.classList.contains('title-card-id'));
    const idxTitle = children.findIndex((c) => c.classList.contains('itemTitle'));

    expect(idxId).withContext('id must appear before title in DOM when mobile').toBeLessThan(idxTitle);
  });
});
