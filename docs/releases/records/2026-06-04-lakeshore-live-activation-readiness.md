# 2026-06-04-lakeshore-live-activation-readiness — Lakeshore Live Activation Readiness

## Release ID

`2026-06-04-lakeshore-live-activation-readiness`

## Status

`candidate`

## Plain-English Summary

Adds a read-only readiness verifier and runbook for turning the Lakeshore
Holdings synthetic package into a live tenant-scoped context layer. The change
does not load data or provision users by itself. It tells operators what is
ready, what is blocked by pending PRs, what live credentials are missing, and
what evidence must be collected before Lakeshore is considered live.

## Layer Impact

- `client-data-lane`: Adds Lakeshore-specific activation guidance for governed
  data loading, embeddings, Data Trust proof, CXO user provisioning, and tenant
  isolation verification.
- `internal-admin`: Adds an operator verifier and runbook used by AbarVa agents
  and administrators during the Lakeshore pilot activation.

## Client Applicability

- All clients: No runtime behavior changes.
- Specific clients: Lakeshore Holdings activation only.
- Internal only: The verifier and runbook are internal operator assets.
- Public/demo only: Not applicable.
- Feature flag: Not applicable.

## Changes Included

- `scripts/lakeshore/verify-live-activation-readiness.mjs`
- `docs/runbooks/lakeshore-live-activation.md`
- `docs/releases/records/2026-06-04-lakeshore-live-activation-readiness.md`
- `package.json` script `lakeshore:live-activation:verify`

## QA / Validation

- PASS: `node scripts/lakeshore/verify-live-activation-readiness.mjs`
  returned `ready_with_warnings`, with no blocking artifact gaps and explicit
  warnings for missing live secrets plus PR-dependent evidence.
- PASS: `node scripts/lakeshore/verify-live-activation-readiness.mjs --json`
  emitted machine-readable readiness output.
- PASS: `node scripts/lakeshore/verify-live-activation-readiness.mjs --strict`
  returned nonzero as expected because live secrets and PR-dependent evidence
  are not present in the local worktree.
- PASS: `node scripts/lakeshore/verify-synthetic-context.mjs` confirmed 5
  operating companies, 1,329 structured records, 18 CSV files, 21 documents, 65
  ZIP entries, and a non-empty offline review bundle.
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge to `main` through PR. No runtime deploy dependency is required because
this is a read-only verifier and documentation slice. Operators can run
`npm run lakeshore:live-activation:verify` immediately after merge.

## Rollback Plan

Revert the PR. No database, Azure, Clerk, or production runtime changes are
introduced by this release.

## Audit Evidence

- PR URL and CI once opened.
- Verifier output showing ready items and expected pending live inputs.
- Release check output.
- Later Lakeshore activation evidence packet described in
  `docs/runbooks/lakeshore-live-activation.md`.

## Known Gaps

- PR #2997 must merge before governed load rehearsal and commit evidence exists.
- PR #2998 must merge before CXO provisioning and agent-grounding validation
  assets exist on `main`.
- Live activation still requires Clerk, data-plane, embedding, and Azure
  Document Intelligence credentials in the target environment.
