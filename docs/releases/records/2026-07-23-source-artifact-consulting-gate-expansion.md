# 2026-07-23-source-artifact-consulting-gate-expansion — Source Artifact Consulting Gate Expansion

## Release ID

`2026-07-23-source-artifact-consulting-gate-expansion`

## Status

`candidate`

## Plain-English Summary

Source no longer reserves the partner-grade consulting quality gate for only the RFP package. The same Claude review-and-rewrite gate now applies to the other flagship narrative artifacts that executives actually rely on: sourcing strategy memo, scope memo, executive decision brief, and selection memo. The Files lifecycle matrix and exported standards CSV also show which artifacts require Gate B, whether a persisted review receipt exists, and whether the review passed or still needs repair.

## Layer Impact

- Release lane: `global-control-lane`.
- Product UI: the Source Files lifecycle matrix now shows Gate B required/passed/pending counts and per-artifact Gate B status for flagship artifacts.
- Source generation: `requiresSourceConsultingGradeGate()` now always includes d01, d05, d24, and d27 in addition to d09. These artifacts require Anthropic-backed generation/review; deterministic fallback remains disabled for gated artifacts.
- Evidence and audit: the standards CSV now includes Consulting Gate B columns so operators can export the narrative-quality control state alongside lifecycle, prompt, content QA, and authority state.

## Client Applicability

- All clients: yes, for Source events that generate or inspect the gated artifact set.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This removes the hidden `SOURCE_QUALITY_GATE_EXPANDED` dependency and makes the flagship gate explicit in code.

## Changes Included

- `src/lib/source/agent-generation/quality-review.ts`: expands the required consulting-grade gate set to d01, d05, d09, d24, and d27 without an env flag.
- `src/lib/source/artifact-lifecycle-matrix.ts`: adds Consulting Gate B assessment, summary counts, standards-context text, and CSV columns.
- `src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx`: renders Gate B counts and per-row status in the Files lifecycle matrix.
- Tests updated for quality gate selection, lifecycle/CSV projection, and Files matrix rendering.

## QA / Validation

- `npm test -- --runInBand src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/source/agent-generation/__tests__/strategy-authoring.test.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` — pass, 39/39. Pre-existing duplicate Jest manual mock warnings observed.
- `npx eslint src/lib/source/agent-generation/quality-review.ts src/lib/source/agent-generation/__tests__/quality-review.test.ts src/lib/source/agent-generation/__tests__/strategy-authoring.test.ts src/lib/source/artifact-lifecycle-matrix.ts src/lib/source/__tests__/artifact-lifecycle-matrix.test.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.chat.test.tsx` — pass.

## Rollout Plan

Merge through PR into `main`; the repo-owned ACA main deploy workflow builds and deploys the digest-pinned image to `app.abarva.ai`. After deploy, verify the ACA runtime invariant and signed-in Files matrix proof on an accessible Source event.

## Deployment Authority

- Repo-owned deploy workflow: required for production rollout.
- Shared runtime mutators: none in this PR.
- Approved image digest: to be recorded after the ACA main deploy completes.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker image changes expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Files matrix should show Gate B counts and per-artifact status.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main workflow. This restores d01/d05/d24/d27 to single-pass generation and removes the Files/CSV Gate B projection. No migration rollback is required.

## Audit Evidence

- PR URL: to be added after PR creation.
- Merge SHA: to be added after merge.
- ACA deploy run / digest: to be added after deployment.
- Signed-in browser proof: to be added after deployment.

## Known Gaps

- This slice does not generate new artifacts or mutate production data.
- This slice does not assert that already-uploaded client-final documents passed Claude Gate B unless a persisted generation receipt exists.
