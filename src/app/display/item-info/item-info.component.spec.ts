import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemInfoComponent } from './item-info.component';

describe('ItemInfoComponent', () => {
  let component: ItemInfoComponent;
  let fixture: ComponentFixture<ItemInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemInfoComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('track functions', () => {
    it('trackListKey returns id when present', () => {
      const L = { item: { id: 'Q123' }, itemLabel: { value: 'Label' } } as any;
      expect(component.trackListKey(0, L)).toBe('Q123');
    });

    it('trackListKey falls back to label when id missing', () => {
      const L = { itemLabel: { value: 'LabelOnly' } } as any;
      expect(component.trackListKey(1, L)).toBe('LabelOnly');
    });

    it('trackListKey falls back to mainsnak id when other fields missing', () => {
      const L = { mainsnak: { datavalue: { value: { id: 'Q999' } } } } as any;
      expect(component.trackListKey(2, L)).toBe('Q999');
    });

    it('trackListKey uses index when nothing else available', () => {
      const L = {} as any;
      expect(component.trackListKey(5, L)).toBe(5);
    });

    it('trackListKey accepts compact DisplayItem objects and returns id', () => {
      const disp = { id: 'Q500', label: 'Compact' } as any;
      expect(component.trackListKey(0, disp)).toBe('Q500');
    });

    it('trackListKey accepts tuple shape and picks DisplayItem from last element', () => {
      const tuple = [{}, [], [], [], { id: 'Q600', label: 'TupleItem' }] as any;
      expect(component.trackListKey(0, tuple)).toBe('Q600');
    });

    it('trackTechKey prefers id then label then index', () => {
      const val1 = { mainsnak: { datavalue: { value: { id: 'Q1' } } } } as any;
      expect(component.trackTechKey(0, val1)).toBe('Q1');

      const val2 = { mainsnak: { label: 'lbl2' } } as any;
      expect(component.trackTechKey(1, val2)).toBe('lbl2');

      const val3 = {} as any;
      expect(component.trackTechKey(2, val3)).toBe(2);
    });

    it('trackTechPropKey prefers propertyId/property/label then index', () => {
      expect(component.trackTechPropKey(0, { propertyId: 'P42' } as any)).toBe('P42');
      expect(component.trackTechPropKey(1, { property: 'P100' } as any)).toBe('P100');
      expect(component.trackTechPropKey(2, { propertyLabel: 'prop label' } as any)).toBe(
        'prop label'
      );
      expect(component.trackTechPropKey(3, {} as any)).toBe(3);
    });
  });
});
