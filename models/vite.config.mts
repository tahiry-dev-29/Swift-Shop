/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../node_modules/.vite/models',
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    viteStaticCopy({
      targets: [{ src: '*.md', dest: '.' }],
      silent: true,
    }),
  ],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    name: 'models',
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/models',
      provider: 'v8' as const,
    },
  },
}));
