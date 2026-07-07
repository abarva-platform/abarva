# Accessibility Axe Runbook

## Purpose

This runbook explains the public-page axe accessibility gate. The gate scans no-auth public pages for WCAG 2.1 A/AA violations using Playwright and `@axe-core/playwright`.

## Scope

Current CI scope:

- `/`
- `/contact`
- `/sign-in`

Authenticated product surfaces require real Clerk sessions and tenant context. They are intentionally out of scope for this first gate and should be added after CI has stable test personas.

## Local Use

```bash
npm run build
npm run accessibility:axe
```

The Playwright config starts `next start` on `localhost:3100` by default. Override with `ACCESSIBILITY_PORT` when that port is busy.

The gate sets `ACCESSIBILITY_AXE_DISABLE_CLERK=1` so public pages can be scanned on a localhost CI host without ClerkJS rejecting the host. The proxy applies this only to public routes and forwards a private `x-abarva-accessibility-axe: 1` request header; the root layout disables `ClerkProvider` only when both the env var and header are present. Normal development, preview, and production requests keep Clerk enabled by default.

The workflow still needs Clerk-shaped environment variables because the server middleware and public sign-in route import Clerk helpers. In GitHub Actions, the gate prefers `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` or the `AZURE_LAB_*` equivalents when present; otherwise it injects valid-format dummy test values for this public-only scan. Locally, load `.env.local` before running the command if your shell does not do that automatically, or provide valid-format dummy Clerk values for public-page accessibility checks.

## Triage

When the gate fails:

1. Read the failing axe rule id in the Playwright output.
2. Fix the semantic HTML, accessible name, color contrast, landmark, or focus-order issue.
3. Re-run `npm run accessibility:axe`.
4. If a third-party widget causes a false positive, document the reason in the PR and scope an explicit selector exclusion in the test.

## Expansion

Next expansion should add authenticated scans for `/admin`, `/source`, `/tower`, `/intelligence`, and `/programs` after CI can mint or reuse Clerk sessions safely.
