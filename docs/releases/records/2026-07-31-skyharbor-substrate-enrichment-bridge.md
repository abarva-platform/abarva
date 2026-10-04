# 2026-07-31-skyharbor-substrate-enrichment-bridge — Make the real skyharbor-air enrichment dataset the source of the loaded Postgres substrate

## Release ID

`2026-07-31-skyharbor-substrate-enrichment-bridge`

## Status

`candidate`

## Plain-English Summary

`scripts/seed/load-tenant-substrate.ts` (the script that actually loads skyharbor-air's
data into the live Postgres substrate Home/Intelligence/Moves/Source/Tower read from)
reads its input from `datasets/skyharbor-air-synthetic-v1/`. That directory was, until
this change, produced only by `scripts/skyharbor/generate-skyharbor-substrate.mjs` — a
self-contained generator with its own hardcoded synthetic content, written independently
of and disconnected from the real skyharbor-air enrichment dataset delivered in PR #5838
(`datasets/tenant-inputs/active/skyharbor-air/current/`: 503 applications with rich
per-system narrative, 65 vendor contracts, 20 programs, plus 216 executive interview
Q&As at `datasets/tenant-inputs/skyharbor-air/interviews/`). Reloading the live substrate
from the old generator would not have surfaced any of that enrichment work — it would
have reproduced the same disconnected placeholder content it always had (92 applications,
no interviews).

Adds `scripts/skyharbor/generate-skyharbor-substrate-from-enrichment.mjs`, which reads the
real enrichment dataset plus Tower's T01 AI-initiative registry
(`tower-standardized-v1/skyharbor-air/ai-control-tower/T01_initiative-registry.csv`) and
produces `datasets/skyharbor-air-synthetic-v1/` in the exact shape the existing loader
expects. This makes the enrichment dataset the single source of truth for what the live
product renders, rather than three independent, disconnected pipelines for one tenant.

`datasets/skyharbor-air-synthetic-v1/` is a build artifact — confirmed it was never
git-tracked (untracked working-tree content in several local checkouts, absent from
`origin/main`). This release keeps it that way: the substrate is meant to be regenerated
at load time, not committed.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 2 (Source adapters)**: adds a new adapter (`generate-skyharbor-substrate-from-
  enrichment.mjs`) between the governed Layer 1 enrichment dataset and the Layer 3
  substrate loader. No change to the loader itself (`load-tenant-substrate.ts`) or to any
  Layer 4 product code.
- Does not touch the live Postgres database — this PR is a repo-only script/config
  change. The actual reload against `pg-abarva-context-lab-001` is a separate, later
  operational step (see Known Gaps and the companion ACA job update, tracked outside this
  PR's scope).

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/skyharbor/generate-skyharbor-substrate-from-enrichment.mjs`.
- Adds `npm run generate:skyharbor-substrate:from-enrichment` in `package.json` (the old
  `generate:skyharbor-substrate` alias is left pointing at the Packet 28 generator,
  unchanged, since other consumers of its `docs/skyharbor/` and S01-S15 segment/graph
  output are out of scope for this change).
- Adds a superseded-for-this-purpose note to the top of
  `scripts/skyharbor/generate-skyharbor-substrate.mjs` pointing at the new generator.

## QA / Validation

- `node scripts/skyharbor/generate-skyharbor-substrate-from-enrichment.mjs` — ran clean:
  855 chunks (1 profile + 20 spend portfolios + 503 apps + 65 vendors + 20 programs + 30
  Tower AI initiatives + 216 interviews), 503 applications, 50 initiatives (20 enterprise
  + 30 Tower AI, merged without ID collision — confirmed disjoint `PROG-*`/`SHA-INIT-*`
  namespaces and zero `is_rollup_of` rows in T01 before merging), 65 vendor contracts.
- Column-completeness check across all generated CSVs (every non-provenance column, all
  rows): initiatives-active.csv 9/10 columns 100% filled — `vendors` derived via two real
  joins (T08 spend-line `vendor_or_tool` for the 30 Tower initiatives; a
  program→system→vendor join through `12_relationships.csv` + `04_applications_systems.csv`
  for the 20 enterprise programs) and lands at 49/50 rows filled, the one gap being a
  program with no linked systems in the source relationship data — left blank rather than
  fabricated. `committed_usd` for Tower initiatives now sums real T08 `budget_fy26_usd`
  lines instead of a `0` placeholder.
- `node scripts/skyharbor/generate-airline-pattern-overlay.mjs` +
  `node scripts/skyharbor/verify-airline-pattern-overlay.mjs` — PASSED (184 packs, 2760
  patterns/chunks; this generic industry-pattern overlay is untouched by this change).
- `TENANT_KEY=skyharbor npx tsx scripts/seed/load-tenant-substrate.ts --dry-run` — clean,
  zero errors: chunks upserted=3595 (≥3240 floor), applications=503 (≥92 floor),
  initiatives=50 (≥38 floor), vendors=65 (≥52 floor) — all four thresholds
  `job-skyharbor-load-0528`'s own built-in post-load verification checks.
- Did not run the old `verify-skyharbor-substrate.mjs` — confirmed it checks the Packet
  28 generator's own separate output shape (`records/json/*.json`, `graph/`, `briefs/`,
  etc.), none of which the actual Postgres loader reads; not applicable to this
  generator's output.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — pending (run before
  merge).

## Rollout Plan

Merge to `main` via the standard squash-merge path. No runtime rollout from this PR alone
— `datasets/skyharbor-air-synthetic-v1/` is only materialized when the generator is run.
The companion step (updating `job-skyharbor-load-0528` to run this generator before the
loader, then triggering a real load) is tracked as a separate operational action, not
part of this repo change.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable — no runtime/image change in this PR.
- Shared runtime mutators: None in this PR. The follow-on ACA job update (tracked
  separately) will update `job-skyharbor-load-0528`'s container command/args via
  `az containerapp job update` in `rg-abarva-controlplane-lab-eastus` — pre-existing
  infrastructure you built directly, not the shared Product/Lab web runtime this repo's
  ACA deploy-authority rules govern.
- Live signed-in proof required: Yes, for the follow-on load step (not this PR) — must
  verify `app.abarva.ai/home?client=skyharbor`, `/intelligence?client=skyharbor`,
  `/tower?client=skyharbor` render the new data before calling the load done.

## Rollback Plan

Revert the merge commit. No live infrastructure or data is touched by this PR, so
rollback is a plain git revert with no migration or data implications.

## Audit Evidence

- PR (this change) — see PR description for link.
- `docs/runbooks/skyharbor-private-runtime-reset-load.md` (the governing reset/load
  runbook this generator feeds).
- `docs/runbooks/azure-private-operator-runner.md` (the approved private-Postgres
  execution path for the follow-on load).
- PR #5838 (the enrichment dataset this generator reads from).

## Known Gaps

- This PR does not itself reload the live Postgres substrate. The follow-on steps —
  updating `job-skyharbor-load-0528` to call this generator, running the reset runbook's
  backup/scoped-delete gates against existing skyharbor-air rows, triggering the real
  load, and capturing live signed-in proof — are tracked as separate operational work,
  not part of this repo-only change.
- `annual_run_cost_usd` in the generated application-portfolio CSV is left blank for all
  503 rows — `04_applications_systems.csv` does not carry a per-application cost column,
  and `08_spend_value.csv`'s cost data is at a 20-row spend-category grain
  (e.g. "Passenger Service & Distribution Applications": $84M/yr) with no shared key to
  individual applications; allocating it down would fabricate precision that doesn't
  exist in the source. Added as its own real chunk set (`SHA-SPEND-*`, `it_financials`
  segment) instead, so portfolio-level spend/value questions are still answerable.
- `ai_usage_clauses`, `exit_terms`, and `data_rights` in the generated vendor-contracts
  CSV are blank for all 65 rows — none of these are columns in
  `07_vendors_contracts.csv`; not fabricated, genuinely not captured in the source
  enrichment.
- 1 of 50 initiatives (`PROG-0018`, SAF Blend & Regulatory Reporting Automation) has no
  `vendors` value — it has no `impacts` relationship to any system in
  `12_relationships.csv`, so the program→system→vendor join has nothing to resolve. A
  real gap in the underlying enrichment data, left blank rather than guessed.
