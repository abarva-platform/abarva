# 2026-07-19-tower-value-realization-page - Tower Value Realization Page

## Release ID

`2026-07-19-tower-value-realization-page`

## Status

`candidate`

## Plain-English Summary

Tower now opens on the AI Value Realization Control Tower treatment: the visible command page states that AI activity is not value, shows $0 claimable today, and keeps promised, finance-validated, and realized-allowed value separate. The old command-page read remains superseded by the governed mart/value-realization presentation.

## Layer Impact

`global-control-lane` - Updates shared Tower UI rendering and Tower aVa routing/context metadata for every tenant that reaches the Tower command mart or governed CXO view.

No data-plane schema, migration, loader, or tenant corpus mutation is included.

## Client Applicability

- All clients: Tower tenants using the shared `/tower` surface receive the updated value-realization page.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/tower/TowerIndexPage.tsx` - Adds the attached value-realization title/verdict treatment to the Tower mart and governed CXO paths, keeps aVa hidden by default, and passes Tower measures, portfolio rows, and gaps as dock context.
- `src/lib/cio-tower/answer.ts` - Routes Tower value-realization, claimable value, proof funnel, decision lane, AI portfolio, recommended action, and evidence-gap questions into the governed Tower answer contracts.
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx` - Covers the new page title/verdict, mart-first rendering, and hidden aVa invocation.

## QA / Validation

- `npx eslint src/components/tower/TowerIndexPage.tsx src/lib/cio-tower/answer.ts` - passed with existing unused-code warnings in the Tower file.
- `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand -t "governed Portfolio|Tower command mart|starter questions"` - passed 6 focused tests; duplicate manual mock warnings and Recharts zero-size test-environment warnings are pre-existing.
- Local signed-in browser proof was attempted, but localhost is blocked before Tower by the Responsible AI acknowledgment ledger because the local machine cannot record the acceptance evidence. Live browser proof is required after ACA deployment.

## Rollout Plan

Merge the PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the exact main SHA image to `app.abarva.ai`. No manual ACA mutation is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Must be checked after deployment before claiming live.
- Worker image invariant: No worker image changes expected; verify if the deploy workflow reports worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/tower?client=meridian` or the active Tower client route after the main deploy reaches 100% traffic.

## Rollback Plan

Revert the PR and let the main ACA deploy workflow publish the rollback SHA. No database rollback is required.

## Audit Evidence

Use the PR, merged commit, ACA main deploy run, runtime image/digest proof, and post-deploy signed-in Tower screenshots/checks as the release evidence bundle.

## Known Gaps

Live signed-in proof is pending until this candidate is merged and deployed through the approved ACA main workflow.
