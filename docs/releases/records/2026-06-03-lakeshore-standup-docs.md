# 2026-06-03-lakeshore-standup-docs — Lakeshore Holdings stand-up brief + tenant setup plan (docs)

## Release ID

`2026-06-03-lakeshore-standup-docs`

## Status

`candidate`

## Plain-English Summary

Documentation-only change. Adds the execution plan + Codex brief to stand up **Lakeshore Holdings** —
a fictional analog of a Chicago private holding company (Morgan Street / HAVI Group) — as a real,
isolated per-client Azure data plane, wire the control plane to it, and build its entire context
layer **through the Data Loads module** (no seed scripts) from rich, real-world-shaped synthetic data
across ~50 dimensions (CMDB, IT systems per opco, vendor contracts, finance/treasury + Kyriba, etc.).
Includes: the cheap-but-honest data-plane standup (dedicated Postgres flexible server + Key Vault +
managed identity in the existing subscription — no new subscription), automated loads + loader
bug-fixing, corpus reuse strategy (reuse/curate the existing genome, no rebuild-from-scratch),
per-template How-To pages (registry-driven), a metadata-driven "load any file" future track, and a
loader-hardening track (XLSX parser + preview-before-commit → PDF/DOCX document parsing). No runtime
code, schema, or data change.

## Layer Impact

- `global-control-lane` (documentation only): engineering/design + execution-handoff documents for a
  future tenant stand-up + loader-hardening effort. No shipped behavior, no feature gate, no runtime
  path touched.
- The work these docs commission lands later as `client-data-lane` (a new per-client data plane) +
  `experimental` (loader-hardening features) once built and validated.

## Client Applicability

- All clients: not yet — planning/handoff docs. Anchored on the Lakeshore (Morgan Street analog)
  pilot rehearsal; the loader-hardening + How-To pages benefit all tenants once built. Internal
  engineering handoff. Public/demo: no. Feature flag: none.

## Changes Included

- `docs/build/CODEX-LAKESHORE-STANDUP-BRIEF-2026-06-03.md` — the Codex stand-up brief (data plane,
  tenant wiring, ~50-dimension synthetic data into prebuilt templates, automated loads, corpus reuse,
  How-To pages, metadata-driven future, loader-hardening track).
- `docs/build/LAKESHORE_HOLDINGS_TENANT_SETUP_PLAN_2026-06-03.md` — the loader-first setup plan.
- `docs/build/LAKESHORE_SYNTHETIC_DATA_GENERATION_SPEC_2026-06-03.md` — detailed per-dimension data
  generation (tabular + documents incl. contract PDFs) for top-notch corpus; document parsing
  (Azure Document Intelligence) is in-scope so contracts/policies/reports become searchable corpus.

## QA / Validation

- Status: **not-run** — docs only, no code changed, so unit/integration/e2e suites were not run
  (none affected). `npm run release:check`: **pass** (satisfied by this record).
- Independently verified the prerequisite (PR #2977) is live: `/admin/setup`,
  `/admin/context-layer/templates`, `/admin/context-layer/uploads` return Clerk 307;
  `/home/admin/setup` returns 301. Honest-format stance confirmed (CSV live; others labeled).

## Rollout Plan

Merge to `main`. No deploy impact (documentation).

## Rollback Plan

Revert the doc commit; no runtime or data dependency.

## Audit Evidence

- Builds on the merged loader UX (PR #2977, commit 249582a19) and the corpus-capability audit + the
  rate-card / modernization / finance / Kyriba packs already on `main`.
- Cost decision (dedicated server, not a new subscription) grounded in Azure pricing reasoning; the
  customer-owned-subscription production variant documented.

## Known Gaps

- Planning/handoff docs; the actual stand-up (data plane IaC, tenant wiring, synthetic data, loads,
  How-To pages, XLSX/document parsing) is the subsequent build the brief commissions.
- Account/credential + Azure resource creation are human-executed steps (Codex preps, Anand runs).
