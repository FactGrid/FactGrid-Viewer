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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders iframe with adjusted viewport height', () => {
    // Provide a minimal iframeGroup so the template renders an iframe
    component.iframeGroups = [
      {
        property: 'P999',
        label: 'External',
        claims: [{ mainsnak: { datavalue: { value: 'https://example.com' } } }],
      },
    ];
    fixture.detectChanges();

    const iframe: HTMLIFrameElement | null = fixture.nativeElement.querySelector('iframe');
    expect(iframe).toBeTruthy();
    // Check we've stopped using bare 100vh which can overlap the toolbar
    expect(iframe!.getAttribute('style') || '').toContain('calc(100vh - 56px)');
  });
});
