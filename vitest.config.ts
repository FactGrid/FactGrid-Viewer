/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    angular(),
    tsconfigPaths(),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: 'src/test-setup.ts',
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
