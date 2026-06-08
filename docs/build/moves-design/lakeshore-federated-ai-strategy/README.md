# Lakeshore Federated AI Strategy — Design Package

> **⚠️ Canonical-cast divergence (flagged 2026-06-08).** This package describes a
> *federated PE-fund* Lakeshore — Morgan Street / Roosevelt / Lakefront HoldCos,
> CFO Sarah Lindqvist, CIO Daniel Okonkwo. That is **NOT** the canonical Lakeshore
> tenant that is actually loaded. The loaded/canonical Lakeshore is a **diversified
> holdco** — Holdco (CIO **Meera Rao**, CFO **Daniel Whitaker**) over **Northline,
> Brightmark, Forge & Field, Great Lakes Pantry** (see
> `src/scripts/lakeshore/generate-synthetic-context.ts` and
> `docs/build/LAKESHORE_HOLDINGS_TENANT_SETUP_PLAN_2026-06-03.md`). The two are
> structurally different (3 PE HoldCos vs 4 operating companies) and must be
> reconciled before either is demoed; the canonical (Rao/Whitaker) cast wins.
> Reconciliation is a narrative-rewrite follow-up, not a mechanical rename.

**Tenant:** Lakeshore (L0 sponsor) over Morgan Street Holdings Chicago, Roosevelt Holdings Atlanta, Lakefront Capital Boston (L1 HoldCos)
**Audience:** Claude design module (review + refine) → Codex (implement) → demo to PE/HoldCo CXO audience
**Created:** 2026-06-05
**Companion docs:** `docs/build/source-design/` (Source module redesign — the lifecycle these Source events live in)

---

## What this package is

The first **federated** tenant demo on AbarVa. Five Moves, one Tower federated command center, four-six Source events spawned from architecture work, and a CXO intel loader spec that every HoldCo onboards through. Designed to hold up to actual PE-fund CFO / HoldCo CIO / HoldCo Treasurer scrutiny — no demo-only handwaving, every artifact has a defensible provenance chain.

The demo arc:

- **L0 Lakeshore** sponsor sees portfolio-wide rollups, cross-HoldCo opportunities, federated risk
- **L1 Morgan Street / Roosevelt / Lakefront** each onboards via CXO intel loader (CIO, CFO, COO, CHRO, GC bundles)
- **Move 0** de-risks Kyriba rollouts (6-gate canonical pattern, reusable for any platform rollout)
- **Move 1** layers AI on top of Kyriba (forecast, anomaly, covenant, IC auto-recon)
- **Move 2** cross-HoldCo cost reduction via vendor consolidation
- **Move 3** federated IT strategy + AI use case marketplace
- **Move 4** federated risk + governance (concentration, talent, benchmarks)
- **Source events** spawn from Move architecture phases when procurement is genuinely in scope

---

## Reading order

| # | File | Open in browser | Purpose | Audience |
|---|---|---|---|---|
| 1 | [01-lakeshore-federated-structure-brief.md](./01-lakeshore-federated-structure-brief.md) | (Markdown) | The fictionalized HoldCo structure · CXO bench per HoldCo · IT estate posture · benchmarks cited | Everyone — sets the vocabulary |
| 2 | [02-demo-spine-architecture.html](./02-demo-spine-architecture.html) | ✓ | The full lifecycle · 5 Moves × phases · current-vs-target per phase · CXO loader entry · Source event spawn points | Design module · CXO reviewers |
| 3 | [03-cxo-intel-loader-spec.html](./03-cxo-intel-loader-spec.html) | ✓ | Per-CXO upload specs (CIO, CFO, COO, CHRO, GC) · CSV schemas · validation rules · approval routing | Design module → Codex |
| 4 | [04-artifact-contracts.html](./04-artifact-contracts.html) | ✓ | Per-Move per-phase per-artifact spec · input source · generation rule · approval · evidence chain · quality bar | Design module → Codex |
| 5 | [05-design-module-review.md](./05-design-module-review.md) | (Markdown) | Per-artifact verdicts · cross-spec decisions · Wave 1 PR sequencing | Codex |
| 6 | [06-tower-federated-command-center.html](./06-tower-federated-command-center.html) | ✓ | **L0 sponsor's daily-use surface** · portfolio rollup · cross-HoldCo opportunities · federated savings ledger · risk concentration | Codex |
| 7 | [07-kyriba-derisk-pattern-setter.html](./07-kyriba-derisk-pattern-setter.html) | ✓ | **Move 0 full-fidelity** · the 6 gates · per-gate artifact · canonical "Platform Rollout De-Risk" pattern | Codex |
| 8 | [08-cross-holdco-vendor-rationalization.html](./08-cross-holdco-vendor-rationalization.html) | ✓ | **Move 2 full-fidelity** · vendor normalization · taxonomy · leverage scoring · rationalization slate | Codex |
| 9 | [09-business-case-pattern-setter.html](./09-business-case-pattern-setter.html) | ✓ | **Phase 4 full-fidelity** · investment + benefits realization · rate-card driven · works for all 5 Moves | Codex |
| 10 | [10-mobilization-pattern-setter.html](./10-mobilization-pattern-setter.html) | ✓ | **Phase 5 full-fidelity** · 30/60/90 + RACI · foundation-before-AI sequencing · works for all 5 Moves | Codex |

All HTML files are self-contained — no build step, no JS deps. Open in any browser.

---

## How Codex uses this package

Codex picks up `04-artifact-contracts.html` + `05-design-module-review.md` and ships **wave-by-wave**, building against `06`/`07`/`08`/`09`/`10` as the visual + fidelity bar.

### Wave 1 — Foundation (week 1-2)

**Phase 1 (parallel — 4 PRs):**
- **Spec L01** — Holding-group tenancy substrate (`holding_group_id`, parent-tenant aggregate-read pattern, RLS posture)
- **Spec L02** — CXO intel loader UI (CIO + CFO bundles first; admin role gated)
- **Spec L03** — Move 0 Kyriba de-risk page (the 6-gate canvas, matches `07-kyriba-derisk-pattern-setter.html`)
- **Spec L04** — Tower "Federated" tab scaffold (L0-only; visibility based on `holding_group_id` membership)

### Wave 2 — Move 0 + Move 2 depth (week 3-4)

- **Spec L05** — Move 0 per-gate artifacts (banking inventory · ERP feed audit · entity registry · historical position reconstruction · adoption sprint · IC auto-recon)
- **Spec L06** — Move 2 cross-HoldCo vendor analytics page (matches `08-cross-holdco-vendor-rationalization.html`)
- **Spec L07** — Cross-HoldCo opportunity ranker (powering L0 Tower "Opportunities this week")
- **Spec L08** — CXO intel loader COO + CHRO + GC bundles

### Wave 3 — Move 1, Move 3, Move 4 (week 5-7)

- **Spec L09** — Move 1 AI-on-top-of-Kyriba use cases (4 capabilities each with own surface)
- **Spec L10** — Move 3 federated IT strategy + AI marketplace
- **Spec L11** — Move 4 federated risk + governance
- **Spec L12** — Business case pattern setter (matches `09-business-case-pattern-setter.html`)
- **Spec L13** — Mobilization pattern setter (matches `10-mobilization-pattern-setter.html`)

### Wave 4 — Source events + polish (week 8+)

- **Spec L14** — Source event spawn from Move 1 Phase 3 (banking consolidation pre-fill)
- **Spec L15** — Source event spawn from Move 2 (vendor consolidation per category)
- **Spec L16** — Federated savings ledger (cross-Move realized vs projected)
- **Spec L17** — CXO performance dashboards in Tower

Each spec ships as its own PR. No PR spans multiple specs. Source module redesign (`docs/build/source-design/`) is treated as canonical and unchanged — Lakeshore Source events are the first real-world test.

### Reading order when picking up a spec

1. Read the spec in **04-artifact-contracts.html** (input · generation · approval · evidence · bar)
2. Open **02-demo-spine-architecture.html** for the lifecycle context
3. If the spec implements Move 0 → open **07-kyriba-derisk-pattern-setter.html**; match its fidelity
4. If the spec implements Move 2 → open **08-cross-holdco-vendor-rationalization.html**
5. If the spec implements a business case or mobilization phase → open **09**/**10**
6. If the spec implements an L0 Tower surface → open **06-tower-federated-command-center.html**
7. Cross-check against **05-design-module-review.md** for the verdict on that spec

---

## The five locked rules

These are the load-bearing usage constraints. No artifact in any Move can violate them.

1. **No claim without provenance.** Every Sentinel-generated sentence cites either a loaded record (CXO intel bundle row), a corpus pattern ID, or a confirmed human input. If none exist, Sentinel says "I need X to answer this" — not a plausible-sounding guess.

2. **Foundation-before-AI sequencing.** No AI use case ships until its data plane + governance foundation is signed off. Mobilization plans (Phase 5) make this dependency explicit; the AI use case has a `blocked_until` reference to the foundation milestone.

3. **No fake completion.** A phase is not "done" until its artifacts exist, their evidence chains resolve, and the next-phase entry conditions are met. Tower's L0 rollup shows true state, not aspirational state.

4. **HoldCo data sovereignty.** L0 sees aggregates; HoldCo CXOs see their own data fully; sibling HoldCos cannot read each other's transaction-grain data without explicit grant. The `holding_group_id` substrate enforces this; UI affordances respect it.

5. **No demo-only data.** Every loaded record is either real (where we have it) or fictionalized-with-disclosure. The 01 structure brief marks every fictional anchor. No claim references "data we'd have in production" — the loader UI shipped Wave 1 lets us load real data when we have it.

---

## Status

| Doc | State | Lines |
|---|---|---|
| 01 Structure brief | ✓ Complete | 196 |
| 02 Demo spine | ✓ Complete | 543 |
| 03 CXO loader spec | ✓ Complete | 1,641 |
| 04 Artifact contracts | ✓ Complete · master spec | 2,033 |
| 05 Design module review | ✓ Complete · Wave 1-4 cleared | 187 |
| 06 Tower federated CC | ✓ Complete · 1 revision noted (Q2) | 1,121 |
| 07 Kyriba de-risk pattern | ✓ Complete | 1,283 |
| 08 Cross-HoldCo vendor | ✓ Complete · 1 revision noted (Q3) | 1,492 |
| 09 Business case pattern | ✓ Complete | 1,328 |
| 10 Mobilization pattern | ✓ Complete | 1,593 |
| **Total** | | **11,417** |

Package status: **Complete. Codex pickup ready.**

Autonomous execution brief at: `docs/build/codex-handoff/2026-06-05-LAKESHORE_FEDERATED_FULL_AUTONOMOUS.md`

All 17 Codex specs (L01-L17) assigned to 4 waves. Wave 1 cleared for immediate pickup. 5 open Qs (Q1-Q5) resolved with named spec ownership; they do not block Wave 1 start.
