module.exports = {
  env: {
    node: true,
    browser: true,
    es6: true,
    mocha: true,
  },

  plugins: [],

  extends: ['eslint:recommended', 'prettier'],

  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {},
  },

  rules: {
    'no-class-assign': [0],
  },
};
