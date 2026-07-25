# 2026-07-25-home-v4-dimension-evidence-hard-rule — Close the dimensional evidence loophole

## Release ID

`2026-07-25-home-v4-dimension-evidence-hard-rule`

## Status

`candidate` — prompt fix only, zero-cost-verified. Regeneration proof across all three canary
tenants is tracked in this same record and will be added once available (blocked on this PR
deploying first, since the governed regeneration job runs against the deployed image).

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
- `pending` — Real-content regeneration proof across all three canary tenants (see below).

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

_To be filled in after this PR merges, deploys, and the governed regeneration job runs against the
new image. Closure criterion: zero unresolved `industry_comparison_*` validation findings across
all three tenants, with no rule weakening, exclusion, severity downgrade, or tenant-specific bypass._

## Rollout Plan

1. Merge → `aca-main-deploy.yml` builds and deploys automatically.
2. Governed ACA job, all three tenants, book mode: regenerate against the fixed prompt.
3. Pull each fresh candidate's `quality_report` via `home:knowledge-v4:inspect-candidate` and
   confirm `validation_status: pass` for all three before treating any as review-ready.
4. Update this record's "Post-fix regeneration proof" section with the results. If any tenant still
   fails, isolate and resolve that tenant specifically -- do not close until all three are clean or
   the remaining failure is explicitly recorded as a separate, named issue.
5. No approval, publication, or replacement of any currently-approved candidate happens as part of
   this workstream.

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
