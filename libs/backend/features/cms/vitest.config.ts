import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const root = resolve(__dirname, '../../../..');

export default defineConfig({
  resolve: {
    alias: {
      '@swift-shop/data-access-prisma': resolve(
        root,
        'libs/data-access-prisma/src/index.ts',
      ),
      '@swift-shop/backend/auth': resolve(
        root,
        'libs/backend/core/auth/src/index.ts',
      ),
      '@swift-shop/prisma-client': resolve(
        root,
        'prisma/generated-client/client.ts',
      ),
      '@swift-shop/models': resolve(root, 'models/src/index.ts'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: true,
  },
});
