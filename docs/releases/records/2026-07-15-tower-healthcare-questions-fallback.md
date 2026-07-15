# 2026-07-15-tower-healthcare-questions-fallback — Tower Healthcare Questions and Fallback

## Release ID

`2026-07-15-tower-healthcare-questions-fallback`

## Status

`candidate`

## Plain-English Summary

Tower no longer shows holding-company or portfolio-company starter questions to Healthcare/Meridian-style tenants unless the tenant shape supports that language. The Tower aVa path also falls back to a plain-English, deterministic dashboard answer if Claude returns malformed visible-answer JSON, so users do not see internal answer-contract failure text.

## Layer Impact

- Release lane: `global-control-lane`.
- Product UI: Tower starter questions now use tenant-shape-aware wording for holding-company versus enterprise tenants.
- AI answer runtime: Tower chat keeps Claude as the primary advisor, but parse failures now return a governed Tower dashboard fallback instead of exposing contract machinery.
- Audit/trace: fallback answers are still marked as validation failures with `cio_tower_deterministic_fallback_generated`, preserving the truth that Claude output did not pass the strict contract.

## Client Applicability

- All clients: safer Tower fallback behavior.
- Specific clients: Healthcare/Meridian-style tenants receive enterprise starter questions rather than holding-company / portfolio-company wording.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No new flag.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx`
- `src/lib/cio-tower/answer.ts`
- `src/app/api/tower/cio-chat/route.ts`
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
- `src/lib/cio-tower/__tests__/answer.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- Pass: `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand --testNamePattern='starter questions|Healthcare/Meridian'`
- Not run yet: production signed-in browser proof.
- Known existing test issue: the full `TowerCioDashboardSurface` jsdom suite still has older workspace-render assertions that fail because the current AgentDock shell is what jsdom exposes; this candidate does not change that behavior.

## Rollout Plan

Merge through the protected PR lane, let the repo-owned ACA main deploy workflow build and deploy the digest-pinned image, then run signed-in Tower proof for Healthcare Demo and one holding-company tenant.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA traffic changes.
- Shared runtime mutators: None in this PR.
- Approved image digest: To be captured after main deploy.
- ACA runtime invariant: Required before live proof.
- Worker image invariant: Not changed by this PR.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/tower` for Healthcare Demo and one holding-company tenant.

## Rollback Plan

Revert this PR and redeploy through the ACA main workflow. Rollback restores the prior static starter-question list and previous Tower chat error behavior.

## Audit Evidence

- Focused Jest output for answer fallback and starter-question tests.
- PR diff and release record.
- Post-deploy browser proof should capture the Healthcare starter questions and a Tower chat answer that no longer exposes contract-failure language.

## Known Gaps

- This does not complete Tower v3 runtime migration.
- This does not enable `ENABLE_TOWER_V3_CONTEXT_RUNTIME`.
- This does not solve the broader jsdom right-workspace assertion issue in the existing Tower dashboard test suite.
