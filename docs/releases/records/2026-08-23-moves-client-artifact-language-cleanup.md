# 2026-08-23 Moves Client Artifact Language Cleanup

## Release ID

`2026-08-23-moves-client-artifact-language-cleanup`

## Status

`candidate`

## Plain-English Summary

Moves generated artifacts should explain client evidence and readiness in
business-facing language, not expose terms from the build pipeline. This release
rewrites two remaining review-level terms before generated artifact content is
rendered or persisted and updates one architecture brief instruction so future
artifacts ask for the same client-facing language.

## Layer Impact

- **Layer 4 — Products:** Affected lane: `global-control-lane`. Changes Moves
  artifact language cleanup and generation guidance only. No source intake,
  adapter, canonical model, projection, registry, migration, routing, tenant
  data, or runtime flag changes.

## Client Applicability

- All clients: Applies to Moves generated artifact exports and future generated
  artifact guidance.
- Specific clients: None hard-coded.
- Internal only: No. This protects client-facing generated artifacts.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Rewrites `quality score` to `evidence readiness rating` in client-facing
  generated artifact text.
- Rewrites `data plane` wording to client-facing evidence-environment language.
- Changes the target-architecture brief from implementation vocabulary to
  client-facing evidence-environment vocabulary.
- Adds sanitizer regression coverage for the two terms.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts src/lib/deliverables/shared/__tests__/client-readiness-scan.test.ts src/lib/deliverables/shared/__tests__/client-readiness-gate.test.ts --runInBand`.
- PASS: `npx eslint src/lib/deliverables/client-facing-artifact-sanitize.ts src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts src/lib/deliverables/orchestrator/evidence-assembler.ts src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts`.
- Pending: `git diff --check`.
- Pending: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`.
- Pending: `npm run release:check`.
- Pending: PR checks.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow may
build and deploy the resulting image. Re-run the existing Moves artifact
cleanliness dry-run against the deployed image to verify no blocker findings
remain and to assess whether review-only phrase findings are removed for newly
rendered content.

## Deployment Authority

- Repo-owned deploy workflow: Approved for this session.
- Shared runtime mutators: None beyond the repo-owned main deploy workflow.
- Approved image digest: To be captured by the deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming the runtime is
  current.
- Worker image invariant: Covered by the repo-owned deploy workflow.
- Feature/env flag update path: None.
- Live signed-in proof required: No. The relevant proof is artifact export scan
  output from the scoped Moves dry-run.

## Rollback Plan

Revert the release commit and redeploy through the repo-owned main workflow.
Persisted artifact state is unchanged by this release.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6744.
- Local validation: focused sanitizer/readiness suites above.
- Runtime/operator evidence: follow-up `moves-artifact-cleanliness-report.json`
  from the deployed image.

## Known Gaps

- This does not mutate stored artifact state or apply an artifact refresh. It
  changes future rendering/sanitization and future generation guidance.
