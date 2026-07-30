export default {
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: {
          esModuleInterop: true,
          module: "ESNext",
          moduleResolution: "bundler",
          noUncheckedIndexedAccess: true,
          strict: true,
          target: "ESNext",
          verbatimModuleSyntax: false,
        },
      },
    ],
  },
};
