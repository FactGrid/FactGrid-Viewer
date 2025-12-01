# PR Draft: refactor/centralize-overlay-styles → main

## Title
refactor(styles): centralize overlay / child2 card styles into ThematicCard component

## Summary
This branch migrates and centralizes styling for the right-column (child2) thematic cards into the ThematicCard component, introduces modifier-driven variants and removes fragile global fallbacks like `.child2` selectors and `::ng-deep` duplicates.

Primary goals:
- Make ThematicCard the source of truth for variants (compact, flush, image-only)
- Remove duplicated/fragile styles scoped via `.child2` and `::ng-deep`
- Fix layout problems (double-padding for selected rows; visibility of visited list on mobile; image card paddings)

## Files changed (summary)
- src/app/display/thematic-card/thematic-card.component.ts (new inputs: `compact`, `flush`, `imageOnly`, host bindings)
- src/app/display/thematic-card/thematic-card.component.scss (new variants: `.thematic-card--compact`, `.thematic-card--flush`, `.thematic-card--image-only` + compact list tweaks)
- src/app/display/_cards-child2.scss (cleaned — removed duplicate/migrated rules)
- src/app/display/display.component.scss (removed .child2 fallback rules; prefer `.thematic-card--compact` modifier)
- src/app/display/display.component.html (applied `[imageOnly]` to images cards and `[compact]` already used on right-column cards)

## Why this change
This reduces duplication and fragile styles, improves encapsulation (move away from global `::ng-deep` overrides) and makes it easier to reason about card variants. It also fixes small UI bugs found during review (desktop/mobile padding inconsistencies).

## QA / How to test locally
1. Run dev server: `ng serve` (or `npm start` in dev workflow)
2. Open the Display view (http://localhost:4200/) and exercise:
   - Desktop: ensure the right column (Images, Wikis, External Links, "You have visited") aligns, shows expected insets and no double-padding on selected rows
   - Mobile: confirm "You have visited" card is visible and image gallery displays flush thumbnails
   - Check links / wrapping for long wiki/external link labels — no overflow
3. Inspect `.thematic-card` elements — compact/flush/image-only variants should have expected padding and visual differences

## Notes / follow-ups
- There are still some `::ng-deep` usages across `display.component.scss` used for host-level alignment — these are untouched for now if they are not child2-specific (we can continue cleaning them up in a follow-up PR)
- Lint/build on CI should be run before final push — a few unrelated test files in the repo might need attention (not changed in this PR)

---

Add any screenshots you want here before creating the PR.

If you'd like, I can: (A) push this branch and open the PR now, or (B) leave everything local for more refinement (recommended).

## Recent small fixes applied locally
- Adjusted the compact variant so `externalLinksText` / wiki lines inside right-column cards get a left inset and vertical spacing (fixes items being flush and lacking gaps). This should address the child2 formatting issue for External Links and Wikis.

## Notes about formatting
During the last step I ran ESLint/Prettier auto-fixes across the repository and committed the results locally (no push). Some files were auto-formatted — there is still one lint error remaining (a parsing error in `src/app/project-selector/project-selector.component.html`) that requires manual attention and was not auto-fixable. These formatting fixes are included in the local commits and will be pushed only when you request it.