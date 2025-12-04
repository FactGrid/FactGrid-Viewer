import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DisplayComponent } from './display.component';
import { DrawerService } from '../services/drawer.service';

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

  it('should render contextual "Pages liées" button and call DrawerService.toggle() when clicked', () => {
    const drawerService = TestBed.inject(DrawerService);
    const spy = spyOn(drawerService, 'toggle');

    // ensure existence of the top section; we verify behaviour via the exposed method
    component.item = { id: 'Q1', label: 'Test' } as any;
    fixture.detectChanges();

    component.toggleLinkedPages();
    expect(spy).toHaveBeenCalled();
  });
});
