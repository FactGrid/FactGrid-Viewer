**MCP server (local) for use with Copilot Chat / Agent workflows**

This repository includes a minimal local MCP-style helper server intended to be used during local development and to integrate with tools that expect a local service exposing workspace files and command execution.

Important: this server is intended for local use only. It executes commands on your machine (with a whitelist) and exposes file contents under the project root. Do not run it on a public host.

Files added
- `scripts/mcp-server.js`: minimal Express server exposing endpoints:
  - `GET /health` - quick health check
  - `GET /file?path=relative/path` - read file (only under project root)
  - `GET /list?path=dir&recursive=true` - list files
  - `POST /exec` - execute a whitelisted command `{ "cmd": "ng serve" }` (long-running commands spawn detached)
- `scripts/mcp-config.json`: configuration (port, allowed command prefixes)
- `package.json` script: `npm run mcp:start` to launch the server

Quick start
1. From the project root, run:
```powershell
npm run mcp:start
```
2. Check health:
```powershell
curl http://127.0.0.1:8990/health
```
3. Example: read a file
```powershell
curl "http://127.0.0.1:8990/file?path=src/app/app.component.html"
```
4. Example: start `ng serve` (will be launched detached)
```powershell
curl -X POST http://127.0.0.1:8990/exec -H "Content-Type: application/json" -d '{"cmd":"ng serve --host 0.0.0.0"}'
```

Security notes
- Server binds to `127.0.0.1` by default. Check `scripts/mcp-config.json` to change port.
- Allowed commands are restricted by prefixes in `scripts/mcp-config.json`. Edit with care.
- Keep this server off public networks; use only locally.

Integration with Copilot Chat (Agent mode)
- In VS Code Copilot Chat Agent settings you can point the agent to a local MCP-type endpoint if that integration is available. Use `http://127.0.0.1:8990` as the service host/port. The agent will then be able to request file reads and command execution according to endpoints above.

If you want, I can:
- add more endpoints (streaming logs, start/stop processes),
- tighten security (JWT, socket auth),
- create an adapter that matches the exact MCP JSON-RPC spec used by your Copilot agent (if you provide the spec).
