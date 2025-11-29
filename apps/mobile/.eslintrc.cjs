module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['node_modules/', 'dist/', '.expo/'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
};
