# 2026-07-10-airline-demo-display-name - Restore Airline Demo Visible Tenant Name

## Release ID

`2026-07-10-airline-demo-display-name`

## Status

`candidate`

## Plain-English Summary

The SkyHarbor tenant keeps its internal keys and data aliases, but visible product chrome and governed Tower/Source answer paths should show the demo-safe tenant name `Airline Demo`. This release removes the Tower/Atlas-specific display-name override that reintroduced `SkyHarbor Air` and updates Source event display normalization for the same demo tenant.

## Layer Impact

- `global-control-lane`: Shared Tower/Atlas tenant display mapping now follows the canonical demo-safe client name.
- `public-demo`: Airline demo Source event names and account labels use `Airline Demo` instead of the old SkyHarbor legal-style label.
- `client-data-lane`: No data mutation. Internal keys such as `skyharbor-air` and source package codes such as `SKYH-*` remain unchanged.

## Client Applicability

- All clients: No.
- Specific clients: Airline Demo / `skyharbor-air` only.
- Internal only: No.
- Public/demo only: Yes.
- Feature flag: None.

## Changes Included

- `src/lib/client-config.ts`
- `src/config/tenants/CANONICAL_TENANTS.ts`
- `src/lib/cio-tower/metric-packet.ts`
- `src/lib/home/enterprise-landscape-view-model.ts`
- `src/lib/home/know/compose-dossier-answer.ts`
- `src/lib/intelligence/ask/tenant-safety-policy.ts`
- `src/lib/intelligence/advisory-packet/top-100-audit.ts`
- `src/lib/agent/context-bundle.ts`
- `src/lib/agent-claims/validate.ts`
- `src/lib/agent-grounding/openai-prompt.ts`
- `src/lib/agent-grounding/scorer.ts`
- `src/lib/auth/cxo-personas.ts`
- `src/lib/auth/agent-client-logins.ts`
- `src/lib/source/**`
- `src/app/api/v1/source/[eventId]/**`
- `src/lib/tower/portfolio-sequence-view.ts`
- `src/lib/atlas/__tests__/tower-grounding-client-name.test.ts`
- `src/lib/atlas/__tests__/orchestrator-governed-tower.test.ts`
- `src/lib/atlas/__tests__/tower-factual-spine.test.ts`
- `src/lib/cio-tower/__tests__/answer.test.ts`
- `src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx`
- `src/components/source/canvas/UniversalCanvasShell.tsx`
- `src/components/source/canvas/EventIdStrip.tsx`

## QA / Validation

- Pass: focused Tower/Atlas tenant-name tests (`18 passed`).
- Pass: `src/__tests__/behaviors/agent-claims.test.ts` (`18 passed`) after preserving old SkyHarbor aliases as leakage terms for non-airline tenants.
- Pass: ESLint for changed TypeScript/TSX files (`0 errors`, warnings only in pre-existing unused-symbol paths).
- Pass: runtime source scan leaves `SkyHarbor Air` only in aliases, blockers, comments, or fixtures; no non-test display source remains hard-coded to the old visible label.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`.
- Pass: `npm run release:check`.

## Rollout Plan

Merge to `main` and deploy through the repo-owned Azure Container Apps main deploy workflow. After deploy, run live signed-in smoke for Airline Demo on Home, Intelligence, Source, and Tower to confirm visible chrome and aVa answer text do not show `SkyHarbor Air`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by ACA deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Airline Demo route/browser proof.

## Rollback Plan

Revert this PR and redeploy through the ACA main lane. Internal tenant keys are unchanged, so rollback only affects display text.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Live proof: Pending after deploy.

## Known Gaps

Historical datasets, runbooks, and proof artifacts may still contain `SkyHarbor Air` as an internal/source-pack alias. This release targets runtime-visible product labels, not archival renaming.
