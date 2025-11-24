#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

if (process.argv.length < 3) {
  console.error('Usage: node check-template-blocks.js <file>');
  process.exit(2);
}

const file = process.argv[2];
let text;
try {
  text = fs.readFileSync(file, 'utf8');
} catch (e) {
  console.error('Cannot read file', file, e.message);
  process.exit(2);
}

// Normalize line endings and build line map
const lines = text.split(/\r?\n/);
function posToLine(pos) {
  let acc = 0;
  for (let i = 0; i < lines.length; i++) {
    acc += lines[i].length + 1; // +1 for newline
    if (pos < acc) return i + 1;
  }
  return lines.length;
}

const directives = ['@if', '@for', '@while', '@switch'];

// Find all directive starts
const starts = [];
for (const d of directives) {
  let idx = 0;
  while (true) {
    idx = text.indexOf(d, idx);
    if (idx === -1) break;
    // ensure it's a standalone word-ish (next char is whitespace or '(')
    const next = text[idx + d.length];
    if (!next || /[\s(]/.test(next)) {
      starts.push({ dir: d, pos: idx });
    }
    idx += d.length || 1;
  }
}

// Sort starts by position
starts.sort((a,b)=>a.pos-b.pos);

const problems = [];

for (const s of starts) {
  // find first '{' after the directive
  const bracePos = text.indexOf('{', s.pos);
  if (bracePos === -1) {
    problems.push({type: 'no-opening-brace', dir: s.dir, pos: s.pos, line: posToLine(s.pos)});
    continue;
  }
  // Now scan from bracePos forward to match braces
  let depth = 0;
  let i = bracePos;
  let matched = false;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        matched = true;
        break;
      }
    }
  }
  if (!matched) {
    problems.push({type: 'unclosed-block', dir: s.dir, pos: s.pos, line: posToLine(s.pos)});
  }
}

// Additionally detect stray closing braces '}' that are not matched by any directive-brace pairing
// Build an array of all brace ranges matched for directives
const matchedRanges = [];
for (const s of starts) {
  const bracePos = text.indexOf('{', s.pos);
  if (bracePos === -1) continue;
  // find matching
  let depth = 0;
  let i = bracePos;
  let matched = false;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        matchedRanges.push({start: bracePos, end: i});
        matched = true;
        break;
      }
    }
  }
}

function inAnyRange(pos) {
  for (const r of matchedRanges) if (pos > r.start && pos < r.end) return true;
  return false;
}

for (let i=0;i<text.length;i++){
  if (text[i] === '}'){
    // is this closing brace inside some matched range? If not, it may be stray
    if (!inAnyRange(i)) {
      problems.push({type:'stray-closing-brace', pos:i, line: posToLine(i)});
    }
  }
}

if (problems.length === 0) {
  console.log('No unclosed @if/@for/@while/@switch blocks detected by this heuristic.');
  process.exit(0);
}

console.log('Detected potential problems:');
for (const p of problems) {
  if (p.type === 'no-opening-brace') console.log(`- ${p.dir} at line ${p.line}: no opening '{' found after directive.`);
  else if (p.type === 'unclosed-block') console.log(`- ${p.dir} at line ${p.line}: block seems not closed (unmatched '{').`);
  else if (p.type === 'stray-closing-brace') console.log(`- stray closing '}' at line ${p.line}.`);
}

// For convenience, print a small context around reported lines
console.log('\nContext (3 lines around each reported line):\n');
for (const p of problems) {
  const l = Math.max(1, (p.line || posToLine(p.pos)) - 3);
  const r = Math.min(lines.length, (p.line || posToLine(p.pos)) + 3);
  console.log(`--- Around line ${(p.line || posToLine(p.pos))} ---`);
  for (let ln = l; ln <= r; ln++) {
    const mark = ln === (p.line || posToLine(p.pos)) ? '>>' : '  ';
    const txt = lines[ln-1];
    console.log(`${mark} ${ln.toString().padStart(4)} | ${txt}`);
  }
  console.log('');
}

process.exit(0);
