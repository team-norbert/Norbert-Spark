import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vitestPlugin from '@vitest/eslint-plugin'
import type { ESLint, Linter } from 'eslint'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import sortDestructureKeys from 'eslint-plugin-sort-destructure-keys'

import rootConfig from '../../eslint.config.js'

/**
 * Helper function to safely cast plugin types to ESLint.Plugin
 * This provides better type safety than 'as any' by explicitly
 * acknowledging the type assertion through unknown
 */
function asESLintPlugin(plugin: unknown): ESLint.Plugin {
  return plugin as ESLint.Plugin
}

const config: Linter.Config[] = [
  ...(rootConfig as Linter.Config[]),
  {
    plugins: {
      '@typescript-eslint': asESLintPlugin(tseslint),
      vitest: asESLintPlugin(vitestPlugin),
      'simple-import-sort': simpleImportSort,
      'sort-destructure-keys': asESLintPlugin(sortDestructureKeys),
    },
    languageOptions: {
      parser: tsParser,
    },
    rules: {
      'import/no-unresolved': 'off', // TypeScript handles module resolution
      'import/named': 'off', // TypeScript handles named exports
      'no-console': 'warn', // Shared package should minimize console usage
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: 'Enums are not allowed. Use const objects with "as const" instead.',
        },
      ],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'sort-destructure-keys/sort-destructure-keys': 'warn',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    plugins: {
      vitest: asESLintPlugin(vitestPlugin),
    },
    rules: {
      // Use only specific vitest rules to avoid configuration issues
      'vitest/expect-expect': 'error',
      'vitest/no-identical-title': 'error',
      'vitest/no-focused-tests': 'warn',
      'vitest/valid-expect': 'error',
      'vitest/no-conditional-expect': 'off',
    },
  },
]

export default config
