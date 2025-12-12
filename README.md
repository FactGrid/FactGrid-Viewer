# FactGrid Viewer

Outil pour naviguer la base FactGrid (Wikibase).

AperÃ§u rapide â€” dÃ©veloppement
- Installer les dÃ©pendances : npm ci
- Lancer le serveur de dÃ©veloppement : ng serve
 Tests : npm test (Vitest) 
 Note sur les tests (mode développeur vs CI):
 Par défaut `npm test` exécute Vitest (défini via `vitest.config.ts`).
 Commandes utiles :
   - `npm test` — exécute Vitest en mode CI (run + coverage) par défaut.
   - `npm run test:watch` — lance Vitest en mode watch pour le développement.
   - `npm run test:ci` — lance Vitest en mode run + coverage pour les pipelines CI.
  - `npm run test:ci` — même comportement, prévu pour les environnements CI.

Quand je lance les tests pour toi dans cette session, je t'indiquerai explicitement la commande `npm run test:once` (ou `npm run test:ci`) pour que tu puisses la réutiliser localement.

(La configuration MCP / PM2 a Ã©tÃ© retirÃ©e du projet.)

Documentation
-------------
- **Architecture du projet** : [`PROJECT-ARCHITECTURE.md`](PROJECT-ARCHITECTURE.md) — présentation complète de l'architecture, des flux de données, et des fonctionnalités principales (en anglais).
- Dispatcher / affichage des items : `docs/dispatcher.md` — guide expliquant le fonctionnement du dispatcher, la détection P2, et comment ajouter un bloc conditionnel (p.ex. activité).
- Documentation technique : `documentation/` — générée via Compodoc (`npm run compodoc:serve`).

DÃ©pannage automatisÃ© (exÃ©cution du script de suppression)
- ExÃ©cuter depuis la racine du dÃ©pÃ´t (PowerShell Ã©levÃ© recommandÃ©) :
  powershell -NoProfile -ExecutionPolicy Bypass -File .\remove-mcp-artifacts.ps1
- Alternative (depuis CMD) :
  .\remove-mcp-artifacts.cmd
- Si vous prÃ©fÃ©rez PowerShell Core (pwsh) :
  pwsh -NoProfile -ExecutionPolicy Bypass -File .\remove-mcp-artifacts.ps1

Utiliser GitHub Copilot avec llms.txt
- Installer l'extension GitHub Copilot (et Copilot Chat si besoin) dans VS Code.
- Ouvrir ce workspace dans VS Code et accepter la recommandation d'extensions (Voir .vscode/extensions.json).
- Donner à Copilot l'accès au dépôt (Settings → Extensions → GitHub Copilot → Repository access).
- Ouvrir le fichier llms.txt dans l'éditeur : Copilot / Copilot Chat utilisera ce contenu comme contexte local pour les suggestions si l'extension a l'autorisation.
- Pour Copilot Chat : commencer une session (Copilot Chat) et demander explicitement "Consulte le fichier llms.txt et résume le contexte" — l'agent local lira le fichier ouvert dans le workspace.
- Remarque : l'agent ou service distant ne lira ce fichier que si vous lui fournissez explicitement le contenu ou si l'outil d'indexation du dépôt est configuré pour inclure les fichiers workspace.




