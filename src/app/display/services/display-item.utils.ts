// This type describes the older "tuple" shape used by display services.
// We rename it to EnrichedItemTuple to avoid conflict with the global UI-level
// DisplayItem type defined in src/app/services/item-types.ts.
export type EnrichedItemTuple = any[] | { raw: any; remainingProps: string[] };

export function getEntity(item: EnrichedItemTuple): any {
  return Array.isArray(item) ? item[0] : item.raw;
}

export function getRemainingProps(item: EnrichedItemTuple): string[] {
  return Array.isArray(item) ? item[1] : item.remainingProps;
}

export function removeRemainingProp(item: EnrichedItemTuple, prop: string): void {
  const arr = getRemainingProps(item);
  if (!arr) return;
  const idx = arr.indexOf(prop);
  if (idx !== -1) arr.splice(idx, 1);
}
