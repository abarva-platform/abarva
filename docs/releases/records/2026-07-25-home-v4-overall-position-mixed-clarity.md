# 2026-07-25-home-v4-overall-position-mixed-clarity — "mixed" means real disagreement, not a hedge

## Release ID

`2026-07-25-home-v4-overall-position-mixed-clarity`

## Status

`candidate` — prompt fix only, zero-cost-verified. Regeneration proof for the two affected tenants
is tracked in this record and will be added once available (blocked on this PR deploying first).
meridian-health is unaffected and not regenerated again -- it was already confirmed clean in the
prior round (`2026-07-25-home-v4-dimension-evidence-hard-rule.md`).

## Plain-English Summary

Regenerating first-capital and skyharbor-air against the dimension-evidence HARD RULE fix
(`2026-07-25-home-v4-dimension-evidence-hard-rule.md`) closed 51 of 53 findings -- but each of the
two tenants still had exactly one `industry_comparison_overall_position_inconsistent` finding:

- first-capital, pattern "Model-risk gate before bank AI scale": `overall_position: "mixed"` while
  every judged dimension actually came out `ahead`.
- skyharbor-air, pattern "Tower value tracking for IROPS outcomes industry pattern":
  `overall_position: "mixed"` while every judged dimension actually came out `behind`.

This is the inverse of the original industry-comparison defect. That defect collapsed real
disagreement into one flat label; this one manufactures disagreement that isn't there -- writing
"mixed" even when the dimensional record shows unanimous agreement. Both are the same underlying
requirement (`overall_position` must accurately reflect the dimensions), just violated from
opposite directions, and the existing `industry_comparison_overall_position_inconsistent` validator
rule correctly caught both without any change to the rule itself.

Root cause: the prompt's `overall_position` instruction explained when to use `'mixed'` (real
disagreement) and forbade the two direct contradictions (`'behind'` next to an `ahead` dimension,
and vice versa), but never explicitly said what to do when everything agrees -- leaving room for
the model to reach for `'mixed'` as a "sounds more careful" default even when the actual dimensional
judgments were unanimous.

## What changed

One clarifying addition to the same `overall_position` paragraph in the JOB 2 instruction
(`scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`): states explicitly that `'mixed'` is
not a safer or more sophisticated default, and that when every judged dimension (ignoring
`not_evidenced`/`not_applicable`) lands on the same position, `overall_position` MUST equal that
same position, never `'mixed'`. A single evaluated dimension or several that all agree is not a mix.

No validator rule was touched. `industry_comparison_overall_position_inconsistent` already covers
both directions of this defect mechanically (see its implementation in
`scripts/knowledge/validate-integrated-manifest.mjs`'s `checkIndustryComparison()`); this PR fixes
the prompt to meet the rule the validator was already enforcing correctly.

## Layer Impact

- `internal-admin` lane: generator prompt change only, for a human-review-gated candidate surface.
  No client-data-lane change -- no tenant is approved or made live by this PR.

## Client Applicability

- Internal only, no client-visible surface changes. Same applicability as
  `2026-07-25-home-v4-dimension-evidence-hard-rule.md`: this edits the operator-triggered generation
  prompt only, produces `status: candidate` rows visible solely on the platform-admin-gated
  `/home/v4-preview` review route, and does not touch any tenant-facing route or the two tenants'
  currently-approved, currently-live content.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: one clarifying addition to the
  `overall_position` paragraph in the JOB 2 instruction.
- `scripts/knowledge/__fixtures__/integrated-manifest/industry-comparison-mixed-despite-uniform.json`
  (new): regression fixture reproducing the exact real defect shape (uniform dimensions labeled
  `mixed`).
- `scripts/knowledge/__tests__/run-integrated-manifest-tests.mjs`: registers the new fixture case.

## QA / Validation

- `pass` — `node --check` and `npx eslint`, exit 0.
- `pass` — `npm run home:knowledge-v4:test-manifest-validator`: 25/25 (24 existing + 1 new fixture
  reproducing this exact real defect shape).
- `pass` — `npm run home:knowledge-v4:test-prompt-preflight`: 6/6, including `real-current-prompt`.
- `pass` — Full production `npm run build` and `tsc --noEmit` (expanded heap), zero errors.
- `pending` — Real-content regeneration proof for first-capital and skyharbor-air (see below).

## Real defect evidence (before this fix)

| Tenant | Candidate ID | Finding |
|---|---|---|
| first-capital | `0e71b1e9-9ca9-4618-b8ee-52a8e7b55145` | `overall_position: "mixed"` on "Model-risk gate before bank AI scale" while all judged dimensions were `ahead` |
| skyharbor-air | `8f379020-0dd8-492a-815e-3a4747d81e99` | `overall_position: "mixed"` on "Tower value tracking for IROPS outcomes industry pattern" while all judged dimensions were `behind` |

Both rows remain in `candidate` status (never approved) as the documented "before" state for this
fix -- superseded, not deleted, by the regeneration below.

## Post-fix regeneration proof

_To be filled in after this PR merges, deploys, and the governed regeneration job runs for
first-capital and skyharbor-air only (meridian-health is already clean and not regenerated).
Closure criterion, carried over from the parent workstream: zero unresolved `industry_comparison_*`
validation findings across all three tenants, with no rule weakening, exclusion, severity
downgrade, or tenant-specific bypass._

## Rollout Plan

1. Merge → `aca-main-deploy.yml` builds and deploys automatically.
2. Governed ACA job, `first-capital,skyharbor-air` only, book mode: regenerate against the fixed
   prompt. meridian-health is not regenerated -- it is already confirmed clean.
3. Pull each fresh candidate's `quality_report` via `home:knowledge-v4:inspect-candidate` and
   confirm `validation_status: pass` for both.
4. Update this record's "Post-fix regeneration proof" section with the results.
5. If both are clean: the cross-tenant closure criterion (zero unresolved industry-comparison
   findings across first-capital, meridian-health, skyharbor-air) is met -- record that explicitly
   in this file. If either still fails, isolate and resolve that tenant specifically before closing.
6. No approval, publication, or replacement of any currently-approved candidate happens as part of
   this workstream.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none in this PR itself. The regeneration job is a separate, explicit,
  governed ACA job execution, not a shared-runtime traffic change.
- Live signed-in proof required: no — no renderer or route change in this PR.

## Rollback Plan

Revert the PR. The prompt reverts to the round-1 (dimension-evidence-hard-ruled, but not
mixed-clarified) contract. No persisted data is affected -- regenerated candidates stay in
`candidate` status either way and nothing is approved.

## Audit Evidence

- `docs/releases/records/2026-07-25-home-v4-dimension-evidence-hard-rule.md` — round 1 of this same
  workstream, whose regeneration surfaced this defect.
- `docs/releases/records/2026-07-25-home-v4-industry-comparison-fix.md` — the calibrated-comparison
  fix and `checkIndustryComparison()` validator this hardens.
- The two real candidate IDs and their quality reports above, retrieved via
  `home:knowledge-v4:inspect-candidate` against the real deployed database.

## Known Gaps

- Same as round 1: the `home_knowledge_v4_job_runs` table from
  `2026-07-25-home-v4-quality-governance.md`'s migration does not exist in the real database.
  Candidate persistence itself succeeds; only the supplementary job-run audit logging fails safely.
  Tracked as a separate follow-up, not part of this closure criterion.
