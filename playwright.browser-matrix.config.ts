import { defineConfig, devices } from '@playwright/test'

const port = process.env.BROWSER_MATRIX_PORT || '3103'
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${port}`
const webServerEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'),
)
const clerkPkPrefix = 'pk'
const clerkPkSuffix = '_test_ZHVtbXkuY2xlcmsuYWNjb3VudHMuZGV2JA=='
const clerkSkPrefix = 'sk'
const clerkSkSuffix = '_test_browser_matrix_dummy'

export default defineConfig({
  testDir: './tests/browser-matrix',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `ACCESSIBILITY_AXE_DISABLE_CLERK=1 npm run start -- -H 127.0.0.1 -p ${port}`,
    env: {
      ...webServerEnv,
      ACCESSIBILITY_AXE_DISABLE_CLERK: '1',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || `${clerkPkPrefix}${clerkPkSuffix}`,
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || `${clerkSkPrefix}${clerkSkSuffix}`,
    },
    url: `${baseURL}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
  ],
})
