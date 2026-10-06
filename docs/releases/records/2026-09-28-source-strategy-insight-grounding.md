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
- Preserve declared commercial-risk context for unsized levers in the governed aVa answer; an ambiguous coarse event type remains unresolved in vendor-coverage answers.

## QA / Validation

- Pass: three red-first builder cases and one rendered empty-state case failed on the base implementation, then six focused suites passed 85/85.
- Pass: two practical mutations, one restoring the ambiguous archetype fallback and one restoring numeric sample bars, each failed its targeted test; the restored code passed.
- Pass: the first PR CI run found two aVa consumers of the changed Strategy contract. The risk-grounding answer now names declared risks without amounts; vendor-coverage tests use an actual managed-service type for managed-service facts and include a coarse-type refusal. The full Source aVa library passed 26 suites / 396 tests locally.
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

## Post-Release Verification (append-only, 2026-09-28 08:01 UTC)

- Final-head CI: Pass, 37 applicable checks; five configured skips; no review finding.
- Merge: PR #8612 squash-merged as `3c85d10bdf4b34d3ce456be8f45fc3ae091dfd6b`.
- Deploy/runtime: Pass. Repo-owned ACA main run `36393721229` succeeded. Web template, Healthy/Running 100%-traffic revision, and both required delivery workers matched digest-pinned `sha256:1f68781d6c2e172023eae45113e05196e3bfb2d3b725ea91b069c8ffd57957bb` at readback.
- Signed-in product replay: Pass for this presentation correction. After a full reload, the Strategy Intelligence Explorer for a synthetic coarse-classification event no longer rendered an unrelated sample dollar pool, uncited percentage benchmark, or unsupported sponsor-backed statement. The prior release-state statements above are preserved as the pre-rollout checkpoint.
- Residual: Source-record and approval gates remain blocked. No stage acceptance, finance validation, supplier contact, award, or contract execution is claimed.
