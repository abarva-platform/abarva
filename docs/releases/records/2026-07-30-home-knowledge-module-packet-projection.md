# 2026-07-30-home-knowledge-module-packet-projection — Home Knowledge Module Packet Projection

## Release ID

`2026-07-30-home-knowledge-module-packet-projection`

## Status

`candidate`

## Plain-English Summary

Adds a governed Home Knowledge module packet projection so the signed-in Home Knowledge page can read suggested questions from the data plane instead of relying on a UI fallback. The packet is deterministic, tenant-scoped, and generated only after the accepted consumption projections for the active baseline have been built.

## Layer Impact

- Release lane: `client-data-lane`.
- `CANONICAL MODEL`: No canonical source, review-decision, baseline, or publication schema is changed.
- `PRODUCTS`: Home reads the existing `consumption.module_knowledge_packet_v1` projection through the current reader path after an operator rebuild makes rows available.
- `SOURCE ADAPTERS`: No adapter or intake-template behavior changes.

## Client Applicability

- All clients: None by default.
- Specific clients: Any tenant whose governed consumption projections are rebuilt after this code is deployed.
- Internal only: Operator release/proof workflow.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/processing/executor-framework.mjs` adds `module_knowledge_packet_v1` to the closed core projection set, cleans stale packet rows during rebuild, writes a deterministic Home suggested-questions packet after related projections are built, counts the packet row, and registers a separate projection version.
- `scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs` adds static and in-memory regression coverage for packet projection construction and registration.
- This release record.

## QA / Validation

- pass: `node --check scripts/knowledge/processing/executor-framework.mjs`
- pass: `node --check scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- pass: `node scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- pass: `npx eslint scripts/knowledge/processing/executor-framework.mjs scripts/knowledge/__tests__/run-knowledge-process-executor-tests.mjs`
- pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`
- pass: `npm run release:check`

## Rollout Plan

Merge through PR review. Deploy through the repo-owned Azure Container Apps main deployment workflow. After the approved image is live, run the governed ACA data-build job for the authorized tenant scope to rebuild consumption projections, then capture signed-in Home Knowledge proof that suggested questions load from `module_knowledge_packet_v1`.

## Deployment Authority

- Repo-owned deploy workflow: Required for code rollout to shared runtime.
- Shared runtime mutators: Not authorized by this PR.
- Approved image digest: Required before any shared runtime change.
- ACA runtime invariant: Must be proven after deployment before claiming live status.
- Worker image invariant: Required for the governed data-build job.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, after deployment and projection rebuild.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. Existing packet rows can be left harmlessly stale if the reader is disabled by rollback, or refreshed by rerunning the governed projection build from the rollback image. Do not delete data-plane rows outside an approved operator cleanup.

## Audit Evidence

- PR for this release candidate.
- Local validation output listed above.
- Post-merge ACA deployment evidence.
- Governed ACA data-build job receipt and quality output.
- Signed-in Home Knowledge proof for the affected tenant scope.

## Known Gaps

- This does not run the live data-plane rebuild.
- This does not certify signed-in product behavior.
- This does not authorize canonical promotion, new publication, baseline activation, production cutover, deletion, or security weakening.
