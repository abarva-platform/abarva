# 2026-07-22-moves-generation-move-context-priority — Moves Generation Move Context Priority

## Release ID

`2026-07-22-moves-generation-move-context-priority`

## Status

`candidate`

## Plain-English Summary

Moves deliverable generation now gives the Move's own phase-capture inputs and reviewed Move evidence priority over broad tenant context. Live FS Demo proof showed the P1 Charter could mechanically pass generation while drifting into unrelated First Capital portfolio material instead of the sandbox Move's commercial-lending agent-assist scope. This release keeps tenant context available as supporting material, but the Move record leads the source register and model prompt.

## Layer Impact

- `global-control-lane`: Shared Moves evidence assembly behavior for governed deliverable generation.
- `public-demo`: Improves FS Demo / Meridian / SkyHarbor demo quality by preventing broad tenant context from hijacking a specific Move narrative.

## Client Applicability

- All clients: Any Moves deliverable generated with a Move source reference uses this evidence priority.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None; this is a governed evidence-ordering correction.

## Changes Included

- `src/lib/deliverables/orchestrator/evidence-assembler.ts`: loads phase-capture rows from `program_modules` as Move-scoped generation context.
- `src/lib/deliverables/orchestrator/evidence-assembler.ts`: orders Move-scoped candidates before active tenant context candidates.
- `src/lib/deliverables/orchestrator/evidence-assembler.ts`: raises the Move-scoped evidence cap so phase capture and reviewed uploaded evidence can both reach generation.
- `src/lib/deliverables/orchestrator/__tests__/surface.test.ts`: adds regression coverage proving Move phase capture outranks broad tenant context.

## QA / Validation

- Pass: `npx jest src/lib/deliverables/orchestrator/__tests__/surface.test.ts --runInBand`.
- Pass: `npx eslint src/lib/deliverables/orchestrator/evidence-assembler.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts`.
- Pending: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`.
- Pending: `npm run release:check`.
- Pending: `git diff --check`.
- Pending after deploy: rerun signed-in FS Demo sandbox P1 Charter generation and inspect the generated DOCX for use-case relevance.

## Rollout Plan

Merge through PR, deploy through the repo-owned Azure Container Apps main deploy workflow, verify the ACA runtime invariant, then rerun the signed-in FS Demo sandbox P1 Charter generation before advancing the E2E Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Pending deploy.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the prior ACA image through the repo-owned deployment lane. There are no schema or migration changes.

## Audit Evidence

- Live quality failure prompting this release: FS Demo sandbox P1 Charter run `5d3fb915-8aec-4ff0-909d-0e1a347cf587` succeeded mechanically with 7 sections and 12 retrieved evidence items, but the generated DOCX centered unrelated AI portfolio material rather than the commercial-lending agent-assist Move.
- PR URL: Pending.
- ACA revision: Pending.
- Signed-in proof bundle: Pending.

## Known Gaps

- This release does not redesign the P1 approval UI.
- This release does not fix the known Move Context Extract attached-evidence count divergence.
- This release does not prove P2-P5 document quality; those remain part of the continuing E2E run.
