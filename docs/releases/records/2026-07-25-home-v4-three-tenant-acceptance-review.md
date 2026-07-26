# 2026-07-25-home-v4-three-tenant-acceptance-review — qualitative review, all three rejected

## Release ID

`2026-07-25-home-v4-three-tenant-acceptance-review`

## Status

`closed` — review performed, decision recorded, reject actions taken.

## Plain-English Summary

Per the standing rule that no V4-generated content goes live on validator-pass alone, this is a
real qualitative read of the full generated content (not just the automated validator's report) for
the three tenant candidates named for this review round:

- `first-capital`: `c9edd075-f7e1-4c37-b7c9-c795be275c0c`
- `meridian-health`: `45e9cced-4c4c-4dbc-bdff-cee6ffbfed11`
- `skyharbor-air`: `d66b9f8b-1ac8-4878-a34f-52fdb8270212`

**Verdict: reject all three.** Every candidate carries `validation_status: pass` on the
industry-comparison/hard-limits validator this session's earlier fixes hardened — but every
candidate's own separate, broader `coherence_review` self-check recommends against sending it to
human review as-is (`revise_before_human_review` on two, the stronger `regenerate_sections` on the
third). A direct read of the full content, independent of that self-check, confirms and extends its
concerns with one additional, systemic defect the self-check didn't fully call out: **the same small
set of headline strings is reused verbatim across a large majority of each tenant's 38 dimensions**,
in the same cluster shape across all three tenants. This is exactly the scenario the standing rule
against bulk-approval on validator pass exists for.

## Layer Impact

- `internal-admin` lane: this is a review-and-decision record for internal candidate content, not a
  code or schema change. The reject actions it records mutate `home_knowledge_packs` rows already
  covered by `2026-07-25-home-v4-approval-activation-lifecycle.md`'s migration and lifecycle actions.

## Client Applicability

- Internal only. This record documents a review decision and resulting database state change
  (three candidate packs moved from `candidate` to `rejected`) for internal content governance —
  no client-facing route, content, or behavior changes as a result of this record.

## Changes Included

- No code changes. Three database rows updated via the governed CLI/operator-job path added in
  `2026-07-25-home-v4-lifecycle-cli.md`: `status` flipped from `candidate` to `rejected` on the
  three candidate IDs named below, with `rejected_by`/`rejected_at`/`reject_reason` recorded.

## Method

For each candidate: pulled the full persisted row, including `render_pack` (the actual generated
`enterprise_book` + all 38 `dimensions[]`), via the governed ACA operator job running
`home:knowledge-v4:inspect-candidate --full` (the `--full` flag added in
`2026-07-25-home-v4-inspect-full-flag.md`, since the tool previously only surfaced the quality
report). Read each candidate's own `coherence_review` block, then independently verified its claims
and checked for anything it might have missed by comparing every dimension's `headline` string for
duplication across the pack.

## Findings per tenant

### first-capital (`c9edd075-f7e1-4c37-b7c9-c795be275c0c`)

- `coherence_review.approval_recommendation`: **`revise_before_human_review`**.
- 6 self-reported violations: `enterprise_thesis` has a blank headline/takeaway despite a fully
  authored thesis existing elsewhere in the pack; 13 other dimensions carry empty
  `key_insights`/`material_gaps`/`material_advantages`; the relationship dimension is missing its
  required graph visual; no bounded business-object structure (`qualified_candidates`/
  `foundations`/`early_ideas`) exists anywhere despite named initiatives being described; two minor
  visual-encoding defects (a scatter plot with foundation-type initiatives plotted at x=0, an
  evidence timeline used for a non-chronological two-state split).
- **Independently confirmed and extended**: of the 38 dimension headlines, only 9 distinct strings
  are used, each repeated across 2-14 dimensions verbatim (e.g. "Functions run distinctly with
  unassigned data and model accountability" appears identically on `interview_signals`,
  `divisions`, `front_middle_back`, `org`, `decision_rights`, `workforce`, `business_processes`,
  `journeys`, and `opev` — 9 unrelated dimensions sharing one sentence). The self-check's "13
  dimensions have empty insights" finding is real but understates the actual defect: those
  dimensions do have body text, but it is the wrong dimension's text, copy-pasted.

### meridian-health (`45e9cced-4c4c-4dbc-bdff-cee6ffbfed11`)

- `coherence_review.approval_recommendation`: **`revise_before_human_review`**.
- 5 self-reported violations: `enterprise_thesis` blank headline/takeaway; a cluster of dimensions
  (`proven_strengths`/`structural_constraints`/`functions`/`capabilities`) lacking insights and
  implications; a budget visual that resolves to a single zero-value area; a programs scatter
  plotting all seven points at the origin; a count-leakage risk in one applications narration.
- **Independently confirmed and extended**: the identical duplication pattern — 9 distinct headline
  strings across 38 dimensions, the largest cluster ("Seven ownership domains, cross-functional
  executive demand") shared verbatim across 11 unrelated dimensions
  (`leadership_agenda`, `interview_signals`, `divisions`, `front_middle_back`, `org`,
  `decision_rights`, `workforce`, `business_processes`, `journeys`, `opev`, `service_delivery`).

### skyharbor-air (`d66b9f8b-1ac8-4878-a34f-52fdb8270212`)

- `coherence_review.approval_recommendation`: **`regenerate_sections`** — the strongest of the three
  signals; this candidate's own self-check does not merely suggest revision, it recommends
  regenerating specific sections outright.
- 8 self-reported violations (5 major): several visuals present raw record counts as if they were
  executive value signals, which the self-check flags as directly contradicting the pack's own
  declared "planning-grade, synthetic" evidence posture; an evidence-timeline visual used for a
  non-chronological status split; a strategic-agenda section narrating inventory size as if it were
  strategic progress.
- **Independently confirmed and extended**: the same duplication shape again — 9 distinct headlines
  across 38 dimensions, with an 11-dimension cluster sharing "Functionally rich, but accountability
  not yet assigned" verbatim.

## Cross-tenant pattern (new finding, not previously tracked)

All three tenants show the **same distinctive cluster shape**: roughly 9 unique headline strings,
each mapped to a fixed group of dimensions, reused identically regardless of tenant-specific
content. This is not tenant-specific noise — the cluster boundaries themselves (which dimensions
share a headline) are nearly identical across first-capital, meridian-health, and skyharbor-air,
strongly suggesting the dimension-authoring pass writes one headline per "book chapter" (a small
set of narrative groupings) and applies it to every dimension mapped to that chapter, rather than
writing a headline specific to each dimension. This is the same underlying failure mode as the V2
evidence-leak bug fixed earlier this session
(`2026-07-25-home-v2-evidence-containment.md`) — content meant for one scope silently presented as
if specific to another — but manifesting in the V4 generator's headline/takeaway authoring rather
than the V2 renderer's evidence-lookup fallback. **This is a new, distinct defect, not yet fixed**,
and is now the top-priority item before any of these three tenants can be regenerated toward
approval.

## Decision and actions taken

**Reject all three candidates.** Executed via the governed CLI added in
`2026-07-25-home-v4-lifecycle-cli.md` (`home:knowledge-v4:lifecycle --reject`), run through the
governed ACA operator job, with the reject reason on each row citing this record and the specific
finding: the pack's own coherence self-check does not recommend it for human review, and independent
review confirms a systemic headline-duplication defect across most dimensions.

| Tenant | Candidate ID | Action | Reason recorded |
|---|---|---|---|
| first-capital | `c9edd075-f7e1-4c37-b7c9-c795be275c0c` | rejected | Own coherence_review recommends revise_before_human_review (6 violations, incl. blank thesis, missing relationship graph, no business-object structure); independent review found 9 headline strings reused verbatim across 13+ of 38 dimensions. |
| meridian-health | `45e9cced-4c4c-4dbc-bdff-cee6ffbfed11` | rejected | Own coherence_review recommends revise_before_human_review (5 violations, incl. blank thesis, degenerate budget/programs visuals); independent review found the same headline-duplication pattern, 11-dimension cluster. |
| skyharbor-air | `d66b9f8b-1ac8-4878-a34f-52fdb8270212` | rejected | Own coherence_review recommends regenerate_sections outright (8 violations, incl. raw counts narrated as value); independent review found the same headline-duplication pattern, 11-dimension cluster. |

## QA / Validation

- `pass` — all three candidates' `render_pack` pulled and parsed successfully from the real
  production database via the governed operator job; JSON validated by direct parse, not assumed
  from log output (log truncation at the start of `containerapp job logs show` output was worked
  around by re-pulling each execution's full console output from Log Analytics, per this project's
  established reliable-retrieval pattern).
- `pass` — every dimension's headline was enumerated and cross-referenced programmatically (not
  spot-checked), so the "9 distinct strings across 38 dimensions" finding is exhaustive per tenant,
  not a sample.

## Rollout Plan

1. Merge this record (docs-only).
2. Execute the three reject actions via the governed operator job (see Audit Evidence for the
   execution logs once run).
3. No further activation for these three tenants until the headline-duplication root cause is fixed
   in the generator prompt and all three are regenerated and re-reviewed.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml` — this record itself is docs-only and carries no
  runtime change.
- Shared runtime mutators: the governed operator job executions performing the three reject actions.
- Live signed-in proof required: no — this record documents a database-state decision, not a
  rendered surface change.

## Rollback Plan

A `rejected` pack can be reactivated via the rollback action (`2026-07-25-home-v4-approval-activation-lifecycle.md`)
if this review's decision needs to be revisited — no data is destroyed, the candidate rows remain
in the database with `status='rejected'` and the reason/actor/timestamp recorded.

## Audit Evidence

- The three candidates' full `render_pack` content, pulled via `home:knowledge-v4:inspect-candidate --full`
  through the governed operator job, retrieved via Log Analytics query against
  `ContainerAppConsoleLogs_CL`.
- The governed operator-job execution logs for each of the three reject actions, once run.

## Known Gaps

- The headline-duplication root cause (dimension-authoring pass reusing one "book chapter" headline
  across every dimension mapped to it) is not yet fixed. This is now the leading blocker for PR4/PR5
  of the broader V4 live-cutover pivot — regenerating any of these three tenants before that fix
  lands would very likely reproduce the same defect.
- This review did not attempt to fix the defect itself — fixing the generator prompt is separate,
  follow-on work, scoped the same way every other defect in this workstream has been (root-cause in
  the prompt, not a validator exception).
