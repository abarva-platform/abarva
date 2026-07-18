# 2026-07-18-moves-phase-intelligence-tab — Moves Phase Intelligence Tab

## Release ID

`2026-07-18-moves-phase-intelligence-tab`

## Status

`candidate`

## Plain-English Summary

Adds a read-only Phase Intelligence workspace tab to Moves. The tab gives the team a short, executive-readable synthesis for the current phase: one key design decision, one curated Function Pack strategic signal, and one gate/evidence truth line. It does not generate new claims, change gate pass/fail logic, or call a model; it summarizes already-governed state.

## Layer Impact

- `global-control-lane`: adds shared Moves UI behavior and a read-only authenticated Moves API route.
- Moves workspace UI: adds `Phase Intelligence` beside Files & Evidence and Session Playbook, without changing the default phase workflow.
- Moves synthesis/read path: adds `buildPhaseIntelligenceSummary`, which composes existing KDD, Function Pack, gate, and evidence readiness state.

## Client Applicability

- All clients: Yes, any tenant using the standalone Moves phase workspace.
- Specific clients: Meridian / Healthcare Demo benefits from the Agent Assist Function Pack signal when the Move resolves to `member_service_agent_assist`.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/programs/phase-intelligence-summary.ts`
- `src/app/api/v1/programs/[programId]/phase-intelligence/route.ts`
- `src/components/strategic-moves/PhaseIntelligencePanel.tsx`
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- `src/lib/programs/__tests__/phase-intelligence-summary.test.ts`
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`

## QA / Validation

- Pass: `npx eslint src/lib/programs/phase-intelligence-summary.ts 'src/app/api/v1/programs/[programId]/phase-intelligence/route.ts' src/components/strategic-moves/PhaseIntelligencePanel.tsx src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx src/lib/programs/__tests__/phase-intelligence-summary.test.ts`
- Pass: `npx jest src/lib/programs/__tests__/phase-intelligence-summary.test.ts --runInBand`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `git diff --check`
- Not run yet: signed-in browser review before merge because this is a new visible Moves surface.
- Blocked by pre-existing failures: `npx jest src/lib/programs --runInBand` still fails on clean `origin/main` for orchestrated business-case quality, current-state ingest quarantine, IT sourcing answer casing, tenant display-name resolution, and industry-profile coverage. The failing files were rerun with this slice stashed and failed identically.
- Pass: `npm run release:check`

## Rollout Plan

Open a PR against `main` and hold for Anand review. After approval and merge, the repo-owned Azure Container Apps main deploy workflow builds and deploys the merged SHA to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Pending post-merge deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker-image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the ACA main deploy workflow. This release has no migration and writes no new data.

## Audit Evidence

Pending:

- PR URL
- Local validation output
- GitHub CI
- Signed-in browser screenshots for the Phase Intelligence tab
- ACA deploy proof after merge, if approved

## Known Gaps

- This release does not add more KDD authoring UI beyond the existing Slice 2 action.
- This release does not change gate-blocking approval logic.
- This release does not generate new LLM insights or claim realized value.
