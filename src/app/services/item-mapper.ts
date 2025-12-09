import { DisplayItem } from './item-types';

/**
 * Map an entity object returned by wbgetentities (GetEntitiesResponse.entities[id])
 * to a compact, UI-friendly DisplayItem.
 *
 * The mapper intentionally keeps a minimal public surface and stores the rest
 * of the entity in `extra` so we can migrate callers safely.
 */
export function mapEntityToDisplayItem(entity: any, sourceProject?: string): DisplayItem {
  if (!entity) return { id: '', label: undefined };

  const id = entity.id || entity.pageid || entity.title || '';

  // label / description / aliases appear either at top-level or in label/description maps
  const label = entity.labels?.en?.value || entity.labels?.fr?.value || entity.label || entity.name || undefined;
  const description =
    entity.descriptions?.en?.value || entity.descriptions?.fr?.value || entity.description || undefined;

  const aliases = (() => {
    if (Array.isArray(entity.aliases)) return entity.aliases;
    if (entity.aliases && typeof entity.aliases === 'object') {
      // entity.aliases: { en: [{...}], fr: [{...}] }
      const flat: string[] = [];
      for (const lang of Object.keys(entity.aliases)) {
        const arr = entity.aliases[lang] || [];
        for (const a of arr) flat.push(a?.value || a || '');
      }
      return flat.filter(Boolean);
    }
    return undefined;
  })();

  // try to find a candidate image in sitelinks or claims (best-effort)
  let bestImageUrl: string | undefined;
  if (entity.sitelinks && entity.sitelinks.commonswiki) {
    const title = entity.sitelinks.commonswiki.title?.replace(' ', '_');
    if (title) bestImageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${title}`;
  }

  // attempt to pull instance-of / types from claims.P31 or types
  const classes: { id: string; label?: string }[] = [];
  try {
    const instanceOf = entity.claims?.P31 || entity.instanceOf || [];
    for (const it of instanceOf) {
      const idVal = it?.mainsnak?.datavalue?.value?.id || it?.id || it?.value?.id || undefined;
      const lbl = it?.mainsnak?.label || it?.label || undefined;
      if (idVal) classes.push({ id: idVal, label: lbl });
    }
  } catch (e) {
    // ignore
  }

  const out: DisplayItem = {
    id,
    label,
    description,
    aliases,
    project: sourceProject,
    bestImageUrl,
    classes: classes.length ? classes : undefined,
    extra: { rawEntity: entity },
  };

  return out;
}

export default mapEntityToDisplayItem;
