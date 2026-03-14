module.exports = {
  testEnvironment: 'node',
  setupFiles: ['./tests/setup.js'],
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/utils/__mocks__/**'
  ],
  coverageReporters: ['text', 'lcov'],
  verbose: true
};
