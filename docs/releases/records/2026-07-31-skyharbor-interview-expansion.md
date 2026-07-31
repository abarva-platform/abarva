# 2026-07-31-skyharbor-interview-expansion — Expand executive interviews to 24 questions per role

## Release ID

`2026-07-31-skyharbor-interview-expansion`

## Status

`candidate`

## Plain-English Summary

`executive_interviews.csv` had exactly 12 questions for every one of 18 stakeholder roles (216 rows
total) — thinner than a real enterprise engagement, identified directly by the operator reviewing the
file.

Expands to 24 questions per role (432 rows total), adding 12 new questions per role covering org design/
decision rights, cross-functional dependency, technical debt/legacy exposure, talent/skills gaps,
regulatory/external pressure, competitive benchmarking, failure scenarios, cost takeout, change lessons
learned, M&A integration impact, roadmap sequencing, and board reporting — territory the original 12
questions per role didn't cover.

New rows' `initiative_link`/`metric_mentioned` values use exact canonical strings from
`09_programs_initiatives.csv`, `T01_initiative-registry.csv`, and `14_metrics_outcomes.csv` verbatim —
deliberately not perpetuating the naming gap the original 216 rows had (which needed a separate
semantic-reconciliation pass, see companion PR #5844).

Includes a realistic minority of delegate/proxy interview patterns (9 of 216 new rows, ~4%) — e.g. an
SVP covering a topic for an unavailable COO — grounded in the real reporting chain in
`02_org_ownership.csv`, matching how real executive interview programs actually work when a full
calendar can't accommodate every session.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1 (Client intake)**: extends an existing Layer 1 interview file. No Layer 3/4 code touched, no
  database write.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Modifies `datasets/tenant-inputs/skyharbor-air/interviews/executive_interviews.csv` — 216 existing
  rows unchanged, 216 new rows appended (432 total).

## QA / Validation

- Verified independently: 432 total rows, exactly 24 per role across all 18 stakeholder roles.
- Duplicate check (n-gram analysis across all 432 rows, actually run, not asserted): 0 exact duplicate
  `synthetic_answer` values, 0 duplicated 8+-word phrases across any pair of rows.
- Spot-checked 4 new Q&A pairs for depth/specificity and grounding in real cross-referenced content (real
  dollar figures, real system names, real initiative names) — not generic filler.
- Confirmed the 216 pre-existing rows are byte-identical to the pre-expansion file.
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
- Companion releases from today, same repo-only/no-side-load reasoning: `2026-07-31-skyharbor-itsm-
  ticket-sla-dataset.md`, `2026-07-31-skyharbor-interview-relationship-links.md`, `2026-07-31-skyharbor-
  org-structure-depth.md`, `2026-07-31-skyharbor-initiative-metric-crosswalk.md`.

## Known Gaps

- The new rows' initiative/metric references use canonical names correctly, but the *original* 216 rows'
  naming gap against canonical names is a separate, already-tracked reconciliation (PR #5844).
- Dedicated interviews for the specific new VP/Director-level IT leadership roles added in the org-
  structure expansion (PR #5843) are a separate, planned follow-up — not part of this release, which only
  deepens the existing 18 stakeholder categories.
