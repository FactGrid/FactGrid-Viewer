const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'styles', 'overlay-search.scss');
const content = fs.readFileSync(file, 'utf8');

const mediaBlockIndex = content.indexOf('@media (max-width: 700px)');
const matches = [...content.matchAll(/left\s*:\s*50%/g)];

if (matches.length === 0) {
  console.error('No occurrences of "left: 50%" found in overlay-search.scss — nothing to check.');
  process.exit(2);
}

const outside = matches.filter((m) => m.index < mediaBlockIndex || mediaBlockIndex === -1);

if (outside.length > 0) {
  console.error(`Found ${outside.length} occurrence(s) of "left: 50%" outside the mobile media query in overlay-search.scss.`);
  outside.forEach((m, idx) => {
    console.error(`  #${idx + 1}: position ${m.index}`);
  });
  process.exit(1);
}

console.log('OK: all "left: 50%" occurrences are located inside the mobile media query.');
process.exit(0);
