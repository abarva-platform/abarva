# 2026-07-22 Moves P2 Generation Quality Sanitizer

## Release ID

`2026-07-22-moves-p2-generation-quality-sanitizer`

## Status

`candidate`

## Plain-English Summary

The First Capital sandbox end-to-end run proved that P2 could gather and approve evidence, but generated P2 deliverables were quarantined by the document-quality gate because client-facing text still contained internal/mechanical wording such as phase shorthand, enterprise substrate, and Source Register references in the body. This release sanitizes the final client-facing deliverable HTML before the quality gate runs and tightens the generation instructions so client documents use plain phase names and reserve evidence-register language for appendices.

## Layer Impact

- `global-control-lane`: Updates shared Moves deliverable generation/persistence quality behavior for client-facing artifacts.
- `client-data-lane`: No schema, ingestion, retrieval, evidence policy, tenant data, candidate data, or uploaded evidence behavior changes.

## Client Applicability

- All clients: Applies to client-facing deliverables generated through the shared Moves deliverable orchestrator.
- Specific clients: Validated first against the First Capital FS Demo sandbox Move.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag. Uses the existing deliverable quality contract.

## Changes Included

- `src/lib/deliverables/client-facing-artifact-sanitize.ts`
  - Rewrites internal phase shorthand in client documents, including priority shorthand such as `P1` into `Priority 1`.
  - Rewrites mechanical terms such as `substrate`, `context rows`, and `tower rows` into client-readable language.
- `src/lib/deliverables/orchestrator/persistence.ts`
  - Applies client-facing artifact sanitization before the deliverable quality contract evaluates the final HTML.
- `src/lib/deliverables/orchestrator/prompt-builder.ts`
  - Tells the generator to use human phase names instead of P0-P5 shorthand.
  - Reserves `Source Register` for appendix/evidence-register headings rather than narrative body prose.
- `src/lib/deliverables/quality/transformation-gates.ts`
  - Allows explicit appendix/evidence-register headings while continuing to block Source Register references in the narrative body.
- Tests:
  - Adds sanitizer coverage for phase shorthand and mechanical wording.
  - Adds quality-gate coverage for appendix Source Register versus body Source Register.

## QA / Validation

- Pass: `npx jest src/lib/deliverables/quality/__tests__/transformation-gates.test.ts src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts --runInBand`
  - Result: 18 passed / 18 total.
  - Notes: Existing duplicate Jest manual-mock warnings still appear.
- Pass: `npx eslint src/lib/deliverables/client-facing-artifact-sanitize.ts src/lib/deliverables/orchestrator/persistence.ts src/lib/deliverables/quality/transformation-gates.ts src/lib/deliverables/orchestrator/prompt-builder.ts src/lib/deliverables/quality/__tests__/transformation-gates.test.ts src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Blocked by pre-existing optional Home graph dependencies: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  - Reported missing modules: `@xyflow/react`, `@dagrejs/dagre`.
  - The reported files are Home graph/design-contract files, not this Moves deliverable-generation change.
- Pending: GitHub PR checks.
- Pending: ACA runtime invariant after merge/deploy.
- Pending: signed-in First Capital sandbox P2 generation proof after deploy.

## Rollout Plan

Merge through PR to `main`. The repo-owned ACA deploy workflow should build and deploy the exact merge SHA to `ca-abarva-web-lab-eastus`. After deployment, verify the ACA runtime invariant, then rerun the First Capital sandbox P2 Approve & Build/generation path to prove the generated deliverables are no longer quarantined for the mechanical wording fixed here.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending merge/deploy.
- ACA runtime invariant: Pending merge/deploy.
- Worker image invariant: Pending merge/deploy.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Yes, First Capital sandbox Move only.

## Rollback Plan

Revert this PR or remove the merged commit from the next ACA image. Rollback restores the previous quality-gate behavior and prompt language. No data migration or tenant data rollback is required.

## Audit Evidence

- Root-cause evidence: ACA logs from the First Capital sandbox P2 generation showed `blocked_quality (non_mechanical_writing)` with matches for `P1`, `P2`, `P3`, `substrate`, and Source Register body references.
- PR URL: Pending.
- ACA deployment proof: Pending.
- Runtime invariant: Pending.
- Signed-in browser proof: Pending.

## Known Gaps

- This does not change evidence readiness, evidence approval, or gate criteria.
- This does not bypass the document-quality contract; it only removes known mechanical false positives and generation instructions that caused them.
- This does not certify the generated deliverable as client-approved. Human review and approval remain required where the phase gate requires them.
