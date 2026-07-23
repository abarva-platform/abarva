# 2026-07-23-moves-p3-design-family-gate-selection — Moves P3 Design Gate Family Selection

## Release ID

`2026-07-23-moves-p3-design-family-gate-selection`

## Status

`candidate`

## Plain-English Summary

Moves P3 gate approval now evaluates the full design deliverable family instead of relying on whichever design-like row the database returns first. This prevents an older generated draft or pending architecture artifact from masking a later human-signed design specification that should satisfy the `design_approved` hard gate.

## Layer Impact

- `global-control-lane`: shared Strategic Moves governance behavior. The change affects phase-gate evaluation for all clients because the evaluator is a common runtime path.
- No schema, migration, data-layer, candidate-promotion, or tenant-data-read behavior changes.

## Client Applicability

- All clients: yes, wherever Strategic Moves P3 gates evaluate design-family deliverables.
- Specific clients: First Capital sandbox found the issue during the sanctioned P0-P5 proof.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; this is a correctness fix to existing gate semantics.

## Changes Included

- `src/lib/programs/governance.ts`
  - `design_approved` now passes when any design-family deliverable is signed off and meets its required approval bar.
  - Pending or failed generated design artifacts still do not pass when they are the only available design signal.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts`
  - Added a regression test for the live sandbox failure shape.
  - Expanded the test query mock to support the chained queries used by role-approval checks.

## QA / Validation

- `npx jest src/lib/programs/__tests__/governance-evaluate-gates.test.ts --runInBand` — passed, 21/21.
- `npx eslint src/lib/programs/governance.ts src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — passed.
- Remaining validation to complete before release:
  - full TypeScript check
  - `npm run release:check`
  - `git diff --check`
  - PR review/merge
  - ACA deploy and runtime invariant
  - signed-in First Capital sandbox P3 gate retry

## Rollout Plan

Merge via PR to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, confirm the runtime invariant, then rerun the First Capital sandbox P3 gate approval to prove the sanctioned E2E path advances to P4.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the approved ACA workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: not changed by this PR, but should remain aligned with the web image after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, First Capital sandbox P3 gate retry.

## Rollback Plan

Revert the PR and redeploy the prior ACA image. The rollback restores the previous first-row design-gate behavior.

## Audit Evidence

- PR URL: pending.
- First Capital sandbox proof that exposed the issue:
  - `/tmp/firstcapital-p3-advance-proof-2026-07-23T19-20Z/result.json`
  - `/tmp/firstcapital-p3-signed-deliverables-proof-2026-07-23T19-18Z/result.json`
- Post-fix signed-in proof: pending.

## Known Gaps

- The UI still needs clearer human-approved artifact lifecycle affordances so users understand that generated artifacts must become signed-off deliverables before a hard gate passes.
