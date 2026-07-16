# 2026-07-15-tower-advisor-tone-followups — Tower Advisor Tone and Contextual Follow-ups

## Release ID

`2026-07-15-tower-advisor-tone-followups`

## Status

`candidate`

## Plain-English Summary

Tower aVa now asks Claude for a more executive-consultant answer shape and requires any suggested next question to follow directly from the answer. The deterministic fallback path was also tightened so it reads as a point of view and produces a metric-specific follow-up instead of a generic menu prompt.

## Layer Impact

- Release lane: `global-control-lane`.
- AI answer runtime: Tower prompt instructions now ask Claude to shape the response as a point of view and make follow-up questions specific to the surfaced metric, gap, risk, owner, or decision.
- Product UI: No renderer rewrite, scrub, or filter was added. The Tower UI continues to display `modelOutput.answer` and `modelOutput.followUpQuestion` as returned.
- Data plane: No data values, candidate state, promotion state, or TowerContextPack behavior changed.

## Client Applicability

- All clients: clearer Tower aVa answer tone and better follow-up-question behavior.
- Specific clients: Healthcare Demo benefits from the run/change budget fallback tested in this slice.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/lib/cio-tower/answer.ts`
- `src/lib/cio-tower/__tests__/answer.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- Not run yet: full typecheck.
- Not run yet: release gate.
- Not run yet: production signed-in browser proof after ACA deploy.

## Rollout Plan

Merge through the protected PR lane, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then rerun signed-in Healthcare Demo Tower proof for the enterprise budget question.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA traffic changes.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after main deploy.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Not changed by this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Healthcare Demo `/tower`.

## Rollback Plan

Revert this PR and redeploy through the ACA main workflow. Rollback restores the prior prompt wording and deterministic fallback follow-up.

## Audit Evidence

- Focused Jest output for the Tower prompt and deterministic fallback answer.
- PR diff and release record.
- Post-deploy browser proof should capture a non-generic follow-up question tied to the surfaced run/change budget split.

## Known Gaps

- This does not complete Tower v3 runtime migration.
- This does not add renderer-side filtering; by design, Claude owns the visible prose and the renderer remains placement-only.
