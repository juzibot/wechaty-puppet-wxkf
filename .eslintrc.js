module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    extraFileExtensions: ['.cjs'],
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:promise/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],

  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { args: 'all', "argsIgnorePattern": "^_" }],
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    'no-constant-condition': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    'no-fallthrough': ['error', { allowEmptyCase: true }],
    '@typescript-eslint/no-this-alias': 'off', // 我们要避免使用异步箭头函数，因此有时候必须给 this 做一个 alias
    'no-async-promise-executor': 'warn', // 也许有一天可以完全清除掉...
    'semi': ["error", "never"],
    'quotes': ["error", "single", { allowTemplateLiterals: true }],
    'comma-dangle': ["error", "only-multiline"],
  },

  env: {
    es2022: true,
  },
}
