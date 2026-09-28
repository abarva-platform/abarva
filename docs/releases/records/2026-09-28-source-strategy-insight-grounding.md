# 2026-09-28-source-strategy-insight-grounding - Strategy insight grounding

## Release ID

`2026-09-28-source-strategy-insight-grounding`

## Status

`candidate`

## Plain-English Summary

A coarse event type must not silently select a more specific sourcing archetype, and a Strategy value pool with no qualifying event facts must not display plausible dollar amounts. The Strategy insight now waits for a governed classification or source evidence, names unsized levers without numbers, and avoids an unlinked percentage benchmark.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source projection and presentation only. No canonical fact, tenant record, or classifier output is written by this release.

## Client Applicability

- All clients: yes, when viewing Source Strategy insights.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Respect an explicit unresolved event-type mapping instead of selecting a more specific pack by matching its broad event-type label.
- With no quantified value levers, show an unsized state and the lever names rather than illustrative dollar bars.
- Replace an unlinked Strategy benchmark and universal sponsor-language claim with evidence-bound, decision-neutral guidance.

## QA / Validation

- Pass: three red-first builder cases and one rendered empty-state case failed on the base implementation, then six focused suites passed 85/85.
- Pass: two practical mutations, one restoring the ambiguous archetype fallback and one restoring numeric sample bars, each failed its targeted test; the restored code passed.
- Not run: final-head CI, runtime deployment, and signed-in replay. They are required before live acceptance is claimed.

## Rollout Plan

Squash-merge after applicable PR checks and review. The repo-owned ACA main workflow deploys the exact merged SHA. No migration, data build, synthetic evidence mutation, or shared-runtime command is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: only that workflow.
- Approved image digest: pending main workflow output.
- ACA runtime invariant: pending read-only inspection of template and 100%-traffic revision.
- Worker image invariant: pending read-only inspection of required workers.
- Feature/env flag update path: none.
- Live signed-in proof required: revisit the same synthetic Strategy intelligence view and check the archetype and unsized value state.

## Rollback Plan

Revert through a new PR and the same main deploy workflow if a valid classified event loses an applicable authored archetype. Do not supply invented values to restore a chart.

## Audit Evidence

Red/green focused tests, mutation output, CI checks, official ACA run and digest readback, and signed-in smoke ledger entry.

## Known Gaps

The synthetic event's Strategy source-record requirements remain open. This release changes the explanation of missing value evidence; it does not satisfy a gate or assert an event-specific value estimate.
