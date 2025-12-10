import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BatchAskResult, SparqlTuple } from '../sparql-types';

/**
 * Interface pour les stratégies de requêtes SPARQL.
 * Chaque stratégie correspond à un type d'item spécifique (Organisation, Career, Location, etc.).
 */
export interface SparqlQueryStrategy {
  /**
   * Identifiant unique de la stratégie (ex: 'Q12', 'Q37073', 'Q8').
   */
  readonly id: string;

  /**
   * Priorité d'application (plus élevée = plus prioritaire).
   * Utilisée pour résoudre les conflits quand plusieurs stratégies matchent.
   */
  readonly priority: number;

  /**
   * Teste si cette stratégie s'applique à l'item donné.
   */
  test(flags: BatchAskResult, item: any): boolean;

  /**
   * Exécute la requête SPARQL pour cet item.
   */
  query(item: any): Observable<SparqlTuple>;
}

/**
 * Service de résolution du type d'item et mappage vers stratégies SPARQL.
 * Centralise la logique de détection (Q8, Q12, Q37073, etc.) et remplace les cascades if/else.
 */
@Injectable({
  providedIn: 'root',
})
export class ItemTypeResolverService {
  private strategies = new Map<string, SparqlQueryStrategy>();

  /**
   * Enregistre une stratégie.
   */
  registerStrategy(strategy: SparqlQueryStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  /**
   * Enregistre plusieurs stratégies.
   */
  registerStrategies(strategies: SparqlQueryStrategy[]): void {
    strategies.forEach(s => this.registerStrategy(s));
  }

  /**
   * Récupère une stratégie par son ID.
   */
  getStrategy(id: string): SparqlQueryStrategy | undefined {
    return this.strategies.get(id);
  }

  /**
   * Trouve la stratégie applicable avec la plus haute priorité.
   * Retourne undefined si aucune stratégie ne matche.
   */
  resolveStrategy(flags: BatchAskResult, item: any): SparqlQueryStrategy | undefined {
    const matching = Array.from(this.strategies.values())
      .filter(s => s.test(flags, item))
      .sort((a, b) => b.priority - a.priority); // Tri par priorité décroissante

    return matching[0];
  }

  /**
   * Trouve toutes les stratégies applicables, triées par priorité.
   */
  resolveAllStrategies(flags: BatchAskResult, item: any): SparqlQueryStrategy[] {
    return Array.from(this.strategies.values())
      .filter(s => s.test(flags, item))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Liste toutes les stratégies enregistrées.
   */
  getAllStrategies(): SparqlQueryStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Supprime toutes les stratégies (utile pour tests).
   */
  clear(): void {
    this.strategies.clear();
  }
}
