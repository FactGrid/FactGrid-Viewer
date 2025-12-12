# FactGrid Viewer

A tool for browsing the FactGrid database (Wikibase).

**Live Demo**: [https://factgrid.github.io/FactGrid-Viewer](https://factgrid.github.io/FactGrid-Viewer)

## Quick Start — Development

- **Install dependencies**: `npm ci`
- **Start development server**: `ng serve`
- **Run tests**: `npm test` (Vitest)

### Testing (Developer vs CI mode)

By default, `npm test` runs Vitest (configured via `vitest.config.ts`).

**Useful commands:**
- `npm test` — Runs Vitest in CI mode (run + coverage) by default
- `npm run test:watch` — Launches Vitest in watch mode for development
- `npm run test:ci` — Runs Vitest in run + coverage mode for CI pipelines
- `npm run test:once` — Runs tests once without coverage

When running tests in this session, I will explicitly indicate the `npm run test:once` (or `npm run test:ci`) command so you can reuse it locally.

_(MCP / PM2 configuration has been removed from the project.)_

---

## Documentation

- **Project Architecture**: [`PROJECT-ARCHITECTURE.md`](PROJECT-ARCHITECTURE.md) — Comprehensive presentation of the architecture, data flows, and main features.
- **Dispatcher / Item Display**: `docs/dispatcher.md` — Guide explaining how the dispatcher works, P2 detection, and how to add a conditional block (e.g., activity).
- **Technical Documentation**: `documentation/` — Generated via Compodoc (`npm run compodoc:serve`).

---

## Automated Troubleshooting (Artifact Cleanup Script)

Run from the repository root (elevated PowerShell recommended):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\remove-mcp-artifacts.ps1
```

**Alternative (from CMD)**:
```cmd
.\remove-mcp-artifacts.cmd
```

**PowerShell Core (pwsh)**:
```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\remove-mcp-artifacts.ps1
```

---

## Using GitHub Copilot with llms.txt

1. Install the GitHub Copilot extension (and Copilot Chat if needed) in VS Code
2. Open this workspace in VS Code and accept the extension recommendations (see `.vscode/extensions.json`)
3. Grant Copilot access to the repository (Settings → Extensions → GitHub Copilot → Repository access)
4. Open the `llms.txt` file in the editor: Copilot / Copilot Chat will use this content as local context for suggestions if the extension has authorization
5. For Copilot Chat: start a session and explicitly ask "Consult the llms.txt file and summarize the context" — the local agent will read the file open in the workspace

**Note**: The remote agent or service will only read this file if you explicitly provide the content or if the repository indexing tool is configured to include workspace files.

---

## Additional Development Commands

```bash
# Production
npm run build          # Production build
npm start             # Start server.js (Node Express)

# Code Quality
npm run lint          # ESLint check
npm run lint:fix      # Auto-fix linting issues
npm run format        # Prettier formatting

# End-to-End Testing
npm run e2e           # Run E2E tests

# Documentation
npm run compodoc      # Generate documentation
npm run compodoc:serve # Generate and serve documentation

# Theming
npm run theme         # Interactive theme picker
npm run theme:default # Apply default theme
npm run theme:blue-orange # Apply blue-orange palette
npm run theme:preview # Preview all themes
```

---

## Project Requirements

- **Node.js**: >= 18.0.0 LTS
- **npm**: >= 9.0.0
- **Angular CLI**: 21.0.2

See `package.json` for complete dependency list.

---

## Contributing

Please read the architecture documentation in [`PROJECT-ARCHITECTURE.md`](PROJECT-ARCHITECTURE.md) before contributing. For specific guidance on adding features, see `docs/dispatcher.md`.

---

## License

See LICENSE file for details.




