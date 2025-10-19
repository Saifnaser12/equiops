module.exports = {
  root: true,
  extends: ['@equiops/config/eslint/base'],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.next/',
    'build/',
    'coverage/',
  ],
  overrides: [
    {
      files: ['apps/web/**/*'],
      extends: ['@equiops/config/eslint/nextjs'],
    },
    {
      files: ['apps/api/**/*'],
      extends: ['@equiops/config/eslint/node'],
    },
    {
      files: ['packages/ui/**/*'],
      extends: ['@equiops/config/eslint/nextjs'],
    },
  ],
}