import { ProtectShortWordsPipe } from './protect-short-words.pipe';

describe('ProtectShortWordsPipe', () => {
  const pipe = new ProtectShortWordsPipe();

  it('should return null/undefined unchanged', () => {
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it('should not modify a single word', () => {
    expect(pipe.transform('bonjour')).toBe('bonjour');
  });

  it('should attach a single-letter word to the following word with NBSP', () => {
    expect(pipe.transform("a test")).toBe('a\u00A0test');
    expect(pipe.transform("A   test")).toBe('A\u00A0test');
    expect(pipe.transform("à la maison")).toBe('à\u00A0la maison');
  });

  it('should not change numbers or multi-letter words', () => {
    expect(pipe.transform('1 test')).toBe('1 test');
    expect(pipe.transform('ab c')).toBe('ab c');
  });

  it('should work repeatedly without duplicating NBSP', () => {
    expect(pipe.transform('a\u00A0test')).toBe('a\u00A0test');
  });

  it('should preserve punctuation after a one-letter word', () => {
    expect(pipe.transform('a, test')).toBe('a, test');
  });
});
