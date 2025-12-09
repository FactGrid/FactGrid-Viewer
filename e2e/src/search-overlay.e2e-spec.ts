import { browser, by, element, ExpectedConditions as EC } from 'protractor';

describe('Search overlay behavior (project-mode + local-autocomplete)', () => {
  beforeAll(async () => {
    await browser.get(browser.baseUrl);
    // ensure page loaded
    await browser.wait(EC.presenceOf(element(by.css('.new-search-input'))), 5000);
  });

  it('should attach the CDK overlay and not render inline fallback', async () => {
    const projBtn = element(by.css('.project-select-btn'));

    // click the project button if present and pick the first project option
    try {
      if (await projBtn.isPresent()) {
        await projBtn.click();
        const firstProj = element(by.css('.compact-project-option'));
        if (await firstProj.isPresent()) {
          await browser.wait(EC.elementToBeClickable(firstProj), 2000);
          await firstProj.click();
        }
      }
    } catch (e) {
      // ignore — project selection is optional in some test setups
    }

    const input = element(by.css('.new-search-input'));
    await input.clear();
    await input.sendKeys('Fred');

    // Wait briefly for any local-autocomplete / project expansion to run
    // Expect an overlay pane to appear (CDK managed)
    const overlayPane = element(by.css('.cdk-overlay-pane.search-items_panel'));
    await browser.wait(EC.presenceOf(overlayPane), 5000, 'Expected overlay pane to attach');

    const inlineFallback = element(by.css('.inline-fallback'));
    // Inline fallback should not exist
    const inlinePresent = await inlineFallback.isPresent().catch(() => false);
    expect(inlinePresent).toBeFalse('inline fallback should not be rendered');

    // Basic sanity: the overlay pane should have at least one suggestion item
    const firstSuggestion = overlayPane.element(by.css('.compact-suggestion-item'));
    expect(await firstSuggestion.isPresent()).toBeTrue('overlay should include suggestion items');
  });
});
