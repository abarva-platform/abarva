# 2026-09-18-source-ava-contract-amount-guard - Contract answer amount provenance

## Release ID

`2026-09-18-source-ava-contract-amount-guard`

## Status

`candidate`

## Plain-English Summary

Source contract answers now withhold an annual value when its baseline conflict is unresolved. They identify opportunity amounts that lack a matching calculation run as stated, unverified amounts and exclude those amounts from calculated totals and charts.

## Layer Impact

Layer 4, Products: Source aVa answer context, grounding text, and deterministic visual answers preserve the status and provenance of values read from existing Source projections. No intake, adapter, canonical data, or calculation rule changes are included. Release lane: `global-control-lane`.

## Client Applicability

- All clients: Source contract answers using this shared path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

The server answer context carries contract conflict status and opportunity calculation trace state. Contract grounding labels unreconciled amounts in answer and export-ready rows. Deterministic visual answers withhold unresolved annual values and keep unverified stated amounts out of sized totals and charts. Focused behavioral tests cover conflict and authored-only amount paths.

## QA / Validation

- Focused Jest suites: 40 tests passed.
- Deliberate guard mutation: disabling the opportunity trace check made the authored-only amount test fail; restoring it passed.
- Focused ESLint: passed.
- Full TypeScript check with an 8 GB Node heap: passed.
- `npm run release:check`: passed.
- Signed-in product proof: not performed.

## Rollout Plan

Review and merge through a PR. The repository-owned ACA main deploy workflow is the only path to the shared web runtime. No runtime or data-plane change is part of this candidate.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after an authorized merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable before deployment.
- ACA runtime invariant: Not checked; no deployment requested.
- Worker image invariant: Not checked; no worker update requested.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, before calling the affected answer behavior live-proven.

## Rollback Plan

Revert the PR through the normal release path. There is no schema or tenant-data rollback.

## Audit Evidence

The PR diff, focused test output, mutation result, lint, TypeScript, and release-check output establish the local candidate. Deployment and signed-in proof remain separate future evidence.

## Known Gaps

The export packet serializes the already-gated answer and grounding block, so this guard is inherited by that path; signed-in export parity is unproven. Broader Source export surfaces and economics reconciliation, including benchmark-based sizing and finance-confirmed value, remain separate work. This candidate does not establish full Stage 09 parity.
