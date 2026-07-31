# 2026-07-31-skyharbor-interview-relationship-links — Wire interview evidence into the relationship graph

## Release ID

`2026-07-31-skyharbor-interview-relationship-links`

## Status

`candidate`

## Plain-English Summary

`executive_interviews.csv`'s `system_or_vendor_mentioned` field has been fully populated (216/216 rows)
since the interview pack was built, but `12_relationships.csv` — the actual relationship graph every
other dimension file's cross-references route through — never had an `interview` object type. Interview
evidence about specific systems and vendors existed but wasn't queryable as evidence on those systems'
own rows.

Adds 115 new `interview -> discusses -> system/vendor` rows to `12_relationships.csv`, matched via
normalized token overlap between each interview's free-text mention and the canonical `system_name`/
`vendor_name`. 303 total mentions were parsed; 115 (38.0%) cleared the match-confidence threshold and
were linked. The remaining 188 were left unmatched, not force-linked — a wrong evidence link is worse
than a missing one.

`initiative_link` and `metric_mentioned` are explicitly NOT handled by this change — those fields use a
genuinely different, unreconciled naming scheme from the canonical initiative/metric files (e.g.
"IROPS Recovery Copilot" in the interview vs "IROPS Agentic Recovery Cockpit" in
`T01_initiative-registry.csv` — same real-world initiative, near-zero token overlap) and need actual
semantic judgment to reconcile correctly, not string matching. Tracked as separate follow-on work.

## Layer Impact

**Release lane: `client-data-lane`.**

- **Layer 1 (Client intake)**: extends an existing Layer 1 relationship file. No Layer 3/4 code touched,
  no database write.
- Not a side-load — same reasoning as the ITSM ticket/SLA dataset release earlier today: this script
  only appends rows to a repo-committed CSV, makes no Postgres/Azure writes, and does not bypass the
  Admin Data Loader for any eventual real load.

## Client Applicability

- All clients: No.
- Specific clients: `skyharbor-air` only.
- Internal only: Yes.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds `scripts/skyharbor/generate-interview-relationship-links.mjs`.
- Modifies `datasets/tenant-inputs/active/skyharbor-air/current/12_relationships.csv` — 3,071 existing
  rows preserved unchanged, 115 new interview-relationship rows appended (3,186 total).

## QA / Validation

- `node scripts/skyharbor/generate-interview-relationship-links.mjs` — ran clean.
- Match threshold set at 60% token overlap (favoring precision over recall — a missed link is
  acceptable, a false one isn't). Real coverage reported honestly: 115/303 mentions matched (38.0%),
  not overstated.
- Every new row's `relationship_strength` is set to `high` (≥90% overlap) or `moderate` (60-89%);
  `moderate`-confidence rows additionally carry a `known_gaps` note flagging them for verification before
  being treated as fully authoritative.
- Confirmed the existing 3,071 relationship rows are byte-identical apart from being followed by the new
  115 — no accidental mutation of prior content.
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
- `docs/releases/records/2026-07-31-skyharbor-itsm-ticket-sla-dataset.md` (companion release earlier
  today, same repo-only/no-side-load reasoning).

## Known Gaps

- 188/303 interview mentions (62%) remain unlinked — below the match-confidence threshold. Most are
  likely genuine matches expressed in language too different from the canonical name for token overlap
  to catch (the same class of gap as the initiative/metric naming mismatch) — would need the same
  semantic-matching treatment, not a lower threshold (which would trade false negatives for false
  positives, the wrong direction).
- `initiative_link`/`metric_mentioned` reconciliation against `09_programs_initiatives.csv`,
  `T01_initiative-registry.csv`, and `14_metrics_outcomes.csv` is real, identified, unstarted work —
  tracked separately, not attempted here.
