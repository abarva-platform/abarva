# 2026-08-16-source-ava-portfolio-chart-grounding — Source aVa Portfolio Chart Grounding

## Release ID

`2026-08-16-source-ava-portfolio-chart-grounding`

## Status

`candidate`

## Plain-English Summary

Source aVa now answers portfolio-wide chart and concentration questions from the governed Source portfolio read model only. When a user asks for top vendors, supplier categories, or portfolio concentration visuals without selecting a single contract or event, the prompt suppresses generic Source broker context and requires chart labels and values to come from the authoritative Source portfolio grounding block.

## Layer Impact

- `global-control-lane`: updates shared Source aVa prompt/context selection for portfolio-wide questions.
- Canonical model: no schema or data changes.
- Source adapters: no adapter changes.
- Client intake: no intake-template changes.

## Client Applicability

- All clients: yes, for Source aVa portfolio sessions.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/chat/agent/route.ts`
- `src/app/api/chat/agent/__tests__/source-ava-polish-gate.test.ts`

## QA / Validation

- Targeted Source aVa polish test must pass.
- ESLint must pass for touched files.
- TypeScript must pass with `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit`.
- `npm run release:check` must pass.
- Live proof requires the repo-owned ACA deploy and a post-deploy Source aVa hard-QA capture showing portfolio chart answers do not use ambient vendor context.

## Rollout Plan

Merge through PR, then deploy via the repo-owned Azure Container Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: produced by the deploy workflow.
- ACA runtime invariant: required before live-proof claim.
- Worker image invariant: required before live-proof claim.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source aVa captured-response QA.

## Rollback Plan

Revert the PR and redeploy through the same ACA main workflow.

## Audit Evidence

- PR and CI checks for this release.
- ACA deploy evidence bundle and runtime invariant proof.
- Source aVa hard-QA captured-response report.

## Known Gaps

This does not change Source data, generated artifacts, upload parsing, or the portfolio read model. It only prevents portfolio chart answers from using non-authoritative context when governed Source portfolio grounding is available.
