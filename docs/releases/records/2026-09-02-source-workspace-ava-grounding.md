# 2026-09-02-source-workspace-ava-grounding - Source Workspace aVa Grounding Contract

## Release ID

`2026-09-02-source-workspace-ava-grounding`

## Status

`released`

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
  grounding status, and refusal examples to the Source workspace surface context,
  then promotes those Source-specific guardrails into the shared retrieval source
  set before answer synthesis.
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
- `src/lib/intelligence/ask/retrievers/surface-context.ts`: promotes Source
  workspace claim rules, row coverage, capability boundaries, evidence
  requirements, and refusal examples as a high-confidence surface source.
- `src/lib/intelligence/ask/types.ts`: documents the optional Source workspace
  aVa grounding fields carried in `surfaceContext`.
- `src/lib/intelligence/ask/__tests__/surface-context-domains.test.ts`: verifies
  the Source-specific claim contract reaches the retrieval source set.

## QA / Validation

- pass - Focused Jest:
  `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand`.
- pass - Focused ESLint:
  `npx eslint 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts'`.
- pass - Release gate: `npm run release:check`.
- pass - TypeScript: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`.
- pass - Follow-up focused Jest:
  `npm test -- --runTestsByPath 'src/lib/intelligence/ask/__tests__/surface-context-domains.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/workspace-ava-contract.test.ts' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' --runInBand`.
- pass - Follow-up focused ESLint:
  `npx eslint 'src/lib/intelligence/ask/retrievers/surface-context.ts' 'src/lib/intelligence/ask/types.ts' 'src/lib/intelligence/ask/__tests__/surface-context-domains.test.ts'`.
- pass - Post-deploy signed-in Source workspace aVa micro-proof on
  2026-09-03: the assistant grounded an active workspace context question in
  visible Source 360 facts, refused a realized-savings claim without finance
  confirmation, refused a supplier-selection recommendation without evaluation
  evidence, and refused a cross-tenant pricing request.

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
- Live signed-in proof required: Completed on 2026-09-03 for the scoped Source
  workspace aVa prompt set: grounded workspace-context answer, unsupported value
  refusal, unsupported supplier-selection refusal, and cross-tenant pricing
  refusal.

## Rollback Plan

Revert this release with a follow-up pull request and deploy through the same
repo-owned workflow. No data rollback is required because the change only alters
the Source workspace assistant context.

## Audit Evidence

- Pull request: PR #7345 merged for the Source workspace context packet.
- Pull request: PR #7347 merged for the shared retrieval-source promotion.
- Deploy workflow: ACA deploy `33697859469` completed for the merged runtime.
- Live proof: signed-in Source workspace aVa micro-proof completed on
  2026-09-03 by the authenticated product operator and reported in the current
  task thread.

## Known Gaps

This release does not ingest new data, change Source read models, alter finance
confirmation state, or replace the broader 50-question aVa hard-QA bank. Those
remain separate proof and data-plane workstreams.
