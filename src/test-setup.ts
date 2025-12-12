// Setup file used by Vitest to initialize Angular testing environment
// Polyfill AbortController if missing (required for Angular HttpClient)
import AbortController from 'abort-controller';
if (typeof globalThis.AbortController === 'undefined') {
  (globalThis as any).AbortController = AbortController;
}

import 'zone.js';
import 'zone.js/testing';
import { withProxyZone } from 'zone.js/testing';
// Log to help debugging whether this setup file runs in each worker
console.log('[vitest setup] src/test-setup executed');
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

const testBed = getTestBed();
// Angular's TestBed can only be initialized once per process. When running
// tests with Vitest, modules may be loaded multiple times across workers or
// in subsequent runs. Guard against re-initialization.
if (!testBed.platform) {
  testBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
    teardown: { destroyAfterEach: false },
  });
}

// Ensure persistent state like selectedResearchField from previous runs doesn't leak.
try {
  localStorage.removeItem('selectedResearchField');
} catch {}

// Ensure global helpers used in tests exist in this environment. Some tests
// use `window.open` which is not defined in happy-dom, so provide a stub
// to allow vi.spyOn(window, 'open') in tests to work.
if (typeof (globalThis as any).open === 'undefined') {
  // Use vi.fn if available, otherwise a simple no-op function
  try {
    (globalThis as any).open = (globalThis as any).vi ? (globalThis as any).vi.fn() : () => null;
  } catch {
    (globalThis as any).open = () => null;
  }
}

// Provide common testing modules globally to avoid repeating in many specs
getTestBed().configureTestingModule({ imports: [HttpClientTestingModule] });

// Provide a minimal MutationObserver polyfill if running in an environment
// without a DOM MutationObserver implementation or an incomplete one (e.g. in
// some headless envs). Angular CDK overlays expect observe() / disconnect().
if (
  typeof (globalThis as any).MutationObserver === 'undefined' ||
  typeof (globalThis as any).MutationObserver.prototype.observe !== 'function'
) {
  class PolyfillMutationObserver {
    callback: Function;
    constructor(cb: Function) {
      this.callback = cb;
    }
    observe() {
      /* no-op */
    }
    disconnect() {
      /* no-op */
    }
    takeRecords() {
      return [];
    }
  }
  (globalThis as any).MutationObserver = PolyfillMutationObserver;
}

// Provide a <base href="http://localhost/"> element for tests that rely on getAssetPath() or
// `new URL(path, base)` style resolution which depends on a document base.
if (!document.querySelector('base')) {
  const baseEl = document.createElement('base');
  baseEl.setAttribute('href', 'http://localhost/');
  document.head.appendChild(baseEl);
}

// Wrap common test functions (Vitest / Mocha / Jasmine compatible) so that
// zone.js ProxyZoneSpec is active when tests use `fakeAsync`/`tick` helpers
// if `withProxyZone` is available. If unavailable, do not wrap to avoid
// runtime errors (some zone.js builds don't expose the helper).
const VITEST_FN_NAMES = ['it', 'test', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll'];
const _withProxyZone = typeof withProxyZone === 'function' ? withProxyZone : undefined;
for (const name of VITEST_FN_NAMES) {
  const orig = (globalThis as any)[name];
  if (typeof orig === 'function') {
    (globalThis as any)[name] = (desc: any, fn: any, ...args: any[]) => {
      // When fn is not a function (e.g., skipped tests), don't wrap
      const wrappedFn = _withProxyZone && typeof fn === 'function' ? _withProxyZone(fn) : fn;
      return orig(desc, wrappedFn, ...args);
    };
  }
}



