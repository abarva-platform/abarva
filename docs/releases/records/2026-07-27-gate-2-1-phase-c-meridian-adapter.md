# 2026-07-27-gate-2-1-phase-c-meridian-adapter — Meridian normalized, not admitted as a second schema

## Release ID

`2026-07-27-gate-2-1-phase-c-meridian-adapter`

## Status

`candidate` — a zero-write, read-only adapter run. No tenant data changed.

## Plain-English Summary

Gate 2.1 Phase C. Builds a typed, deterministic adapter translating meridian-health's real "tower
fact" rows into the Phase B universal scenario model, for the 16 domains Gate 2 found schema-mismatched.
Per the architectural decision, meridian's alternate shape is NOT admitted as a second canonical
model — every entity this adapter produces is a real `function`/`business_unit`/`application`/
`program`/etc. entity in the same scenario model every other tenant will eventually use, with fields
classified as direct, derived, or explicitly unresolved.

## The headline finding: most of the raw row count was never that domain's content

Direct investigation of the real active files found that every affected domain file except
`workforce_roles`/`enterprise_profile`/`infrastructure_platforms`/`industry_context_patterns`/
`expert_lenses` mixes a small number of genuinely domain-specific rows (`source_type =
"synthetic_v3_context_generation"`) with the **same 221 executive-interview rows**
(`source_type = "executive_interview"`) broadcast identically across every file under a different
`dimension` label. Those interview rows are already correctly handled by
`evidence-v4-migration-dry-run.mjs`'s `executive_interviews`/`evidence_items` pipeline — they are
not that domain's content. After excluding them, real per-domain row counts are 2–77, not 221–869.
This single filter (`realContentRows()`) is the adapter's first, universal step, and it changes the
whole picture: `01_business_functions.csv` reports 228 rows, but only 7 are real.

A second, compounding finding: several domains' remaining "real" rows duplicate another domain's
content rather than carrying anything distinct:

- `15_industry_context_patterns` and `16_expert_lenses` share the exact same 7 rows.
- `18_operational_process_evidence`'s 7 real rows populate only the same generic
  `industry_context`/`signals` fields as 15/16 — **zero** process-specific columns
  (`process_owner`, `systems_used`, `cycle_time`, etc.) are populated anywhere.
- `05_data_assets_integrations`'s real rows share the same use_case-grouped narrative as
  `09_programs_initiatives`/`10_ai_automation_use_cases`, not discrete named data assets.
- `14_metrics_outcomes`'s real rows are `use_case`+`risk_or_gap` duplicates of
  `11_risks_controls`, with no distinct `metric_name` identity anywhere.
- `03_workforce_roles` has **zero** non-interview rows: no real workforce content (persona, skills,
  pain points) exists anywhere in this tenant's active data.

Per the explicit instruction not to silently infer unsupported identity, none of these five domains
were adapted. Forcing entities from content that isn't really there would fabricate identity the
source doesn't have. They're flagged `NOT ADAPTED` in the reconciliation report, requiring Phase D
governed generation instead of Phase C normalization.

## What was adapted (250 real entities, all validated)

`enterprise` (1, merging two disclosed source rows — an identity row and an explicitly-labeled
`profile_planning_assumption` detail row), `leader` (24, deduplicated by name across every domain
that mentions an owner — `owner_role`/`owner` fields resolve to real, ID-referenced leader entities
now, not disconnected strings), `function` (7), `business_unit` (7), `application` (20), `platform`
(15 — confirmed to have **no** interview contamination), `vendor`+`contract` (10 each, one meridian
row = one vendor + one contract per v3's own row-combination pattern), `spend_line` (77, 70 with real
dollar amounts), `program` (21, grouped by `use_case` from 35 real rows — one row per
`(use_case, data_domain)` pair in the source, not one row per program), `ai_use_case` (16),
`risk` (28), `industry_pattern` (7), `expert_lens` (7, thin — flagged that its fields beyond identity
are unresolved since the source content is shared with `industry_pattern`).

Every field is classified `direct`, `derived`, or `unresolved` in the reconciliation report, with the
exact source expression and, for anything non-direct, a note explaining why. `program.sponsor_ref`
is a genuine, confirmed gap — none of the grouped rows carry any owner-like field — disclosed via a
new `UNRESOLVED_REF` sentinel rather than fabricated or silently omitted.

## A real gap found in Phase B's engine, fixed here

Building this adapter immediately hit a case Phase B's design hadn't accounted for: a required
reference field (`program.sponsor_ref`) with genuinely no source data to resolve it. The original
`validateGraph()` treated any missing required reference as a hard error, which would have forced
either fabricating a sponsor or abandoning the `required: true` declaration entirely. Neither is
right — Phase C's own spec requires marking fields `unresolved` as a first-class state, not a
failure. Fixed by adding an `UNRESOLVED_REF` sentinel: a caller sets a reference to this value to
disclose a *confirmed* gap (not an omission), and `validateGraph()` surfaces it as a warning, not an
error. This is a genuine refinement to already-merged Phase B code, made because real usage exposed
the gap immediately, not a design that was wrong on paper.

## Layer Impact

- `internal-admin` lane, adapter infrastructure. No layer below "reports on disk" is touched; nothing
  in `datasets/tenant-inputs/active/**` changed.

## Client Applicability

- Internal only, and specific to meridian-health's normalization. Zero tenant-facing or runtime
  effect. Not yet consumed by anything (no CSV files are written; the graph and reconciliation report
  are the outputs of this phase).

## Changes Included

- `scripts/data-build/tenant-scenario-model/scenario-model.mjs`: adds `UNRESOLVED_REF` and updates
  `validateGraph()`/`resolveMapping()` to treat it as a disclosed warning, not a validation failure.
- `scripts/data-build/tenant-scenario-model/meridian-tower-fact-adapter.mjs` (new): the adapter
  described above.
- `scripts/data-build/tenant-scenario-model/__tests__/run-scenario-model-tests.mjs`: 3 new tests for
  `UNRESOLVED_REF` (22/22 total, up from 19).
- `scripts/data-build/tenant-scenario-model/__tests__/run-meridian-tower-fact-adapter-tests.mjs`
  (new, 23/23 passing): the interview-row filter proven against real files, full-graph validation,
  real leader-resolution proven end to end (function → leader → projected CSV column), the disclosed
  `sponsor_ref` gap, and entity counts matching direct investigation for every adapted domain.
- `reports/tenant-semantic-remediation/meridian-scenario-graph.json` (new): the full 250-entity graph.
- `reports/tenant-semantic-remediation/meridian-scenario-id-crosswalk.csv` (new): stable-ID ↔
  display-name ↔ projected-domain crosswalk.
- `reports/tenant-semantic-remediation/meridian-source-to-canonical-reconciliation.json` (new):
  field-level direct/derived/unresolved classification for all 16 domains, including the 5
  explicitly `NOT ADAPTED`.

## QA / Validation

- `pass` — `npx eslint`, zero findings across all changed/new files.
- `pass` — `run-scenario-model-tests.mjs`, 22/22 (Phase B, extended).
- `pass` — `run-meridian-tower-fact-adapter-tests.mjs`, 23/23 (Phase C, new).
- `pass` — `validateGraph()` on the real 250-entity meridian graph: zero errors, one disclosed
  warning class (`program.sponsor_ref`).
- `pass` — spot-checked real projections end to end: `function` "Enterprise Data and Analytics"
  projects `executive_owner: "CDAO"` (resolved through a real leader entity, not a raw string or a
  blank); `program` "Unified clinical + claims lakehouse" projects `business_sponsor: ""` (honestly
  blank, not fabricated).
- Not applicable: no runtime/UI surface, no live signed-in verification needed, no CSV files written
  to disk yet (that's a Phase G concern).

## Rollout Plan

None. This is a reviewable artifact, not a rollout. Phase D (targeted synthetic enrichment) is next —
its scope now includes the 5 domains this phase explicitly could not adapt (`workforce_roles`,
`data_assets_integrations`, `operational_process_evidence`, plus real metric definitions for
`metrics_outcomes` and named data assets), in addition to apex-retail's known blockers.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Nothing outside the two `tenant-scenario-model` script files, their tests, and
`reports/tenant-semantic-remediation/meridian-*` was touched. `scenario-model.mjs`'s `UNRESOLVED_REF`
addition is backward compatible — no existing caller behavior changes.

## Audit Evidence

- This PR's diff and CI run.
- `reports/tenant-semantic-remediation/meridian-source-to-canonical-reconciliation.json` — full
  field-level reconciliation for all 16 domains.
- `reports/tenant-semantic-remediation/meridian-scenario-graph.json` — the full entity graph.
- Test suite output (22/22 + 23/23 passing).

## Known Gaps

- 5 domains (`workforce_roles`, `data_assets_integrations`, `operational_process_evidence`, plus real
  metric definitions and named data assets) have no real content in the current active data to
  normalize. Explicitly flagged, not silently skipped — Phase D's responsibility.
- `program`/`ai_use_case` entities preserve real system names mentioned in the source
  (`entity.meridianSystemsMentioned`) but do not yet resolve them into `system_refs` pointing at the
  `application` entities this same adapter builds — a real, available cross-reference deferred to
  avoid guessing at partial/ambiguous name matches without a review step.
- No CSV files are written by this phase. The graph and reconciliation report are read-only
  diagnostic/design artifacts; actual candidate CSV generation is Phase G's responsibility, after
  Phase D's enrichment fills the domains this phase could not touch.
