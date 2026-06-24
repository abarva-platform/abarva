# 2026-06-24-home-intelligence-doctrine-status — Home / Intelligence Doctrine And Status Lock

## Release ID

`2026-06-24-home-intelligence-doctrine-status`

## Status

`candidate`

## Plain-English Summary

Adds the product doctrine that separates Home / Explorer from Intelligence and adds a locked
top-line phase/status table to the Brain Contract progress tracker. Home is now documented as
the factual enterprise memory / evidence explorer. Intelligence is documented as the advisor
layer that reasons over tenant facts plus governed corpus, benchmarks, patterns, and experts.

## Layer Impact

`global-control-lane`: Updates repo-owned product doctrine and execution tracking for all
tenants and all shared surfaces. No runtime code, database schema, feature flag, data load, or
deployment behavior changes are included.

## Client Applicability

- All clients: Yes. The doctrine and progress tracker apply to every tenant surface.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `docs/product/HOME_INTELLIGENCE_SURFACE_DOCTRINE.md`
- `docs/build/BRAIN_CONTRACT.md`
- `docs/build/BRAIN_CONTRACT_PROGRESS.md`
- `docs/releases/records/2026-06-24-home-intelligence-doctrine-status.md`

## QA / Validation

- `rg -n "HOME_INTELLIGENCE_SURFACE_DOCTRINE|Locked top-line execution status|Overall execution" docs/build docs/product` — PASS.
- `npm run release:check` — PASS.

## Rollout Plan

Merge to `main`. No ACA deployment, data migration, or feature flag is required because this is
documentation and release-control tracking only. Subsequent Home, Intelligence, and shared chat
implementation PRs must update the locked phase/status table when their proof state changes.

## Deployment Authority

- Repo-owned deploy workflow: Not required for this documentation-only release.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not affected.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Not for this doctrine/status slice. Runtime implementation PRs still require deployed browser proof.

## Rollback Plan

Revert the PR to remove the doctrine link and locked status table. No data rollback is required.

## Audit Evidence

Inspect the PR diff and this release record. Future PRs should cite the doctrine and update
`docs/build/BRAIN_CONTRACT_PROGRESS.md` when phase percentages or proof states move.

## Known Gaps

- This release does not change Home or Intelligence runtime behavior.
- The top-line percentages are conservative status-tracking values, not acceptance evidence.
- A deployed matrix and reality-crawl run remain the acceptance authority.
