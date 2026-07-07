# 2026-06-01-source-l6-governance-followup — Source L6 Governance Follow-Up

## Release ID

`2026-06-01-source-l6-governance-followup`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source sourcing-event controls that were flagged in the June 1 L6 QA memo. Legacy seeded gate criteria that were marked met without a reason, committed artifact, and ready evidence are no longer counted as valid. AI-generated artifact outlines must be human-edited before completion, event approval requires a typed human reason plus explicit confirmation, self-approval is disclosed and logged, and the CXO report HTML route avoids loading the PPTX renderer unless PPTX output is requested.

## Layer Impact

- `global-control-lane`: Source governance rules, approval UX, artifact completion rules, and Source export route behavior change for all clients using Source.
- `internal-admin`: The Source admin approval queue now requires accountable human approval input and surfaces self-approval risk.

## Client Applicability

- All clients: Source event stage gates, artifact completion controls, Source event approval queue, and Source CXO report export behavior.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Source governance enforcement now verifies previously met gate criteria against current artifact, evidence, and reason controls before stage promotion.
- Source event canvas display invalidates legacy met criteria that fail current controls and records a synthetic governance log entry explaining why they no longer count.
- Artifact completion rejects AI-only generated bodies until the user saves a human edit; body saves preserve AI provenance and add human-edit metadata.
- Admin Source event approval/rejection requires a reason, an explicit confirmation checkbox, a browser confirmation step, and server-side confirmation/reason validation.
- Approval records add a self-approval notice when the approver is also the recorded event creator.
- CXO report HTML export defers PPTX renderer imports until `format=pptx`.
- Focused tests cover Source governance enforcement and admin approval queue controls.

## QA / Validation

- `npx jest src/lib/source/__tests__/source-governance-enforcement.test.ts src/components/source/__tests__/AdminSourceEventApprovalQueue.test.tsx src/__tests__/integration/source/source-access-control-static.test.ts --runInBand` — passed locally, 22/22 tests.
- `npx tsc --noEmit --pretty false` — passed locally.
- `npm run release:check -- --base origin/main --head HEAD` — passed locally.
- `git diff --check` — passed locally.
- `npm run build` — passed locally after replacing the worktree `node_modules` symlink with a local copy for Turbopack. Build emitted existing local environment warnings for Azure DNS fallback, pg SSL-mode semantics, and the localstorage-file flag.
- Browser/deployed-preview retest required after merge and deploy for CXO report, approval queue, AI draft completion, and seeded gate invalidation.

## Rollout Plan

Merge to `main` after green CI. Vercel production deployment makes the controls active without database migrations. No manual data migration is included; legacy seeded records are handled at read/promotion time by the new verification logic.

## Rollback Plan

Revert the PR from `main` and let Vercel redeploy the prior Source behavior. No schema rollback is required because this release does not add migrations.

## Audit Evidence

- PR URL and CI run once opened.
- Local focused Jest output.
- Local TypeScript and release-check output.
- Post-deploy browser crawl output for Source event approval, artifact completion, stage promotion, and CXO report export.

## Known Gaps

- Clerk development-key rotation is an environment/configuration task and is not implemented in this code release.
- Full separation-of-duties enforcement is not claimed. This release records and displays self-approval risk but does not require a second user for approval.
- Persistence/legal sign-off rows in the pilot readiness tracker must remain undone unless separately implemented and verified.
