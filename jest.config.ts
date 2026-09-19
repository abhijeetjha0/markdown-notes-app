import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
  testMatch: ['<rootDir>/tests/unit/**/*.test.ts', '<rootDir>/tests/unit/**/*.test.tsx'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/app/layout.tsx',
  ],
  coverageReporters: ['json-summary', 'text', 'lcov'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
const makeConfig = async () => {
  const nextJestConfig = await createJestConfig(config)();
  return {
    ...nextJestConfig,
    transformIgnorePatterns: [
      '/node_modules/(?!(unified|remark-.*|rehype-.*|unist-.*|mdast-.*|micromark.*|hast-.*|vfile.*|property-information|space-separated-tokens|comma-separated-tokens|escape-string-regexp|bail|is-plain-obj|trough|decode-named-character-reference|character-entities.*|trim-lines|ccount|markdown-table|devlop|fault|lowlight|highlight.js|zwitch|longest-streak|emoticon|gemoji)/)'
    ]
  };
};

export default makeConfig;
