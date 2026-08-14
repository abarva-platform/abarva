# 2026-08-14-layer2-semantic-decision-ledger — Layer 2 Semantic Decision Ledger

## Release ID

`2026-08-14-layer2-semantic-decision-ledger`

## Status

`candidate`

## Plain-English Summary

The tenant layer-refresh audit now writes a report-only ledger for Layer 2 dry-run failures that
need explicit semantic alias approval before they can be fixed in adapter/profile code. The ledger
keeps those cases separate from mechanically safe alias candidates and does not activate aliases,
change tenant inputs, or write canonical outputs.

## Layer Impact

- Affected release lane: `global-control-lane`.
- Layer 1 Client Intake: read-only inspection of active intake packet headers; no intake files are
  changed.
- Layer 2 Source Adapters: report-only semantic decision ledger; no alias is activated and no
  adapter transform is executed.
- Layer 3 Canonical Enterprise Model: no canonical objects, facts, or relationships are written.
- Layer 4 Products: no product projection or runtime behavior changes.

## Client Applicability

- All clients: audit tooling can emit the semantic decision ledger for any tenant packet.
- Specific clients: none.
- Internal only: intended for operator/backlog planning and approval packet preparation.
- Public/demo only: not applicable.
- Feature flag: none.

## Changes Included

- `scripts/audit/tenant-layer-refresh.mjs` now emits `layer2-semantic-decision-ledger.json`.
- `scripts/audit/__tests__/run-layer2-semantic-decision-ledger-tests.mjs` validates the
  report-only truth split, hard-gate counts, and blocked activation actions.
- The generated refresh README and summary now include the semantic decision ledger totals.

## QA / Validation

- Pass: `node scripts/audit/__tests__/run-layer2-semantic-decision-ledger-tests.mjs`
- Pass: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out <tmp>/layer-reconciliation --no-package`
- Pass: `npm run release:check`

## Rollout Plan

Merge through a pull request. The artifact appears the next time the audit script runs. There is no
data-plane load, registry activation, runtime routing change, or product behavior change.

## Deployment Authority

- Repo-owned deploy workflow: allowed by the session merge/deploy approval for merged code.
- Shared runtime mutators: none beyond the repo-owned deploy workflow.
- Approved image digest: produced by the repo-owned ACA main deploy if merged.
- ACA runtime invariant: required after repo-owned deploy if merged.
- Worker image invariant: required after repo-owned deploy if merged.
- Feature/env flag update path: none.
- Live signed-in proof required: no, because no product runtime behavior changes.

## Rollback Plan

Revert the pull request to stop emitting `layer2-semantic-decision-ledger.json`. Existing dry-run,
classification, and code-only alias-impact reports remain available.

## Audit Evidence

- Focused test output for the semantic decision ledger test.
- Full audit dry-run output directory containing `layer2-semantic-decision-ledger.json`.
- `npm run release:check` output.

## Known Gaps

The ledger is not approval. Semantic identity aliases, tenant CSV mutation, registry activation,
and data-plane writes remain hard-gated follow-up work.
