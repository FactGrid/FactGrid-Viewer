const fs = require('fs');
const path = require('path');

function walk(dir) {
  let res = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) res = res.concat(walk(p));
    else if (p.endsWith('.html')) res.push(p);
  }
  return res;
}

const files = walk('src');
let candidates = [];
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/@if\s*\(\s*!([^\)\{]+)\s*\)\s*\{/);
    if (m) {
      const varName = m[1].trim().replace(/\s+/g, ' ');
      // find end of block roughly
      let depth = 0;
      let j = i;
      for (j = i + 1; j < lines.length; j++) {
        const l = lines[j];
        if (l.includes('{')) depth++;
        if (l.includes('}')) {
          if (depth <= 0) break;
          depth--;
        }
      }
      // j is line index of closing brace
      let k = j + 1;
      while (k < lines.length && lines[k].trim() === '') k++;
      if (k < lines.length) {
        const m2 = lines[k].match(/@if\s*\(\s*([^\)\{]+)\s*\)\s*\{/);
        if (m2) {
          const var2 = m2[1].trim().replace(/\s+/g, ' ');
          // strip parentheses maybe
          const normalize = s => s.replace(/^\(+/, '').replace(/\)+$/, '').trim();
          if (normalize(var2) === normalize(varName)) {
            candidates.push({ file, negLine: i + 1, negExpr: varName, posLine: k + 1, posExpr: var2 });
          }
        }
      }
    }
  }
}
console.log(JSON.stringify(candidates, null, 2));
