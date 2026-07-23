import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'apps/*/vite.config.mts',
      'apps/*/vitest.config.ts',
      'models/vite.config.mts',
      'libs/backend/features/*/vitest.config.ts',
      'libs/backend/core/*/vitest.config.ts',
    ],
  },
});
