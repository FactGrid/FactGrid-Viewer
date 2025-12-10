import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IframesDisplayComponent } from './iframes-display.component';

describe('IframesDisplayComponent', () => {
  let component: IframesDisplayComponent;
  let fixture: ComponentFixture<IframesDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IframesDisplayComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IframesDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders iframe with adjusted viewport height', async () => {
    // create a fresh fixture and set input before the first detectChanges to
    // avoid mid-cycle mutations that trigger ExpressionChangedAfterItHasBeenCheckedError
    const localFixture = TestBed.createComponent(IframesDisplayComponent);
    const localComponent = localFixture.componentInstance;
    localComponent.iframeGroups = [
      {
        property: 'P999',
        label: 'External',
        claims: [{ mainsnak: { datavalue: { value: 'https://example.com' } } }],
      },
    ];
    localFixture.detectChanges();
    await localFixture.whenStable();

    const iframe: HTMLIFrameElement | null = localFixture.nativeElement.querySelector('iframe');
    expect(iframe).toBeTruthy();
    // Check we've stopped using bare 100vh which can overlap the toolbar
    expect(iframe!.getAttribute('style') || '').toContain('calc(100vh - 56px)');
  });
});
