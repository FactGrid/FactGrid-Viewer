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
  // Prefer top-level prepared fields (label/description) which are likely already
  // language-selected upstream. Fall back to label/descriptions maps only when
  // the top-level field is not present.
  const label =
    entity.label ||
    entity.name ||
    entity.labels?.en?.value ||
    entity.labels?.fr?.value ||
    undefined;
  const description =
    entity.description ||
    entity.descriptions?.en?.value ||
    entity.descriptions?.fr?.value ||
    undefined;

  const aliases = (() => {
    if (Array.isArray(entity.aliases)) return entity.aliases;
    // If aliases are already present as a language-selected array (e.g. ['a','b'])
    // we keep them. If aliases is an object keyed by language (raw API), do NOT
    // flatten across languages here — aliases must be language-specific and
    // should be prepared earlier by SetLanguageService. Returning undefined
    // prevents mixing languages in the DisplayItem.
    if (entity.aliases && typeof entity.aliases === 'object') {
      return undefined;
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
