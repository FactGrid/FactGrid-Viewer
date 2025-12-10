# FactGrid-Viewer — Custom instruction (pour Copilot Chat)

 - Stack : Angular 21, Angular Material, RxJS, Leaflet.
 - Note : Angular 21 renforce les patterns standalone et `signals`. Privilégier `signal`/`computed` pour l'état local quand cela reste pertinent (tests + compatibilité RxJS). 
 - Proposer patches minimaux (rsync/diff ou snippets) compatibles Angular 21.
 - Remarque : le projet est déjà sous Angular 21 — n'inclure **pas** de checklist de migration; proposez plutôt des PRs d'adoption des patterns Angular 21 (signals, standalone, OnPush) quand cela apporte une valeur.
- Générer tests unitaires simples (Jasmine/Karma) et exemples d’e2e quand nécessaire.

Conventions de code & style (attentes)
- TypeScript strict, RxJS best practices (unsubscribe/pipes).
- Respect des patterns Angular (DI, OnPush, modules).
- Tests unitaires : privilégier tests isolés via TestBed.
- Format de réponse : courte synthèse (1–3 lignes) + actions précises (commandes, snippets, patch minimal) + raison/impact + comment tester.

Contraintes & sécurité
- Ne pas proposer d’outils/commandes exposant le développement local en production (MCP/PM2). Vérifier fichiers de config avant suggestions.
- Éviter changements majeurs sans tests ; proposer étapes de rollback.

Exemples de prompts (haute valeur)
 - "Explique brièvement la responsabilité de display.component.ts et propose 3 optimisations rapides."
 - "Propose une PR pour convertir un composant à `signals` + OnPush : diff minimal et tests unitaires."
- "Voici une erreur de build X — propose un patch minimal (.diff) et les tests associés."
- "Génère 2 tests unitaires pour advanced-search.component couvrant les cas edge."

Mode d’usage
- Ouvrez le fichier ciblé dans l’éditeur pour fournir le contexte au Chat.  
- Si vous demandez un patch, fournissez la sortie d’erreur complète et l’emplacement du fichier.  
- Précisez toujours la version d’Angular et Node si différente de la valeur par défaut.

Règle pour les réponses
- Ne pas inventer d’API ni de dépendances ; valider la compatibilité avec package.json.
- Prioriser les corrections qui conservent le comportement existant tout en fixant l’erreur.
