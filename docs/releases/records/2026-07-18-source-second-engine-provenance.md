# 2026-07-18-source-second-engine-provenance — Source Auto-Assessment Provenance

## Release ID

`2026-07-18-source-second-engine-provenance`

## Status

`candidate`

## Plain-English Summary

Source gate auto-assessment now reuses the same hard-gate evidence provenance checks as the manual gate-readiness path. A hard criterion can no longer be auto-marked met from client-stated evidence that only reaches a sufficient rank; the underlying evidence must be genuinely verified or explicitly promoted to usable evidence.

## Layer Impact

- `global-control-lane`: Updates the Source auto-assessment engine that derives gate display state and writes system-reviewed gate criteria for all clients.
- API/runtime behavior: Threads already-fetched artifact state through the stage-promotion auto-assessment path so persisted auto-met decisions use the same artifact and evidence checks as governance enforcement.
- Tests/release evidence: Adds focused regression coverage for client-stated-only hard criteria, usable evidence, uploaded evidence, and persistence no-write behavior.

## Client Applicability

- All clients: Applies to Source events using canonical gate auto-assessment.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/source-governance-enforcement.ts`: adds a system-caller option to skip the human approval-reason check while preserving artifact and evidence readiness checks.
- `src/lib/source/gate-auto-assessment.ts`: passes artifacts into criterion assessment and cross-checks auto-evidence results with governance readiness before returning `met_auto_evidence`.
- `src/lib/source/gate-auto-assessment-persist.ts`: requires artifacts for persistence-time auto-assessment.
- `src/app/api/v1/source/[eventId]/stage/route.ts`: passes `substrate.artifacts` into auto-assessment persistence after stage promotion.
- `src/components/source/canvas/UniversalCanvasShell.tsx`: passes live stage artifacts into the visible gate assessment.
- Focused Source tests for assessment, persistence, and Gate tab render behavior.

## QA / Validation

- `npx jest src/lib/source/__tests__/gate-auto-assessment.test.ts src/lib/source/__tests__/gate-auto-assessment-persist.test.ts --runInBand`: pass, 16/16.
- `npx eslint src/lib/source/source-governance-enforcement.ts src/lib/source/gate-auto-assessment.ts src/lib/source/gate-auto-assessment-persist.ts 'src/app/api/v1/source/[eventId]/stage/route.ts' src/components/source/canvas/UniversalCanvasShell.tsx src/lib/source/__tests__/gate-auto-assessment.test.ts src/lib/source/__tests__/gate-auto-assessment-persist.test.ts src/__tests__/integration/source/source-canvas-gate-tab.test.tsx`: pass with existing `UniversalCanvasShell.tsx` warnings only.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`: pass.
- `npx jest src/lib/source/__tests__/source-governance-enforcement.test.ts src/lib/source/__tests__/gate-auto-assessment.test.ts src/lib/source/__tests__/gate-auto-assessment-persist.test.ts src/__tests__/integration/source/source-canvas-gate-tab.test.tsx --runInBand`: pass, 39/39.
- `npx jest src/lib/source --runInBand --json --outputFile=/tmp/source-slice2b-candidate-jest.json`: 30 failures, 2,114 passing tests; exact failed-test set matched clean `origin/main`, with four additional candidate passing tests.
- Clean `origin/main` comparison: `npx jest src/lib/source --runInBand --json --outputFile=/tmp/source-slice2b-baseline-jest.json` produced the same 30 failed tests and 2,110 passing tests; JSON comparison showed `sameFailedTests: true`, `onlyBaseline: []`, `onlyCandidate: []`.
- Local signed-in browser crawl attempt: candidate served at `http://localhost:3011`; navigating Chrome to `/source` redirected to `/responsible-ai/acknowledgment`, where the page reported the acknowledgment ledger unavailable and kept `Accept and continue` disabled. Candidate browser acceptance remains blocked by this local environment gate.
- Production signed-in browser crawl on `https://app.abarva.ai/source`: signed in as `Anand Sundaram · FS Demo`; opened non-Lakeshore Source event `dcd31955-e1ac-416b-8c3b-52b83e8650de`, verified the legacy `UniversalCanvasShell` renders with gate checklist, context strip, Evidence tab, export menu, and aVa chat chips. The live Responses preview initially showed `Responses Readiness 0 / 2`, `Artifacts 0 / 3`, `Requirement coverage 0 / 5`, and `Gates 0 / 3`.
- Production live bypass proof: using the signed-in production tab, recorded two client-stated evidence answers through the same `/api/v1/source/:eventId/evidence/:requirementId/answer` endpoint used by the simple-front answer path (`EVID-SRC-RESP-PROPOSALS` and `EVID-SRC-RESP-CLARIFICATIONS`). After reload, production showed `Responses Readiness 2 / 2`, `Artifacts 0 / 3`, `Requirement coverage 2 / 5`, and `Gates 3 / 3`. Because the typed-answer route writes `Available` with `source_artifact_id: null`, this confirms the live Engine B bypass that this candidate fixes; it is production bug proof, not candidate acceptance proof.

## Rollout Plan

Merge to `main` only after Anand approval, then deploy through the repo-owned Azure Container Apps main deploy workflow. No migration, data load, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for shared runtime deployment.
- Shared runtime mutators: Not used by this candidate.
- Approved image digest: Pending deploy workflow output after merge approval.
- ACA runtime invariant: Must be proved after deploy before claiming live.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source signed-in browser crawl must verify auto-assessment no longer clears client-stated-only hard criteria and still clears genuinely-ready evidence.

## Rollback Plan

Revert the merged PR and redeploy through the repo-owned ACA main deploy workflow. No schema rollback is required.

## Audit Evidence

- Candidate branch: `codex/source-slice2b-second-engine-provenance`.
- PR URL: pending.
- Local validation output: lint, typecheck, focused Jest, release check, and directory-wide Source Jest comparison recorded in the PR.
- Signed-in browser proof: production crawl on `app.abarva.ai` confirmed the current live bypass; candidate acceptance proof still requires repeat after merge/deploy.

## Known Gaps

- The duplicate rank tables in Engine A and Engine B remain intentionally deferred.
- Slice 2c, bridging `source_event_facts` into gate readiness, remains out of scope.
- Candidate browser proof remains blocked locally by the Responsible AI acknowledgment ledger unavailable state; production was used to prove the live bypass instead. Repeat the same production crawl after merge/deploy to confirm `Artifacts 0 / 3` no longer coincides with `Gates 3 / 3` for client-stated-only Responses evidence.
