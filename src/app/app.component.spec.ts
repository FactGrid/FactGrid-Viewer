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

  it('should render a home button that links to the root', () => {
    // simulate non-root route by forcing isHome = false
    const fixture = TestBed.createComponent(AppComponent);
    // ngOnInit sets isHome based on Router — set it explicitly after init
    fixture.detectChanges();
    fixture.componentInstance.isHome = false;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    const homeBtn = compiled.querySelector('button[aria-label="Accueil"]');
    expect(homeBtn).toBeTruthy();

    const homeIcon = homeBtn.querySelector('mat-icon');
    expect(homeIcon.textContent).toContain('home');
  });

  it('should hide the home button on the root route', () => {
    // simulate root route by forcing isHome = true
    const fixture = TestBed.createComponent(AppComponent);
    // ngOnInit sets isHome — ensure template sees the root state by setting after init
    fixture.detectChanges();
    fixture.componentInstance.isHome = true;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;

    const homeBtn = compiled.querySelector('button[aria-label="Accueil"]');
    expect(homeBtn).toBeNull();
  });
});
