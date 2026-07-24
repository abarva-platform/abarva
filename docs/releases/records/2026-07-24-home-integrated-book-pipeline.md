# 2026-07-24-home-integrated-book-pipeline — Integrated Home Book generation + dataset registry

## Release ID

`2026-07-24-home-integrated-book-pipeline`

## Status

`candidate`

## Plain-English Summary

Implements the core architecture change directed this session: replace the current
one-Claude-call-per-dimension approach (38 separate calls for a full tenant, each repeating the
same shared context) with one integrated call that produces the whole "Home Book" — an enterprise
story plus a concise manifest per dimension — in a single pass. Claude interprets; deterministic
sources remain the system of record.

- New pass type `integrated_dimensions` in `build-home-knowledge-v4-review-pack.mjs`: requests
  every dimension's manifest (`dimension_key, chapter, title, headline, executive_takeaway,
  key_insights, strategic_implication, recommended_actions, evidence_refs, visual_binding,
  data_binding, relationship_binding, gap_binding, related_dimensions, confidence_statement`) in
  one call, explicitly instructed not to reproduce inventories/records — bind to a governed
  `dataset_id` instead, or omit the binding.
- New `deterministic_dataset_registry`, built per tenant from `tower-standardized-v1` files
  **directly verified this session to have real content** (not just checked for existence):
  `applications_full` (900 rows, skyharbor-air), `vendors_full` (320 rows, real vendor names/$),
  `programs_full` (30 rows, real initiative names/$), `risk_register` (150 rows), `evidence_registry`
  (80 rows), `budget_summary` (13 rows). Threaded into the packet and into the new prompt.
- Gated behind `HOME_KNOWLEDGE_V4_INTEGRATED=true` / `--integrated` — the existing 38-call path is
  the unchanged default; this is additive, not a replacement, until proven.

## Layer Impact

- `global-control-lane`: operator pipeline script only. No product-surface change in this PR — the
  integrated path only runs when explicitly flagged, and only affects what a future generation
  run produces, not anything already live.

## Client Applicability

- Internal only — pipeline/tooling change.
- Feature flag: `HOME_KNOWLEDGE_V4_INTEGRATED` (opt-in, default off).

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: `integrated_dimensions` pass type,
  `loadTenantDatasetRegistry()`, `TST_TENANT_FOLDER` shared constant (deduplicated from
  `loadTenantApplicationOwnershipFacts`), `integratedMode` flag, orchestration loop branch.

## QA / Validation

- `pass` — `npx eslint`, exit 0.
- `pass` — local `--packet-only` dry run (zero Claude calls, zero cost): confirmed
  `deterministic_dataset_registry` carries correct real row counts and evidence source paths for
  all 6 verified datasets.
- `pending` — the actual integrated generation call has not been run yet; this PR ships the
  capability, a separate explicitly-authorized canary run exercises it for real.

## Rollout Plan

Merge through the normal PR path → `aca-main-deploy.yml` builds and deploys the image the
operator pipeline runs from (ACA jobs run from the deployed image, not a local worktree — same
constraint as every other pipeline change this session). After deploy: submit one governed ACA
job with `HOME_KNOWLEDGE_V4_INTEGRATED=true`, `HOME_KNOWLEDGE_V4_TENANT=skyharbor-air`,
`EMIT_ACA_PROOF_BUNDLE=true` to generate the real integrated Home Book for review.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none in this PR — no database writes. The follow-up canary run is a
  governed ACA Job execution, not a shared-runtime web deploy.
- Live signed-in proof required: no — no product-surface change in this PR.

## Rollback Plan

Revert the PR, or simply don't set `HOME_KNOWLEDGE_V4_INTEGRATED` — the existing 38-call path is
untouched and remains the default either way.

## Audit Evidence

- Same-day pipeline audit identified the repeated-context and per-dimension-output problems this
  release addresses.
- Local `--packet-only` dry-run output showing the real dataset registry (row counts, evidence
  source paths) captured above.

## Known Gaps

- Executive-context aggregates beyond Applications (owner coverage) — budget totals, vendor
  concentration, program value summaries as structured `material_aggregates`, not just the
  dataset registry pointer — not yet built. The integrated prompt currently gets the dataset
  registry (what exists, row counts) but only one real computed aggregate (applications
  ownership); richer aggregates for budget/vendors/programs are a natural next addition once the
  canary proves the basic architecture.
- No merge/publisher logic yet to bind a generated manifest's `data_binding`/`visual_binding` to
  the actual governed grid/chart component at render time (spec Section 5) — this PR produces the
  manifest; consuming it in the UI is separate, follow-on work.
- No stale-artifact gate or deterministic contradiction QA specific to this new manifest shape yet
  (the existing `validate-dimension-contradictions.mjs` targets the old 5-tab shape) — needed
  before this path could replace the default, not needed to prove it works on a canary.
