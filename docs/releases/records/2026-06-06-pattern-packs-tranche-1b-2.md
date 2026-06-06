# 2026-06-06 — Pattern Packs tranche 1b + 2 + Move Artifact Contract

## Release ID

`2026-06-06-pattern-packs-tranche-1b-2`

## Status

`candidate`

## Plain-English Summary

Completes the Pattern Pack Bible: adds two cross-cutting packs (Responsible AI & Clinical Ops; Source/SI Databricks Implementation), two Lakeshore domain packs (Finance/Treasury; Cost-Reduction/Vendor), and the Move Artifact Contract — the common "what good looks like" bar every Move artifact must satisfy. Brings the library to 235 patterns across 13 packs plus the contract. Documentation-only.

- **RAI** (17 patterns) — responsible-AI + clinical-governance spine: no-autonomous-clinical-action, HIL/approval gates, model cards, bias/subgroup eval (Obermeyer 2019), local validation + drift (Epic Sepsis Model lesson), kill-switch/rollback, regulatory mapping (FDA GMLP, HHS §1557, NIST AI RMF, EU AI Act, ONC HTI-1).
- **SISRC** (16 patterns) — Source/SI selection for a Databricks build: RFP lane decomposition, SI scorecard, rate-card guardrails, the IP-transfer spine clause (accelerator IP assigns to the client), BAFO levers, Move→Source spawn hand-off.
- **TREAS** (19 patterns) — finance/treasury for a multi-entity HoldCo: Kyriba/TMS rollout de-risk, 13-week + forward forecasting, payment anomaly/BEC, covenant headroom, IC auto-recon, working capital. Own-it thesis: rent the rails, own the intelligence.
- **COST** (18 patterns) — cross-entity vendor rationalization: normalization, taxonomy, consolidation ranking, federated contracts/audit/insurance/cyber, savings realization (projected→contracted→realized). Own-it thesis: own the spend graph + savings logic.
- **Move Artifact Contract** — the universal artifact bar (evidence/assumptions/options/architecture/economics/governance/roadmap/sourcing), per-phase contract, provenance contract, and the kernel-enforcement mapping.

## Layer Impact

- `global-control-lane`: documentation — extends the authored reference library. The healthcare domain packs are already encoded into the typed kernel; TREAS/COST are ready for the same encoding lane (separate PR when it touches `src/`).

## Client Applicability

- All clients: No direct runtime effect. Specific clients: TREAS/COST ground the Lakeshore demo; RAI/SISRC are cross-domain. Internal only: authored IP. Public/demo only: No. Feature flag: N/A.

## Changes Included

- `docs/build/pattern-packs/cross-cutting/07-responsible-ai-clinical-ops.md` (17 patterns)
- `docs/build/pattern-packs/cross-cutting/08-source-si-databricks-implementation.md` (16)
- `docs/build/pattern-packs/domains/04-finance-treasury.md` (19)
- `docs/build/pattern-packs/domains/05-cost-reduction-vendor.md` (18)
- `docs/build/pattern-packs/MOVE_ARTIFACT_CONTRACT.md`
- `docs/build/pattern-packs/README.md` — taxonomy, pack-codes, and status tables updated to register all four new packs + the contract; total updated to 235 patterns / 13 packs.
- `docs/releases/records/2026-06-06-pattern-packs-tranche-1b-2.md` — this record.

## QA / Validation

**Status: PASS** — documentation-only; structural validation green.

- All four packs conform to the locked schema; uniform `### PATTERN [CODE]-[NN]` headers verified (17 / 16 / 19 / 18 patterns).
- Every pattern carries the Own-it field; quantitative claims sourced (FBI IC3 BEC, Hackett/McKinsey/Deloitte/Gartner benchmarks, Obermeyer, Epic Sepsis Model figures) or flagged "estimate — confirm with client data."
- Self-contained Markdown; no external dependencies; no emojis.

## Rollout Plan

Merge to main publishes the completed library. No deploy step. TREAS/COST kernel encoding follows in a separate `src/`-touching PR.

## Rollback Plan

Documentation-only: revert the PR. No schema, migration, or runtime state.

## Audit Evidence

- Pack directory: `docs/build/pattern-packs/` (13 packs + Move Artifact Contract)
- Pairs with #3210 (tranche 1), #3212/#3217 (kernel encoding), #3221 (grounding battery)

## Known Gaps

- TREAS + COST are authored (Markdown) but not yet encoded into typed kernel function packs (no `financial_services` Treasury/Cost function-pack enrichment yet) — that's the next encoding-lane step, mirroring POPH/CLIN/PAYER.
- RAI + SISRC depth not yet reflected as kernel function-pack layers (they are cross-cutting; a future foundation/governance-aware renderer step can consume them).
