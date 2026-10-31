import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/coverage/**', '**/.turbo/**', '**/node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['packages/**/*.{ts,tsx}', 'apps/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
    },
  },
  {
    files: [
      'packages/browser/src/**/*.{ts,tsx}',
      'apps/playground/src/**/*.{ts,tsx}',
      'apps/frontend/src/**/*.{ts,tsx}',
    ],
    languageOptions: {
      // 只给真正运行在浏览器中的代码开放 DOM 全局变量。
      // core 即使误写 window，也不能因为共享 ESLint 配置而被静默放过。
      globals: globals.browser,
    },
  },
  {
    files: ['**/*.config.{js,cjs,mjs,ts}', '**/scripts/**/*.{js,cjs,mjs,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  }
)
