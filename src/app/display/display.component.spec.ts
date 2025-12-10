import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DisplayComponent } from './display.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { BackListService } from '../services/back-list.service';
import { SparqlDisplayService } from './services/sparql-display.service';
import { TranscriptionService } from './services/transcription.service';
import { TranscriptDisplayService } from '../services/transcript-display.service';
import { SelectedLangService } from '../selected-lang.service';
import { BackListDetailsService } from '../services/back-list-details.service';
import { SelectedResearchFieldService } from '../services/selected-research-field.service';
import { of, Observable } from 'rxjs';
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

  beforeEach(async () => {
    fixture = TestBed.createComponent(DisplayComponent);
    component = fixture.componentInstance;
    // ensure top info card is rendered so the contextual button exists
    component.item = {} as any;
    component.id = 'Q1';
    fixture.detectChanges();
    // wait for async subscriptions / change-detection triggered from ngOnInit
    // to settle (avoids ExpressionChangedAfterItHasBeenCheckedError under v21)
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update project signals when SelectedResearchFieldService changes', async () => {
    const srf = TestBed.inject(SelectedResearchFieldService);
    // Set service before re-creating component to ensure the constructor-level
    // signal picks up the new value reliably in the test environment.
    srf.setSelectedResearchField({ id: 'Q10', name: 'My project', description: 'Sample project' });
    fixture = TestBed.createComponent(DisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.projectId()).toBe('Q10');
    expect(component.projectName()).toBe('My project');
    // ensure template updates when a project is set
    fixture.detectChanges();
    const el: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.mobile-project-name');
    expect(el).toBeTruthy();
    expect(el!.textContent).toContain('My project');
  });

  it('should update displayed project name when SelectedResearchFieldService changes after creation', async () => {
    const srf = TestBed.inject(SelectedResearchFieldService);
    // Save previous value and reset to default to avoid leaking state from other tests
    const previous = srf.getSelectedResearchField();
    srf.setSelectedResearchField({ id: 'all', name: 'all', description: '' });
    fixture = TestBed.createComponent(DisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    // Initially the service defaults to id 'all' so the project label should not be shown
    let el: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.mobile-project-name');
    expect(el).toBeNull();

    // Update the service after the component is created and assert DOM reflects change
    srf.setSelectedResearchField({ id: 'Q30', name: 'Berlin Project', description: '' });
    fixture.detectChanges();
    await fixture.whenStable();

    el = fixture.nativeElement.querySelector('.mobile-project-name');
    expect(el).toBeTruthy();
    expect(el!.textContent).toContain('Berlin Project');

    // Restore the previous SRF to avoid test leaking into following tests
    srf.setSelectedResearchField(previous);
  });

  it('addInFactGrid should open FactGrid in a new tab with the correct id', () => {
    const spy = vi.vi.spyOn(window, 'open').mockImplementation(() => null as any);
    component.itemId = 'Q22370';
    component.addInFactGrid();
    expect(spy).toHaveBeenCalled();
    // basic check: url contains the id and opens in a new tab
    const expected = `https://database.factgrid.de/entity/Q22370`;
    expect((vi.mocked(spy).mock.lastCall as any[])[0]).toContain(expected);
  });

  it('should render linked pages as a thematic card when item and linkedItems exist', async () => {
    component.item = { id: 'Q1', label: 'Test' } as any;
    component.id = 'Q1';
    component.linkedItems = [{ id: 'QZ', label: 'Linked Z' } as any];
    component.linkedPagesTitle = 'Linked pages now';
    fixture.detectChanges();
    await fixture.whenStable();

    const cardTitle = fixture.nativeElement.querySelector('.typo-thematic-card-title');
    expect(cardTitle).toBeTruthy();
    expect(cardTitle!.textContent).toContain('Linked pages now');
  });

  it('should show selected item id in sub-header and link to FactGrid', async () => {
    component.isMobile = false;
    component.item = { id: 'Q42', label: 'Test' } as any;
    component.id = 'Q42';
    fixture.detectChanges();
    await fixture.whenStable();

    const idLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector('.title-id');
    expect(idLink).toBeTruthy();
    expect(idLink!.textContent).toContain('Q42');
    expect(idLink!.getAttribute('href')).toContain('Q42');
  });

  it('should show linkedPagesTitle on the linked pages card when linkedItems are present', async () => {
    component.item = { id: 'Q7' } as any;
    component.id = 'Q7';
    component.linkedPagesTitle = 'pages liées test';
    component.linkedItems = [{ id: 'Q1', label: 'L1' } as any];
    fixture.detectChanges();
    await fixture.whenStable();

    const title = fixture.nativeElement.querySelector('.typo-thematic-card-title');
    expect(title).toBeTruthy();
    expect(title.textContent).toContain('pages liées test');
  });

  // drawer no longer used: we render linked pages as thematic card inside the grid

  it('close icon / drawer button should not exist (drawer removed)', async () => {
    // prepare
    component.item = { id: 'Q7' } as any;
    component.id = 'Q7';
    component.isMobile = false;
    fixture.detectChanges();
    await fixture.whenStable();

    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('.close-btn');
    expect(btn).toBeNull();
  });

  it('drawer UI removed — app-drawer should not be present', async () => {
    component.item = { id: 'Q1' } as any;
    fixture.detectChanges();
    await fixture.whenStable();

    const drawerEl: HTMLElement | null = fixture.nativeElement.querySelector('.app-drawer');
    expect(drawerEl).toBeNull();
  });

  it('should fall back to English label when user-lang label is empty', () => {
    const backList = TestBed.inject(BackListService);
    const backListDetails = TestBed.inject(BackListDetailsService);

    // Prepare the service to return two responses (user lang result, en result)
    vi.vi.spyOn(backList, 'backList').mockReturnValue(
      of([
        { query: { pages: [{ title: 'Item:Q1', entityterms: { label: [''] } }] } },
        { query: { pages: [{ title: 'Item:Q1', entityterms: { label: ['English name'] } }] } },
      ])
    );

    // Ensure setBackList converts pages into simple {id, label} entries
    vi.vi.spyOn(backListDetails, 'setBackList')
      .mockReturnValueOnce([{ id: 'Q1', label: '' }])
      .mockReturnValueOnce([{ id: 'Q1', label: 'English name' }]);

    component.itemId = 'Q1';
    (component as any).loadBackList();

    // after load, label should equal the English fallback
    expect(component.linkedItems[0].label).toBe('English name');
  });

  it('should build SPARQL cards state from item.sparql (typed SparqlTuple[])', async () => {
    // Prepare a sample SparqlTuple stream for sparql4
    const sampleRows: any[] = [
      ['', []],
      ['', []],
      ['', []],
      ['', []],
      ['Q8', [{ item: { id: 'Q1' }, itemLabel: { value: 'House' } }]],
    ];

    // Build a minimal item payload that passes loadItem() checks
    const item = {
      id: 'Q1',
      label: 'Test',
      claims: { P2: [{ mainsnak: { datavalue: { value: { id: 'Q1' } } } }] },
      sparql: of(sampleRows),
    } as any;

    // Instead of driving the full loadItem pipeline (which triggers many
    // downstream services), create the sparql$ stream and feed it to the
    // display service used by the component. This focuses the test on the
    // typed pipeline (SparqlTuple[] -> buildAllCardsState).
    component.item = [item] as any;
    component.sparql$ = of(sampleRows) as Observable<any>;
    const sdsvc = TestBed.inject<any>(SparqlDisplayService);
    const langService = TestBed.inject<any>(SelectedLangService);
    langService.selectedLang = 'en';
    component.sparqlCards$ = sdsvc.buildAllCardsState(component.sparql$, langService);

    (component.sparqlCards$ as Observable<any>).subscribe((cards) => {
      expect(cards.sparql4.list.length).toBeGreaterThan(0);
      expect(cards.sparql4.title).toBeTruthy();
    });
  });

  it('should display id when no label exists in any language', () => {
    const backList = TestBed.inject(BackListService);
    const backListDetails = TestBed.inject(BackListDetailsService);

    vi.vi.spyOn(backList, 'backList').mockReturnValue(
      of([
        { query: { pages: [{ title: 'Item:Q2', entityterms: { label: [''] } }] } },
        { query: { pages: [{ title: 'Item:Q2', entityterms: { label: [''] } }] } },
      ])
    );

    vi.vi.spyOn(backListDetails, 'setBackList')
      .mockReturnValueOnce([{ id: 'Q2', label: '' }])
      .mockReturnValueOnce([{ id: 'Q2', label: '' }]);

    component.itemId = 'Q2';
    (component as any).loadBackList();

    expect(component.linkedItems[0].label).toBe('Q2');
  });

  it('should update transcription (trans) when item contains P251', async () => {
    const transcriptDisplay = TestBed.inject<any>(TranscriptDisplayService);
    const changeTranscriptSvc = TestBed.inject<any>(TranscriptionService);
    // return a predictable transcription
    vi.vi.spyOn(transcriptDisplay, 'transcript').mockReturnValue(of({ parse: { text: 'TRANS' } }));
    vi.vi.spyOn(changeTranscriptSvc, 'cleaning').mockImplementation((t: string) => t);

    // create item with P251 claim data used by the transcription
    const item = [
      {
        id: 'Q999',
        claims: { P251: [{ mainsnak: { datavalue: { value: 'text to trans' } } }] },
      },
    ] as any;
    // update the signal that the constructor-level effects watch
    (component as any).itemSignal.set(item);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.trans).toBe('TRANS');
  });

  it('home header and search should be visible when no item is selected', async () => {
    component.item = null;
    component.title = 'FactGrid';
    component.subtitle = 'Mon super projet';
    fixture.detectChanges();
    await fixture.whenStable();

    const titleEl: HTMLElement | null = fixture.nativeElement.querySelector('.home-title');
    expect(titleEl).toBeTruthy();
    expect(titleEl!.textContent).toContain('FactGrid');

    const subtitleEl: HTMLElement | null = fixture.nativeElement.querySelector('.home-subtitle');
    expect(subtitleEl).toBeTruthy();
    expect(subtitleEl!.textContent).toContain('Mon super projet');

    const searchHost = fixture.nativeElement.querySelector('.search-host');
    expect(searchHost).toBeTruthy();
  });

  it('onSearchItemSelected should animate then navigate when called from homepage', async () => {
    const navigateSpy = vi.vi.spyOn((component as any).router, 'navigate');

    component.item = null; // homepage state
    fixture.detectChanges();
    await fixture.whenStable();

    component.onSearchItemSelected('Q123');
    // it should first set header to closed and search to pinned
    expect(component.headerAnimState).toBe('closed');
    expect(component.searchAnimState).toBe('pinned');

    // navigation should not happen immediately
    expect(navigateSpy).not.toHaveBeenCalled();

    // simulate start & end of header animation
    (component as any).onHeaderAnimationStart({ fromState: 'home', toState: 'closed' } as any);
    expect(component.headerAnimating).toBe(true);
    // simulate end
    (component as any).onHeaderAnimationDone({ toState: 'closed' } as any);
    expect(component.headerAnimating).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/item', 'Q123']);
  });

  it('headerAnimating toggles during animation callbacks', () => {
    component.headerAnimating = false;
    (component as any).onHeaderAnimationStart({ fromState: 'home', toState: 'closed' } as any);
    expect(component.headerAnimating).toBe(true);
    (component as any).onHeaderAnimationDone({ toState: 'closed' } as any);
    expect(component.headerAnimating).toBe(false);
  });

  it('shows the selected project label above the search when present', async () => {
    component.item = null; // make header show
    const srf = TestBed.inject(SelectedResearchFieldService);
    srf.setSelectedResearchField({ id: 'Q10', name: 'My project', description: 'Sample' });
    fixture.detectChanges();
    await fixture.whenStable();

    // Since the project sub-header card is removed, we should see the project title above the search
    const mobileTitle: HTMLElement | null =
      fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle).toBeTruthy();
    expect(mobileTitle!.textContent).toContain('My project');
    // the project title and a small 'clear' button are wrapped in a container; find the anchor inside
    const anchor = mobileTitle!.querySelector('.mobile-project-name') as HTMLAnchorElement | null;
    expect(anchor).toBeTruthy();
    expect(anchor!.getAttribute('href')).toContain('/item/Q10');

    // project-sub-header-card should not be present
    const cardEl: HTMLElement | null = fixture.nativeElement.querySelector(
      'app-thematic-card.project-sub-header-card'
    );
    expect(cardEl).toBeNull();
  });

  it('renders a clear-project button next to the mobile project title and clearing resets selection to all', async () => {
    component.item = null; // header visible
    const srf = TestBed.inject(SelectedResearchFieldService);
    srf.setSelectedResearchField({ id: 'Q10', name: 'My project', description: 'Sample' });
    fixture.detectChanges();
    await fixture.whenStable();

    const clearEl: HTMLElement | null = fixture.nativeElement.querySelector('.clear-project');
    expect(clearEl).toBeTruthy();

    // Trigger clearing via component method (removal event or click should call the same handler).
    component.clearCurrentProject();
    fixture.detectChanges();

    const selected = srf.getSelectedResearchField();
    expect(selected.id).toBe('all');
  });

  it('desktop: uses mat-chip clear control next to project title', async () => {
    component.item = null; // header visible
    const srf = TestBed.inject(SelectedResearchFieldService);
    srf.setSelectedResearchField({ id: 'Q20', name: 'Desktop project', description: 'Sample' });
    component.isMobile = false;
    fixture.detectChanges();
    await fixture.whenStable();

    const chipEl: HTMLElement | null =
      fixture.nativeElement.querySelector('mat-chip.clear-project');
    expect(chipEl).toBeTruthy();
  });

  it('mat-chip removed event (non-DOM) should still clear selection', async () => {
    component.item = null; // header visible
    const srf = TestBed.inject(SelectedResearchFieldService);
    srf.setSelectedResearchField({ id: 'Q10', name: 'My project', description: 'Sample' });
    fixture.detectChanges();
    await fixture.whenStable();

    // Simulate removed event emitted by MatChip — this is not a DOM event
    // and does not have stopPropagation. Ensure the handler still clears.
    component.clearCurrentProject({} as any);
    fixture.detectChanges();

    const now = srf.getSelectedResearchField();
    expect(now.id).toBe('all');
  });

  it('mobile: shows centered project title above search and hides right label', async () => {
    component.item = null; // header visible
    const srf = TestBed.inject(SelectedResearchFieldService);
    srf.setSelectedResearchField({ id: 'Q10', name: 'My project', description: 'Sample' });
    component.isMobile = true;
    fixture.detectChanges();
    await fixture.whenStable();

    const mobileTitle: HTMLElement | null =
      fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle).toBeTruthy();
    expect(mobileTitle!.textContent).toContain('My project');
    // mobile project title container contains the anchor link
    const anchorMobile = mobileTitle!.querySelector(
      '.mobile-project-name'
    ) as HTMLAnchorElement | null;
    expect(anchorMobile).toBeTruthy();
    expect(anchorMobile!.getAttribute('href')).toContain('/item/Q10');

    // on mobile the right-hand project block is not rendered (we show a compact title above the search)
    const rightBlock: HTMLElement | null = fixture.nativeElement.querySelector(
      '.project-sub-header-right'
    );
    expect(rightBlock).toBeNull();

    // on mobile the project sub-header card should not be rendered (we show a centered title instead)
    const projectCardMobile: HTMLElement | null = fixture.nativeElement.querySelector(
      'app-thematic-card.project-sub-header-card'
    );
    expect(projectCardMobile).toBeNull();

    // on the home page the title should be centered regardless of viewport width
    const topToolbar: HTMLElement | null = fixture.nativeElement.querySelector('.top-toolbar');
    expect(topToolbar).toBeTruthy();
    expect(topToolbar!.classList.contains('home-state')).toBe(true);
    // Note: happy-dom doesn't compute CSS styles. The CSS rule `.top-toolbar.home-state .mobile-project-title`
    // applies text-align:center, but we can only verify the class combination is present.
    expect(mobileTitle!.classList.contains('mobile-project-title')).toBe(true);
  });

  it("doesn't render project title when project is the '-' placeholder (desktop)", async () => {
    component.item = null; // header visible
    const srf = TestBed.inject(SelectedResearchFieldService);
    srf.setSelectedResearchField({ id: '-', name: '-', description: '' });
    fixture.detectChanges();
    await fixture.whenStable();

    const mobileTitle: HTMLElement | null =
      fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle, "project title placeholder '-' should not be rendered").toBeNull();
  });

  it("doesn't render project title when project is the '-' placeholder (mobile)", async () => {
    component.item = null; // header visible
    const srf = TestBed.inject(SelectedResearchFieldService);
    srf.setSelectedResearchField({ id: '-', name: '-', description: '' });
    component.isMobile = true;
    fixture.detectChanges();
    await fixture.whenStable();

    const mobileTitle: HTMLElement | null =
      fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle, "mobile project title placeholder '-' should not be rendered").toBeNull();
  });

  it("doesn't render project title when selected research field is the default 'all'", async () => {
    component.item = null; // header visible
    const srf = TestBed.inject(SelectedResearchFieldService);
    srf.setSelectedResearchField({ id: 'all', name: 'all', description: '' });
    fixture.detectChanges();
    await fixture.whenStable();

    const mobileTitle: HTMLElement | null =
      fixture.nativeElement.querySelector('.mobile-project-title');
    expect(mobileTitle, "default 'all' selection should not render the project title").toBeNull();
  });

  it('mobile: should render linked pages as a thematic card when backList exists', async () => {
    // ensure the component is in item-state so the stacked card area is rendered
    component.item = {} as any;
    component.id = 'Q1';
    component.isMobile = true;
    component.linkedItems = [{ id: 'QX', label: 'Linked Item A' } as any];
    component.linkedPagesTitle = 'Pages liées mobile';
    fixture.detectChanges();
    await fixture.whenStable();
    const cardTitle: HTMLElement | null = fixture.nativeElement.querySelector(
      '.typo-thematic-card-title'
    );
    expect(cardTitle).toBeTruthy();
    expect(cardTitle!.textContent).toContain('Pages liées mobile');

    // Ensure the linked item label is present inside the card content
    expect(fixture.nativeElement.textContent).toContain('Linked Item A');

    // There should be an anchor linking to the item id inside the card
    const mobileLink: HTMLAnchorElement | null = fixture.nativeElement.querySelector(
      'app-thematic-card a.selectedItemLink'
    );
    expect(mobileLink).toBeTruthy();
    // routerLink should produce an href in the rendered DOM pointing to '/item/QX'
    expect(mobileLink!.getAttribute('href')).toContain('/item/QX');
  });

  it('mobile: linked pages should not appear in the drawer on mobile', async () => {
    component.isMobile = true;
    component.linkedItems = [{ id: 'QY', label: 'Linked Item B' } as any];
    fixture.detectChanges();
    await fixture.whenStable();

    // Drawer heading is only rendered for non-mobile view; on mobile it should be absent
    const drawerHeading: HTMLElement | null =
      fixture.nativeElement.querySelector('.drawer-heading');
    expect(drawerHeading).toBeNull();
  });

  it('should render header properties card inside info-themed-card when headerDetail exists', async () => {
    component.item = { id: 'Q1', label: 'Test title' } as any;
    component.id = 'Q1';
    component.headerDetail = [
      {
        id: 'P2',
        label: 'Instance of',
        claims: [{ mainsnak: { datatype: 'string', datavalue: { value: 'Q7' } } }],
      },
    ];

    fixture.detectChanges();
    await fixture.whenStable();

    const headerCard: HTMLElement | null = fixture.nativeElement.querySelector('.info-themed-card');
    expect(headerCard).toBeTruthy();

    const headerList: HTMLElement | null = fixture.nativeElement.querySelector(
      'app-generic-list-display'
    );
    expect(headerList).toBeTruthy();
  });

  it('mobile: should render the FactGrid id above the title in the item header', async () => {
    component.item = { id: 'Q1', label: 'Un titre très long pour tester le wrapping' } as any;
    component.id = 'Q1';
    component.isMobile = true;
    fixture.detectChanges();
    await fixture.whenStable();

    const itemRow: HTMLElement | null = fixture.nativeElement.querySelector('.itemTitle-row');
    expect(itemRow).toBeTruthy();

    const children = Array.from(itemRow!.children).filter(
      (n: any) => n.nodeType === 1
    ) as HTMLElement[];
    const idxId = children.findIndex((c) => c.classList.contains('title-card-id'));
    const idxTitle = children.findIndex((c) => c.classList.contains('itemTitle'));

    expect(idxId).toBeLessThan(idxTitle);
  });

  it('desktop: should render the FactGrid id above the title in the item header', async () => {
    component.item = { id: 'Q1', label: 'Un titre assez long pour vérifier le wrapping' } as any;
    component.id = 'Q1';
    component.isMobile = false; // desktop-mode
    fixture.detectChanges();
    await fixture.whenStable();

    const itemRow: HTMLElement | null = fixture.nativeElement.querySelector('.itemTitle-row');
    expect(itemRow).toBeTruthy();

    const children = Array.from(itemRow!.children).filter(
      (n: any) => n.nodeType === 1
    ) as HTMLElement[];
    const idxId = children.findIndex((c) => c.classList.contains('title-card-id'));
    const idxTitle = children.findIndex((c) => c.classList.contains('itemTitle'));

    expect(idxId).toBeLessThan(idxTitle);
  });
});
