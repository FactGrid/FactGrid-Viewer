#!/usr/bin/env node

/**
 * Script pour changer facilement de palette de couleurs
 * Usage: node switch-palette.js [numéro de palette]
 * Exemple: node switch-palette.js 2
 */

const fs = require('fs');
const path = require('path');

const THEME_FILE = path.join(__dirname, 'src', 'app', 'display', '_theme-variables.scss');

const PALETTES = {
  '0': {
    name: 'Bleu Indigo / Rose (défaut)',
    primary: '#283593',
    primaryLight: '#3F51B5',
    primaryDark: '#1a237e',
    accent: '#AD1457',
    accentLight: '#c2185b'
  },
  '1': {
    name: 'Bleu Académique / Orange',
    primary: '#1e3a8a',
    primaryLight: '#3b82f6',
    primaryDark: '#1e40af',
    accent: '#ea580c',
    accentLight: '#f97316'
  },
  '2': {
    name: 'Vert Forêt / Ambre',
    primary: '#065f46',
    primaryLight: '#059669',
    primaryDark: '#064e3b',
    accent: '#d97706',
    accentLight: '#f59e0b'
  },
  '3': {
    name: 'Violet Profond / Cyan',
    primary: '#5b21b6',
    primaryLight: '#7c3aed',
    primaryDark: '#4c1d95',
    accent: '#0891b2',
    accentLight: '#06b6d4'
  },
  '4': {
    name: 'Bleu Marine / Corail',
    primary: '#0c4a6e',
    primaryLight: '#0284c7',
    primaryDark: '#075985',
    accent: '#dc2626',
    accentLight: '#ef4444'
  },
  '5': {
    name: 'Bordeaux / Or',
    primary: '#7f1d1d',
    primaryLight: '#b91c1c',
    primaryDark: '#991b1b',
    accent: '#ca8a04',
    accentLight: '#eab308'
  }
};

function showHelp() {
  console.log('\n🎨 FactGrid Viewer - Changeur de Palette\n');
  console.log('Usage: node switch-palette.js [numéro]\n');
  console.log('Palettes disponibles:');
  Object.keys(PALETTES).forEach(key => {
    console.log(`  ${key}: ${PALETTES[key].name}`);
  });
  console.log('\nExemple: node switch-palette.js 2');
  console.log('         (change pour la palette Vert Forêt / Ambre)\n');
}

function switchPalette(paletteNumber) {
  if (!PALETTES[paletteNumber]) {
    console.error(`❌ Erreur: La palette ${paletteNumber} n'existe pas.`);
    showHelp();
    process.exit(1);
  }

  const palette = PALETTES[paletteNumber];

  try {
    let content = fs.readFileSync(THEME_FILE, 'utf8');

    // Expression régulière pour trouver et remplacer les valeurs de couleur
    const patterns = [
      { regex: /\$primary-color:\s*#[0-9a-fA-F]{6};/, value: `$primary-color: ${palette.primary};` },
      { regex: /\$primary-light:\s*#[0-9a-fA-F]{6};/, value: `$primary-light: ${palette.primaryLight};` },
      { regex: /\$primary-dark:\s*#[0-9a-fA-F]{6};/, value: `$primary-dark: ${palette.primaryDark};` },
      { regex: /\$accent-color:\s*#[0-9a-fA-F]{6};/, value: `$accent-color: ${palette.accent};` },
      { regex: /\$accent-light:\s*#[0-9a-fA-F]{6};/, value: `$accent-light: ${palette.accentLight};` }
    ];

    patterns.forEach(({ regex, value }) => {
      content = content.replace(regex, value);
    });

    fs.writeFileSync(THEME_FILE, content, 'utf8');

    console.log(`\n✅ Palette changée avec succès!\n`);
    console.log(`📌 Palette active: ${palette.name}\n`);
    console.log('Couleurs:');
    console.log(`  - Primaire: ${palette.primary}`);
    console.log(`  - Primaire claire: ${palette.primaryLight}`);
    console.log(`  - Primaire foncée: ${palette.primaryDark}`);
    console.log(`  - Accent: ${palette.accent}`);
    console.log(`  - Accent claire: ${palette.accentLight}\n`);
    console.log('🔄 Rechargez votre navigateur pour voir les changements.\n');

  } catch (error) {
    console.error(`❌ Erreur lors du changement de palette: ${error.message}`);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '-h' || args[0] === '--help') {
  showHelp();
  process.exit(0);
}

const paletteNumber = args[0];
switchPalette(paletteNumber);
