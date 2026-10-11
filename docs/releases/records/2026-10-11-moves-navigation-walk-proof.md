# Moves navigation walk proof

## Release ID

`2026-10-11-moves-navigation-walk-proof`

## Status

`candidate`

## Plain-English Summary

The signed-in navigation walk now checks the global product bar on a real Moves page while the page scrolls. It also waits for the step route to finish loading after a person returns from Files or Record. The first walk incorrectly looked for the bar inside a small HTML fixture that has no app shell and allowed only five seconds for a live route that took longer. This release changes the check only.

## Layer Impact

Release lane: `global-control-lane`.

- Layer 4 (Products — Moves): validation coverage only. Product routes and rendered behavior are unchanged.
- Layers 1–3: unchanged. No tenant data, canonical records, schema, or write path changes.

## Client Applicability

- All clients: no product behavior change.
- Specific clients: none.
- Internal only: the signed-in production walk check.
- Public/demo only: no.
- Feature flag: no change.

## Changes Included

- The standalone scroll fixture checks scroll reachability without asserting app-shell elements that it does not mount.
- The signed-in root-causes page checks the global bar while scrolling at 1906, 1440, and 390 pixels.
- The Files and Record return path waits for the step URL and visible step heading within the existing 20-second page-read budget.

## QA / Validation

- The first automatic signed-in walk showed the fixture assertion error and a five-second return-to-Steps timeout. Its six phase landings, six legacy views, and 28 of 29 step views passed; the deck preview PDF fetch had a separate timeout.
- A read-only signed-in browser click returned from Record to a step in about eight seconds, with the global bar visible at 73 pixels high and top position zero after navigation.
- `npx playwright test tests/e2e/moves-step-pages-live-walk.spec.ts -g 'walks long work through pane and document scrolling'`: passed.
- `npx eslint tests/e2e/moves-step-pages-live-walk.spec.ts`: passed.
- `npm run typecheck`: passed.
- The next automatic signed-in walk is required to verify the updated live assertions.

## Rollout Plan

Squash merge through a PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the exact main image and triggers the signed-in walk. No migration or feature flag change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: established by the deploy workflow.
- ACA runtime invariant: checked by the deploy workflow.
- Worker image invariant: checked by the deploy workflow.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the updated navigation assertions.

## Rollback Plan

Revert the PR through the normal release path. No data rollback is needed.

## Audit Evidence

- PR and CI checks for this release candidate.
- Repo-owned ACA deploy artifact and the subsequent signed-in Moves walk artifact.

## Known Gaps

- The first walk did not complete the navigation proof because of the validation timeouts described above.
- The separate deck preview PDF timeout remains outside this navigation check.
