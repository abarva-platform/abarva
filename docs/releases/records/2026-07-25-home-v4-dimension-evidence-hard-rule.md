# 2026-07-25-home-v4-dimension-evidence-hard-rule — Close the dimensional evidence loophole

## Release ID

`2026-07-25-home-v4-dimension-evidence-hard-rule`

## Status

`candidate` — round 1 (this PR's original scope) deployed and regenerated: dropped 53 findings to
2, with meridian-health fully clean. The 2 remaining findings were a second, distinct defect
(`overall_position: 'mixed'` when every dimension actually agreed) rather than a recurrence of the
evidence-loophole this PR targeted -- its fix is tracked as round 2 in this same record, in
`2026-07-25-home-v4-overall-position-mixed-clarity.md`. Closure (zero unresolved findings across
all three tenants) is not yet reached; tracked there.

## Plain-English Summary

Regenerating all three canary tenants (first-capital, meridian-health, skyharbor-air) against the
new calibrated `industry_comparison` contract (see `2026-07-25-home-v4-industry-comparison-fix.md`)
surfaced 53 real validator findings across the three candidates. 51 of the 53 (96%) were the exact
same rule: `industry_comparison_judgment_without_evidence` -- a `dimensions[]` entry asserting a
real evaluative position (`ahead`/`at_parity`/`behind`) with zero `evidence_refs`. The other two
were both on meridian-health: one `industry_comparison_overall_position_inconsistent`, one
`industry_comparison_advantage_contradiction` (see the companion fix below).

This is not a validator defect. The rule is working exactly as designed -- a dimensional judgment
with nothing behind it is a real gap, not a false positive -- and weakening it would let claims
like "governance_and_controls: behind" ship unevidenced, which is precisely what the whole
industry-comparison rework exists to prevent. The root cause is a prompt gap: `conclusions[]`
carries an isolated, emphatic HARD RULE for the `evidence_refs`/`evidence_status` pair, with
right/wrong examples. The new `dimensions[].evidence_refs` requirement was only documented inside
the longer shape description, not given the same treatment -- so Claude reliably cited evidence at
the conclusions level and reliably did not at the dimension level.

## What changed

Added a second, equally explicit HARD RULE to the JOB 2 instruction in
`scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`, mirroring the conclusions-level rule's
structure exactly:

- States plainly that ANY `dimensions[]` entry whose `position` is `ahead`/`at_parity`/`behind` --
  i.e. any entry that actually asserts a comparison, advantage, disadvantage, or other evaluative
  judgment -- MUST carry `evidence_refs` with >=1 real ID that specifically supports that
  dimension's claim.
- Gives the one correct move when no such evidence exists: `position: 'not_evidenced'` with
  `evidence_refs: []` -- explicitly framed as correct and expected, not a gap to paper over.
- Includes one RIGHT example (a real position backed by a real evidence_id) and one WRONG example
  reproducing the exact real defect (`position: 'behind'`, `evidence_refs: []`).
- Explicitly forbids inventing or stretching an evidence_id that doesn't specifically establish the
  dimension's claim, and forbids treating "obviously true from context_packet" as license to skip
  evidence_refs.
- Cross-referenced from the `industry_comparison_shape` documentation so the schema description and
  the hard rule point at each other.

No validator rule was touched. `industry_comparison_judgment_without_evidence`,
`industry_comparison_overall_position_inconsistent`, and `industry_comparison_advantage_contradiction`
are unchanged -- this PR fixes the prompt to meet the existing bar, not the bar to match the prompt.

## Layer Impact

- `internal-admin` lane: generator prompt change only, for a human-review-gated candidate surface.
  No client-data-lane change -- no tenant is approved or made live by this PR.

## Client Applicability

- Internal only, no client-visible surface changes. This PR edits the prompt sent to Claude during
  the operator-triggered book-mode generation job; it does not touch any route, component, or API
  a signed-in tenant user can reach. The candidates it produces land in `home_knowledge_packs` with
  `status: candidate`, visible only on the platform-admin-gated `/home/v4-preview` review route --
  no tenant's live `/home` experience changes as a result of this fix or the regeneration it
  enables. skyharbor-air and meridian-health's currently-approved, currently-live candidates are
  untouched; the new regenerated candidates supersede only the earlier `candidate`-status rows from
  today's first regeneration attempt, not anything approved.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: new dimensions[]-evidence HARD RULE
  in the JOB 2 instruction; `industry_comparison_shape` doc updated to cross-reference it.

## QA / Validation

- `pass` — `node --check` and `npx eslint`, exit 0.
- `pass` — `npm run home:knowledge-v4:test-manifest-validator`: 24/24 (unchanged from the prior fix
  -- this PR only changes generation-time prompt text, not validator logic).
- `pass` — `npm run home:knowledge-v4:test-prompt-preflight`: 6/6, including `real-current-prompt`.
- `pass` — Full production `npm run build` and `tsc --noEmit` (expanded heap), zero errors.
- `pass` — Real-content regeneration proof across all three canary tenants (see below): findings
  dropped from 53 to 2, meridian-health fully clean. The 2 remaining findings are a distinct defect,
  not a recurrence of this PR's target -- see `2026-07-25-home-v4-overall-position-mixed-clarity.md`.

## Real defect evidence (before this fix)

Regenerated `first-capital`, `meridian-health`, `skyharbor-air` against the calibrated contract
(prompt version `home-knowledge-v4-business-transformation-prompt-first-20260723-single-dimension-v1`,
pre-hard-rule) via the governed ACA job. All three candidates were persisted as `status: candidate`
(never approved) with `validation_status: fail`:

| Tenant | Candidate ID | Findings | Breakdown |
|---|---|---|---|
| first-capital | `50d71ba8-262d-4db1-9f32-0799157d2b2a` | 13 | 13x `industry_comparison_judgment_without_evidence` |
| meridian-health | `18c5180e-7d2c-42c6-bda5-308e394ffec9` | 21 | 19x `industry_comparison_judgment_without_evidence`, 1x `industry_comparison_overall_position_inconsistent`, 1x `industry_comparison_advantage_contradiction` |
| skyharbor-air | `fdaf96b3-fea5-41ff-87df-33a819e42677` | 19 | 19x `industry_comparison_judgment_without_evidence` |

These three candidate rows remain in `candidate` status in the database as the documented "before"
state -- they are superseded, not deleted, by the post-fix regeneration below.

## Post-fix regeneration proof

Merged, deployed (`ac92205b`, `aca-main-deploy.yml` run `30175493110`, 6m4s, runtime invariant and
health endpoint both verified), then regenerated all three tenants against the fixed prompt via the
same governed ACA job:

| Tenant | New Candidate ID | Findings | Breakdown |
|---|---|---|---|
| first-capital | `0e71b1e9-9ca9-4618-b8ee-52a8e7b55145` | 1 | 1x `industry_comparison_overall_position_inconsistent` (dimensions all `ahead`, overall_position wrongly `mixed`) |
| meridian-health | `45e9cced-4c4c-4dbc-bdff-cee6ffbfed11` | 0 | `validation_status: pass`, `candidate_review_ready` |
| skyharbor-air | `8f379020-0dd8-492a-815e-3a4747d81e99` | 1 | 1x `industry_comparison_overall_position_inconsistent` (dimensions all `behind`, overall_position wrongly `mixed`) |

53 findings → 2, a 96% reduction, and the dimension-evidence HARD RULE this PR added produced zero
`industry_comparison_judgment_without_evidence` findings across all three tenants -- the fix worked
exactly as intended. The 2 remaining findings are NOT a recurrence: both are the inverse direction
of the overall_position consistency rule (uniform dimensions mislabeled `mixed`, not mixed dimensions
mislabeled uniform) -- a second, distinct prompt gap, fixed and regenerated in
`2026-07-25-home-v4-overall-position-mixed-clarity.md`. These three candidate rows remain in
`candidate` status (never approved) as the documented "after round 1 / before round 2" state.

## Rollout Plan

1. `done` — Merge → `aca-main-deploy.yml` built and deployed automatically.
2. `done` — Governed ACA job, all three tenants, book mode: regenerated against the fixed prompt.
3. `done` — Pulled each fresh candidate's `quality_report` via `home:knowledge-v4:inspect-candidate`.
   meridian-health confirmed `validation_status: pass`; first-capital and skyharbor-air isolated to
   one distinct, named remaining issue each (see Post-fix regeneration proof) -- resolved and
   regenerated in `2026-07-25-home-v4-overall-position-mixed-clarity.md`, not suppressed here.
4. `done` — This record's "Post-fix regeneration proof" section updated with the round-1 results.
5. `done` — No approval, publication, or replacement of any currently-approved candidate happened as
   part of this workstream.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none in this PR itself. The regeneration job is a separate, explicit,
  governed ACA job execution, not a shared-runtime traffic change.
- Live signed-in proof required: no — no renderer or route change in this PR.

## Rollback Plan

Revert the PR. The prompt reverts to the prior (already-fixed-once, but not dimension-hard-ruled)
contract. No persisted data is affected -- regenerated candidates stay in `candidate` status either
way and nothing is approved.

## Audit Evidence

- `docs/releases/records/2026-07-25-home-v4-industry-comparison-fix.md` — the calibrated-comparison
  fix this hardens.
- The three real candidate IDs and their quality reports above, retrieved via
  `home:knowledge-v4:inspect-candidate` against the real deployed database.

## Known Gaps

- **Discovered, not caused by this change**: the governed regeneration job logged
  `relation "public.home_knowledge_v4_job_runs" does not exist` for all three tenants when
  attempting to write the job-run audit row added in `2026-07-25-home-v4-quality-governance.md`.
  The candidate persistence itself succeeded (all three rows written); only the supplementary
  job-run outcome logging failed, and failed safely (caught, did not block persistence, matching
  that PR's own crash-isolation design). This means that migration
  (`20260725160000_home_knowledge_v4_quality_governance.sql`) was never actually applied against
  the real database despite that PR being merged and deployed. Tracked as a separate follow-up --
  not part of this closure criterion, which is scoped to industry-comparison validation findings.
