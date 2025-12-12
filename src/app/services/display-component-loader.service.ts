import { Injectable, ViewContainerRef, ComponentRef, SimpleChange, ChangeDetectorRef, inject } from '@angular/core';
import { SearchCacheService } from './search-cache.service';
import { SelectedLangService } from '../selected-lang.service';

/**
 * DisplayComponentLoaderService
 * 
 * Service dédié au chargement dynamique de composants dans DisplayComponent.
 * Responsabilités :
 * - Chargement lazy des composants SPARQL (5 slots)
 * - Chargement lazy des composants ItemInfo (2 slots)
 * - Cache des listes SPARQL volumineuses (>= 300 items)
 * - Retry avec exponential backoff si host pas prêt
 * - Mise à jour des inputs via setInput() ou fallback instance
 */
@Injectable({
  providedIn: 'root'
})
export class DisplayComponentLoaderService {
  private searchCache = inject(SearchCacheService);
  
  // Seuil pour cacher les listes SPARQL volumineuses
  readonly SPARQL_CACHE_THRESHOLD = 300;
  readonly MAX_SPARQL_RETRY_ATTEMPTS = 30;
  readonly MAX_ITEMINFO_RETRY_ATTEMPTS = 10;

  /**
   * Charge un composant SPARQL à l'index donné avec retry automatique.
   * Si le host n'est pas prêt, retry avec exponential backoff.
   * Met à jour le composant existant si déjà créé, sinon crée un nouveau.
   */
  async loadSparqlComponent(
    index: number,
    card: any,
    host: ViewContainerRef | undefined,
    existingRef: ComponentRef<any> | null,
    langService: SelectedLangService,
    itemId: string,
    cdr: ChangeDetectorRef,
    attempt = 0
  ): Promise<ComponentRef<any> | null> {
    try {
      // Le host peut ne pas être présent immédiatement (Angular traite @if async)
      if (!host) {
        if (attempt < this.MAX_SPARQL_RETRY_ATTEMPTS) {
          // Force change detection
          try {
            cdr.detectChanges();
          } catch {}
          // Exponential backoff: 50ms * 1.5^attempt (capped at 500ms)
          const delay = Math.min(500, 50 * Math.pow(1.5, Math.min(attempt, 10)));
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.loadSparqlComponent(index, card, host, existingRef, langService, itemId, cdr, attempt + 1);
        }
        return null;
      }

      // Si composant existant, on met à jour ses inputs
      if (existingRef) {
        this.updateSparqlComponentInputs(existingRef, index, card, langService);
        this.cacheSparqlDataIfLarge(itemId, index, card);
        return existingRef;
      }

      // Créer un nouveau composant
      host.clear();
      const module = await import('../display/sparql-display/sparql-display.component');
      const Comp = module.SparqlDisplayComponent;
      const ref = host.createComponent(Comp);

      this.updateSparqlComponentInputs(ref, index, card, langService);
      this.cacheSparqlDataIfLarge(itemId, index, card);

      try {
        cdr.detectChanges();
      } catch {}

      return ref;
    } catch (e) {
      // Swallow import error
      return null;
    }
  }

  /**
   * Met à jour les inputs d'un composant SPARQL existant.
   * Utilise setInput() si disponible (Ivy), sinon fallback sur instance assignment + ngOnChanges.
   */
  private updateSparqlComponentInputs(
    ref: ComponentRef<any>,
    index: number,
    card: any,
    langService: SelectedLangService
  ): void {
    try {
      if (card) {
        // Préférer setInput() (Ivy)
        if (typeof (ref as any).setInput === 'function') {
          (ref as any).setInput('sparqlType', `sparql${index}`);
          (ref as any).setInput('sparqlData', card.list);
          (ref as any).setInput('sparqlSubject', card.subject);
          (ref as any).setInput('langService', langService);
          (ref as any).setInput('parentTitle', card.title);
        } else {
          // Fallback: assign + manual ngOnChanges
          const prevData = ref.instance.sparqlData;
          const prevSubject = ref.instance.sparqlSubject;

          ref.instance.sparqlType = `sparql${index}`;
          ref.instance.sparqlData = card.list;
          ref.instance.sparqlSubject = card.subject;
          ref.instance.langService = langService;
          ref.instance.parentTitle = card.title;

          const changes: any = {
            sparqlData: new SimpleChange(prevData, card.list, false),
            sparqlSubject: new SimpleChange(prevSubject, card.subject, false)
          };

          try {
            if (typeof ref.instance.ngOnChanges === 'function') {
              ref.instance.ngOnChanges(changes);
            }
          } catch {}

          try {
            ref.changeDetectorRef.detectChanges();
          } catch {}
        }
      } else {
        // Pas de card -> clear data
        if (typeof (ref as any).setInput === 'function') {
          (ref as any).setInput('sparqlData', []);
          (ref as any).setInput('sparqlSubject', undefined);
        } else {
          ref.instance.sparqlData = [];
          ref.instance.sparqlSubject = '';
          try {
            if (typeof ref.instance.ngOnChanges === 'function') {
              ref.instance.ngOnChanges({
                sparqlData: new SimpleChange(undefined, [], false)
              });
            }
          } catch {}
          try {
            ref.changeDetectorRef.detectChanges();
          } catch {}
        }
      }
    } catch (e) {
      // Ignore update failures
    }
  }

  /**
   * Cache les listes SPARQL volumineuses (>= threshold) pour restauration rapide.
   */
  private cacheSparqlDataIfLarge(itemId: string, index: number, card: any): void {
    try {
      if (
        card &&
        card.list &&
        Array.isArray(card.list) &&
        card.list.length >= this.SPARQL_CACHE_THRESHOLD &&
        itemId
      ) {
        const key = `${itemId}::${index}::${card.subject || ''}`;
        this.searchCache.setItem(
          key,
          { list: card.list, subject: card.subject, title: card.title },
          undefined,
          undefined
        );
      }
    } catch {}
  }

  /**
   * Tente de charger les composants SPARQL depuis le cache pour un itemId donné.
   * Retourne un tableau de cards à charger.
   */
  getCachedSparqlCards(itemId: string, maxSlots = 5): Array<{ index: number; card: any }> {
    const results: Array<{ index: number; card: any }> = [];
    if (!itemId) return results;

    for (let idx = 0; idx < maxSlots; idx++) {
      try {
        const prefix = `${itemId}::${idx}::`;
        const cached: any = this.searchCache.getItemByPrefix(prefix);
        if (cached && cached.list && cached.list.length) {
          results.push({
            index: idx,
            card: {
              subject: cached.subject || '',
              list: cached.list,
              title: cached.title || ''
            }
          });
        }
      } catch {}
    }

    return results;
  }

  /**
   * Charge un composant ItemInfo à l'index donné (0 ou 1) avec retry automatique.
   */
  async loadItemInfoComponent(
    index: number,
    host: ViewContainerRef | undefined,
    existingRef: ComponentRef<any> | null,
    infoList: any,
    cdr: ChangeDetectorRef,
    attempt = 0
  ): Promise<ComponentRef<any> | null> {
    try {
      if (!host) {
        if (attempt < this.MAX_ITEMINFO_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, 60));
          return this.loadItemInfoComponent(index, host, existingRef, infoList, cdr, attempt + 1);
        }
        return null;
      }

      // Pas d'info à afficher
      if (!infoList || (Array.isArray(infoList) && infoList.length === 0)) {
        return null;
      }

      // Déjà chargé
      if (existingRef) {
        return existingRef;
      }

      host.clear();
      const module = await import('../display/item-info/item-info.component');
      const Comp = module.ItemInfoComponent;
      const ref = host.createComponent(Comp);

      try {
        if (typeof (ref as any).setInput === 'function') {
          (ref as any).setInput('infoList', infoList);
        } else {
          ref.instance.infoList = infoList;
          try {
            ref.changeDetectorRef.detectChanges();
          } catch {}
        }
      } catch {}

      try {
        cdr.detectChanges();
      } catch {}

      return ref;
    } catch (e) {
      // Swallow import error
      return null;
    }
  }

  /**
   * Détruit proprement un tableau de ComponentRefs.
   */
  destroyComponentRefs(refs: Array<ComponentRef<any> | null>): void {
    refs.forEach((ref) => {
      try {
        ref?.destroy();
      } catch {}
    });
  }

  /**
   * Clear les hosts d'un tableau de ViewContainerRef.
   */
  clearHosts(hosts: Array<ViewContainerRef | undefined>): void {
    hosts.forEach((host) => {
      try {
        host?.clear();
      } catch {}
    });
  }
}
