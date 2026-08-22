# 2026-08-22-move-deliverable-markdown-id-scrub — Moves Deliverable Markdown ID Scrub

## Release ID

`2026-08-22-move-deliverable-markdown-id-scrub`

## Status

`candidate`

## Plain-English Summary

Moves generated deliverables now scrub bare internal UUIDs from generated markdown body text before the deliverable quality gate and export path. The strict quality gate remains in place, but deterministic cleanup prevents a reviewer-facing artifact from failing solely because a model echoed an internal run or object identifier into prose.

## Layer Impact

Layer 4 Products: Updates Moves deliverable assembly and client-facing artifact sanitization only. No tenant intake, source adapter, canonical model, data-plane loader, graph, migration, or registry behavior changes.

## Client Applicability

- All clients: Moves deliverable generation users.
- Specific clients: None named.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Add a markdown sanitizer that redacts bare internal UUIDs in generated body text while preserving markdown artifact URLs.
- Apply the markdown sanitizer after unsupported-figure repair and before deliverable quality validation.
- Preserve raw model text for unsupported-figure validation so factual and financial checks are not weakened.
- Add regression coverage for markdown UUID scrubbing and assembled deliverable body cleanup.

## QA / Validation

- `npx jest --runTestsByPath src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/orchestrator/__tests__/quality-validator-hardening.test.ts --runInBand` — pass.
- `npx eslint src/lib/deliverables/client-facing-artifact-sanitize.ts src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts src/lib/deliverables/orchestrator/section-generation.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — pass.

## Rollout Plan

Merge by PR to `main`. The repo-owned ACA main deploy workflow will build and deploy the runtime image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be captured by the ACA deploy workflow.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, retry a Moves deliverable generation that previously blocked on a UUID leak.

## Rollback Plan

Revert the PR and allow the repo-owned ACA workflow to deploy the prior behavior. No data rollback is required.

## Audit Evidence

PR URL, CI checks, ACA deploy run, runtime invariant output, and signed-in deliverable generation retry proof after deployment.

## Known Gaps

This change does not relax unsupported-claim, citation, source-register, or decision-quality gates. It only removes bare internal UUIDs from generated client-facing markdown prose before validation.
