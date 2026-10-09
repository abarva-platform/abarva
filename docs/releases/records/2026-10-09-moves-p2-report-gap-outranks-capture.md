# 2026-10-09 — P2 baseline and stakeholder checks: a gap in a readable Discovery Report outranks the P2 answers

## Release ID

`2026-10-09-moves-p2-report-gap-outranks-capture`

## Status

`candidate`

## Plain-English Summary

The P2 → P3 gate has two hard checks besides `p2_readiness_cleared` that
follow the same pattern: `discovery_baseline_attested` and
`discovery_stakeholders_named`. Each passes on the signed Discovery Report, OR
on the completed P2 answers when they mention the topic ("baseline", "metric",
"owner", "ownership", "role", and so on).

The answer path is meant to stand in for a report that says nothing either
way. It also applied when the report was readable and recorded the very gap the
check exists for ("technical owner not yet named", "baseline not yet attested",
"owner names (...) missing"). Two consequences:

1. When the report records a hard gap, the gate already stays shut through
   `p2_readiness_cleared`, but its open list showed the baseline and
   stakeholder checks as met — the remedy shown omitted the thing the report
   said was missing.
2. When the report records missing owner names without hard-gap wording, the
   readiness check clears on the report and the stakeholder check cleared on
   the word "ownership" in the answers, so the gate could pass over the
   report's own finding.

This change keeps the answer path, but not over a readable report that records
the gap: the baseline check ignores the answers when the report records a hard
gap, and the stakeholder check ignores them when the report records a hard gap
or a missing owner. A report that records no gap is unaffected, and a report
with no readable text is unaffected.

## Layer Impact

- Release lane: `global-control-lane`.
- Product projection: the Moves P2 → P3 gate. Two hard checks are narrowed.
- Canonical model: no schema, data or tenant change.

## Client Applicability

- All clients: yes. A Move whose readable Discovery Report records a missing
  owner now stays at P2 until the report is resolved, and the open list names
  the baseline and stakeholder checks when the report records them as gaps.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/governance.ts`: the answer arm of
  `discovery_baseline_attested` requires that the report records no hard gap;
  the answer arm of `discovery_stakeholders_named` requires that the report
  records no hard gap and no missing owner. Both reuse the report signals the
  report arm of the same check already reads.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts`: three cases
  over one completed P2 capture whose answers mention baselines and owners —
  a report with hard gaps lists both checks as open; a report naming missing
  owners and nothing else refuses the gate on the stakeholder check alone; a
  report with no gap still lets the answers clear both.

## QA / Validation

- PASS: the three new cases; each of the three added guards, removed one at a
  time, fails exactly one case (3 of 3 mutants killed).
- PASS: `npx jest src/lib/programs src/app/api/programs` — 411 suites, 6264
  tests.
- PASS: `tsc -p tsconfig.json --noEmit` (exit 0). ESLint clean on both files.
- PASS: Prettier — the test file is clean; `governance.ts` already fails the
  check at base on an unrelated line and was not reformatted.
- NOT RUN: signed-in walk (see Deployment Authority).

## Rollout Plan

Merge through the protected main branch; the repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. No flag, migration or data
job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify web template and serving revision match the
  approved digest.
- Worker image invariant: verify required worker images match the approved
  digest.
- Feature/env flag update path: none.
- Live signed-in proof required: on a Move at P2 whose readable report records
  a missing owner, the gate lists `discovery_stakeholders_named` as an open
  hard check.

## Rollback Plan

Revert this change through a pull request; the answer arms again apply
regardless of what the report records.

## Audit Evidence

- Pull request and CI results.
- The mutant runs above.

## Known Gaps

- A readable report that is simply silent on baselines still lets the answers
  clear the baseline check; only a recorded gap outranks them.
- The answer arms still decide by phrase matching. The structured P2 step
  named in the preceding P2 readiness record replaces them.
