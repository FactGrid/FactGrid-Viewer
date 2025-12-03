import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenericListDisplayComponent } from './generic-list-display.component';

describe('GenericListDisplayComponent', () => {
  let component: GenericListDisplayComponent;
  let fixture: ComponentFixture<GenericListDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericListDisplayComponent],
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
});
