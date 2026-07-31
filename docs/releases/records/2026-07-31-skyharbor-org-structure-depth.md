# 2026-07-31-skyharbor-org-structure-depth — Deepen the IT organizational hierarchy

## Release ID

`2026-07-31-skyharbor-org-structure-depth`

## Status

`candidate`

## Plain-English Summary

`02_org_ownership.csv` had 38 rows total across the whole enterprise, reaching mostly to VP level with
only 4 Director-level rows (roughly 3-4 of them IT-related). For a $50B+ enterprise, IT alone should
carry 100+ distinct org units down to Director/Senior Manager level — the gap was identified directly by
the operator reviewing the file.

Adds 112 new rows (150 total) extending the existing IT leadership chain — CIO/CTO, CISO, CDAO, VP Data
& AI Platforms, VP Infrastructure & Cloud, VP Enterprise Architecture, VP IT Service Management &
Support, the existing Directors, and the Meridian Regional integration chain — down through 34 new
Director and 78 new Senior Manager rows. `leader_name_or_role` continues to hold titles only, never real
person names, matching the existing convention exactly. Every new row's `owned_systems`/vendor
references are cross-checked against real `system_name` values in `04_applications_systems.csv` or
`vendor_name` values in `07_vendors_contracts.csv` — nothing invented in a vacuum.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1 (Client intake)**: extends an existing Layer 1 org-structure file. No Layer 3/4 code touched,
  no database write.
- Not a side-load — same reasoning as the two companion releases from today: this is a repo-only CSV
  addition with no Postgres/Azure write and no Admin Data Loader bypass.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Modifies `datasets/tenant-inputs/active/skyharbor-air/current/02_org_ownership.csv` — 38 existing rows
  unchanged, 112 new rows appended (150 total).

## QA / Validation

- Verified independently (not just trusting the generation pass): `git diff --stat` confirms 112 pure
  insertions, zero modifications to the original 38 rows.
- Reporting-chain integrity: every new row's `parent_org_unit` resolves to an existing row — zero
  orphans, verified by direct query against the full 150-row set.
- PII check: spot-checked `leader_name_or_role` across new rows — titles only ("Senior Manager Mainframe
  Operations (z/OS)", "Director Meridian Applications Rationalization & Decommissioning"), no person
  names, consistent with the existing 38 rows' convention.
- Role-level distribution: 150 total (1 CEO, 9 C-suite, 5 SVP, 18 VP, 1 VP/C-adjacent, 38 Director, 78
  Senior Manager) — real depth, not flat padding.
- `node scripts/release-check.mjs` — pending (run before merge).

## Rollout Plan

Merge to `main` via the standard squash-merge path. No runtime rollout — repository content change only.

## Deployment Authority

- Repo-owned deploy workflow: Not applicable.
- Shared runtime mutators: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert the merge commit. No live data touched.

## Audit Evidence

- PR (this change) — see PR description for link.
- Companion releases from today: `2026-07-31-skyharbor-itsm-ticket-sla-dataset.md`,
  `2026-07-31-skyharbor-interview-relationship-links.md` (same repo-only/no-side-load reasoning).

## Known Gaps

- Business-function-side org depth (Flight Ops, Crew Ops, Commercial, Finance, etc.) was intentionally
  left untouched — this release is scoped to IT specifically, per the gap that was identified.
- The new Director/Senior Manager-level roles are not yet interview subjects — a follow-up (tracked
  separately) adds dedicated interviews for the specific senior IT leadership roles (VP Infrastructure &
  Cloud, VP Enterprise Architecture, VP Data & AI Platforms) discussing their real scope/platforms/systems.
