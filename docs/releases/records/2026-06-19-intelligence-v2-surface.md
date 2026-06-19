# 2026-06-19-intelligence-v2-surface — Intelligence v2 surface (the Lens) wired to the binding contract

## Release ID

`2026-06-19-intelligence-v2-surface`

## Status

`candidate`

## Plain-English Summary

Ships the Intelligence v2 design (the "Lens" — ask-first, grounded, with Signals / Context / Corpus tabs) as the live `/intelligence` surface for the five demo tenants. It renders from a committed binding payload (`all-tenants.json`) via a read-model, showing real per-tenant signals (with domain tags, confidence, evidence/source counts, and Shape-into-Move), the loaded-context dimensions (Mirror), and matched corpus patterns. Tenants without a binding payload fall back unchanged to the existing Context & Corpus Explorer.

## Layer Impact

- **global-control-lane**: shared `/intelligence` surface behavior. New component `IntelligenceV2Surface`, new read-model `getIntelligenceBindingPayload`, and a committed build-time data asset (`src/lib/intelligence/binding/all-tenants.json`). The page renders v2 when a payload exists for the active tenant, else the existing explorer — additive, with graceful fallback. No schema or client DB write.

## Client Applicability

- Specific clients: the five demo tenants — First Capital, SkyHarbor, Meridian, Lakeshore, Apex — render the v2 surface (they have binding payloads). All other tenants are unaffected (explorer fallback). No feature flag; presence of a payload is the gate.

## Changes Included

- `src/lib/intelligence/binding/all-tenants.json` — CREATED: committed binding payload for 5 tenants (signals/context/corpus/questions/trust; evidence scaled to real V4 ACA load depth). Produced by `scripts/context-packs/build-intelligence-binding-payload.py`.
- `src/lib/intelligence/binding/binding-payload.ts` — CREATED: typed read-model `getIntelligenceBindingPayload(tenantKey)` with app-key→payload-key aliasing. Documented seam to swap to a DB-computed read-model later (same signature).
- `src/components/intelligence-v2/IntelligenceV2Surface.tsx` — CREATED: the v2 design as a client component (Fraunces/Geist/mono, hairline cards, cross-domain chips), tabbed Signals/Context/Corpus, rendered from the payload.
- `src/app/(maestro)/intelligence/page.tsx` — MODIFIED: render v2 when a binding payload exists for the active tenant; else fall back to the Context & Corpus Explorer (v2 skips the heavier overview/tower fetches).
- `docs/releases/records/2026-06-19-intelligence-v2-surface.md` — CREATED: this record.

## QA / Validation

Status: PASS (static) / NOT-RUN (live signed-in — to be verified post-deploy on app.abarva.ai)

- PASS: `npx eslint` on the four touched files — exit 0.
- PASS: `npx tsc --noEmit` — zero errors in the touched files. (23 pre-existing project errors: stale `.next/dev/types` + Codex's `js-yaml` TS7016 in P1/P2 loader files — not introduced here and not build-blocking; main deploys green.)
- PASS: design + data verified rendering together in the standalone prototype (all 5 tenants, tenant switch) prior to porting.
- NOT-RUN: live signed-in QA — confirm `/intelligence` renders v2 per tenant on app.abarva.ai after deploy.

## Rollout Plan

Squash-merge to `main`; `.github/workflows/aca-main-deploy.yml` builds and deploys a new revision to `ca-abarva-web-lab-eastus` (app.abarva.ai). Post-deploy: open `/intelligence` for each demo tenant and confirm the v2 surface renders with real per-tenant signals/context/corpus.

## Rollback Plan

Additive with graceful fallback. Rollback = `git revert` the squash commit; the same workflow redeploys the prior revision, restoring the Context & Corpus Explorer for all tenants. No data migration to unwind (the binding payload is a static asset; removing it reverts every tenant to the explorer).

## Audit Evidence

- Binding payload generator: `scripts/context-packs/build-intelligence-binding-payload.py` (committed on `docs/source-intelligence-os-spec`).
- Data-bound prototype the design+data were verified against: `outputs/intelligence-binding/AbarVa-Intelligence-v2-databound.html`.
- Evidence counts trace to the V4 ACA load receipt (facts-per-record per tenant).

## Known Gaps

- The hero **Ask bar + suggested-question chips are presentational** in v1; conversational answers wire to the grounded answer engine in a follow-on.
- The binding payload is a **build-time data asset**; the documented seam swaps `getIntelligenceBindingPayload` to compute the contract live from the data plane later (return shape unchanged).
- "Trace evidence" / "Shape into Move" links are present but not yet wired to the evidence drill-down / Moves origination.
