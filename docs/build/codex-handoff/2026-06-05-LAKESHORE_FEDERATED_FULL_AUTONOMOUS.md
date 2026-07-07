# Codex Autonomous Execution Brief — Lakeshore Federated AI Strategy Demo

**Created:** 2026-06-05
**Authoring lineage:** Design package at `docs/build/moves-design/lakeshore-federated-ai-strategy/` (10 files, 11,355 lines) cleared by design module review (`05-design-module-review.md`). All 5 cross-doc Qs resolved with named spec ownership.

**Mandate:** Build the Lakeshore Federated demo end-to-end: 17 specs across 4 waves, full merge + deploy authority, no time/spend caps, quality gates only. Codex auto-continues between waves on green.

---

## What this demo is

The first **federated tenant** demo on AbarVa. L0 Lakeshore sponsor sees portfolio-wide rollups over three L1 HoldCos (Morgan Street Holdings Chicago, Roosevelt Holdings Atlanta, Lakefront Capital Boston). Five Moves run in parallel; six Source events spawn from Move architecture phases; Tower's new "Federated" tab is the L0 sponsor's daily-use surface.

Hero stories:
- **Move 0** de-risks Morgan Street's Kyriba rollout (6-gate canonical pattern, generalizable to any platform rollout)
- **Move 1** adds AI on top of Kyriba (4 capabilities: 12-week forecast · payment anomaly · covenant headroom · IC auto-recon); Lakefront is the live reference
- **Move 2** runs cross-HoldCo vendor consolidation surfacing $3.3-5.0M annual savings
- **Move 3** federated IT strategy + AI capability marketplace
- **Move 4** federated risk + concentration governance

Source events L-S01 through L-S06 spawn from Moves into the redesigned Source 11-stage lifecycle (`docs/build/source-design/`) — Lakeshore is the first real-world test of that redesign.

---

## The design package — your single source of truth

Read in this order before starting any spec:

1. `docs/build/moves-design/lakeshore-federated-ai-strategy/README.md` — package overview + reading order + the 5 locked rules
2. `docs/build/moves-design/lakeshore-federated-ai-strategy/01-lakeshore-federated-structure-brief.md` — entities · CXO bench · vendor matrix · benchmarks
3. `docs/build/moves-design/lakeshore-federated-ai-strategy/02-demo-spine-architecture.html` — lifecycle map · 5 Moves · Source event spawn points · state machine
4. `docs/build/moves-design/lakeshore-federated-ai-strategy/03-cxo-intel-loader-spec.html` — CSV schemas + UX pattern (per CXO bundle)
5. `docs/build/moves-design/lakeshore-federated-ai-strategy/04-artifact-contracts.html` — **master spec** · per-Move per-phase per-artifact contracts · provenance rules
6. `docs/build/moves-design/lakeshore-federated-ai-strategy/05-design-module-review.md` — verdicts · 5 open Qs resolved with named ownership · wave assignment
7. `docs/build/moves-design/lakeshore-federated-ai-strategy/06-tower-federated-command-center.html` — Tower Federated tab full-fidelity
8. `docs/build/moves-design/lakeshore-federated-ai-strategy/07-kyriba-derisk-pattern-setter.html` — Move 0 full-fidelity
9. `docs/build/moves-design/lakeshore-federated-ai-strategy/08-cross-holdco-vendor-rationalization.html` — Move 2 full-fidelity
10. `docs/build/moves-design/lakeshore-federated-ai-strategy/09-business-case-pattern-setter.html` — Phase 4 full-fidelity (all Moves)
11. `docs/build/moves-design/lakeshore-federated-ai-strategy/10-mobilization-pattern-setter.html` — Phase 5 full-fidelity (all Moves)

**Treat the design package as the contract.** Do not modify any file under `docs/build/moves-design/lakeshore-federated-ai-strategy/`. If a spec implementation surfaces a real gap in the design, surface it as a comment in the PR description and ship the implementation against your interpretation; design module review will reconcile post-merge.

---

## Quality gates (G1-G11) — these REPLACE time/spend caps

You auto-continue between waves on green. You STOP and surface only when a gate fails.

| Gate | Check | Stop condition |
|---|---|---|
| G1 | Precondition check before spec start | Required prior spec not merged · required file missing · required schema not migrated |
| G2 | TypeScript compiles clean | `npx tsc --noEmit` errors |
| G3 | ESLint passes clean | `npx eslint src/` errors at error level |
| G4 | Unit + behavior tests pass | `npm run test:nav` or `npm run test:behaviors` fail |
| G5 | Integration tests pass for changed surfaces | `npm run test:integration` failure scoped to changed module |
| G6 | Design fidelity matches pattern setter | Visual diff against `07`/`08`/`09`/`10` shows material drift (colors · typography · density · component pattern) |
| G7 | RLS posture pen-test passes | L0 user can read sibling HoldCo transaction grain · ANY false positive blocks |
| G8 | No claim without provenance | Sentinel-generated artifact body contains string without resolvable evidence chain (loaded record OR corpus pattern OR confirmed human input) |
| G9 | No fake completion | UI shows phase or gate as "complete" without acceptance criterion measured from substrate state |
| G10 | No export of nothing | Export button enabled when artifact body is null · violates locked rule |
| G11 | release:check passes | `npm run release:check` errors — release record required for release-relevant changes |

**On gate failure:** STOP that spec, write a one-page diagnostic to `docs/build/codex-handoff/runs/2026-06-XX-lakeshore-stop-<gate>-<spec>.md` describing what failed, what you tried, what you'd need from Anand to resolve. Then proceed to other independent specs.

---

## Wave 1 — Foundation (parallel · 4 PRs)

Auto-continue between Wave 1 specs on green. Wave 2 starts when Wave 1's 4 PRs are all merged.

### Spec L01 — Holding-group tenancy substrate

**Files:**
- `supabase/migrations/2026XXXXXXXXXX_holding_group.sql` — new column `holding_group_id` on `tenants` table; index; backfill for Lakeshore + Morgan Street + Roosevelt + Lakefront
- `src/lib/auth/source-access-policy.ts` — extend to honor `holding_group_id` for L0 aggregate reads
- `src/lib/auth/holding-group-policy.ts` — new file defining `canReadAggregate`, `canReadTransactionGrain`, `canApproveSpawn` predicates
- `tests/integration/holding-group-rls.spec.ts` — pen-test simulating L0 sponsor attempting to read sibling HoldCo transaction grain

**Acceptance:** L0 sponsor (canonical-admin with sponsor role + `holding_group_id` match) reads aggregate-level data across all L1 children. L0 sponsor cannot read Morgan Street vendor contract terms or banking transaction grain without explicit grant. Pen-test (G7) passes.

**Release record:** Required. `client-data-lane`. Document the `holding_group_id` posture + L0 aggregate-read pattern.

### Spec L02 — CXO Intel Loader UI (CIO + CFO bundles)

**Files:**
- `src/app/(setup)/admin/cxo-intel/page.tsx` — landing page with 5 bundle cards (CIO + CFO active; COO + CHRO + GC marked "Wave 2")
- `src/app/(setup)/admin/cxo-intel/cio/page.tsx` — CIO bundle upload (7 CSVs)
- `src/app/(setup)/admin/cxo-intel/cfo/page.tsx` — CFO bundle upload (7 CSVs)
- `src/lib/cxo-intel/parsers/*.ts` — parser per CSV schema, matching 03 spec
- `src/lib/cxo-intel/validators/*.ts` — validator per CSV with row-level red/amber/green
- `supabase/migrations/...` — `cxo_intel_app_inventory`, `cxo_intel_cloud_footprint`, `cxo_intel_vendor_contracts`, `cxo_intel_ai_roadmap`, `cxo_intel_it_spend`, `cxo_intel_risk_register`, `cxo_intel_org_chart`, `cxo_intel_finance_systems`, `cxo_intel_banking_relationships`, `cxo_intel_audit_engagements`, `cxo_intel_insurance_program`, `cxo_intel_close_metrics`, `cxo_intel_it_spend_ratios`, `cxo_intel_tax_engagements` — RLS scoped to HoldCo tenant
- `src/components/cxo-intel/UploadFlow.tsx` — the canonical 6-step pattern from 03 §2

**Acceptance:** Upload Morgan Street CIO + CFO bundles via the loader. All 14 substrate tables receive records. Validation surfaces row-level issues. Post-upload screen shows "this load enables Move 0 + Move 1 + Move 2 (with another HoldCo)" callout (resolves Q1 from design review).

**Release record:** Required. `client-data-lane`.

### Spec L03 — Move 0 Kyriba page

**Files:**
- `src/app/(moves)/[moveCode]/page.tsx` — Move canvas (generic)
- `src/app/(moves)/m-kyriba-derisk/page.tsx` — Move 0 page (or routed via `moveCode=m-kyriba-derisk`)
- `src/components/moves/KyribaDeRiskCanvas.tsx` — the 6-gate canvas matching `07-kyriba-derisk-pattern-setter.html`
- `src/components/moves/GateCard.tsx` — per-gate card with status, owner, recommendation, evidence
- `src/components/moves/LakefrontReferenceDrawer.tsx` — comparison drawer
- `src/lib/moves/kyriba-derisk/queries.ts` — gate status derivation from substrate state
- `src/lib/moves/kyriba-derisk/recommendations.ts` — Sentinel-Treasury agent integration

**Acceptance:** Page renders with 6 gates for Morgan Street. Gate status derives from loaded `cxo_intel_*` data, not seeded constants. Paper header (NOT charcoal — locked rule). Lakefront-reference drawer functional. Visual diff against `07` pattern setter passes (G6).

### Spec L04 — Tower "Federated" tab scaffold

**Files:**
- `src/app/(tower)/federated/page.tsx` — Federated tab landing
- `src/components/tower/federated/PortfolioRollupStrip.tsx` — Zone A
- `src/components/tower/federated/CrossHoldCoOpportunities.tsx` — Zone B
- `src/components/tower/federated/SavingsLedger.tsx` — Zone C (empty in Wave 1)
- `src/components/tower/federated/RiskConcentrationTrend.tsx` — Zone D
- `src/components/tower/federated/CxoPerformance.tsx` — Zone E (empty in Wave 1)
- `src/components/tower/federated/CapabilityMarketplace.tsx` — Zone F (empty in Wave 1)
- `src/lib/tower/federated/visibility.ts` — gate on L0 sponsor role + `holding_group_id` membership

**Acceptance:** Tab visible to L0 sponsor only. Empty state when < 2 L1 bundles loaded shows "needs 2+ HoldCo loads to surface" callout per Zone B/C (resolves Q2 from design review). Zone A renders Morgan Street + Lakefront + Roosevelt portfolio rollup.

---

## Wave 2 — Depth (week 3-4 · auto-continue from Wave 1 green)

### Spec L05 — Move 0 per-gate artifacts

For each of G1-G6, generate 2-4 artifacts per `04-artifact-contracts.html` Move 0 section. Sentinel-Treasury agent role; corpus patterns cited per artifact contract. Artifact body must satisfy provenance chain (G8). Export gated (G10).

### Spec L06 — Move 2 cross-HoldCo vendor page

Matches `08-cross-holdco-vendor-rationalization.html`. Vendor normalization confidence-graded review queue. PortCo veto path implemented (resolves Q3 from design review — PortCo CFOs get a structured "I object because..." path with named exit-clause review).

### Spec L07 — Cross-HoldCo opportunity ranker

Surfaces from CIO + CFO bundle joins across ≥ 2 HoldCos. Vendor overlap detection, contract renewal calendar (federated), AI capability marketplace stub, risk concentration crossings. Refreshes nightly; quarterly slate generation cadence. Powers Tower Zone B.

### Spec L08 — CXO loader Wave 2 (COO + CHRO + GC)

Same shape as L02 with the 3 additional bundles. 15 substrate tables across the 3. Approval routing per CXO.

---

## Wave 3 — Move 1, 3, 4 + pattern setters (week 5-7)

### Spec L09 — Move 1 AI-on-top-of-Kyriba

4 capabilities each its own surface. Entry condition: Move 0 G1-G4 minimum green (enforced in queries). Capability portfolio surface matches Move 1 section of `02-demo-spine-architecture.html` §5.

### Spec L10 — Move 3 federated IT strategy

AI capability marketplace populated from CIO bundles. Modernization wave coordinator. Federated AI governance framework.

### Spec L11 — Move 4 federated risk

Concentration risk dashboard. CXO benchmarks. Regulatory rollup. Cyber posture rollup.

### Spec L12 — Business case pattern setter

Matches `09-business-case-pattern-setter.html`. Estimation engine API exposed via React hook for live recomputation (resolves Q4 from design review — surface existing `lib/estimation` to the assumption panel).

### Spec L13 — Mobilization pattern setter

Matches `10-mobilization-pattern-setter.html`. 30/60/90 swimlane with EoC criteria; dependency graph with `blocked_until` links; RACI table.

---

## Wave 4 — Source spawns + polish (week 8+)

### Spec L14 — Source spawn from Move 1 Phase 3 (L-S01 Banking)

Move 0 Phase 3 Architecture page emits "Spawn Banking Consolidation RFP" affordance when G1 status indicates bank consolidation needed. Confirmation modal shows pre-filled facts. Post-spawn navigates to Source Strategy stage with banner "Spawned from Move m-kyriba-derisk · Morgan Street" (resolves Q5 from design review).

### Spec L15 — Source spawns from Move 2 (L-S02 through L-S05)

Per-category spawn affordance from Move 2 quarterly slate. Move 2 hands clean envelope.

### Spec L16 — Federated savings ledger

Cross-Move realized vs projected per vendor/category. Drill-down. Projected derives from Move business cases; realized fills from Move 5 mobilization tracking. No realized without provenance (G8).

### Spec L17 — CXO performance dashboards

Per HoldCo CXO benchmark vs P50/P90 from corpus + bundles. IT spend %, AI maturity score, modernization debt index, talent comp.

---

## Operating rules

1. **Read the design package before each spec.** Cross-doc references matter; do not author from a single file.
2. **Specs ship as their own PR.** No PR spans multiple specs. Each PR title format: `feat(lakeshore): Spec L<NN> · <Title>`
3. **Branch from `main`.** Never branch from another in-flight Codex branch. Resolve sequential dependencies by waiting for prior PR merge to main.
4. **Release records required for client-data-lane and global-control-lane specs.** Use the template at `docs/releases/templates/release-record-template.md`. `npm run release:check` will block in CI if missing.
5. **No `--no-verify`. No `--no-gpg-sign`. No force-push.** If a hook fails, fix the underlying issue. The hooks are the bar.
6. **Auto-merge on green Code-lane PRs per standing authority.** Self-merge specs L01-L17 when CI green and your own implementation acceptance is met. Data-lane changes (L01 specifically) wait for Anand-explicit human approval before merge.
7. **Deploy.** Merge to main auto-deploys to Vercel production. Verify the URL at `https://app.abarva.ai` reflects the change before claiming spec complete.
8. **Crawl test after each spec.** Playwright walks the changed surface; verify (a) artifact opens, (b) downloads succeed, (c) evidence links resolve, (d) approval state matches click, (e) no fake completion shown. Failures STOP the spec.
9. **Do NOT auto-revert a deployed spec without Anand approval.** If post-deploy issue is found, surface for review.
10. **Do NOT modify any file under `docs/build/moves-design/lakeshore-federated-ai-strategy/`.** The design package is the contract.

---

## Reporting

After each wave's last spec merges, write a one-page wave summary to `docs/build/codex-handoff/runs/2026-06-XX-lakeshore-wave-<N>-summary.md`:
- Specs shipped (PR numbers + URLs)
- Gates touched
- Open issues / Q's surfaced
- Crawl test results
- Production URL state

After Wave 4 merges, write the demo-readiness summary to `docs/build/codex-handoff/runs/2026-06-XX-lakeshore-demo-ready.md`:
- All 17 specs merged + deployed
- E2E crawl test results across all 5 Moves
- Tower Federated tab functional with all 6 zones
- 5 locked rules satisfied (provenance · foundation-before-AI · no fake completion · sovereignty · no demo-only data)
- Open issues for follow-up

---

## What to do if stuck

- **Precondition gate fails (G1):** STOP that spec, write the diagnostic, proceed to other independent specs. Do NOT manually patch the precondition.
- **Provenance gate fails (G8):** the artifact contract in `04-artifact-contracts.html` is your source of truth. If the contract specifies a corpus pattern that doesn't exist in substrate, that's a data gap, not an implementation gap — surface it.
- **Visual fidelity gate fails (G6):** the pattern setter HTMLs (07/08/09/10) are the visual contract. If your implementation drifts, re-read the relevant pattern setter and match it.
- **Release check fails (G11):** add the release record before merge. Template at `docs/releases/templates/release-record-template.md`.

If you hit something outside the above, write the diagnostic and continue. Do not improvise on architecture or design — surface the question.

---

**Begin Wave 1 when ready. Auto-continue between waves on green. No time caps, no spend caps, quality gates only.**
