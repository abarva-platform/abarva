# 2026-06-07-loader-landscape-model — Enterprise technology-landscape model (design)

## Release ID

`2026-06-07-loader-landscape-model`

## Status

`candidate`

## Plain-English Summary

A design package that replaces the Admin Loader's thin starter dimensions
(name/vendor/cost/renewal) with a real, layered **enterprise technology-landscape
model**: applications → integration → data/analytics → **infrastructure** (a
layer we had none of), plus vendor/security/ops spines. It defines how the loader
accepts **many artifacts from many owners** (VP Apps, VP Infra, CDAO, EA,
Procurement, CISO) in any format and **reconciles** them into one landscape, and
ships **tiered guideline templates** (S/M/L, anchored to Lakeshore/Meridian/Apex)
plus **discovery-export adapters** (ServiceNow CMDB, vCenter, cloud inventory,
Flexera/Apptio, Epic, interface engines).

This PR is **documentation only** — no runtime code changes. It is the reviewed
blueprint for a subsequent code change that will wire the deepened dimensions
into `LoaderDimension`/field-catalog and extend `ContextDimension` (+ migration).

## Layer Impact

- **global-control-lane**: design guidance for shared loader behavior. No runtime
  behavior changes in this PR; nothing is gated or deployed by it.

## Client Applicability

- All clients: Indirect/future — the model will shape how every tenant's estate
  is loaded once the follow-up code change lands. No client receives any runtime
  change from this PR.
- Internal only: The documents themselves are internal design artifacts.
- Public/demo only: No. Feature flag: None.

## Changes Included

- `docs/build/setup-admin-loader/landscape-model/00-MODEL.md` — master model.
- `landscape-model/tiers/{lakeshore-S,meridian-M,apex-L}/` — per-layer guideline
  templates + README + golden-questions per tier.
- `landscape-model/discovery-adapters/` — 7 adapter specs.

## QA / Validation

**Result: pass** (docs-only validation; no runtime tests applicable).

- Docs-only. All template CSVs were validated well-formed (quote-aware column
  counts) and cross-layer keys reconcile (hosting_ref/host_ref → infra asset).
- Per-tier READMEs flag canonical-vs-illustrative data and the data-truth
  discrepancies (Apex $12.4B-canonical vs $80B-brief; Lakeshore dual cast;
  Meridian divergent figures). No fabricated facts presented as brand truth.
- No code, no migration, no runtime path touched.

## Rollout Plan

Merge to `main`. No runtime rollout — these are design documents. The follow-up
code change (wiring deepened dimensions) will carry its own release record and
QA, including a migration for any `ContextDimension` extension.

## Rollback Plan

Revert the PR. Pure docs; no runtime or data impact.

## Audit Evidence

- PR URL + CI (release:check, architecture rules).
- The per-tier READMEs document every canonical source and every illustrative
  extrapolation.

## Known Gaps

- The deepened dimensions are not yet wired into code (`LoaderDimension`,
  field-catalog, `ContextDimension` + migration) — deliberate follow-up.
- Data-truth reconciliation (Apex scale, Lakeshore dual cast, Meridian figures)
  is flagged for a decision, not resolved here.
