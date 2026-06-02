# 2026-06-02-admin-shell-vocabulary — Admin Shell Vocabulary Alignment

## Release ID

`2026-06-02-admin-shell-vocabulary`

## Status

`candidate`

## Plain-English Summary

Updates shell navigation vocabulary so Admin destinations are labeled Admin rather than Setup. The command palette now points to canonical Admin routes, including `/admin/connectors` and `/admin/users-access`, instead of older setup-era labels and redirect paths.

## Layer Impact

Global control lane shell UI. This changes visible navigation labels and command-palette destinations only; it does not change data loading, private data-plane behavior, authentication policy, or role-access logic.

## Client Applicability

- All clients: Signed-in users see Admin vocabulary in shell navigation and command search.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/shell/AppRail.tsx`
- `src/components/shell/CommandPalette.tsx`
- `src/components/shell/__tests__/admin-shell-vocabulary.test.ts`

## QA / Validation

Local validation:

- PASS — `npx jest --runTestsByPath src/components/shell/__tests__/admin-shell-vocabulary.test.ts --runInBand`
- PASS — `npx eslint src/components/shell/AppRail.tsx src/components/shell/CommandPalette.tsx src/components/shell/__tests__/admin-shell-vocabulary.test.ts`
- PASS — `git diff --check`
- PASS — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` and deploy through the normal Vercel pipeline. No migration or feature flag is required.

## Rollback Plan

Revert the PR to restore the prior shell labels and command-palette entries. No data rollback is required.

## Audit Evidence

Inspect the PR diff, local validation output, release-control gate, CI results, and Vercel preview.

## Known Gaps

The internal shell surface key remains `setup` for compatibility with existing access-control and surface-detection code. This PR changes visible user vocabulary only.
