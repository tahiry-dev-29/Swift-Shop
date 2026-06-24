import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    ignores: ['prisma/**/*', 'tools/**/*'],
    // Override or add rules here
    rules: {
      'max-lines': [
        'error',
        { max: 200, skipBlankLines: true, skipComments: true },
      ],
      'max-classes-per-file': ['error', 1],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'ForOfStatement CallExpression[callee.object.property.name="logger"]',
          message:
            '❌ Master Summary Violation: Do not use logger inside a loop. Buffer your data and log once outside to prevent I/O bottlenecks.',
        },
        {
          selector:
            'ForStatement CallExpression[callee.object.property.name="logger"]',
          message:
            '❌ Master Summary Violation: Do not use logger inside a loop. Buffer your data and log once outside to prevent I/O bottlenecks.',
        },
        {
          selector:
            'CallExpression[callee.property.name="forEach"] CallExpression[callee.object.property.name="logger"]',
          message:
            '❌ Master Summary Violation: Do not use logger inside a loop. Buffer your data and log once outside to prevent I/O bottlenecks.',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': 'warn',
    },
  },
  {
    // 🛡️ EXCEPTION: DTOs, Types, and Inputs are allowed to have multiple classes per file
    // as per standard NestJS / GraphQL practices for grouping related data structures.
    files: [
      '**/*.dto.ts',
      '**/*.type.ts',
      '**/*.types.ts',
      '**/*.input.ts',
      '**/*.inputs.ts',
      '**/*-type.ts',
      '**/*-types.ts',
      '**/*-input.ts',
      '**/*-inputs.ts',
    ],
    rules: {
      'max-classes-per-file': 'off',
    },
  },
];
