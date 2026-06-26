# 2026-06-25-tower-cio-wow-polish — Tower CIO Wow Polish

## Release ID

`2026-06-25-tower-cio-wow-polish`

## Status

`candidate`

## Plain-English Summary

Tower gets a sharper CIO-command-center layer on top of the deployed dashboard: a daily executive read, decision/action cards, scenario prompts, and a board-readout view. The polish keeps the same Tower read-model inputs and shared aVa dock, and it continues to name missing evidence as gaps instead of inventing ROI, run/change, or vendor facts.

## Layer Impact

- `global-control-lane`: Updates the shared `/tower` surface for all tenants.
- UI/read-model presentation: Adds deterministic interpretation from existing Tower initiatives and vendor rows.
- No database schema, ingestion, or tenant-data migration changes.

## Client Applicability

- All clients: Yes, wherever `/tower` renders `TowerIndexPage`.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a `Board` dashboard view.
- Adds a CIO daily-read narrative computed from loaded Tower rows.
- Adds decision/action cards for pressure spend, value proof, renewals, and AI mix.
- Adds scenario prompts that make the aVa dock feel like a CIO chief-of-staff companion.
- Updates the initial aVa turn and suggested prompts to use the CIO dashboard model.
- Expands Tower dashboard tests to cover the new board/action/scenario layer and aVa branding.

## QA / Validation

- Targeted Jest: passed, `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand`.
- Targeted ESLint: passed with pre-existing Tower unused-helper warnings, `npx eslint src/components/tower/TowerIndexPage.tsx src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`.
- TypeScript: passed, `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- Whitespace: passed, `git diff --check`.
- `npm run release:check`: passed after this record was updated.

## Rollout Plan

Merge to `main`, deploy through the approved Azure Container Apps main deploy workflow, verify the runtime invariant, then run signed-in browser proof on `/tower` for the dashboard and board view.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be recorded by ACA deploy.
- ACA runtime invariant: Template image, active revision image, and 100% traffic digest must match.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy the prior approved `main` image through the ACA deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA revision/digest: pending.
- Browser screenshots: pending after deploy.

## Known Gaps

- This release does not create new Tower facts. If measured value, run/change, CapEx/OpEx, or richer AI ROI fields are absent, Tower still names them as gaps.
