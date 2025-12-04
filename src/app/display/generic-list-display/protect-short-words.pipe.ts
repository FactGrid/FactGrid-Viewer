import { Pipe, PipeTransform } from '@angular/core';

/**
 * Replaces single-character words followed by a space with a non-breaking space
 * so single-character words (e.g. French "à", "y") won't remain orphaned
 * at the end of a line. The pipe returns a string containing the NBSP char
 * so it can be used directly inside templates / anchors.
 */
@Pipe({ name: 'protectShortWords', standalone: true })
export class ProtectShortWordsPipe implements PipeTransform {
  transform(value: any): any {
    if (value === undefined || value === null) return value;
    const s = String(value);

    // Replace any single-letter word followed by whitespace with the
    // same letter followed by a non-breaking space (U+00A0).
    // Uses Unicode letter property so accented letters are matched too.
    // Accept either start-of-string or whitespace before the letter and
    // preserve that prefix (group 1) so this is safe to use inside texts.
    return s.replace(/(^|\s)(\p{L})\s+/gu, '$1$2\u00A0');
  }
}
