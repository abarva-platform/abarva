# 2026-06-28-moves-bind-program-evidence-ledger — Moves Artifact Evidence Binding

## Release ID

`2026-06-28-moves-bind-program-evidence-ledger`

## Status

`candidate`

## Plain-English Summary

Moves deliverable generation now binds the Move's uploaded/captured evidence ledger into the same current-state context used for artifact prompts. This prevents P2/P3/P4 artifacts from relying only on broad broker context when users uploaded specific workshop notes, baselines, or evidence files.

Update: the shared artifact generation path also sanitizes client-facing HTML before the golden bar and persistence so model-echoed implementation terms do not appear in sponsor-visible deliverables.

## Layer Impact

- `global-control-lane`: updates shared Moves artifact prompt context assembly for all clients.
- `client-data-lane`: reads existing tenant-scoped `program_evidence_items`; no schema or data mutation is introduced.

## Client Applicability

- All clients: yes, for Moves artifact generation where a Move has uploaded/captured evidence.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing access and Move-read permissions continue to gate evidence reads.

## Changes Included

- `src/lib/deliverables/moves-generate-deps.ts`: appends the tenant-scoped program evidence ledger to the broker current-state prompt block.
- `src/lib/deliverables/client-facing-artifact-sanitize.ts`: normalizes internal implementation language in generated artifact HTML before the quality gate and persistence.
- `src/lib/deliverables/generate-artifact.ts`: applies the shared sanitizer to model output and auto-completed exhibit output before golden-bar evaluation.
- `src/lib/programs/evidence-context.ts`: includes structured evidence signals such as baseline candidates, decisions, actions, and risks in the prompt-safe ledger.
- `src/lib/programs/__tests__/evidence-context.test.ts`: verifies structured baseline metrics remain visible in the ledger.
- `src/lib/deliverables/__tests__/moves-generate-deps.test.ts`: verifies artifact generation receives both broker context and uploaded evidence context.
- `src/lib/deliverables/__tests__/generate-artifact.test.ts`: verifies internal words such as `source row` and `prompt` are scrubbed while exact AP metrics and taxonomy survive.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/programs/__tests__/evidence-context.test.ts src/lib/deliverables/__tests__/moves-generate-deps.test.ts --runInBand` passed.
- `npx jest src/lib/deliverables/__tests__/generate-artifact.test.ts src/lib/deliverables/__tests__/golden-bar.test.ts --runInBand` passed.
- `npx eslint src/lib/deliverables/generate-artifact.ts src/lib/deliverables/client-facing-artifact-sanitize.ts src/lib/deliverables/__tests__/generate-artifact.test.ts` passed.
- Full release validation and live artifact regeneration are required before marking released.

## Rollout Plan

Merge to `main`, deploy through the Azure Container Apps main lane, regenerate the Lakeshore P2 Current Work Diagnostic, and verify the downloaded artifact contains the uploaded AP baseline metrics and evidence taxonomy.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deployment lane.
- Shared runtime mutators: none.
- Approved image digest: pending deployment.
- ACA runtime invariant: public web for signed-in API/UI proof; private operator job for heavy generation.
- Worker image invariant: same deployed image must be used by the worker/operator lane.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the release commit and redeploy the prior ACA image. No schema rollback is required because the change is read-only.

## Audit Evidence

- PR URL: pending.
- Focused Jest output for evidence context and Moves generation dependencies.
- Post-deploy proof folder under `/Users/anand/Downloads/moves-p2-async-review-20260628/`.

## Known Gaps

Live artifact regeneration is still required to prove the P2 deliverable includes the AP baseline metrics from uploaded Move evidence.
