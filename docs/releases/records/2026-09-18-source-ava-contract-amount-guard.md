# 2026-09-18-source-ava-contract-amount-guard - Contract answer amount provenance

## Release ID

`2026-09-18-source-ava-contract-amount-guard`

## Status

`candidate`

## Plain-English Summary

Source contract answers now show Contract 360's stated annual value with explicit unresolved-conflict wording when the baseline disagrees. Opportunity amounts without a supported calculated sizing claim and matching output remain stated, unverified amounts outside reproducible totals and charts.

## Layer Impact

Layer 4, Products: Source aVa answer context, grounding text, and deterministic visual answers preserve the status and provenance of values read from existing Source projections. No intake, adapter, canonical data, or calculation rule changes are included. Release lane: `global-control-lane`.

## Client Applicability

- All clients: Source contract answers using this shared path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

The server answer context carries Contract 360's stated annual value, conflict status, and opportunity trace state. Contract grounding requires a supported calculated sizing claim and matching output before using the persisted read adapter's run-linked amount. It labels unreconciled amounts in answer and export-ready rows. Deterministic visual answers keep unverified stated amounts out of sized totals and charts. Focused behavioral tests cover conflicts and authored-only amount paths.

## QA / Validation

- Focused Jest suites: 42 tests passed.
- Deliberate guard mutations: disabling the visual trace check promoted an authored-only amount into a sized total; disabling the linked run-ID check promoted a descriptive fallback calculation into a reproducible total. Both tests passed after restoration.
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

The aVa trace bucket relies on the merged persisted read adapter's claim-run ID check; `OpportunityCalculationRead` does not expose a run ID for independent verification by aVa. Fallback rows and partial claims remain untraced. The export packet serializes the already-gated answer and grounding block, so this guard is inherited by that path; signed-in export parity is unproven. Broader Source export surfaces and economics reconciliation, including benchmark-based sizing and finance-confirmed value, remain separate work. This candidate does not establish full Stage 09 parity.
