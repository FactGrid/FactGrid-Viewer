Vitest migration notes
======================

This repository has migrated unit tests from Karma/Jasmine to Vitest.

Summary:
- Unit tests are run with Vitest; unittests now use `vitest` and `vi` globals.
- `vitest.config.ts` contains configuration and sets `src/test-setup.ts` as setup file.
- `npm test` runs `vitest --run --coverage`.
- `ng test` uses the `@angular/build:unit-test` builder configured to run Vitest.

Notes for contributors:
- When writing new unit tests, prefer `vi.spyOn`, `vi.fn()` and Vitest APIs.
- Avoid using Jasmine globals (e.g., `jasmine.createSpyObj`) in new code — use `vi`.
- Keep using `@angular/elements` and standard Angular testing APIs (TestBed, HttpClientTestingModule, etc.).
- If you need to run tests in watch mode during development, use `npm run test:watch`.

E2E tests (Protractor):
- The project still contains Protractor-based e2e tests which use Jasmine — these are not affected by the migration.

If you encounter failing tests after migration:
- Confirm `src/test-setup.ts` correctly sets up `zone.js/testing`, `BrowserDynamicTestingModule` and any DOM polyfills needed (base href, MutationObserver, etc.).
- Add providers to TestBed or mock missing services in specs that rely on injected tokens (e.g., `MAP_CONFIG_TOKEN`).
- Convert old `done()` callbacks to async/await where missing and increase timeout when necessary using `vi.setTimeout` or test-specific timeout.

If you want help migrating failing tests, file an issue or ask for a PR to convert specific files.
