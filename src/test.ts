// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { enableProdMode } from '@angular/core';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// First, initialize the Angular testing environment.
// Angular v21 introduced stricter change-detection checks which required
// fixing tests to wait for async change-detection. We no longer enable
// production mode here — tests should be stable in dev mode after fixes.

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  teardown: { destroyAfterEach: false },
});

// Provide common testing modules globally to avoid repeating in many specs
getTestBed().configureTestingModule({ imports: [HttpClientTestingModule] });
