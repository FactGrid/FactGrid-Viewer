#!/usr/bin/env node
const fs = require('fs');
if (process.argv.length < 4) {
  console.error('Usage: node trace-template-blocks.js <file> <startLine> <endLine>');
  process.exit(2);
}
const file = process.argv[2];
const startLine = parseInt(process.argv[3], 10);
const endLine = parseInt(process.argv[4], 10) || startLine;
let text;
try { text = fs.readFileSync(file, 'utf8'); } catch (e) { console.error('Cannot read file', file); process.exit(2); }
const lines = text.split(/\r?\n/);
const seg = lines.slice(startLine-1, endLine);
const segText = seg.join('\n');

function posToLinePos(pos) {
  let acc = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineLen = lines[i].length + 1;
    if (pos < acc + lineLen) return {line: i+1, col: pos - acc + 1};
    acc += lineLen;
  }
  return {line: lines.length, col: 1};
}

const events = [];
const regex = /@if|@for|@while|@switch|\{|\}/g;
let m;
while ((m = regex.exec(text)) !== null) {
  const p = m.index;
  const token = m[0];
  // ignore double-curly interpolations like '{{' or '}}'
  if ((token === '{' && text[p+1] === '{') || (token === '}' && text[p-1] === '}')) continue;
  const info = posToLinePos(p);
  if (info.line >= startLine && info.line <= endLine) {
    events.push({type: token, pos: p, line: info.line, col: info.col, context: lines[info.line-1].trim()});
  }
}

console.log(`Tracing events in ${file} from line ${startLine} to ${endLine}:`);
for (const e of events) {
  console.log(`${e.line.toString().padStart(4)}:${e.col.toString().padStart(3)}  ${e.type}   -> ${e.context}`);
}

// Now simulate a stack: whenever we see a directive (@if/@for/...) followed by a '{' later, push; pop on '}'
const directives = ['@if','@for','@while','@switch'];
const stack = [];
// Build a combined list of all tokens in range with their absolute index
const tokenRegex = /@if|@for|@while|@switch|\{|\}/g;
let tokens = [];
while ((m = tokenRegex.exec(text)) !== null) {
  const p = m.index;
  const token = m[0];
  // skip double-curly interpolation braces
  if ((token === '{' && text[p+1] === '{') || (token === '}' && text[p-1] === '}')) continue;
  const info = posToLinePos(p);
  if (info.line >= startLine && info.line <= endLine) {
    tokens.push({token: token, pos: p, line: info.line, col: info.col});
  }
}

console.log('\nSimulating brace stack:');
for (const t of tokens) {
  if (directives.includes(t.token)) {
    console.log(`${t.line}:${t.col}  ${t.token} (directive)`);
    // find next '{' after this pos
    const nextBrace = text.indexOf('{', t.pos);
    if (nextBrace !== -1) {
      const lb = posToLinePos(nextBrace);
      if (lb.line >= startLine && lb.line <= endLine) {
        stack.push({dir: t.token, openLine: lb.line, openCol: lb.col});
        console.log(`    => found opening '{' at ${lb.line}:${lb.col}`);
      } else {
        console.log(`    => opening '{' at ${lb.line}:${lb.col} outside range`);
        stack.push({dir: t.token, openLine: lb.line, openCol: lb.col});
      }
    } else {
      console.log('    => no opening brace found for this directive');
    }
  } else if (t.token === '{') {
    console.log(`${t.line}:${t.col}  {  (explicit brace)`);
    stack.push({dir: '{', openLine: t.line, openCol: t.col});
  } else if (t.token === '}') {
    console.log(`${t.line}:${t.col}  }  (closing)`);
    if (stack.length === 0) {
      console.log(`    >>> stray closing brace at ${t.line}:${t.col}`);
    } else {
      const popped = stack.pop();
      console.log(`    => matched with ${popped.dir} opened at ${popped.openLine}:${popped.openCol}`);
    }
  }
}

if (stack.length) {
  console.log('\nRemaining unclosed opens on stack:');
  for (const s of stack) console.log(` - ${s.dir} opened at ${s.openLine}:${s.openCol}`);
} else {
  console.log('\nNo remaining unclosed opens in range.');
}
