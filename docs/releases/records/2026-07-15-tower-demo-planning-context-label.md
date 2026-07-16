# 2026-07-15-tower-demo-planning-context-label — Tower Demo Planning Context Labels

## Release ID

`2026-07-15-tower-demo-planning-context-label`

## Status

`candidate`

## Plain-English Summary

Tower now labels demo-tenant budget narratives as synthetic Tower planning context instead of phrasing them as direct production-client financial facts. The change keeps the Healthcare Demo budget answer useful while making clear that the FY26 budget values are part of the demo planning context and remain measurement/readiness safe.

## Layer Impact

- Release lane: `global-control-lane`.
- Product UI: Tower dashboard headline copy now says demo-tenant budget values are shown from synthetic Tower planning context.
- AI answer runtime: deterministic Tower fallback answers now use the same synthetic planning-context language for demo tenants.
- Data plane: No data model, ingestion, candidate, promotion, or TowerContextPack behavior changes.

## Client Applicability

- All clients: safer Tower demo/tenant wording where applicable.
- Specific clients: Demo tenants whose names include `Demo` receive explicit synthetic planning-context labels.
- Internal only: No.
- Public/demo only: Primarily improves demo tenant wording.
- Feature flag: No new flag.

## Changes Included

- `src/lib/cio-tower/cxo-view-model.ts`
- `src/lib/cio-tower/answer.ts`
- `src/lib/cio-tower/__tests__/answer.test.ts`
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`

## QA / Validation

- Pass: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand`
- Pass: `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand --testNamePattern='starter questions|Healthcare/Meridian|dashboard headline'`
- Pass: `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/cxo-view-model.ts src/lib/cio-tower/__tests__/answer.test.ts src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
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

Revert this PR and redeploy through the ACA main workflow. Rollback restores the prior demo-tenant wording.

## Audit Evidence

- Focused Jest output for Tower fallback wording and Tower component fixtures.
- PR diff and release record.
- Post-deploy browser proof should capture the Healthcare Demo Tower answer using synthetic planning-context language.

## Known Gaps

- This does not complete Tower v3 runtime migration.
- This does not enable `ENABLE_TOWER_V3_CONTEXT_RUNTIME`.
- This does not change any Tower data values; it only changes visible wording for demo/planning-context safety.
