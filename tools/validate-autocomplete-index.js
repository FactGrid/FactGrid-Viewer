#!/usr/bin/env node
/*
 * Simple validator/normalizer for src/assets/data/autocomplete-index.json
 * usage: node tools/validate-autocomplete-index.js [--fix] [--sort] [--file path]
 * default: dry-run, will not write changes unless --fix is provided
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_FILE = path.resolve(__dirname, '../src/assets/data/autocomplete-index.json');

function usage() {
  console.log('Usage: node tools/validate-autocomplete-index.js [--fix] [--sort] [--file <path>]');
  console.log('  --fix   : apply fixes to the file');
  console.log('  --sort  : sort entries by weight desc (use with --fix if you want to persist)');
  console.log('  --file  : path to the index file (defaults to src/assets/data/autocomplete-index.json)');
}

const argv = process.argv.slice(2);
const opts = { fix: false, sort: false, file: DEFAULT_FILE };

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--fix') opts.fix = true;
  else if (a === '--sort') opts.sort = true;
  else if (a === '--file') { i++; opts.file = path.resolve(process.cwd(), argv[i]); }
  else if (a === '--help' || a === '-h') { usage(); process.exit(0); }
  else { console.error('Unknown arg:', a); usage(); process.exit(2); }
}

function normalizeLabel(s) {
  if (!s && s !== '') return '';
  // fold unicode canonical combining marks -> remove accents, downcase, trim, collapse whitespace
  return String(s)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function isQid(v) { return typeof v === 'string' && /^Q\d+$/.test(v); }
function isPid(v) { return typeof v === 'string' && /^P\d+$/.test(v); }

let raw;
try {
  raw = fs.readFileSync(opts.file, 'utf8');
} catch (e) {
  console.error('Unable to read file:', opts.file, e.message);
  process.exit(2);
}

let data;
try { data = JSON.parse(raw); } catch (e) { console.error('Invalid JSON:', e.message); process.exit(2); }

if (!Array.isArray(data)) {
  console.error('ERROR: expected top-level array in', opts.file);
  process.exit(2);
}

const errors = [];
const warnings = [];
const seenNorm = new Map(); // norm -> index

data.forEach((entry, idx) => {
  if (!entry || typeof entry !== 'object') {
    errors.push(`[${idx}] entry is not an object`);
    return;
  }

  if (!entry.label || typeof entry.label !== 'string') {
    errors.push(`[${idx}] missing or invalid 'label'`);
  }

  // ensure categories is an array of strings if present
  if ('categories' in entry) {
    if (!Array.isArray(entry.categories) || entry.categories.some(c => typeof c !== 'string')) {
      warnings.push(`[${idx}] 'categories' should be an array of strings`);
    }
  } else {
    // default to person when it looks like a name (heuristic: contains space or capital letters)
    // this is not a hard error
    // leave it alone unless --fix
  }

  // normalize label -> norm
  const generatedNorm = normalizeLabel(entry.label || '');
  if (!entry.norm || typeof entry.norm !== 'string') {
    warnings.push(`[${idx}] 'norm' missing - will generate from label`);
    entry.norm = generatedNorm;
  } else {
    // compare stored norm with generated; if different, warn
    if (normalizeLabel(entry.norm) !== generatedNorm) {
      warnings.push(`[${idx}] 'norm' differs from normalized label; will update if --fix`);
    }
  }

  // weight - ensure number
  if (!('weight' in entry)) {
    warnings.push(`[${idx}] missing 'weight' - defaulting to 1`);
    entry.weight = 1;
  } else {
    const w = Number(entry.weight);
    if (!Number.isFinite(w)) { warnings.push(`[${idx}] invalid weight '${entry.weight}' - set to 1`); entry.weight = 1; }
    else entry.weight = Math.max(0, Math.floor(w));
  }

  // id and prop sanity checks
  if ('id' in entry && entry.id != null && !isQid(entry.id)) {
    warnings.push(`[${idx}] id looks malformed: ${entry.id}`);
  }

  if ('prop' in entry && entry.prop != null && !isPid(entry.prop)) {
    warnings.push(`[${idx}] prop looks malformed: ${entry.prop}`);
  }

  // duplicates by norm (and id if set) detection
  const key = `${entry.norm}::${entry.id || ''}`;
  if (seenNorm.has(key)) {
    warnings.push(`[${idx}] duplicate entry with same norm+id as index ${seenNorm.get(key)}`);
  } else {
    seenNorm.set(key, idx);
  }
});

// final diagnostics
console.log('Validation result for:', opts.file);
if (errors.length) {
  console.error('\nErrors:');
  errors.forEach(e => console.error(' -', e));
  console.error('\nFix required. Use --fix to apply corrections where possible.');
  process.exit(3);
}

if (warnings.length) {
  console.log('\nWarnings:');
  warnings.forEach(w => console.log(' -', w));
} else {
  console.log('OK — no warnings detected.');
}

if (opts.fix) {
  // when fixing, regenerate norm consistently and optionally sort
  data.forEach(e => { e.norm = normalizeLabel(e.label || ''); if (!('weight' in e)) e.weight = 1; });
  if (opts.sort) data.sort((a,b) => b.weight - a.weight);
  try {
    fs.writeFileSync(opts.file, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log('\nFile updated:', opts.file);
  } catch (e) {
    console.error('Failed to write file:', e.message);
    process.exit(4);
  }
} else {
  console.log('\nDry run only. No files modified. Use --fix to apply updates (and --sort to sort by weight).');
}

if (warnings.length) process.exit(1);
process.exit(0);
