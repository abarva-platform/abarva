# 2026-09-26 Source 360 Contract Value Lineage

## Release ID

`2026-09-26-source-360-contract-value-lineage`

## Status

`candidate`

## Plain-English Summary

Contract 360 no longer describes committed spend or an opportunity amount as annual contract value when a supplemental row lacks a recorded contract-book value. Story, evidence and vendor summaries retain each amount's own meaning; a missing annual value remains explicit.

## Layer Impact

Release lane: `global-control-lane`. Layer 4 Source presentation only. Layer 3 financial and contract facts remain authoritative; this release writes no data and performs no reconciliation or calculation of a new contract value.

## Client Applicability

All authorized clients using Source 360 supplemental action or evidence rows. No client-specific data, migration or feature flag is added.

## Changes Included

Remove annual-value fallbacks from committed-spend, observed-spend and opportunity-amount fields in the Contract 360 story and vendor summary. Preserve a governed contract-book annual value when one exists, and keep total commitment unknown unless separately recorded.

## QA / Validation

- Pass: red-first behavioral tests reproduced the annual-value mislabel and vendor-rollup promotion on the unfixed code.
- Pass: all 338 Source workspace tests across 37 suites after the correction; existing canonical annual values remain visible.
- Pass: reintroducing each Story and vendor annual-value fallback separately failed its targeted test; both mutations were restored.
- Pass: TypeScript no-emit and scoped ESLint.
- Pass: release control before PR.
- Not run: signed-in replay of the rendered numeric labels; required after official deploy.

## Rollout Plan

Squash merge after applicable CI and review. Only `.github/workflows/aca-main-deploy.yml` may update the shared ACA runtime. No migration, data build or flag update.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record from the successful workflow and verify independently.
- ACA runtime invariant: digest-pinned web template and healthy 100%-traffic revision.
- Worker image invariant: both delivery workers pinned to the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: replay the supplemental Contract 360 detail and inspect the annual-value, committed-spend and observed-spend labels.

## Rollback Plan

Revert the merge in a new PR and redeploy through the repo-owned main workflow. No data rollback is required.

## Audit Evidence

Focused test output, PR/CI, official deploy run, read-only runtime digest proof, and private signed-in smoke ledger.

## Known Gaps

This correction does not establish a missing canonical annual contract value or turn supplemental action evidence into a contract header. Full Source New lifecycle acceptance remains separately governed.

## Signed-in proof reconciliation (item C-548)

- Ran: a signed-in replay was run and is reported in the execution register at `2026-09-26T21:30:45Z`
  by `codex-source-cpo-v2#20260926T2051Z` against PR #8527 — signed-in exact Story replay distinguishes unknown annual contract value from committed and observed spend.
- Outcome as the register states it: reported as meeting this record's acceptance. The same line records one residual: no canonical amount readback is claimed.
- Provenance: this section reconciles the durable record with the operator register under item
  C-548; it is not a first-hand observation by its author, and no proof was re-executed to write
  it. The QA/Validation bullet above was accurate when this record was authored and is superseded
  here by an appended correction rather than by a restamp, per the register time-authority rule.
