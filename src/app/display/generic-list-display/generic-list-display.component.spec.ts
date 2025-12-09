import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { GenericListDisplayComponent } from './generic-list-display.component';
import { ProtectShortWordsPipe } from './protect-short-words.pipe';

describe('GenericListDisplayComponent', () => {
  let component: GenericListDisplayComponent;
  let fixture: ComponentFixture<GenericListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericListDisplayComponent],
      providers: [
        // component uses Router directives; provide a minimal ActivatedRoute in tests
        { provide: ActivatedRoute, useValue: { snapshot: {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenericListDisplayComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('handles non-array items gracefully (single object)', () => {
    component.items = {
      id: 'P1',
      label: 'Test prop',
      mainsnak: { datatype: 'string', datavalue: { value: 'hello' } },
    } as any;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // should render the label 'Test prop' somewhere
    expect(compiled.textContent).toContain('Test prop');
    // and the value 'hello'
    expect(compiled.textContent).toContain('hello');
  });

  it('handles array of items', () => {
    component.items = [
      {
        id: 'P2',
        label: 'Prop2',
        mainsnak: { datatype: 'string', datavalue: { value: 'v2' } },
      },
    ] as any;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Prop2');
    expect(compiled.textContent).toContain('v2');
  });

  it('protects single-letter words using the pipe', () => {
    const pipe = new ProtectShortWordsPipe();
    expect(pipe.transform('a b')).toBe('a\u00A0b');
    // 'x' attaches to 'yz', 'a' attaches to 'c'
    expect(pipe.transform('x yz a c')).toBe('x\u00A0yz a\u00A0c');
  });

  it('renders separators inside the link (no orphan comma)', () => {
    component.items = {
      id: 'P3',
      label: 'Test Prop',
      mainsnak: {
        datatype: 'wikibase-item',
        datavalue: { value: { id: 'Q1', separator: ', ', description: 'desc' } },
        label: 'Label',
      },
    } as any;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    // Expect comma + non-breaking space to be inside a span with class separator
    expect(compiled.innerHTML).toContain('<span class="separator">,&nbsp;</span>');

    // The separator must be glued to the label (no extra space between label and comma)
    const anchor = compiled.querySelector('a.factgrid-link') as HTMLElement | null;
    expect(anchor).toBeTruthy();
    // The label is glued to the separator using a U+2060 (word-joiner) — assert the exact sequence
    expect(anchor!.innerHTML).toContain('Label\u2060<span class="separator">,&nbsp;</span>');
  });

  it('includes description inside the link for wikibase-item mainsnak', () => {
    component.items = {
      id: 'P4',
      label: 'Test Prop',
      mainsnak: {
        datatype: 'wikibase-item',
        datavalue: { value: { id: 'Q100', separator: ', ', description: 'a description' } },
        label: 'Label',
      },
    } as any;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // The description span should live inside the anchor element for the mainsnak
    const anchor = compiled.querySelector('a.factgrid-link') as HTMLElement | null;
    expect(anchor).toBeTruthy();
    const descSpan = anchor?.querySelector('span.typo-item-desc');
    expect(descSpan).toBeTruthy();
    // description may include non-breaking spaces; assert the substring is present
    expect(descSpan?.textContent).toContain('description');
  });

  it('does not attempt to replace separator when separator is undefined (no crash)', () => {
    component.items = {
      id: 'P5',
      label: 'Test Prop',
      mainsnak: {
        datatype: 'wikibase-item',
        datavalue: { value: { id: 'Q200', description: 'desc only' } },
        label: 'Label',
      },
    } as any;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // Should not render separator span and should render description inside link
    const sep = compiled.querySelector('span.separator');
    expect(sep).toBeNull();
    const anchor = compiled.querySelector('a.factgrid-link');
    expect(anchor?.querySelector('span.typo-item-desc')).toBeTruthy();
  });

  it('supports a compact DisplayItem in items and renders its label', () => {
    component.items = { id: 'Q1', label: 'Compact label' } as any;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Compact label');
  });
});
