# 2026-07-14-candidate-preview-runtime-fallback — Candidate Preview Runtime Fallback

## Release ID

`2026-07-14-candidate-preview-runtime-fallback`

## Status

`candidate`

## Plain-English Summary

The reviewed canonical build candidate preview route no longer depends only on generated report files being packaged into the production image. If the inactive candidate-version report artifact is unavailable at runtime, the admin-only preview and Data Layer Explorer compute the same deterministic inactive candidate snapshot in memory from canonical tenant inputs. This keeps the browser-visible proof path available without writing production tenant data, promoting a candidate, or changing module default reads.

## Layer Impact

- Internal admin: `/admin/candidate-preview` and `/admin/data-layer-explorer` can render inactive candidate preview metadata from a runtime deterministic fallback when report artifacts are absent.
- Enterprise data control plane: adds a read-only loader result that distinguishes `report_artifact`, `runtime_deterministic_fallback`, and `missing`.
- Runtime product modules: no change. Home, Intelligence, Moves, Source, and Tower do not read candidate data by default.

## Client Applicability

- All clients: The admin control-plane fallback applies to every tenant represented by the canonical tenant input build.
- Specific clients: SkyHarbor and Meridian remain the explicit richness proof tenants for this candidate-version route.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: Candidate preview still requires explicit request parameters and acknowledgement.

## Changes Included

- Added runtime deterministic fallback loader in `src/lib/enterprise-data/candidate-version-build/candidate-version-build.ts`.
- Updated `/admin/candidate-preview` to use the fallback loader and label the load source.
- Updated `/admin/data-layer-explorer` to use the fallback loader and show the source in the candidate-version panel.
- Added a regression test that forces runtime fallback without relying on bundled report artifacts.

## QA / Validation

- `npx jest src/lib/enterprise-data/candidate-version-build/__tests__/candidate-version-build.test.ts --runInBand` — Pass.
- `npx eslint src/lib/enterprise-data/candidate-version-build/candidate-version-build.ts 'src/app/(maestro)/admin/candidate-preview/page.tsx' 'src/app/(maestro)/admin/data-layer-explorer/page.tsx' src/lib/enterprise-data/candidate-version-build/__tests__/candidate-version-build.test.ts` — Pass.
- Isolated TypeScript compile for candidate-version build and data-build scripts — Pass.
- `npm run audit:candidate-version` — Pass.
- `npm run audit:active-candidate-separation` — Pass.
- `npm run audit:enterprise-naming` — Pass.
- `npm run release:check` — Pass.
- `git diff --check` — Pass.

## Rollout Plan

Merge by PR, deploy through the repo-owned Azure Container Apps main workflow, then verify the candidate preview route in a signed-in browser.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside the repo-owned workflow.
- Approved image digest: captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, `/admin/candidate-preview` with explicit candidate-preview parameters.

## Rollback Plan

Revert the PR or roll ACA traffic back to the prior healthy digest-pinned revision. No data rollback is required because this change writes no tenant data and performs no promotion.

## Audit Evidence

- Follow-up PR for runtime fallback.
- ACA deployment evidence after merge.
- Signed-in browser proof showing inactive candidate banner, guardrails, and SkyHarbor/Meridian candidate counts.

## Known Gaps

Candidate preview remains inactive and operator-controlled. This does not promote any tenant candidate or make candidate data active tenant truth.
