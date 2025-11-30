#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to transform @if to *ngIf
function transformIf(content) {
  // Replace @if (condition) { content } with <div *ngIf="condition"> content </div>
  // This assumes no nested @if/@for in content
  content = content.replace(/@if\s*\(([^)]+)\)\s*\{([^}]*)\}/g, '<div *ngIf="$1">$2</div>');
  return content;
}

// Function to transform @for to *ngFor
function transformFor(content) {
  // Replace @for (item of items; track item) { content } with <div *ngFor="let item of items; trackBy: trackByItem"> content </div>
  content = content.replace(/@for\s*\(([^;]+);\s*track\s+([^)]+)\)\s*\{([^}]*)\}/g, '<div *ngFor="let $1; trackBy: trackBy$2">$3</div>');
  return content;
}

// Function to process a file
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = transformIf(content);
  content = transformFor(content);
  fs.writeFileSync(filePath, content);
}

// Function to walk directory
function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.html')) {
      console.log(`Processing ${filePath}`);
      processFile(filePath);
    }
  }
}

// Main
const srcDir = path.join(__dirname, '..', 'src');
walkDir(srcDir);

console.log('Transformation complete.');
