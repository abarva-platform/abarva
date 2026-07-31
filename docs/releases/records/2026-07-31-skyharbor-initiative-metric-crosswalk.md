# 2026-07-31-skyharbor-initiative-metric-crosswalk — Reconcile interview initiative/metric naming to canonical names

## Release ID

`2026-07-31-skyharbor-initiative-metric-crosswalk`

## Status

`candidate`

## Plain-English Summary

`executive_interviews.csv`'s `initiative_link` and `metric_mentioned` fields were generated
independently from — and never reconciled against — the canonical name lists in
`09_programs_initiatives.csv` (20 programs), `T01_initiative-registry.csv` (30 Tower AI initiatives),
and `14_metrics_outcomes.csv` (26 metrics). Confirmed example: the interview says "IROPS Recovery
Copilot"; the canonical Tower list has "IROPS Agentic Recovery Cockpit" — same real initiative, no shared
vocabulary a string matcher could catch reliably.

Adds a crosswalk (`12b_interview_initiative_metric_crosswalk.csv`, 230 rows — one per distinct
interview-mentioned initiative/metric string) built by actually reading interview content against
canonical program/initiative/metric definitions, not token matching. High/medium-confidence matches
(132 of 230) are appended to `12_relationships.csv` as `interview -> discusses -> program/tower_initiative/
metric` rows; low-confidence (2) and no-canonical-match (208) entries stay visible in the crosswalk but
are deliberately excluded from the relationship graph.

Real finding worth flagging: only 9 of 211 distinct metric mentions (4.3%) matched a canonical KPI. The
other 202 are specific, tactical metric phrasings unique to each interview answer (e.g. "AI-drafted
response accuracy rate") with no counterpart in the 26-metric canonical list. This is not a defect in
this release — it reflects that executives naturally reference more granular metrics in conversation
than what's been curated into an official KPI dashboard — but it's a real signal for future work on
`14_metrics_outcomes.csv`'s coverage, not something this release attempts to fix.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1 (Client intake)**: adds one new intake file, extends an existing one. No Layer 3/4 code
  touched, no database write.
- Not a side-load — same reasoning as the three companion releases from today.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `datasets/tenant-inputs/active/skyharbor-air/current/12b_interview_initiative_metric_crosswalk.csv`
  (230 rows).
- Modifies `datasets/tenant-inputs/active/skyharbor-air/current/12_relationships.csv` — 3,186 existing
  rows preserved unchanged, 132 new interview-relationship rows appended (3,318 total).

## QA / Validation

- Verified independently: `git status`/`git diff --stat` confirm the crosswalk is a new file and
  `12_relationships.csv` gained exactly 132 rows (3,186 → 3,318), matching the crosswalk's
  high+medium count (92 + 40 = 132) exactly.
- Confidence breakdown spot-checked: high=218, medium=10, low=2; canonical_object_type breakdown:
  no_canonical_match=208, tower_initiative=9, metric=9, program=4.
- Reviewed the match rationale for a genuinely hard case (zero shared vocabulary between "Passenger
  Rebooking Personalization" and its correct match "Digital concierge and journey orchestration
  modernization") — resolved by reading actual interview content against the T01 row's stated scope and
  sponsors, not surface-level string similarity. Rationale is grounded, not asserted.
- Low-confidence and no-canonical-match entries confirmed excluded from the relationship graph (visible
  only in the crosswalk file), per the precision-over-recall discipline used throughout today's
  relationship-linking work.
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
  `2026-07-31-skyharbor-interview-relationship-links.md`,
  `2026-07-31-skyharbor-org-structure-depth.md`.

## Known Gaps

- 208/230 crosswalk entries (mostly metric mentions) have no canonical counterpart — real content, just
  not represented in the curated program/initiative/metric lists. Not fabricated, not force-linked.
- `14_metrics_outcomes.csv`'s 26-metric coverage looks thin relative to what executives actually discuss
  in interviews (4.3% match rate) — flagged as a real signal for future enrichment work, not addressed
  here.
