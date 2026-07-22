/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/store',
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    viteStaticCopy({
      targets: [{ src: '*.md', dest: '.' }],
      silent: true,
    }),
  ],
  test: {
    name: 'store',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/store',
      provider: 'v8' as const,
    },
  },
}));
