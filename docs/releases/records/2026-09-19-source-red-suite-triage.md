# 2026-09-19-source-red-suite-triage — Source Library Test Triage

## Release ID

`2026-09-19-source-red-suite-triage`

## Status

`candidate`

## Plain-English Summary

Six Source library suites that were red and not named by CI now run as a bounded CI scope. The change updates stale test fixtures for the current evidence catalog, current aVa label casing, current answer-part behavior, and current export renderer coverage. It also records the live evidence-map dangling identifier instead of guessing a sourcing-taxonomy remap.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 — Products: Source test coverage and export operation metadata were updated to match the current product behavior and renderer support.

Control plane / CI: The AI surface control workflow now runs the six repaired Source library suites by exact path.

## Client Applicability

- All clients: receives the same Source test and metadata guardrails after merge.
- Specific clients: none.
- Internal only: CI and release evidence.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Updated six Source library test files under `src/lib/source/__tests__`.
- Updated Source artifact download declarations for renderer-backed formats.
- Added a bounded CI step for the six repaired suites.
- No migrations, tenant data writes, approval actions, auth changes, or runtime traffic changes.

## QA / Validation

- Failing-first targeted scope on the base: 6 suites failed, 15 tests failed.
- After repair: `npx jest src/lib/source/__tests__/gate-auto-assessment.test.ts src/lib/source/__tests__/gate-auto-assessment-persist.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts src/lib/source/__tests__/stage-progression.test.ts src/lib/source/__tests__/artifact-binding-matrix.test.ts src/lib/source/__tests__/stage-next-move.test.ts --runInBand` passed, 6 suites / 40 tests.
- Triage classification:
  - `gate-auto-assessment`: update plus real. Stale fixtures now include current required stage evidence; the dangling `EVID-SRC-SCOPE-ORG` requirement remains recorded as a real unresolved taxonomy issue.
  - `gate-auto-assessment-persist`: update. Fixtures now satisfy the current stage-evidence governance path before persistence is expected.
  - `nexus-api-live-context`: update. Assertions now match structured answer-part behavior and current artifact-lineage wording.
  - `stage-progression`: update. The stage now surfaces optional evidence separately from required evidence.
  - `artifact-binding-matrix`: update. Gold-standard downloads now match renderer-backed formats.
  - `stage-next-move`: update. The expected label uses the product casing.

## Rollout Plan

Merge to `main`. The repo-owned pull request workflow runs the bounded suite. The normal ACA deploy workflow may build the resulting web image, but this change has no data-plane or feature-flag rollout.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if merged to `main`.
- Shared runtime mutators: none.
- Approved image digest: not applicable before merge.
- ACA runtime invariant: not applicable before merge.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: no; this is test coverage plus Source artifact metadata, with no route, prompt, schema, tenant data, or user-flow mutation.

## Rollback Plan

Revert the PR. That removes the CI step, restores the prior test expectations, and restores the previous Source artifact download declarations.

## Audit Evidence

- PR for this release.
- Targeted Jest output for the six repaired suites.
- Mutation notes in the claim log.
- CI workflow step `Exercise Source library red-suite triage scope`.

## Known Gaps

The evidence-gate map still references `EVID-SRC-SCOPE-ORG`, which does not exist in the canonical evidence catalog. Recommendation: the Source taxonomy owner should decide whether this requirement is retired, renamed through a deliberate catalog migration, or replaced by a new canonical requirement. Do not auto-remap it to the workforce requirement without that decision.
