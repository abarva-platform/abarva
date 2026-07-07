# Browser Matrix Smoke Runbook

## Purpose

The browser matrix smoke gate verifies that public AbarVa surfaces render across desktop Chrome, desktop Firefox, Playwright WebKit as the Safari equivalent, mobile Chrome, and mobile Safari. It catches browser-specific blank pages, HTTP errors, page exceptions, and console errors before a release reaches production.

## Scope

The smoke suite intentionally covers public bootstrap routes only. It does not exercise authenticated tenant workflows, private data-plane routes, or Clerk session-dependent journeys. Those remain covered by focused e2e, integration, and tenant-isolation suites.

## CI Gate

The `Browser Matrix Smoke` GitHub Actions workflow runs on pull requests to `main` and on manual dispatch. The workflow:

- installs Node.js 24 and npm dependencies;
- normalizes dummy Clerk test credentials when repository secrets are not present;
- installs Chromium, Firefox, and WebKit Playwright browsers;
- builds the Next.js app;
- runs `npm run browser:matrix`;
- uploads Playwright reports and test results when present.

## Local Usage

List the matrix without launching a server:

```bash
npm run browser:matrix:list
```

Run the full local matrix after installing Playwright browsers:

```bash
npx playwright install chromium firefox webkit
npm run build
npm run browser:matrix
```

The config starts `next start` on `BROWSER_MATRIX_PORT`, defaulting to `3103`. Override `BASE_URL` to test an already-running preview or deployed environment.

## Failure Triage

When the gate fails, inspect the failing browser project and route first. A route failure usually means one of:

- the route returned HTTP 400 or higher;
- the route rendered a blank body;
- a page exception fired during initial render;
- the browser console emitted an error;
- the production build cannot start under the normalized test environment.

Fix the route or the test environment, rerun the same command locally, then rerun the CI job.

## Rollback

If the workflow blocks an urgent release due to a test harness issue rather than a product regression, revert the PR that introduced the workflow or temporarily disable the workflow in a follow-up PR with release owner approval and a release record explaining the exception.
