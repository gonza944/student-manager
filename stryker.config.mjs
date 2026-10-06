// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: "command",
  commandRunner: { command: "npm run test:unit" },
  coverageAnalysis: "off",
  concurrency: 4,
  mutate: [
    "{app,components,lib}/**/*.{ts,tsx,js,jsx}",
    "!**/*.{test,spec}.{ts,tsx,js,jsx}",
    "!**/{__tests__,__mocks__,fixtures,generated,migrations}/**",
    "!**/*.d.ts",
    "!**/index.{ts,tsx,js,jsx}",
  ],
  ignorePatterns: [".next", ".open-next", ".wrangler", "graphify-out", "reports"],
  reporters: ["progress", "clear-text", "html", "json"],
  htmlReporter: { fileName: "reports/mutation/index.html" },
  jsonReporter: { fileName: "reports/mutation/mutation.json" },
  incrementalFile: "reports/mutation/incremental.json",
};
export default config;
