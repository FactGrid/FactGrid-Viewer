# FactGrid Viewer

Outil pour naviguer la base FactGrid (Wikibase).

AperÃ§u rapide â€” dÃ©veloppement
- Installer les dÃ©pendances : npm ci
- Lancer le serveur de dÃ©veloppement : ng serve
- Tests : npm test

(La configuration MCP / PM2 a Ã©tÃ© retirÃ©e du projet.)

DÃ©pannage automatisÃ© (exÃ©cution du script de suppression)
- ExÃ©cuter depuis la racine du dÃ©pÃ´t (PowerShell Ã©levÃ© recommandÃ©) :
  powershell -NoProfile -ExecutionPolicy Bypass -File .\remove-mcp-artifacts.ps1
- Alternative (depuis CMD) :
  .\remove-mcp-artifacts.cmd
- Si vous prÃ©fÃ©rez PowerShell Core (pwsh) :
  pwsh -NoProfile -ExecutionPolicy Bypass -File .\remove-mcp-artifacts.ps1



