# 2026-06-01-accessibility-axe-gate — Public Axe Accessibility Gate

## Release ID

`2026-06-01-accessibility-axe-gate`

## Status

`candidate`

## Plain-English Summary

Adds a CI accessibility gate that runs axe-core against unauthenticated public pages and fails the PR when WCAG 2.1 A/AA violations are detected.

## Layer Impact

- Release lane: `public-demo`.
- Engineering governance: adds a public-page accessibility quality gate and runbook.
- Runtime: darkens the shared public-site muted text token so public labels meet WCAG AA contrast, and adds an opt-in `ACCESSIBILITY_AXE_DISABLE_CLERK=1` plus private request-header test harness path in the root layout and public-route middleware so CI can scan public pages on localhost. Default auth behavior is unchanged.

## Client Applicability

- All clients: No direct runtime effect.
- Specific clients: None.
- Internal only: Engineering and release operations.
- Public/demo only: Public pages are scanned by CI, but the user-facing runtime is unchanged.
- Feature flag: None.

## Changes Included

- `.github/workflows/accessibility-axe.yml`
- `.gitignore`
- `playwright.accessibility.config.ts`
- `src/app/layout.tsx`
- `src/proxy.ts`
- `src/styles/public-site-tokens.css`
- `tests/accessibility/public-axe.spec.ts`
- `package.json`
- `package-lock.json`
- `docs/runbooks/accessibility-axe.md`
- `docs/releases/records/2026-06-01-accessibility-axe-gate.md`

## QA / Validation

- Pass: `npm run build`
- Pass: `npm run accessibility:axe`
- Pass: `npx playwright test --config=playwright.accessibility.config.ts` via package script
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main`. The workflow runs on pull requests and manual dispatch. No production deploy or feature flag is required.

## Rollback Plan

Revert the PR to remove the workflow, Playwright config, axe test, dependency, package script, runbook, and release record.

## Audit Evidence

- PR URL: Pending
- Local validation output: build passed with existing Azure DNS fallback warnings during static generation; public axe passed 3/3 routes.

## Known Gaps

Authenticated product surfaces are not scanned in this first gate because CI needs real Clerk sessions and tenant context for those routes. The Clerk bypass and dummy Clerk env fallback are limited to the public axe harness and must not be used for authenticated route QA. Add authenticated scans in a follow-up once test personas are stable.
