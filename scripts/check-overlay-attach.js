#!/usr/bin/env node
const puppeteer = require('puppeteer');

async function main() {
  const url = process.env.URL || 'http://localhost:4200/';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  console.log('Opening', url);
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Ensure the search input exists
  const inputSelector = '.new-search-input';
  await page.waitForSelector(inputSelector, { visible: true, timeout: 5000 });

  // Try to open the project selector if present
  try {
    const projBtn = await page.$('.project-select-btn');
    if (projBtn) {
      await projBtn.click();
      // wait for project options to appear, but don't fail if none
      await page.waitForSelector('.compact-project-option', { timeout: 1000 }).catch(() => {});
      // click first project if any
      const firstProj = await page.$('.compact-project-option');
      if (firstProj) {
        await firstProj.click();
        console.log('Selected a project via UI (compact-project-option).');
      } else {
        console.log('No project option available to click - continuing without explicit project selection.');
      }
    }
  } catch (e) {
    console.log('Project selection skipped:', e.message);
  }

  // Type into the input - simulate a user typing 'Fred'
  await page.focus(inputSelector);
  await page.click(inputSelector, { clickCount: 3 }).catch(() => {});
  await page.type(inputSelector, 'Fred', { delay: 100 });

  // Begin watch: wait for either overlay pane or inline fallback to appear
  const paneSelector = '.cdk-overlay-pane.search-items_panel';
  const inlineSelector = '.inline-fallback';

  const start = Date.now();

  // race between overlay pane and inline fallback
  const result = await Promise.race([
    page.waitForSelector(paneSelector, { visible: true, timeout: 3000 }).then(() => ({ which: 'overlay', time: Date.now() - start })),
    page.waitForSelector(inlineSelector, { visible: true, timeout: 3000 }).then(() => ({ which: 'inline', time: Date.now() - start })),
  ]).catch(() => ({ which: 'none', time: Date.now() - start }));

  console.log('Result:', result);

  // Take a screenshot for inspection
  const screenshot = 'tmp/overlay-check.png';
  await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
  console.log('Saved screenshot to', screenshot);

  await browser.close();
  process.exit(result.which === 'overlay' ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
