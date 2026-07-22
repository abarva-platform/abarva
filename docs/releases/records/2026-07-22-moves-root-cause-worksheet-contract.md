# 2026-07-22-moves-root-cause-worksheet-contract — Moves Root-Cause Worksheet Contract

## Release ID

`2026-07-22-moves-root-cause-worksheet-contract`

## Status

`candidate`

## Plain-English Summary

The signed-in First Capital sandbox proof for Moves phase generation confirmed that P2 preserves the canonical artifact key in the durable run payload, but it also exposed the next failure: Root Cause Worksheet generation still behaved like a second Discovery Report. The root-cause run was blocked by the deliverable quality gate instead of becoming client-ready, which is the right gate behavior but the wrong artifact contract.

This release gives the Root Cause Worksheet its own issue-tree structure, its own concise quality band, and its own queue routing. It also makes persistence use the canonical registry key for renderer and quality-contract selection when the queued payload supplies one, so shared or legacy orchestrator aliases cannot silently enforce the wrong artifact profile.

## Layer Impact

- `global-control-lane`: changes shared Moves phase-generation routing and quality-contract behavior for the P2 Root Cause Worksheet.
- `governance/control-plane`: strengthens deliverable lifecycle governance by aligning queue key, artifact profile, quality contract, and generated artifact metadata.
- `design/spec`: makes Root Cause Worksheet a bounded consulting readout, not a long discovery binder.

## Client Applicability

- All clients: yes, for Moves P2 Root Cause Worksheet generation.
- Specific clients: First Capital / FS Demo is the proof tenant.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/orchestrated-deliverable-map.ts`: routes `root_cause_worksheet` to its own orchestrator type instead of `discovery_report`.
- `src/lib/deliverables/orchestrator/briefs/deliverable-structures.ts`: adds a fixed Root Cause Worksheet structure: Executive Answer, Symptoms vs. Causes, Root-Cause Tree, Confidence & Open Gaps, and P3 Implications.
- `src/lib/deliverables/orchestrator/quality-bar-registry.ts`: adds a concise hard-blocking depth band for Root Cause Worksheet.
- `src/lib/deliverables/quality/deliverable-key-map.ts`: adds direct registry-key resolution.
- `src/lib/deliverables/orchestrator/persistence.ts`: uses the queued registry key for profile renderer and quality-contract enforcement when supplied.
- Regression coverage for generate-phase routing, brief composition, quality bar, persistence, and worker payload preservation.

## QA / Validation

Pre-merge validation:

- Pass: focused Jest over route, brief, quality-bar, map, persistence, and worker seams:
  `npx jest --runTestsByPath src/lib/programs/__tests__/orchestrated-deliverable-map.test.ts src/lib/deliverables/orchestrator/__tests__/brief-library.test.ts src/lib/deliverables/orchestrator/__tests__/quality-bar-registry.test.ts src/app/api/v1/deliverables/generate-phase/__tests__/route.test.ts src/lib/deliverables/orchestrator/__tests__/persistence.test.ts src/scripts/__tests__/process-deliverable-queue.test.ts --runInBand` (48/48 tests passed).

Post-deploy proof required:

- Run signed-in P2 generation again on the First Capital sandbox Move.
- Confirm queued Root Cause Worksheet uses `deliverableType=root_cause_worksheet` and `deliverableTypeKey=root_cause_worksheet`.
- Confirm Root Cause Worksheet no longer becomes a discovery-report-length binder.
- Confirm client-ready or honestly quarantined state with root-cause-specific blockers.
- Confirm client-approved deliverable lifecycle writes back to the `root_cause_worksheet` deliverable slot.
- Confirm ACA runtime invariant.

## Rollout Plan

Merge by PR to `main`, deploy through the repo-owned Azure Container Apps main workflow, verify the ACA runtime invariant, then rerun the signed-in First Capital sandbox P2 generation proof against `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned ACA deploy.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required if the deploy includes worker image proof.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy the prior ACA image. Existing artifacts are not deleted. Any Root Cause Worksheet generated during the candidate window should be reviewed before client approval, because this change affects document shape and quality-contract selection.

## Audit Evidence

Pending PR URL, CI results, ACA runtime invariant output, and signed-in First Capital sandbox proof bundle.

## Known Gaps

- This release does not create or migrate a physical Moves learning-ledger table.
- This release does not promote Move-derived artifacts into active enterprise context.
- This release does not change candidate-data, Home, Source, Tower, or Active Tenant Access behavior.
- Other registry keys that still intentionally map to shared orchestrator structures remain out of scope for this slice.
