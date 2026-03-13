module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    requireConfigFile: false,
    ecmaFeatures: {
      jsx: true
    }
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'comma-dangle': ['warn', 'never'],
    'react/prop-types': 'off',
    // React 17+ JSX transform: no need to import React in scope
    'react/react-in-jsx-scope': 'off',
    // Prefer TS rules over base ones
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-prototype-builtins': 'off',
    'react/no-unknown-property': 'off',
    'no-unreachable': 'off'
    // Agregá o ajustá tus reglas personalizadas
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
