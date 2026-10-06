# 2026-09-23-home-render-stale-claim-guard — Home Render Stale Claim Guard

## Release ID

`2026-09-23-home-render-stale-claim-guard`

## Status

`candidate`

## Plain-English Summary

Home now checks authored chapter and exhibit prose against the record rows being rendered before showing it. If older narrative text names counts or supplier-concentration claims that conflict with the current served record, the page removes or replaces that wording while keeping the underlying record rows, tables, and provenance intact.

## Layer Impact

- `global-control-lane` / Layer 4 Products: Home render-path guard for visible chapter, claim, question, limitation, and exhibit text. No canonical records, tenant data, adapters, migrations, or loaders are changed.

## Client Applicability

- All clients: Home preview surfaces that render a bundle with technology-estate rows.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a pure Home stale-claim guard for rendered narrative text.
- Applies the guard in the Home v4 app before rail, chapter, table, and exhibit rendering.
- Extends the Home aVa denominator guard for parenthetical data-asset denominators.
- Adds a served-path regression proving stale authored counts and supplier-pair concentration copy do not render over live rows.

## QA / Validation

- `npm test -- --runTestsByPath src/components/home/v4/__tests__/served-record-surface.test.tsx` passed.
- `npm test -- --runTestsByPath src/lib/home/preview/__tests__/ava-answer.test.ts` passed.
- `npx eslint src/lib/home/preview/stale-claim-guard.ts src/lib/home/preview/ava-answer.ts src/components/home/v4/HomeV4App.tsx src/components/home/v4/__tests__/served-record-surface.test.tsx` passed.
- `npm run typecheck` passed.
- `npm run release:check` passed.
- `git diff --check` passed.

## Rollout Plan

Merge by PR to `main`, then deploy through the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: To be captured by the deploy workflow.
- ACA runtime invariant: Required before calling the release live.
- Worker image invariant: Required before calling the release live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: To be added by the pull request.
- CI: Focused Home v4 served-path and Home aVa tests listed above.
- Deployment: To be captured after merge by the ACA main deploy workflow.
- Live smoke: To be captured after deploy.

## Known Gaps

This guards stale visible text at render time. It does not regenerate authored chapter narratives or create new governed findings.
