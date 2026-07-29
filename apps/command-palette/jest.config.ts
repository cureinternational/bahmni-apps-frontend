export default {
  displayName: '@bahmni/command-palette-app',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(@bahmni/design-system|@bahmni/services)/)',
  ],
  moduleNameMapper: {
    '^i18next$': '<rootDir>/../../node_modules/i18next',
    '^react-i18next$': '<rootDir>/../../node_modules/react-i18next',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
};
