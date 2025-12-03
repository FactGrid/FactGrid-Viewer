import { SafeHtmlPipe } from './safe-html.pipe';
import { TestBed } from '@angular/core/testing';

describe('SafeHtmlPipe', () => {
  it('create an instance', () => {
    TestBed.configureTestingModule({ providers: [SafeHtmlPipe] });
    const pipe = TestBed.inject(SafeHtmlPipe);
    expect(pipe).toBeTruthy();
  });
});
