import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'factgrid'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('factgrid');
  });

  it('should render footer component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    // the app no longer contains the default .content span; assert footer exists as smoke check
    expect(compiled.querySelector('app-footer')).toBeTruthy();
  });

  it('should render a home button that links to the root', async () => {
    // simulate non-root route by forcing isHome = false
    const fixture = TestBed.createComponent(AppComponent);
    // Use the Router to simulate a non-root route so ngOnInit's logic doesn't
    // overwrite our expectation. Navigate before running change detection.
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/not-root');
    fixture.detectChanges();
    // wait for change detection & potential async tasks to settle
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    // The app may be localized; instead of relying on a specific aria-label,
    // find the mat-icon whose text is 'home' and assert it has a parent button.
    const icons = Array.from(compiled.querySelectorAll('mat-icon')) as HTMLElement[];
    const homeIcon = icons.find((el) => el.textContent?.trim() === 'home');
    expect(homeIcon).toBeTruthy();

    const homeBtn = homeIcon?.closest('button');
    expect(homeBtn).toBeTruthy();
  });

  it('should hide the home button on the root route', async () => {
    // simulate root route by forcing isHome = true
    const fixture = TestBed.createComponent(AppComponent);
    // Simulate root route via Router navigation.
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    const icons = Array.from(compiled.querySelectorAll('mat-icon')) as HTMLElement[];
    const homeIcon = icons.find((el) => el.textContent?.trim() === 'home');
    // When on the root route there must be no home icon/button visible
    expect(homeIcon).toBeFalsy();
  });

  it('should render the centered FactGrid title when not on the home page', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    // Simulate being on a non-root route so the centered title renders.
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/not-home');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    const title = compiled.querySelector('.toolbar-title');
    expect(title).toBeTruthy();
    expect(title.textContent.trim()).toEqual('FactGrid');
  });

  it('should not render the FactGrid title on the home page', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    // simulate home route via router url getter
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'url', 'get').mockReturnValue('/');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    const title = compiled.querySelector('.toolbar-title');
    expect(title).toBeNull();
  });
});



