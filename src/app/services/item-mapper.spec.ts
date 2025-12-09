import { mapEntityToDisplayItem } from './item-mapper';

describe('mapEntityToDisplayItem', () => {
  it('should prefer top-level label/description and keep aliases when provided as array', () => {
    const entity: any = {
      id: 'Q1',
      label: 'Top label',
      description: 'Top description',
      aliases: ['a1', 'a2'],
    };

    const mapped = mapEntityToDisplayItem(entity);
    expect(mapped.label).toBe('Top label');
    expect(mapped.description).toBe('Top description');
    expect(mapped.aliases).toEqual(['a1', 'a2']);
  });

  it('should not flatten aliases when aliases is an object keyed by language', () => {
    const entity: any = {
      id: 'Q2',
      labels: { en: { value: 'English' } },
      aliases: { en: [{ value: 'alias-en' }], fr: [{ value: 'alias-fr' }] },
    };

    const mapped = mapEntityToDisplayItem(entity);
    // Since alias object is language-keyed and we don't know the selected language here,
    // the mapper must not mix languages and should not return a flattened alias list.
    expect(mapped.aliases).toBeUndefined();
  });
});
