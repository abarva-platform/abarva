# 2026-08-15-source-optimize-ava-stream-cleanup — Optimize aVa Visible Answer Cleanup

## Release ID

`2026-08-15-source-optimize-ava-stream-cleanup`

## Status

`candidate`

## Plain-English Summary

Optimize Contract aVa now renders only the user-facing answer text from the shared agent stream. Hidden context artifacts are stripped before the chat turn is stored, and governed Source contract values already visible on the page remain visible in the aVa answer instead of being redacted by generic demo-safe text handling.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source Optimize Contract chat rendering now uses the shared artifact-display cleanup path and opts into preserving governed Source-visible text.
- Canonical model: No canonical data, read-model, migration, loader, or calculation semantics changed.

## Client Applicability

- All clients: Yes, for tenants using the Source Optimize Contract page.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceOptimizeContractPage.tsx`
- `src/components/source/__tests__/SourceOptimizeContractPage.test.tsx`

## QA / Validation

- `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand` passed. Existing duplicate manual mock warnings are unrelated and pre-existing.
- Pending before release: focused lint, TypeScript, release check, PR checks, ACA deploy, runtime invariant, and signed-in browser proof.

## Rollout Plan

Merge to `main`; the repo-owned ACA main deploy workflow builds and deploys the approved image to the shared web runtime. No data-plane job or migration is required.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Required before claiming live.
- Worker image invariant: Required before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, open Optimize Contract, ask aVa a contract question, and verify no raw artifact markers or generic value redaction appear in the visible answer.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- Local focused test: `npx jest src/components/source/__tests__/SourceOptimizeContractPage.test.tsx --runInBand`.
- Live proof: pending.

## Known Gaps

None known for this rendering cleanup. Broader Optimize Contract journey quality remains tracked separately.
