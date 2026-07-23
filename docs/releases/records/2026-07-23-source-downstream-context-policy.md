# 2026-07-23-source-downstream-context-policy — Source Accepted-Artifact Context Policy Enforcement

## Release ID

`2026-07-23-source-downstream-context-policy`

## Status

`candidate`

## Plain-English Summary

Source already asked a human whether an accepted artifact should be included, restricted, or excluded from downstream agent context. This release makes that answer enforceable at the shared governed context gate: excluded artifacts are blocked, restricted artifacts are blocked unless a caller explicitly opts into restricted downstream review, and included artifacts continue through the normal Context & Corpus Governance checks.

## Layer Impact

- App/runtime governance: `buildValidatedAgentContextBundle` now understands accepted-artifact downstream context policy when a candidate carries it.
- Source governance: the `source_artifact_acceptances.downstream_context_policy` hook now has a matching enforcement point, without changing the table or mutating any production rows.
- Data plane: no schema changes, no migrations, no data-build jobs, no vector indexing, and no production data mutation.

## Client Applicability

- All clients: yes, wherever a Source artifact acceptance policy is mapped into a governed candidate.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/governance/agent-context-bundle.ts`: adds optional `downstream_context_policy` to governed candidates and enforces include/restricted/exclude semantics before model-visible context is assembled.
- `src/lib/governance/context-bundle-adapters.ts`: preserves `downstreamContextPolicy` from enterprise bundle items when present.
- `src/lib/governance/__tests__/agent-context-bundle.test.ts`: adds regression coverage for excluded, restricted, included, and adapter-mapped policies.
- `docs/backlog/source-product-backlog.md`: marks the SOURCE-SHELL-004 policy-enforcement gap as addressed by SOURCE-SHELL-004a.

## QA / Validation

- `npm test -- --runTestsByPath src/lib/governance/__tests__/agent-context-bundle.test.ts` — passed, 16 tests. Jest still reports the repo's pre-existing duplicate manual mock warnings for markdown/GFM mocks.
- `npx eslint src/lib/governance` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — passed. A first plain `npx tsc --noEmit` attempt exhausted the local Node heap before diagnostics, so the validation was rerun with a larger heap.
- `npm run release:check` — passed.
- Pending before release: PR checks, ACA deploy, runtime invariant, and focused read-only/live proof.

## Rollout Plan

Merge through a governed PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the exact merge SHA. After deployment, run the independent ACA runtime invariant. Because this is a pure governance gate change, focused proof should show the latest runtime is active and the regression suite passed; no production data mutation is required or approved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none allowed for this release.
- Approved image digest: pending ACA deploy.
- ACA runtime invariant: pending after deploy.
- Worker image invariant: pending after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: focused proof required where applicable; no client data mutation required.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow publish the rollback SHA. No database rollback is needed because this release only changes code and docs.

## Audit Evidence

- PR: [abarva-platform/abarva#5470](https://github.com/abarva-platform/abarva/pull/5470).
- Merge commit: pending.
- ACA deploy run: pending.
- Runtime invariant: pending.
- Focused tests: see QA / Validation.

## Known Gaps

- This release enforces the policy only when a candidate carries `downstream_context_policy`. It does not backfill old acceptances, start vector indexing, or promote artifacts into enterprise context.
