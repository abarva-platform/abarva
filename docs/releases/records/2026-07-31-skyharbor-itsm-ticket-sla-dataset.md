# 2026-07-31-skyharbor-itsm-ticket-sla-dataset — Add ITSM ticket-history/SLA-performance dataset for skyharbor-air

## Release ID

`2026-07-31-skyharbor-itsm-ticket-sla-dataset`

## Status

`candidate`

## Plain-English Summary

Adds `datasets/tenant-inputs/active/skyharbor-air/current/20_itsm_ticket_sla_performance.csv` — one row
per application in `04_applications_systems.csv` (503 rows), giving each system a trailing-12-month
incident volume by priority, MTTR, SLA target/actual/breach count, top root-cause category, and change
success rate, shaped to match what a real ServiceNow CMDB/ITSM export would surface. This fills a real
gap identified while preparing for next week's Source-module demo: the existing enrichment pack had SLA
*targets* (11 managed-service-level rows in `17_service_scope_managed_services.csv`) but no measured
ticket/incident history per system — the actual "ServiceNow pull" content a Source vendor-risk narrative
needs.

Generated deterministically from the existing `known_challenges_narrative` field via keyword-based
severity scoring, not independent random noise — 16.3% of systems show an SLA breach in the generated
set, concentrated in legacy/no-formal-support/M&A-inherited systems already flagged in the existing
narrative (confirmed: tier1 systems show the *lowest* breach rate at 6.2%, consistent with mission-critical
systems getting the most operational investment despite the tightest targets; tier2/tier3 carry more of
the legacy-tech-debt breach risk).

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1 (Client intake)**: adds a new Layer 1 intake file. No Layer 3 (canonical model) or Layer 4
  (product) code is touched, and no database is written to by this change.
- **Not a side-load.** `scripts/skyharbor/generate-itsm-ticket-sla-history.mjs` matches the Pilot Data
  Loader Gate's file-pattern check (`scripts/skyharbor/generate-*.mjs`) because it lives in that
  directory, but its only effect is writing a repo-committed CSV file — it makes no Postgres or Azure
  writes of any kind, and does not bypass the Admin Data Loader. This is the same category as PR #5838's
  enrichment work: Layer 1 intake content that a future governed load will carry through the Admin Data
  Loader (data_ingestion_runs-backed), not a mechanism that loads it itself. No side-load of client data
  into a live database occurs in this release.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No — feeds a real (if synthetic) client-pilot demo, not a public-only surface.
- Feature flag: None.

## Changes Included

- Adds `scripts/skyharbor/generate-itsm-ticket-sla-history.mjs`.
- Adds `datasets/tenant-inputs/active/skyharbor-air/current/20_itsm_ticket_sla_performance.csv` (503 rows).
- Adds `docs/governance/dataset-manifests/skyharbor-air-itsm-ticket-sla-performance-v1.json` per the New
  Dataset Onboarding Policy, filled in before this content was generated.

## QA / Validation

- `node scripts/skyharbor/generate-itsm-ticket-sla-history.mjs` — ran clean, 503/503 rows, deterministic
  (seeded by system_name, stable across re-runs).
- Verified severity/breach distribution is realistic, not uniform: 82/503 systems (16.3%) show an SLA
  breach; concentration checked by tier (tier1 6.2%, tier2 18.0%, tier3 17.7%) and spot-checked that the
  highest-breach rows are genuinely the systems already flagged with "no formal support contract" or
  similar high-severity language in `04_applications_systems.csv`'s existing narrative, not disconnected
  from it.
- Corrected mid-build: an earlier version of the scoring conflated "has any known-challenges text" (true
  for all 503 rows, since that was the point of the earlier enrichment pass) with "is operationally at
  risk," producing a 100% SLA-breach rate — caught by spot-checking output before finalizing, not shipped.
- `npx tsx src/scripts/governance/validate-context-corpus.ts manifests` — PASSED.
- `node scripts/release-check.mjs` — passed.

## Rollout Plan

Merge to `main` via the standard squash-merge path. No runtime rollout — this is a repository content
addition only. Actually loading this data into any live database is separate, later work (tracked under
the Admin Data Loader connector effort), not part of this release.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable — no runtime/image change.
- Shared runtime mutators: None.
- Live signed-in proof required: No — no product-facing change from this release alone.

## Rollback Plan

Revert the merge commit. No live data touched, so rollback is a plain git revert.

## Audit Evidence

- PR (this change) — see PR description for link.
- `docs/governance/dataset-manifests/skyharbor-air-itsm-ticket-sla-performance-v1.json`
- `datasets/tenant-inputs/active/skyharbor-air/current/17_service_scope_managed_services.csv` (the
  existing SLA-target-level file this dataset complements, not duplicates).

## Known Gaps

- Still requires the Admin Data Loader connector (Phase 2/3 on the current roadmap) before this data can
  actually reach Source or any other product surface — this release only adds the intake-layer file.
- Ticket data is a system-level trailing-12-month summary, not individual ticket records — matches the
  aggregation grain of the rest of this enrichment pack, not a full ticket-by-ticket export.
