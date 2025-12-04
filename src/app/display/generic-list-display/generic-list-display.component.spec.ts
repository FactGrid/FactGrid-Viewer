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

  it('renders separators protected with word-joiner (no orphan comma)', () => {
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
    // Expect U+2060 (word-joiner) to be present before the separator comma
    expect(compiled.innerHTML.indexOf('\u2060,')).toBeGreaterThan(-1);
  });
});
