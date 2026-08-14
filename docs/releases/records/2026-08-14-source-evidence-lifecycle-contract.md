# 2026-08-14-source-evidence-lifecycle-contract - Source Evidence Lifecycle Contract

## Release ID

`2026-08-14-source-evidence-lifecycle-contract`

## Status

`candidate`

## Plain-English Summary

Adds a pure Source evidence lifecycle contract that keeps uploaded, parsed,
indexed, cited, accepted, stage-ready, stale, low-confidence, and rejected states
separate for the New Event workflow. This gives the evidence table and future
gate logic a deterministic way to show why a file is not ready even after it has
been uploaded.

This is model/test only. It does not parse files, ingest uploads, mutate
data-plane records, change workflow persistence, approve gates, or promote
tenant evidence.

## Layer Impact

- Release lane: `global-control-lane`.
- Products: Source gains a derived evidence lifecycle model for New Event UX.
- Client Intake: No change.
- Source Adapters: No change.
- Canonical Model: No change.

## Client Applicability

- All clients: shared Source model contract.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/source/evidence-lifecycle.ts`
- `src/lib/source/__tests__/evidence-lifecycle.test.ts`

## QA / Validation

- Pass: targeted evidence lifecycle unit test.
- Pass: local prettier check for changed files.
- Pass: local `npm run release:check`.
- Not run yet: GitHub CI.

## Rollout Plan

Merge through normal PR after the currently stacked Source UX slices land. This
contract is inert until consumed by the evidence table or stage gate UX.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if merged
  to `main`.
- Shared runtime mutators: None in this change.
- Approved image digest: Pending deploy if merged.
- ACA runtime invariant: Required after deploy if merged.
- Worker image invariant: Required after deploy if merged.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for inert model/test-only slice.

## Rollback Plan

Revert the PR. This removes the derived lifecycle helper and unit tests without
changing persisted evidence state.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/6283
- Local validation: pass for targeted evidence lifecycle unit test, Prettier,
  and release check.
- GitHub CI: pending.
- ACA deploy proof: pending if merged.

## Known Gaps

The contract is not yet wired into the Files/Evidence table, parser pipeline, or
durable stage gates. It intentionally does not implement upload parsing or
acceptance persistence; those remain hard-gated implementation slices.
