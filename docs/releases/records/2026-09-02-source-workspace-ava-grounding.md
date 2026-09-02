# 2026-09-02-source-workspace-ava-grounding - Source Workspace aVa Grounding Contract

## Release ID

`2026-09-02-source-workspace-ava-grounding`

## Status

`candidate`

## Plain-English Summary

This release strengthens the Source workspace aVa packet so the assistant receives
the active Source 360 page context, available row coverage, explicit claim rules,
and refusal triggers before answering. The goal is to make answers useful for
portfolio, vendor, contract, Optimize, evidence, and graph questions while
preventing unsupported savings, recommendation, pricing, or cross-tenant claims.

## Layer Impact

- Layer 4, Products: Updates the Source workspace assistant context passed to
  the shared aVa route.
- Layer 4, Agent runtime: Adds a structured claim contract, capability summary,
  grounding status, and refusal examples to the Source workspace surface context.
- Lane: `global-control-lane`.

## Client Applicability

- All clients: Source workspace users receive the improved assistant grounding.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`: adds Source
  workspace grounding status, claim rules, evidence requirements, capability
  boundaries, and refusal examples to the aVa surface context.
- `src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts`:
  verifies the route still uses the rich assistant channel and receives the
  Source-specific claim contract.
- `src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts`:
  verifies the built surface context carries row coverage, claim rules, and
  Source 360 / Optimize / New Event capability boundaries.
- `docs/backlog/tracks/04-source-commercial/BACKLOG.md`: tracks the remaining
  signed-in adversarial proof for Source workspace aVa.

## QA / Validation

- pass - Focused Jest:
  `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand`.
- pass - Focused ESLint:
  `npx eslint 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'`.
- pass - Release gate: `npm run release:check`.
- pass - TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.

## Rollout Plan

Merge through pull request to `main`. The repo-owned Azure Container Apps main
deploy workflow builds and deploys the production image.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime rollout.
- Shared runtime mutators: None outside the approved workflow.
- Approved image digest: Produced by the repo-owned workflow.
- ACA runtime invariant: Must pass before live proof is claimed.
- Worker image invariant: Must pass before live proof is claimed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify Source workspace aVa answers the
  scoped adversarial prompt set with grounded claims, refusals, and structured
  exhibits where rows support them.

## Rollback Plan

Revert this release with a follow-up pull request and deploy through the same
repo-owned workflow. No data rollback is required because the change only alters
the Source workspace assistant context.

## Audit Evidence

- Pull request: pending.
- Deploy workflow: pending.
- Live proof: pending.

## Known Gaps

This release does not run the signed-in aVa adversarial prompt set, ingest new
data, change Source read models, or alter finance confirmation state. Those
remain separate proof and data-plane workstreams.
