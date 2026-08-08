# 2026-08-07-source-evidence-intake-and-ava-workspace - Source Evidence Intake and aVa Workspace Grounding

## Release ID

`2026-08-07-source-evidence-intake-and-ava-workspace`

## Status

`candidate`

## Plain-English Summary

Source now carries a fuller evidence intake contract for the 11-stage sourcing workflow. Each evidence requirement names the likely system of record, accepted file types, expected record grain, critical fields to parse, filename tokens for upload matching, and quality checks before the item becomes usable evidence. The Source workspace aVa path also now sends structured workspace context to the shared agent route and prevents context/artifact protocol envelopes from appearing as chat prose.

## Layer Impact

- Release lane: `global-control-lane`.
- Client Intake: evidence requests and downloadable templates now tell clients where to pull data from and which fields AbarVa expects.
- Source Adapters: upload matching now reads filename tokens from the canonical evidence catalog rather than a separate keyword map.
- Canonical Model: no schema change; existing event evidence-state rows continue to use the same requirement ids and readiness states.
- Products: Source evidence panels, input templates, and workspace aVa context use the richer catalog.

## Client Applicability

- All clients: applies to Source evidence workflow and Source workspace aVa behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none introduced.

## Changes Included

- Expanded `SOURCE_EVIDENCE_REQUIREMENTS` across the 11-stage Source workflow.
- Upload evidence matching now uses `filenameTokens` from the canonical requirement.
- Evidence panel rows and request notes show likely systems, critical fields, file types, and record grain.
- Input templates include operational instructions and use requirement critical fields as fallback headers.
- Source workspace aVa sends structured `surfaceContext` and strips only artifact protocol envelopes from visible chat output.
- Source operating doctrine instructs aVa not to expose raw JSON, context bundles, retrieval receipts, artifact tags, or prompt mechanics.

## QA / Validation

- `npx jest --runTestsByPath src/lib/source/__tests__/canonical-specs.test.ts src/lib/source/canvas-substrate/__tests__/upload-sync.test.ts 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' --runInBand` passed: 3 suites, 98 tests.
- `npx eslint` on touched Source evidence, upload, workspace, and test files passed.
- `git diff --check` passed.
- Full `npx tsc --noEmit --pretty false` hit the default Node heap limit; rerun with `NODE_OPTIONS=--max-old-space-size=8192` is required for full-program typecheck on this checkout.

## Rollout Plan

Merge to main through a PR. The repo-owned Azure Container Apps main deploy workflow builds and promotes the shared web image after merge. No database migration or data reload is required.

## Deployment Authority

- Repo-owned deploy workflow: required for production activation.
- Shared runtime mutators: none in this change.
- Approved image digest: produced by the deploy workflow after merge.
- ACA runtime invariant: verify after deploy before claiming live.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: Source workspace evidence panel, input template download, upload evidence auto-match, and Source workspace aVa answer without raw context/protocol leakage.

## Rollback Plan

Revert the PR. Existing persisted Source event evidence rows remain valid because legacy requirement ids used by gates are preserved.

## Audit Evidence

- PR diff and CI/test output.
- Targeted Jest and ESLint command output.
- Post-deploy signed-in Source workspace smoke proof.

## Known Gaps

No schema migration is included. Upload parsing still depends on existing parser support; binary documents without extracted text remain Loaded until asynchronous parsing is available.
