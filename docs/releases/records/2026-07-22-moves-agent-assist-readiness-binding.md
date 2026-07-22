# 2026-07-22-moves-agent-assist-readiness-binding — Moves Agent Assist Readiness Binding

## Release ID

`2026-07-22-moves-agent-assist-readiness-binding`

## Status

`candidate`

## Plain-English Summary

Moves current-state readiness now resolves the phase evidence checklist from the durable P0/P1 phase-capture answers, not only from the latest generated charter blob. This prevents an Agent Assist Move from drifting into the wrong archetype after P1 generation overwrites the charter summary. The release also adds a banking-specific Commercial Lending Agent Assist archetype so First Capital loan-onboarding Moves ask for lending process, KYC/control, policy, systems, value, and human-approval evidence instead of DORA/CI-CD/ITSM engineering metrics.

## Layer Impact

- `global-control-lane`: Shared Strategic Moves archetype/readiness resolution changes for all tenants using Moves.
- `client-data-lane`: No schema or tenant data mutation. Existing phase-capture and module rows are read as additional resolver input.

## Client Applicability

- All clients: Yes, for Moves readiness binding.
- Specific clients: First Capital / FS Demo benefits immediately for commercial-lending Agent Assist.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses existing Moves surfaces; no new flag introduced.

## Changes Included

- Added `COMMERCIAL_LENDING_AGENT_ASSIST` to the Moves archetype registry.
- Added durable phase-capture based resolver helper: `src/lib/programs/move-archetype-resolution.ts`.
- Updated phase page, current-state readiness, diagnose intake, and current-state deliverable routes to use the shared resolver.
- Added resolver tests proving commercial-lending Agent Assist does not require DORA, CI/CD, ITSM, or engineering SDLC evidence for P2.

## QA / Validation

- Pass: `npx jest --runTestsByPath src/lib/programs/archetypes/__tests__/resolve-program-archetype.test.ts --runInBand` (25/25)
- Pass: `npx eslint` on all changed source/routes/tests.
- Pass: `npm run release:check`
- Pass: `git diff --check`
- Known unrelated blocker: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json` stops on pre-existing Home graph optional dependency resolution for `@xyflow/react` and `@dagrejs/dagre`; no changed-file lint or focused resolver test failures.
- Pending: post-deploy signed-in smoke on `Codex Proof First Capital E2E 20260721`, P2 Review Findings.

## Rollout Plan

Merge to `main`; allow the repo-owned Azure Container Apps deploy workflow to build and deploy the exact merge SHA. Verify the ACA runtime invariant before claiming live. Then run signed-in browser proof against the sandbox First Capital Move.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None outside the repo-owned workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy the previous known-good ACA image. Because this is read-path/archetype-binding only, rollback does not require data migration reversal.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA revision: Pending.
- Signed-in proof: Pending.

## Known Gaps

- Uploaded P2 evidence may still require explicit review/commit mapping before readiness flips to committed/agent-ready.
- This release does not redesign the P2 workflow UI; it corrects the phase intelligence/readiness content contract so the UI asks for the right work.
