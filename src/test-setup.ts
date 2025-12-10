// Setup file used by Vitest to initialize Angular testing environment
// Polyfill AbortController if missing (required for Angular HttpClient)
import AbortController from 'abort-controller';
if (typeof globalThis.AbortController === 'undefined') {
  (globalThis as any).AbortController = AbortController;
}

import 'zone.js';
import 'zone.js/testing';
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
