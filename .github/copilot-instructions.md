# GitHub Copilot / AI agent instructions — FactGrid-Viewer

But rapide
- UI Angular (v20) pour naviguer la base FactGrid (Wikibase).

Contexte technique clé (important pour l'agent)
- Stack : Angular 20 (standalone components), Angular Material, RxJS, Leaflet.
- Node LTS recommandé (>=18). Voir `package.json` (engines).
- Principal point d'accès pour compréhension : `src/app/display/display.component.ts` (vue principale / layout).
- Autres entrées cruciales : `src/app/search/` (recherche / advanced-search), `src/app/services/request.service.ts` (intégration FactGrid / SPARQL / téléchargement).

Workflows développeur (à proposer en actions courtes)
- Installation propre : `npm ci` (ou `npm install` si vous devez resynchroniser le lockfile).
- Dev server : `ng serve` (ou via la task "Dev: start frontend").
- Build production : `npm run build`.
- Tests unitaires : `npm test` (Karma + Jasmine). E2E : `npm run e2e` (Protractor).
- Linting : `npm run lint` / `npm run lint:fix`. Docs: `npm run compodoc`.
- Production start script: `npm start` (execute `node server.js`) — attention, évitez d'exposer PM2/MCP en prod (fichiers `remove-mcp-artifacts.*` fournis pour dépanner).

Patterns et conventions spécifiques au projet
- Composants standalone (Angular 20) — voir `@Component({ standalone: true, imports: [...] })` dans `display.component.ts`.
- Injection moderne : mélange d'`inject()` (propriété) et `constructor` pour `ChangeDetectorRef`.
- RxJS : code hérite d'un style mixte — `async` pipe est utilisé dans plusieurs cas (SPARQL cards), mais on trouve de nombreuses subscriptions manuelles et un OnDestroy qui désabonne explicitement. Préférer l'`async` pipe / takeUntil quand possible pour les nouvelles modifications.
- Services réseau : `RequestService` centralise appels à `https://database.factgrid.de` (API MediaWiki / SPARQL). Il gère téléchargements via `file-saver` et pagination via RxJS `expand`.
- Sécurité / DOM : `display.component.ts` utilise `DomSanitizer.bypassSecurityTrustUrl` et crée des éléments DOM (`preloadImage`) — l'agent doit signaler modifications de sécurité et proposer tests.

Intégrations externes visibles
- FactGrid MediaWiki API (`/w/api.php`) et endpoint SPARQL (`/query/sparql`).
- Fichiers téléchargés via `file-saver` (CSV). CORS géré côté back avec `origin=*` dans les requêtes.

Conseils pratiques pour la résolution de bugs et PRs
- Lire `llms.txt`, `COPILOT_CUSTOM_INSTRUCTION.md` et `README.md` (ils donnent contexte et priorités locales).
- Rechercher `standalone: true` composants quand on modifie imports/DI (risque de doubling de dépendances).
- Pour erreurs de build runtime liées à RxJS/Observable: vérifier si `async` pipe peut remplacer `subscribe`/`unsubscribe` et si OnPush / ChangeDetection est impliqué.
- Pour régressions UI : préférer reproduire localement `ng serve`, puis écrire test(s) unitaires ciblés (TestBed) avant de proposer changements.

- Please consult the Angular Material & CDK documentation (Sidenav, Overlay, Theming, Accessibility) before changing or implementing Material components.

Exemples de prompts à utiliser avec l'agent
- "Fais un patch minimal pour corriger l'erreur X dans `src/app/display/display.component.ts` (donne le diff et un test Jasmine correspondant)."
- "Génère 2 tests unitaires pour `advanced-search.component` qui couvrent sélection d'un item et comportement en cas d'absence de résultats."
- "Propose une petite optimisation de bundle pour `display.component` (fichiers à lazy load / refactor) et explique l'impact sur la taille des chunks."

Ce fichier doit rester court et pragmatique — mettre à jour après toute modification d'architecture ou changement de la stack.
