import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ParisSearchComponent } from './paris-search.component';

describe('ParisSearchComponent', () => {
  let component: ParisSearchComponent;
  let fixture: ComponentFixture<ParisSearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ParisSearchComponent, HttpClientTestingModule, RouterTestingModule],
    });
    fixture = TestBed.createComponent(ParisSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
