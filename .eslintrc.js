module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    requireConfigFile: false,
    ecmaFeatures: {
      jsx: true
    }
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:prettier/recommended'],
  plugins: ['react', 'prettier'],
  rules: {
    'no-unused-vars': 'warn',
    'no-undef': 'warn',
    'comma-dangle': ['warn', 'never'],
    'react/prop-types': 'off',
    'no-prototype-builtins': 'off',
    'react/no-unknown-property': 'off'
    // Agregá o ajustá tus reglas personalizadas
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
