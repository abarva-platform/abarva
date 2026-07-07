const port = process.env.LIGHTHOUSE_PORT || "3102";
const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;

module.exports = {
  ci: {
    collect: {
      startServerCommand: `ACCESSIBILITY_AXE_DISABLE_CLERK=1 npm run start -- -H localhost -p ${port}`,
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 30000,
      url: ["/", "/sign-in"].map((path) => `${baseUrl}${path}`),
      numberOfRuns: 1,
      settings: {
        chromeFlags: "--headless=new --no-sandbox --disable-dev-shm-usage",
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "largest-contentful-paint": ["error", { maxNumericValue: 7000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.8 }],
        "total-blocking-time": ["error", { maxNumericValue: 1000 }],
        "speed-index": ["warn", { maxNumericValue: 7000 }],
        "categories:performance": ["warn", { minScore: 0.5 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "audit-artifacts/performance/lighthouse",
    },
  },
};
