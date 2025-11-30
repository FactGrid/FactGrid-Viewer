# FactGrid-Viewer — Custom instruction (pour Copilot Chat)

But du projet (1 phrase)
- Interface Angular 20 pour consulter et naviguer la base FactGrid (Wikibase).

Contexte technique essentiel
- Stack : Angular 20, Angular Material, RxJS, Leaflet.
- Environnement attendu : Node LTS (ex. v20.x). CI : .github/workflows/ci.yml.
- Entrées clés pour l’analyse : src/app/display/display.component.ts, src/app/search/, src/app/services/request.service.ts, src/styles.scss, package.json.

Objectifs pour l’agent
- Diagnostiquer et corriger rapidement les erreurs de build / runtime.
- Proposer patches minimaux (rsync/diff ou snippets) compatibles Angular 20.
- Suggérer optimisations (taille des chunks, performances, accessibilité).
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
- "Voici une erreur de build X — propose un patch minimal (.diff) et les tests associés."
- "Génère 2 tests unitaires pour advanced-search.component couvrant les cas edge."

Mode d’usage
- Ouvrez le fichier ciblé dans l’éditeur pour fournir le contexte au Chat.  
- Si vous demandez un patch, fournissez la sortie d’erreur complète et l’emplacement du fichier.  
- Précisez toujours la version d’Angular et Node si différente de la valeur par défaut.

Règle pour les réponses
- Ne pas inventer d’API ni de dépendances ; valider la compatibilité avec package.json.
- Prioriser les corrections qui conservent le comportement existant tout en fixant l’erreur.
