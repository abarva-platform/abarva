# 2026-09-21-source-d024-response-question-contract — Govern Supplier Response Question Reads

## Release ID

`2026-09-21-source-d024-response-question-contract`

## Status

`candidate`

## Plain-English Summary

Source now refuses to use normalized supplier-response workbook extraction until the underlying
artifact has been accepted as authoritative. Accepted response rows carry a stable question identity,
normalized response category, provenance, and accepted review state before they reach generation,
aVa-style answers, pricing comparison, award-readiness, or benchmark consumers.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: tightens the Source product read path that feeds response-package generation
  context and governed advisory answers.
- Layers 1 through 3: unchanged. No source files, adapters, canonical records, schemas, migrations,
  tenant registries, or private data-plane records are changed.

## Client Applicability

- All clients: Yes, for Source events that load normalized supplier-response workbooks.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added stable tenant/event/vendor/requirement question identity to normalized response rows.
- Added normalized response categories for comply, partial, exception, not applicable, and unanswered.
- Stamped upload-time normalized response facts as unreviewed and excluded from downstream use until
  artifact acceptance.
- Filtered normalized response reads to explicit artifact acceptance rows or accepted
  client-final/current-authoritative artifacts with include downstream context policy.
- Preserved the existing product consumer path instead of introducing a detached library.

## QA / Validation

- `npx jest src/lib/source/__tests__/vendor-response-persistence.test.ts --runInBand` — passed, 4 tests.
- `npx jest src/lib/source/agent-generation/__tests__/context-binder.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand` — passed, 63 tests.
- `npx jest src/lib/source/proposal-intelligence/__tests__/evaluation-bafo-readiness.test.ts src/lib/source/ava/__tests__/award-readiness-governed-answer.test.ts src/lib/source/ava/__tests__/pricing-comparison-governed-answer.test.ts --runInBand` — passed, 11 tests.

## Rollout Plan

Merge through a protected pull request. The repo-owned ACA main deploy workflow builds and deploys
the exact merged SHA. No migration, tenant write, supplier communication, scoring action, award
action, feature flag, or manual data-plane operation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: To be recorded by the deploy workflow for the merged SHA.
- ACA runtime invariant: Template image and 100% traffic revision must match the approved digest.
- Worker image invariant: No worker runtime changes.
- Feature/env flag update path: None.
- Live signed-in proof required: No signed-in claim is made by this release record.

## Rollback Plan

Revert the release pull request and redeploy the resulting main SHA through the repo-owned ACA
workflow. No schema, migration, tenant-data, supplier-data, scoring, award, or benchmark rollback is
required.

## Audit Evidence

- Pull request and merge SHA.
- Focused Jest output listed above.
- ACA main deploy workflow run and runtime-invariant output after merge, if deployment is performed.

## Known Gaps

- This release does not parse new supplier files, mutate tenant data, accept artifacts, contact
  suppliers, calculate scores, make award recommendations, or prove a signed-in route.
- Existing upload-time extraction rows remain historical parser output. They become product-usable
  only after the source artifact has an accepted authoritative state.
