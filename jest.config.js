module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'json'],
  transform: {
    '^.+\\.js$': 'babel-jest'$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$'$': '<rootDir>/tests/__mocks__/styleMock.js',
    '\\.(gif|ttf|eot|svg|png)$'$': '<rootDir>/tests/__mocks__/fileMock.js',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/js/**/*.js',
    '!src/js/app.js',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
};