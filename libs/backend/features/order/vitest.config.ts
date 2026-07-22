import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import { resolve } from 'path';

const root = resolve(__dirname, '../../../..');

export default defineConfig({
  plugins: [
    tsconfigPaths({
      projects: [resolve(root, 'tsconfig.base.json')],
    }),
  ],
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
      '@swift-shop/backend/catalog': resolve(
        root,
        'libs/backend/features/catalog/src/index.ts',
      ),
      '@swift-shop/backend/customer': resolve(
        root,
        'libs/backend/features/customer/src/index.ts',
      ),
      '@swift-shop/backend/pricing': resolve(
        root,
        'libs/backend/features/pricing/src/index.ts',
      ),
      '@swift-shop/backend/cart': resolve(
        root,
        'libs/backend/features/cart/src/index.ts',
      ),
      '@swift-shop/backend/order': resolve(
        root,
        'libs/backend/features/order/src/index.ts',
      ),
      '@swift-shop/backend/shipping': resolve(
        root,
        'libs/backend/features/shipping/src/index.ts',
      ),
      '@swift-shop/backend/payment': resolve(
        root,
        'libs/backend/features/payment/src/index.ts',
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
