# 2026-05-30 · Atlas P0 cross-tenant leak — fixes A1 + A2

## Release ID
`2026-05-30-atlas-p0-cross-tenant-leak`

## Status
candidate

## Plain-English Summary
Atlas, the Tower agent that answers CIO/CFO questions, leaked content between tenants. A live Apex Retail conversation surfaced Meridian-only material (Abridge, BAA, HIPAA references) and a retired tenant name ("Asterline"). The Atlas CXO-quality audit (PR #2562) pinned two independent leak paths.

This release closes both.

**Leak 1 — synthesis route.** `src/app/api/tower/synthesis/route.ts` hardcoded the Apex portfolio fixture and the literal user-message `"Portfolio snapshot for Apex Retail Group:"` regardless of signed-in tenant. Replaced with a tenant-resolving `loadTenantTowerPortfolio(tenancy)` helper. The Apex fixture is now returned ONLY when `tenantKey === 'apexretail'` AND a new `tower_synthesis_apex_demo_fixture` feature flag is on. Other tenants get empty inputs — never Apex content. The portfolio-snapshot prefix now uses the active tenant's display name from `getActiveClientRow()`. Cache key now includes the tenant key so cached Apex synthesis cannot be served to other tenants.

**Leak 2 — retrieval.** `src/lib/agent/retrieval.ts` did not call `normalizeLegacyClientAliases`, so retired client names (`Asterline`, `Heliara`, `Brindlemark`) leaked straight into the model context. Added `scrubChunks` over every retrieval output (vector and Postgres-fallback). Replaced the unscoped `global:ai_governance` topic namespace with `topicNamespace(industry)` — industry-scoped so Meridian's healthcare topics (Abridge / BAA) cannot return to a retail tenant.

## Layer Impact
- `runtime-app-lane`: synthesis route + retrieval pipeline now tenant-correct; cache key includes tenant.
- `architecture-lane`: new helper `src/lib/reasoning/tenant-tower-portfolio.ts` is the canonical tenant-resolving portfolio loader; `topicNamespace(industry)` replaces the global namespace pull; feature flag `tower_synthesis_apex_demo_fixture` gates the Apex demo fixture.
- `qa-validation-lane`: 4 new test files / 31 cases covering per-tenant snapshots, grep invariants on the route source, and alias-normalization tenant-leak invariants.
- `data-plane-lane`: none.

## Client Applicability
- All clients: yes — the leak affected every tenant. Closing it is mandatory before any real-customer demo.
- Specific clients: none preferentially.
- Internal only: no.
- Public/demo only: the Apex demo path remains available behind an explicit feature flag for synthetic-pilot demos only.

## Changes Included
- `src/app/api/tower/synthesis/route.ts` — removed hardcoded `APEX_RETAIL_PROGRAM_INSTANCES` import; replaced hardcoded portfolio + display name; added tenant-scoped cache key; extracted `composeAtlasSynthesisUserMessage`.
- `src/lib/reasoning/tenant-tower-portfolio.ts` — new tenant-resolving portfolio loader; Apex fixture gated by tenantKey + feature flag.
- `src/lib/agent/retrieval.ts` — added `normalizeLegacyClientAliases` + `scrubChunks`; replaced `global:ai_governance` with industry-scoped `topicNamespace(industry)`.
- `scripts/verify-retired-tenant-references.mjs` — allowlisted `src/lib/agent/retrieval.ts` and its test file (legitimate references inside the normalization code).
- 4 new test files / 31 cases: `src/lib/reasoning/__tests__/tenant-tower-portfolio.test.ts`, `src/app/api/tower/synthesis/route.test.ts` (extended), `src/app/api/tower/synthesis/route.invariants.test.ts`, `src/lib/agent/__tests__/retrieval-tenant-leak.test.ts`.

## QA / Validation
- `npx tsc --noEmit` clean.
- 60 suites / 772 tests pass in `src/lib/reasoning` + `src/app/api/tower`.
- New invariants: no hardcoded `"Apex Retail Group"` or `APEX_RETAIL_PROGRAM_INSTANCES` survives in any Atlas runtime code path. No legacy alias (`Asterline`, `Heliara`, `Brindlemark`) appears in any rendered Atlas output for any tenant.
- Snapshot test: Meridian + First Capital tenants produce their own portfolio content, never Apex's.
- `verify-retired-tenant-references: clean` locally after the allowlist patch.
- Pre-existing failures on main (tenant-onboarding, commitProgram / completeProgram / completeModule) confirmed unrelated via stash-and-rerun.

## Rollout Plan
- Merge this PR to main.
- Vercel auto-deploys main; production deploy applies the fix.
- Apex demo paths remain available via the explicit feature flag; default is off.
- Recommend an immediate manual smoke against Atlas in production with Meridian and First Capital sessions to confirm portfolio + topic content is tenant-correct.

## Rollback Plan
- Revert the two source-file commits (`src/app/api/tower/synthesis/route.ts`, `src/lib/agent/retrieval.ts`) plus `src/lib/reasoning/tenant-tower-portfolio.ts`. Atlas returns to the leaking state. Allowlist patch and tests can stay.
- The feature flag also provides a soft rollback: turning `tower_synthesis_apex_demo_fixture` on with a global tenant override would restore the Apex demo behavior, but should NOT be used in production.

## Audit Evidence
- Atlas CXO-quality audit doc `docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md` § "Two prosecution exhibits" — pinned both leak paths to file:line.
- Live transcript against Apex Retail surfaced "Asterline" + "Abridge" + "missing BAA on a clinical-adjacent tool" — Meridian content bleeding into Apex.
- CI gates on this PR: Typecheck + reasoning-layer tests, ESLint, Production readiness, hygiene_gate.sh, Verify canonical tenant allowlist (after allowlist patch), Release record.

## Known Gaps
- The `Routes and disclaimers` integrity check may still report pre-existing main breakage unrelated to this PR. Same precedent as S9/S10/U1 Tower agents — that gate's failure is admin-mergeable when it is the only remaining failure.
- The four other Atlas fix tracks (response-shape boilerplate, determinism + truncation, intent classifier expansion, eval harness) ship in sibling PRs (#2563, #2564, #2566). Together they implement the audit's prioritized P0–P3 plan.
