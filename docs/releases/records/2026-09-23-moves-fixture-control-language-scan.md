# 2026-09-23-moves-fixture-control-language-scan — Moves Fixture Control Language Scan

## Release ID

`2026-09-23-moves-fixture-control-language-scan`

## Status

`candidate`

## Plain-English Summary

The Moves artifact readiness scanner now blocks smoke-test control language when it appears inside a document that could be treated as a client deliverable. Phrases that describe a fixture, a simulated approval upload, or instructions to a generator are not client evidence and should not pass as clean merely because the file is readable.

## Layer Impact

- `global-control-lane` / Layer 4 / Moves product projection: strengthens the generated-artifact and File Cabinet quality audit path. No canonical data, tenant intake, adapter output, or data-plane state is changed.

## Client Applicability

- All clients: applies to any Moves artifact scanned by the shared client-readiness scanner.
- Specific clients: none.
- Internal only: scanner/rule behavior only.
- Public/demo only: useful for demo smoke-test artifacts, but not limited to demo.
- Feature flag: none.

## Changes Included

- `src/lib/deliverables/shared/client-readiness-scan.ts`
  - Adds a blocker finding for fixture/control language such as simulated approval uploads and generator instructions.
- `src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts`
  - Adds positive and negative coverage for the new rule.

## QA / Validation

- `npx jest src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts --runInBand` — 54/54 passing.
- `npx eslint src/lib/deliverables/shared/client-readiness-scan.ts src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts` — passing.
- Live smoke corpus rerun with `npm run moves:scan-artifacts -- reports/moves-e2e-operating-smoke/20260923T222629Z/raw/live-deliverables-post8379` now flags the fixture-control packet as blockers instead of reporting it clean.

## Rollout Plan

Merge to `main`; the repo-owned Azure Container Apps deploy workflow will publish the updated scanner code with the normal web image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: resolved by the deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: scanner code is not a visible route by itself; signed-in proof is the live artifact scan evidence captured in the smoke report.

## Rollback Plan

Revert the scanner rule and test change, then merge through the same repo-owned workflow. No migration or data rollback is required.

## Audit Evidence

- Focused Jest and ESLint command outputs.
- Live smoke scan output under `reports/moves-e2e-operating-smoke/20260923T222629Z/raw/moves-scan-artifacts-post8379-after-fixture-rule.txt`.
- PR, merge commit, and deploy run once released.

## Known Gaps

This release does not reclassify or delete any already-stored artifact. It prevents this class of fixture/control language from being reported as client-ready by the readiness scanner.
