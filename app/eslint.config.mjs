import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier/recommended'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strict, // Schaltet den "Strikten Modus" ein
  prettier, // Integriert Prettier in ESLint
  {
    rules: {
      // Struktur-Regeln (Dein Schutzschild)
      'max-depth': ['error', 3], // Max 3 Ebenen tief verschachteln
      'max-lines-per-function': 'off',

      // Typsicherheit
      '@typescript-eslint/no-explicit-any': 'error', // Verbietet "any"
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^e$' }],

      // Prettier Fehlermeldungen direkt im Linter anzeigen
      'prettier/prettier': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '.next/**'],
  },
)
