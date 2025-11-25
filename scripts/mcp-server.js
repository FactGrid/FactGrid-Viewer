#!/usr/bin/env node
const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const cors = require('cors');

const root = process.cwd();
const cfgPath = path.join(root, 'scripts', 'mcp-config.json');
const cfg = fs.existsSync(cfgPath) ? JSON.parse(fs.readFileSync(cfgPath, 'utf8')) : { port: 8990, hostOnly: true, allowedCommandPrefixes: ['ng ', 'npm run ', 'node '] };

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: cfg.hostOnly ? ['http://localhost', 'http://127.0.0.1'] : true }));

app.get('/health', (req, res) => res.json({ status: 'ok', pid: process.pid }));

// Read a file within the project safely
app.get('/file', (req, res) => {
  const rel = req.query.path;
  if (!rel) return res.status(400).json({ error: 'path query parameter required' });
  const abs = path.resolve(root, rel);
  if (!abs.startsWith(root)) return res.status(403).json({ error: 'access denied' });
  if (!fs.existsSync(abs)) return res.status(404).json({ error: 'not found' });
  const stat = fs.statSync(abs);
  if (stat.isDirectory()) return res.status(400).json({ error: 'path is a directory' });
  const content = fs.readFileSync(abs, 'utf8');
  res.json({ path: rel, content });
});

// List files under a directory (non-recursive by default, optional recursive=true)
app.get('/list', (req, res) => {
  const rel = req.query.path || '.';
  const recursive = req.query.recursive === 'true';
  const abs = path.resolve(root, rel);
  if (!abs.startsWith(root)) return res.status(403).json({ error: 'access denied' });
  if (!fs.existsSync(abs)) return res.status(404).json({ error: 'not found' });
  const results = [];
  function walk(dir) {
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of list) {
      const p = path.join(dir, ent.name);
      const relp = path.relative(root, p).split(path.sep).join('/');
      results.push({ path: relp, isDirectory: ent.isDirectory() });
      if (recursive && ent.isDirectory()) walk(p);
    }
  }
  if (fs.statSync(abs).isDirectory()) {
    walk(abs);
    return res.json({ base: rel, files: results });
  }
  return res.status(400).json({ error: 'path must be a directory' });
});

// Execute a command (restricted to allowed prefixes). For long-running commands like `ng serve`
// it will spawn a detached process and return the pid; for short commands it will run and return stdout.
app.post('/exec', (req, res) => {
  const { cmd } = req.body || {};
  if (!cmd || typeof cmd !== 'string') return res.status(400).json({ error: 'cmd string required' });
  const allowed = cfg.allowedCommandPrefixes || [];
  const ok = allowed.some((p) => cmd.startsWith(p));
  if (!ok) return res.status(403).json({ error: 'command not allowed' });

  // If command contains 'serve' we'll spawn detached to allow long running
  const isLong = /serve|watch|--watch/.test(cmd);
  if (isLong) {
    try {
      const child = spawn(cmd, { shell: true, detached: true, stdio: 'ignore', cwd: root });
      child.unref();
      return res.json({ status: 'started', pid: child.pid });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // Short lived command: run and capture output
  const child = spawn(cmd, { shell: true, cwd: root });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (d) => (stdout += d.toString()));
  child.stderr.on('data', (d) => (stderr += d.toString()));
  child.on('close', (code) => {
    res.json({ code, stdout, stderr });
  });
});

const port = cfg.port || 8990;
app.listen(port, '127.0.0.1', () => {
  console.log(`MCP server listening on http://127.0.0.1:${port}`);
  console.log('Endpoints: GET /health, GET /file?path=..., GET /list?path=.&recursive=true, POST /exec {cmd}');
});
