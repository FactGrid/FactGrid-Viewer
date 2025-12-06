import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ThematicCardComponent } from './thematic-card.component';
import { SimpleChange } from '@angular/core';

describe('ThematicCardComponent', () => {
  let component: ThematicCardComponent;
  let fixture: ComponentFixture<ThematicCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThematicCardComponent, NoopAnimationsModule],
    }).compileComponents();
    fixture = TestBed.createComponent(ThematicCardComponent);
    component = fixture.componentInstance;
  });

  it('should initialize collapsed when startCollapsed true', () => {
    // set collapsible, initial state should be open
    // set inputs using ngOnChanges to simulate Angular input changes
    component.collapsible = true;
    component.ngOnChanges({ collapsible: new SimpleChange(null, true, true) });
    fixture.detectChanges();
    expect(component.isCollapsed).toBeFalse();

    // now parent toggles startCollapsed -> should set collapsed
    component.startCollapsed = true;
    component.ngOnChanges({ startCollapsed: new SimpleChange(null, true, false) });
    fixture.detectChanges();
    expect(component.isCollapsed).toBeTrue();
  });

  it('should update collapsed state when startCollapsed input changes', () => {
    // initialize with both inputs true and trigger ngOnChanges
    component.collapsible = true;
    component.startCollapsed = true;
    component.ngOnChanges({
      collapsible: new SimpleChange(null, true, true),
      startCollapsed: new SimpleChange(null, true, true),
    });
    fixture.detectChanges();
    expect(component.isCollapsed).toBeTrue();

    // Simulate a user toggle (open)
    component.toggle();
    expect(component.isCollapsed).toBeFalse();

    // Parent changes startCollapsed - should reset to collapsed
    component.startCollapsed = true;
    component.ngOnChanges({ startCollapsed: new SimpleChange(false, true, false) });
    fixture.detectChanges();
    expect(component.isCollapsed).toBeTrue();

    // Now set startCollapsed false and ensure component resets accordingly
    component.startCollapsed = false;
    component.ngOnChanges({ startCollapsed: new SimpleChange(true, false, false) });
    fixture.detectChanges();
    expect(component.isCollapsed).toBeFalse();
  });

  it('should render header when only icon is provided', () => {
    component.icon = 'info';
    // ensure ngOnChanges picks up the icon change
    component.ngOnChanges({ icon: new SimpleChange(null, 'info', true) });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const iconEl = el.querySelector('.title-icon');
    expect(iconEl).withContext('mat-icon should exist').toBeTruthy();
    expect(iconEl?.textContent?.trim()).toBe('info');
  });

  it('keeps projected content present even when collapsed', () => {
    // the body should still contain projected content node even if collapsed
    component.collapsible = true;
    component.startCollapsed = true;
    component.ngOnChanges({
      startCollapsed: new SimpleChange(null, true, true),
      collapsible: new SimpleChange(null, true, true),
    });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const body = el.querySelector('.card-body');
    expect(body).toBeTruthy();
    // body-inner should exist even while hidden
    const inner = body!.querySelector('.body-inner');
    expect(inner).toBeTruthy('body-inner should be present in the DOM even when collapsed');
    // and it should have the class content-hidden
    expect(inner!.classList.contains('content-hidden')).toBeTrue();
  });

  it('resets collapsed state when resetKey changes', () => {
    component.collapsible = true;
    component.startCollapsed = false;
    component.ngOnChanges({
      collapsible: new SimpleChange(null, true, true),
      startCollapsed: new SimpleChange(null, false, true),
    });
    fixture.detectChanges();

    // user toggles closed
    component.toggle();
    expect(component.isCollapsed).toBeTrue();

    // parent navigates -> change resetKey should reset to startCollapsed (false)
    component.resetKey = 'a';
    component.ngOnChanges({ resetKey: new SimpleChange(null, 'a', false) });
    fixture.detectChanges();
    expect(component.isCollapsed).toBeFalse();
  });

  it('collapse button exposes aria-label and keeps text for non-mobile', () => {
    component.collapsible = true;
    component.startCollapsed = true;
    component.ngOnChanges({
      startCollapsed: new SimpleChange(null, true, true),
      collapsible: new SimpleChange(null, true, true),
    });
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const btn = el.querySelector('.collapse-btn') as HTMLButtonElement | null;
    expect(btn).toBeTruthy('collapse button exists');
    // aria-label should reflect action
    expect(btn?.getAttribute('aria-label')).toBe('Afficher');

    // The visible text span should still be present in the template (hidden in real mobile via CSS)
    const textSpan = btn?.querySelector('.collapse-text');
    expect(textSpan).toBeTruthy();
    expect(textSpan?.textContent?.trim()).toBe('Afficher');
  });
});
