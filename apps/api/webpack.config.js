const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join, resolve } = require('path');

const projectRoot = join(__dirname, '../..');
const prismaGeneratedDir = resolve(projectRoot, 'prisma/generated-client');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  ignoreWarnings: [/baseline-browser-mapping/],
  externals: {
    '@prisma/client': 'commonjs @prisma/client',
    '@prisma/adapter-pg': 'commonjs @prisma/adapter-pg',
  },
  module: {
    rules: [
      {
        // Polyfill import.meta.url for Prisma 7 generated client (ESM -> CJS webpack compat)
        test: /\.ts$/,
        include: [prismaGeneratedDir],
        use: [
          {
            loader: 'string-replace-loader',
            options: {
              search: 'import.meta.url',
              replace: "'file://' + __filename",
              flags: 'g',
            },
          },
        ],
        // Run BEFORE other ts loaders
        enforce: 'pre',
      },
    ],
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMaps: true,
    }),
  ],
};
