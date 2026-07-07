import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.ACCESSIBILITY_PORT ?? 3100);
const baseURL = process.env.BASE_URL || `http://localhost:${port}`;
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL;

export default defineConfig({
  testDir: "./tests/accessibility",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
    ...(browserChannel ? { channel: browserChannel } : {}),
  },
  webServer: {
    command: `ACCESSIBILITY_AXE_DISABLE_CLERK=1 npm run start -- -H localhost -p ${port}`,
    url: `${baseURL}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
