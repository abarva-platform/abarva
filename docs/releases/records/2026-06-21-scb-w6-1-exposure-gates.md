# 2026-06-21-scb-w6-1-exposure-gates — SCB Exposure Gates

## Release ID

`2026-06-21-scb-w6-1-exposure-gates`

## Status

`candidate`

## Plain-English Summary

Adds the repo-owned exposure policy for the Shared Context Brain. Ava/Consilium
surface flags stay default off, ExpertPacks are exposable only after the pack
quality gate and golden eval both pass, and the W5.1 eval harness emits a parity
gate before any tenant rollout.

## Layer Impact

- `global-control-lane`: Adds shared rollout policy and eval metadata used by
  all SCB surfaces.
- `experimental`: The shared engine remains flag-gated and default off for
  surface activation.

## Client Applicability

- All clients: protection applies to all tenants because surface flags remain
  default off unless explicitly proven and flipped.
- Specific clients: none activated by this change.
- Internal only: release/eval policy and reports.
- Public/demo only: none.
- Feature flag: `scb_shared_engine_home`, `scb_shared_engine_intelligence`,
  `scb_shared_engine_tower`, `scb_shared_engine_source`,
  `scb_shared_engine_moves`.

## Changes Included

- Adds the missing Home shared-engine feature flag.
- Resets SCB surface feature flags to default-off with no pre-enrolled tenants.
- Adds deterministic ExpertPack readiness and parity-gate policy helpers.
- Extends the W5.1 AgentAnswer eval harness report with pack-readiness and
  parity-gate sections.
- Adds focused tests for default-off flag policy, readiness, and parity failure
  modes.
- PR: #3793.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/exposure/shared-engine-policy.test.ts src/lib/intelligence/answer/evals/__tests__/harness.test.ts --runInBand` — 2 suites / 6 tests passed.
- PASS: `npx jest src/lib/features/__tests__/is-feature-enabled.test.ts --runInBand` — 1 suite / 13 tests passed.
- PASS: `npx eslint src/lib/features/registry.ts src/lib/intelligence/exposure/shared-engine-policy.ts src/lib/intelligence/exposure/shared-engine-policy.test.ts src/lib/intelligence/answer/evals/harness.ts src/lib/intelligence/answer/evals/__tests__/harness.test.ts`.
- PASS: `npm run scb:golden-eval -- --out=/tmp/abarva-scb-w6-1-golden-eval.json` — 35/35 pass; parity gate pass; pack readiness emitted 56 total / 35 exposable.
- PASS: `git diff --check`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`. Initial run failed because this release record did not state pass/fail status in QA; record was fixed and rerun passed.
- NOT RUN: full local `npx tsc --noEmit --pretty false` was stopped after running silently for more than 90 seconds; GitHub CI typecheck is required before merge.

## Rollout Plan

Merge to `main` through the repo-owned PR workflow. Azure Container Apps deploy
will roll out the policy code, but no client surface is activated because all
SCB surface flags remain default off with empty static allowlists.

## Deployment Authority

- Repo-owned deploy workflow: required for merge to shared ACA runtime.
- Shared runtime mutators: none outside the repo-owned deploy workflow.
- Approved image digest: captured by ACA deploy workflow after merge.
- ACA runtime invariant: captured by ACA deploy workflow after merge.
- Worker image invariant: captured by ACA deploy workflow after merge.
- Feature/env flag update path: tenant env allowlist only after W6.1 parity and
  readiness proof; no flag rollout in this PR.
- Live signed-in proof required: no activation proof required for default-off
  policy; post-deploy crawl should still run as no-regression proof.

## Rollback Plan

Revert the PR or disable any future tenant env allowlist. Because this change
does not activate the shared engine for clients, rollback is code-only and does
not require data migration.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/3793
- CI: all PR checks passed, including Typecheck + reasoning-layer tests,
  ESLint, Chrome Firefox Safari mobile smoke, Lighthouse CI budget, Public axe
  accessibility, Production readiness gate, release record, hygiene, and
  boundary checks.
- Local eval report: `/tmp/abarva-scb-w6-1-golden-eval.json` showed 35/35
  AgentAnswer eval pass, parity gate pass, and ExpertPack readiness 56 total /
  35 exposable.
- Post-merge deploy/crawl evidence: pending until merged to `main`.

## Known Gaps

- W1.4 surface activation remains separate and must consume these gates before
  tenant flag flips.
- W3.2 expert expansion remains separate; packs without golden eval coverage
  are intentionally not exposable.
