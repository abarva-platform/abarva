# 2026-07-15-tower-followup-quality-routing — Tower Follow-Up Quality Routing

## Release ID

`2026-07-15-tower-followup-quality-routing`

## Status

`candidate`

## Plain-English Summary

Tower aVa follow-up clicks must not produce the same answer again. This release tightens the Tower advisor prompt and deterministic fallback routing so a follow-up about services, vendors, owners, or value gaps is answered as that specific follow-up. If the needed service/vendor allocation data is not loaded, aVa says what cut is missing instead of repeating the generic run/change budget paragraph.

No renderer filter, prose scrubber, or hidden rewrite layer was added. The Tower UI continues to render the answer and follow-up strings returned by the Tower answer contract.

## Layer Impact

- `global-control-lane`: Updates shared Tower advisor answer contract behavior for all tenants using `/api/tower/cio-chat`.
- `reasoning-layer`: Adds stronger prompt instructions that Claude must answer the current question literally and must not repeat a generic budget-mix answer for follow-ups.
- `read-model / fallback`: Adds a deterministic question-intent branch for fallback answers so service/vendor run-driver questions receive a distinct answer or a clear missing-data boundary.

## Client Applicability

- All clients: Yes, for tenants using the Tower advisor.
- Specific clients: Healthcare Demo / Meridian proof path is the primary regression case.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`: Adds follow-up-specific prompt guidance and fallback question-intent routing.
- `src/lib/cio-tower/__tests__/answer.test.ts`: Adds regression coverage for the generated run-driver follow-up path that previously repeated the same answer.

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- Pass: `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/__tests__/answer.test.ts`
- Pending: `npx tsc --noEmit --pretty false`
- Pending: `npm run release:check`
- Pending: `git diff --check`
- Pending after merge/deploy: signed-in Healthcare Demo Tower browser proof for first question plus generated follow-up click.

## Rollout Plan

Open a PR against `main`. After review and merge, the repo-owned Azure Container Apps main deploy workflow builds the image, deploys the new revision, shifts traffic to 100%, and runs the ACA runtime invariant. Then run signed-in browser proof on `https://app.abarva.ai/tower`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None from this PR.
- Approved image digest: Assigned by the main ACA deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required by the main ACA deploy workflow where applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Healthcare Demo Tower.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow redeploy the previous Tower answer-routing behavior. No database migration or production data mutation is included.

## Audit Evidence

- PR URL: pending.
- CI: pending.
- Deploy evidence: pending.
- Browser proof: pending.

## Known Gaps

This release improves answer/follow-up routing quality. It does not add new Tower source data. If service/vendor run allocation is not loaded, aVa must state the missing cut instead of inventing a ranking.
