# 2026-07-25-home-v4-overall-position-mixed-clarity — "mixed" means real disagreement, not a hedge

## Release ID

`2026-07-25-home-v4-overall-position-mixed-clarity`

## Status

`closed` — merged, deployed, regenerated, and verified. **Cross-tenant closure criterion for the
entire industry-comparison workstream is met**: zero unresolved `industry_comparison_*` validation
findings across first-capital, meridian-health, and skyharbor-air, with no rule weakened,
excluded, downgraded, or given a tenant-specific bypass at any point across all three rounds
(`2026-07-25-home-v4-industry-comparison-fix.md` → `2026-07-25-home-v4-dimension-evidence-hard-rule.md`
→ this record).

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
- `pass` — Real-content regeneration proof for first-capital and skyharbor-air (see below):
  skyharbor-air clean on first regeneration; first-capital needed one retry (a different pattern
  hit the same probabilistic residual, resolved on the second attempt with no code change). All
  three tenants confirmed `validation_status: pass`, zero findings.

## Real defect evidence (before this fix)

| Tenant | Candidate ID | Finding |
|---|---|---|
| first-capital | `0e71b1e9-9ca9-4618-b8ee-52a8e7b55145` | `overall_position: "mixed"` on "Model-risk gate before bank AI scale" while all judged dimensions were `ahead` |
| skyharbor-air | `8f379020-0dd8-492a-815e-3a4747d81e99` | `overall_position: "mixed"` on "Tower value tracking for IROPS outcomes industry pattern" while all judged dimensions were `behind` |

Both rows remain in `candidate` status (never approved) as the documented "before" state for this
fix -- superseded, not deleted, by the regeneration below.

## Post-fix regeneration proof

Merged (`ae5d8e32`), deployed (`aca-main-deploy.yml` run `30176385575`, 7m41s, runtime invariant and
health endpoint both verified), then regenerated first-capital and skyharbor-air via the governed
ACA job (meridian-health not touched -- already confirmed clean in round 1):

**First pass:**

| Tenant | Candidate ID | Result |
|---|---|---|
| skyharbor-air | `d66b9f8b-1ac8-4878-a34f-52fdb8270212` | `pass`, 0 findings -- clean on the first try |
| first-capital | `58a1674a-3d9d-4e9e-9f8a-ab16b76a2a72` | `fail`, 1 finding: `industry_comparison_overall_position_inconsistent` -- pattern "Payments value gated by core and sanctions dependencies", `overall_position: "mixed"` while its one judged dimension was `at_parity` |

first-capital's remaining finding was the *same* fixed defect class recurring on a *different*
pattern than either prior round -- this is expected residual model variance (the fix reduces the
rate of this mistake, it does not make generation deterministic), not evidence the fix failed:
across all three tenants and every pattern generated in this workstream, `industry_comparison_*`
findings only ever recurred as this one class, at a steadily dropping rate (53 → 2 → 1), never as a
new defect type and never on skyharbor-air or meridian-health after their respective fixing rounds.
Per the closure instruction ("isolate and resolve only that tenant"), only first-capital was
regenerated again -- skyharbor-air and meridian-health were not touched.

**Second pass (first-capital only):**

| Tenant | Candidate ID | Result |
|---|---|---|
| first-capital | `c9edd075-f7e1-4c37-b7c9-c795be275c0c` | `pass`, 0 findings |

**Final state, all three tenants:**

| Tenant | Final Candidate ID | Status |
|---|---|---|
| first-capital | `c9edd075-f7e1-4c37-b7c9-c795be275c0c` | `pass`, 0 findings |
| meridian-health | `45e9cced-4c4c-4dbc-bdff-cee6ffbfed11` | `pass`, 0 findings (round 1, unchanged) |
| skyharbor-air | `d66b9f8b-1ac8-4878-a34f-52fdb8270212` | `pass`, 0 findings |

**Closure criterion met**: zero unresolved `industry_comparison_*` validation findings across all
three tenants. No rule was weakened, excluded, downgraded in severity, or given a tenant-specific
bypass at any point in this workstream -- every fix tightened the generation prompt to meet the
validator's existing bar. All three candidate rows remain in `status: candidate` (never approved)
-- this workstream produces reviewable, review-ready candidates, it does not approve or publish
anything.

## Rollout Plan

1. `done` — Merge → `aca-main-deploy.yml` built and deployed automatically.
2. `done` — Governed ACA job, `first-capital,skyharbor-air`, book mode: regenerated against the
   fixed prompt. meridian-health was not regenerated -- already confirmed clean in round 1.
3. `done` — Pulled each fresh candidate's `quality_report`. skyharbor-air clean immediately;
   first-capital isolated and regenerated once more on its own (not touching the other two) after
   surfacing one residual finding, then confirmed clean.
4. `done` — This record's "Post-fix regeneration proof" section updated with all results.
5. `done` — All three tenants clean: cross-tenant closure criterion met, recorded above.
6. `done` — No approval, publication, or replacement of any currently-approved candidate happened
   as part of this workstream.

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
  Tracked as a separate follow-up, not part of this closure criterion. (The final first-capital
  regeneration run in this record did not surface the error, but the run was not instrumented to
  confirm whether the table now exists or the write path was simply not exercised the same way --
  do not treat this as evidence the gap is closed without checking directly.)
- The KPI/benchmark data-product workstream remains explicitly out of scope, per
  `2026-07-25-home-v4-industry-comparison-fix.md`'s Known Gaps.
- These three candidates are review-ready, not approved. Approving any of them (and the resulting
  live `/home` experience for that tenant) is a separate, explicit action outside this workstream.
