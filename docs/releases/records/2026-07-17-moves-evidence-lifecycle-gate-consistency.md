# 2026-07-17-moves-evidence-lifecycle-gate-consistency — Moves Evidence Lifecycle And Gate Consistency

## Release ID

`2026-07-17-moves-evidence-lifecycle-gate-consistency`

## Status

`candidate`

## Plain-English Summary

Fixes the gap between what Moves showed as uploaded/ready evidence and what Approve & Build actually attached or generated from. Workspace uploads now open a review lifecycle, readiness and generation use approved Move evidence consistently, stale Move Context Extracts rebuild when accepted evidence changes, and Meridian-style Agent Assist Moves use a healthcare/contact-center evidence blueprint instead of generic AI operations evidence. Phase-gate approval responses also return clearer blockers, transition, gate id, and next action.

## Layer Impact

- `global-control-lane`: shared Strategic Moves behavior for evidence lifecycle, context extract freshness, generation evidence assembly, Agent Assist discovery blueprint, and phase-gate approval response contracts.
- No client data migration, data-layer promotion, Active Tenant Access update, candidate-read default change, or Tower value proof change.

## Client Applicability

- All clients: yes, for Strategic Moves evidence uploads, readiness, context extract generation, phase generation, and gate approval API responses.
- Specific clients: Meridian Agent Assist benefits from the new healthcare/contact-center blueprint, but the code path is global.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/programs/workspace/[moveId]/upload/route.ts`
- `src/app/api/v1/deliverables/generate-phase/route.ts`
- `src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts`
- `src/lib/programs/current-state-doc-ingest.ts`
- `src/lib/programs/discovery/evidence-readiness.ts`
- `src/lib/programs/move-context-extract.ts`
- `src/lib/deliverables/orchestrator/evidence-assembler.ts`
- `src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts`
- Focused tests under `src/lib/programs`, `src/lib/programs/discovery`, `src/lib/deliverables/orchestrator`, and `src/__tests__/integration/programs`
- Audit scripts under `scripts/audit`
- Reports under `reports/moves-evidence-lifecycle-fix`

## QA / Validation

- Pass: `npx jest src/lib/programs/__tests__/move-context-extract.test.ts --runInBand`
- Pass: `npx jest src/lib/programs/discovery/__tests__/evidence-readiness.test.ts src/lib/deliverables/orchestrator/__tests__/surface.test.ts --runInBand`
- Pass: `npx jest src/__tests__/integration/programs/phase-capture-gate-routes.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/move-context-extract.ts src/lib/programs/current-state-doc-ingest.ts src/lib/programs/discovery/evidence-readiness.ts src/lib/deliverables/orchestrator/briefs/discovery-blueprint.ts src/lib/deliverables/orchestrator/evidence-assembler.ts 'src/app/api/v1/programs/[programId]/phase-gate-approval/route.ts' 'src/app/api/programs/workspace/[moveId]/upload/route.ts' 'src/app/api/v1/deliverables/generate-phase/route.ts'`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `npm run audit:moves-evidence-lifecycle`
- Pass: `npm run audit:moves-agent-assist-blueprint`
- Pass: `npm run audit:moves-gate-consistency`
- Pass: `npm run audit:moves-context-extract`
- Pass: `npm run audit:active-candidate-separation`
- Pass: `npm run audit:tenant-isolation:moves`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Pending: PR, ACA deploy, and signed-in browser proof.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow must build and deploy the exact merged SHA before the change is live on `app.abarva.ai`. After deploy, run a signed-in disposable Meridian or SkyHarbor Move proof.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending ACA main deploy.
- ACA runtime invariant: pending ACA main deploy.
- Worker image invariant: not changed by this PR.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No schema migration rollback is required. Existing evidence rows and review rows remain append-only data; rollback only reverts runtime interpretation.

## Audit Evidence

- PR URL: pending.
- Local report bundle: `reports/moves-evidence-lifecycle-fix`
- Local validation: Codex transcript command output.
- Live proof: pending.

## Known Gaps

- UI polish for button placement and phase navigation is not completed in this slice.
- Browser pressure test through P5 is still required after deploy.
- This does not create a data-layer promotion path or Tower realized-value proof.
