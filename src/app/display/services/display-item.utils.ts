export type DisplayItem = any[] | { raw: any; remainingProps: string[] };

export function getEntity(item: DisplayItem): any {
  return Array.isArray(item) ? item[0] : item.raw;
}

export function getRemainingProps(item: DisplayItem): string[] {
  return Array.isArray(item) ? item[1] : item.remainingProps;
}

export function removeRemainingProp(item: DisplayItem, prop: string): void {
  const arr = getRemainingProps(item);
  if (!arr) return;
  const idx = arr.indexOf(prop);
  if (idx !== -1) arr.splice(idx, 1);
}
