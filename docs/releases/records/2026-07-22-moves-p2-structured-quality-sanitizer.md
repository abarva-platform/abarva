# 2026-07-22-moves-p2-structured-quality-sanitizer — Moves P2 Structured Quality Sanitizer

## Release ID

`2026-07-22-moves-p2-structured-quality-sanitizer`

## Status

`candidate`

## Plain-English Summary

P2 generation now cleans the remaining client-visible quality issues that surfaced during the live First Capital sandbox Move proof. The sanitizer rewrites phase-owner shorthand such as `P2 Compliance / Chief Risk Office` into sponsor-readable language, and the structured synthesis layer now marks unsupported numeric/date/value claims in tables, checklists, recommendations, and next actions as assumptions to validate before rendering.

## Layer Impact

- `global-control-lane`: Shared Moves deliverable generation and quality-gate behavior changes for generated artifacts. No tenant data model, data-layer promotion, or evidence-readiness contract is changed.
- `client-data-lane`: No schema, migration, tenant data, candidate data, or Active Tenant Access change.

## Client Applicability

- All clients: Applies wherever Moves generated deliverables use the shared orchestrator and client-facing artifact sanitizer.
- Specific clients: Live proof target is the sandbox First Capital / FS Demo Move only.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None. This is quality enforcement and output sanitation, not an optional UI feature.

## Changes Included

- `src/lib/deliverables/client-facing-artifact-sanitize.ts`
- `src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts`
- `src/lib/deliverables/orchestrator/section-generation.ts`
- `src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts`
- PR URL: pending

## QA / Validation

- `npx jest src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts --runInBand` — pass, 12 tests.
- `npx eslint src/lib/deliverables/client-facing-artifact-sanitize.ts src/lib/deliverables/orchestrator/section-generation.ts src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts` — pass.
- `npm run release:check` — pass.
- `git diff --check` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — blocked by existing Home optional dependency resolution for `@xyflow/react` and `@dagrejs/dagre`; no Moves patch errors remained after fixing checklist reason typing.
- Signed-in production proof on `app.abarva.ai` — pending after merge/deploy.

## Rollout Plan

Open a PR, merge through the protected GitHub workflow, deploy through the repo-owned Azure Container Apps main deploy workflow, verify ACA runtime invariant, then rerun P2 Approve & Build on the sanctioned sandbox Move `Codex Proof First Capital E2E 20260721`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: N/A unless the deploy workflow changes worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous ACA image through the repo-owned main deploy workflow. Because this changes only output sanitation and render-package assembly, rollback does not require data migration or evidence cleanup.

## Audit Evidence

- Prior live blocker proof: First Capital sandbox P2 generated artifacts blocked after PR #5309 with `non_mechanical_writing` due to phase-owner shorthand and one unsupported client-fact claim.
- ACA Log Analytics showed remaining client-visible terms: `P1 CIO / Operations data owner`, `P2 Compliance / Chief Risk Office`, and `P3 Procurement / Vendor Management`.
- Proof bundle root: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722`

## Known Gaps

- This does not weaken the quality gate.
- This does not claim P2 completion.
- This does not advance the sandbox Move until signed-in proof shows generated artifacts pass or fail for a new, narrower reason.
