import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DisplayComponent } from './display.component';

describe('DisplayComponent', () => {
  let component: DisplayComponent;
  let fixture: ComponentFixture<DisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisplayComponent, RouterTestingModule, HttpClientTestingModule, NoopAnimationsModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayComponent);
    component = fixture.componentInstance;
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
});
