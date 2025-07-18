module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:jest/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  plugins: [
    'jest',
    'prettier',
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js'],
      },
    },
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'import/prefer-default-export': 'off',
    'import/extensions': 'off',
    'max-len': ['warn', { code: 400 }],
    'no-param-reassign': ['warn', { props: false }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-underscore-dangle': 'off',
    'class-methods-use-this': 'off',
    'no-use-before-define': 'off',
    'no-restricted-globals': 'off',
    'no-plusplus': 'off',
    'no-mixed-operators': 'off',
    'default-case': 'off',
    'no-prototype-builtins': 'off',
    'no-restricted-syntax': 'off',
    'no-void': 'off',
    'max-classes-per-file': 'off',
    radix: 'off',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
      rules: {
        'no-unused-expressions': 'off',
      },
    },
  ],
};