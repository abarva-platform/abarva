# 2026-07-13-home-admin-live-proof-followup — Home Aggregate Binding and Live Proof Harness

## Release ID

`2026-07-13-home-admin-live-proof-followup`

## Status

`candidate`

## Plain-English Summary

This follow-up closes a live Home smoke finding: selecting an aggregate context area such as Functions could show the correct selected area title while summary copy still named the first underlying source dimension. Home now keeps the selected area label, totals, and summary wording aligned. The Admin/Home smoke harness also adds a timeout around Chrome AppleScript calls so browser proof cannot idle indefinitely if the desktop browser becomes unavailable.

## Layer Impact

- `global-control-lane` / Home UI/runtime: fixes selected aggregate context area rendering so visible labels and summary text agree for all tenants.
- `global-control-lane` / QA proof tooling: adds a bounded timeout for Chrome-driven Admin/Home design smoke proof.
- `internal-admin`: no Admin product behavior changes.

## Client Applicability

- All clients: Home aggregate context browsing receives the binding correction.
- Specific clients: none.
- Internal only: Chrome smoke harness timeout.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/components/home/HomeSurface.tsx`
- `scripts/qa/admin-home-design-smoke-proof.ts`

## QA / Validation

- Pass: `npm test -- --runTestsByPath src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: `npx eslint src/components/home/HomeSurface.tsx scripts/qa/admin-home-design-smoke-proof.ts`
- Pending before release: Admin/Home design smoke and live signed-in browser proof after ACA deploy.

## Rollout Plan

Merge through PR to `main`, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then run signed-in Home/Admin browser proof against `https://app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned ACA main deploy workflow only
- Approved image digest: assigned by ACA main deploy after merge
- ACA runtime invariant: required after deploy
- Worker image invariant: unchanged by this PR
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Revert this PR or shift ACA traffic back to the previous healthy digest-pinned revision using the approved rollback lane. No data writes, migrations, candidate promotion, or Active Tenant Access changes are included.

## Audit Evidence

- PR URL: pending
- Local focused Jest and ESLint output in agent transcript
- Post-deploy ACA runtime invariant and signed-in browser proof to be captured after merge

## Known Gaps

None known for this bounded follow-up. Broader Home data-model enrichment remains in the separate data-layer runway.
