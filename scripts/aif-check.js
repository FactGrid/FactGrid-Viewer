#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const configPath = path.join(root, 'aif.json');
if (!fs.existsSync(configPath)) {
  console.error('Missing aif.json in project root.');
  process.exit(2);
}
const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function globToRegex(glob) {
  // very small glob -> regex converter for patterns like src/**/*.component.html
  let s = glob.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
  s = s.replace(/\\\*\\\*\\\//g, '(?:.*\\/)');
  s = s.replace(/\\\*\\\*/g, '.*');
  s = s.replace(/\\\*/g, '[^\\/]*');
  return new RegExp('^' + s + '$');
}

function walk(dir, files) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of list) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else files.push(p);
  }
}

const includes = cfg.convertGlobs || ['src/**/*.component.html', 'src/**/*.html'];
const excludes = cfg.excludeGlobs || [];

const allFiles = [];
walk(root, allFiles);

function matchAny(file, patterns) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  for (const pat of patterns) {
    const re = globToRegex(pat);
    if (re.test(rel)) return true;
  }
  return false;
}

const targets = allFiles.filter((f) => {
  if (!matchAny(f, includes)) return false;
  if (matchAny(f, excludes)) return false;
  return true;
});

const ngRegex = /\*ngIf|\*ngFor/;
const forParenRegex = /@for\s*\(([^)]*)\)/g;

let problems = 0;
for (const f of targets) {
  const ext = path.extname(f).toLowerCase();
  if (!['.html', '.htm'].includes(ext)) continue;
  const text = fs.readFileSync(f, 'utf8');
  const rel = path.relative(root, f);
  if (ngRegex.test(text)) {
    console.log(`Found legacy ng directive in ${rel}`);
    problems++;
  }
  let match;
  while ((match = forParenRegex.exec(text)) !== null) {
    const inside = match[1];
    if (!/(?:^|;|\s)track\b/.test(inside)) {
      console.log(`@for without track in ${rel}: "@for(${inside.trim()})"`);
      problems++;
    }
  }
}

if (problems > 0) {
  console.error(`Found ${problems} issue(s).`);
  process.exit(1);
}
console.log('No issues found.');
process.exit(0);
