# 2026-07-31-skyharbor-vp-leadership-interviews — Add dedicated VP-level IT leadership interviews

## Release ID

`2026-07-31-skyharbor-vp-leadership-interviews`

## Status

`candidate`

## Plain-English Summary

The 18 existing interview stakeholder categories are generic top-level buckets ("CIO", "CTO", "CDAO",
"Enterprise Architecture") — strategic/priority-focused, not operational. The operator pointed out these
don't cover the specific named IT leadership roles that actually run the technology estate day to day.

Adds 78 new interview rows across 4 dedicated VP-level technical roles, each grounded in their real
`02_org_ownership.csv` scope (owned systems, reporting line, decision rights) rather than generic filler:

- VP Infrastructure & Cloud — 20 questions (mainframe, data center, network, cloud, badge/access)
- VP Enterprise Architecture — 19 questions (integration architecture, API management, solution
  architecture, standards)
- VP Data & AI Platforms — 20 questions (Teradata/Snowflake/Databricks, Kafka, Collibra, GenAI Gateway)
- VP IT Service Management & Support — 19 questions (ServiceNow ITSM/CMDB, service desk BPO, field IT)

A CISO deep-dive was considered and deliberately skipped — the existing 24-question CISO interview
already operates at real technical depth (named systems, a real PAM-coverage metric, named vendor gaps);
a separate interview would have duplicated it, not added ground.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1 (Client intake)**: extends an existing Layer 1 interview file plus its coverage matrix. No
  Layer 3/4 code touched, no database write.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Modifies `datasets/tenant-inputs/skyharbor-air/interviews/executive_interviews.csv` — 432 existing
  rows unchanged, 78 new rows appended (510 total).
- Modifies `datasets/tenant-inputs/skyharbor-air/interviews/interview_coverage_matrix.csv` — adds 4 new
  stakeholder-group rows with accurate question counts.

## QA / Validation

- Verified independently: 510 total rows; new role question counts (20/19/20/19) confirmed.
- Duplicate check (n-gram, actually run across all 510 rows): 0 exact duplicate answers; 0 duplicated
  8+-word phrases introduced by the new rows (8 collisions caught and reworded during drafting).
- One pre-existing 8-word duplicate between two **original** rows (`SHA-INT-05-Q13`, `SHA-INT-09-Q13`,
  both predating this change) was found and left untouched — out of scope for this release, flagged here
  for visibility rather than silently fixed or silently ignored.
- Spot-checked cross-file grounding: new answers cite real dollar figures, real system names, and a real
  cross-file ownership seam (MuleSoft's technical owner in the systems inventory vs. Enterprise
  Architecture setting the integration standard) rather than inventing detail.
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
- Companion releases from today, same reasoning: `2026-07-31-skyharbor-interview-expansion.md`,
  `2026-07-31-skyharbor-org-structure-depth.md` (the org-chart source this release's role grounding
  depends on).

## Known Gaps

- `interview_coverage_matrix.csv`'s original 18 rows still carry a stale question count (12) from before
  the base interview file expanded to 24/role — a pre-existing inconsistency, not introduced or fixed
  here.
- The VP IT Service Management & Support interview honestly acknowledges that no certified ITSM ticket/
  SLA metric exists in Tower today — accurate as of this worktree's state; PR #5842 (ITSM ticket/SLA
  dataset) addresses that gap separately.
