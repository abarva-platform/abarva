# 2026-07-22-moves-p2-structured-quality-sanitizer — Moves P2 Structured Quality Sanitizer

## Release ID

`2026-07-22-moves-p2-structured-quality-sanitizer`

## Status

`released`

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
- PR URL: https://github.com/abarva-platform/abarva/pull/5312
- Merge SHA: `6785d6a3af8122434d2ab924794990f207e7c42c`

## QA / Validation

- `npx jest src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts --runInBand` — pass, 12 tests.
- `npx eslint src/lib/deliverables/client-facing-artifact-sanitize.ts src/lib/deliverables/orchestrator/section-generation.ts src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts` — pass.
- `npm run release:check` — pass.
- `git diff --check` — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` — blocked locally by existing Home optional dependency resolution for `@xyflow/react` and `@dagrejs/dagre`; no Moves patch errors remained after fixing checklist reason typing.
- GitHub PR checks — pass, including CI typecheck, ESLint, release record, production readiness, bundle budget, accessibility, and Chrome/Firefox/Safari smoke.
- ACA runtime invariant — pass on revision `ca-abarva-web-lab-eastus--m6785d6a3`, digest `sha256:9fd10e807b318467a47229f9e7270daa8c9d897846e06ecca3b726bd78079835`, 100% traffic, health OK.
- Signed-in production proof on `app.abarva.ai` — pass on sanctioned sandbox Move `Codex Proof First Capital E2E 20260721`.

## Rollout Plan

Merged through PR #5312, deployed through the repo-owned Azure Container Apps main deploy workflow, ACA runtime invariant verified, and P2 Approve & Build rerun on the sanctioned sandbox Move `Codex Proof First Capital E2E 20260721`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: `sha256:9fd10e807b318467a47229f9e7270daa8c9d897846e06ecca3b726bd78079835`
- ACA runtime invariant: Passed for `ca-abarva-web-lab-eastus--m6785d6a3`, 100% traffic.
- Worker image invariant: N/A unless the deploy workflow changes worker images.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous ACA image through the repo-owned main deploy workflow. Because this changes only output sanitation and render-package assembly, rollback does not require data migration or evidence cleanup.

## Audit Evidence

- Prior live blocker proof: First Capital sandbox P2 generated artifacts blocked after PR #5309 with `non_mechanical_writing` due to phase-owner shorthand and one unsupported client-fact claim.
- ACA Log Analytics showed remaining client-visible terms: `P1 CIO / Operations data owner`, `P2 Compliance / Chief Risk Office`, and `P3 Procurement / Vendor Management`.
- Proof bundle root: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722`
- Runtime invariant proof: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/67-structured-quality-runtime`
- Signed-in click proof: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/67-structured-quality-runtime/67b-p2-click-proof.json`
- Signed-in run polling proof: `/private/tmp/nexus-moves-approval-ux-20260722/proof/firstcapital-e2e-synthetic-20260722/67-structured-quality-runtime/67-run-poll-history.json`
- Generated run `f1fdf668-2c29-4799-8afa-e7cf005d59c6` succeeded as artifact `a0147635-d432-44f7-b3dd-f3c73b494c4e`, 19 retrieved evidence items, 100% evidence coverage, 98% executive readiness, no blockers.
- Generated run `f5dffd07-6cff-48cb-96ef-c6780f61cbaf` succeeded as artifact `8f9ffc30-237e-4c0f-b488-9fe80d8954c2`, 19 retrieved evidence items, 100% evidence coverage, 98% executive readiness, no blockers.

## Known Gaps

- This does not weaken the quality gate.
- This does not claim P2 gate completion; the sandbox Move still requires human review/signoff of the generated deliverables before advancing.
- Both generated P2 deliverables passed the quality gate but remain too long for the target artifact ceiling: 21,096 and 20,641 words against a 13,500-word target. Next quality slice should enforce tighter document-length discipline.
