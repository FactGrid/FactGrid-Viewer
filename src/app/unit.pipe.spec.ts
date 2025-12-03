import { UnitPipe } from './unit.pipe';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('UnitPipe', () => {
  it('create an instance', () => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [UnitPipe] });
    const pipe = TestBed.inject(UnitPipe);
    expect(pipe).toBeTruthy();
  });
});
