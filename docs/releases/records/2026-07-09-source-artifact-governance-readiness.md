# 2026-07-09-source-artifact-governance-readiness — Source Artifact Readiness Governance

## Release ID

`2026-07-09-source-artifact-governance-readiness`

## Status

`candidate`

## Plain-English Summary

Source generated artifacts now get a deterministic readiness verdict before they can be treated as ready or vendor-facing. AbarVa can still save a failed draft for client review, but the system records why it needs review, blocks unsafe export paths, and lets the Source canvas and aVa answer readiness questions from the same persisted artifact state.

## Layer Impact

- `global-control-lane`: Adds shared Source artifact-readiness enforcement, UI state, and aVa grounding behavior for all Source events.
- `client-data-lane`: Reads existing `source_event_artifact_states.body_generation_metadata` and writes a new deterministic governance receipt into that metadata on generation. No schema migration is included.

## Client Applicability

- All clients: Source artifact generation, export, Source analytics gate display, and Source aVa readiness answers.
- Specific clients: Not client-specific.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Source analytics UI and Source aVa grounding remain behind the existing `source_analytics` runtime path where applicable; generation/export enforcement is shared Source control behavior.

## Changes Included

- `src/lib/source/source-governance-enforcement.ts`: Adds deterministic artifact readiness, cross-artifact money consistency, raw citation/internal marker linting, required RFP risk register, scorecard weight, and unsupported SLA fact checks.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`: Persists deterministic governance metadata and marks blocked generated drafts as `needs_review`.
- `src/lib/source/exports/payloads/narrative-docx-payload.ts`: Blocks narrative artifact export when persisted readiness is not safe.
- `src/lib/source/agent-generation/client-facing-hygiene.ts`: Removes internal UUIDs and converts real-looking raw spreadsheet filenames to client-facing exhibit references before readiness lint runs.
- `src/components/source/canvas/analytics/*`: Adds persisted artifact quality state to the gate-generated deliverables panel.
- `src/lib/source/ava/*`: Adds `artifact_quality` answer mode so aVa answers “is the RFP ready?” from artifact-state metadata.
- Tests added/updated for governance, export, aVa classification/grounding, and Source analytics UI.

## QA / Validation

- Pass: `npx jest src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts src/lib/source/__tests__/source-governance-enforcement.test.ts src/lib/source/__tests__/source-artifact-readiness-governance.test.ts src/lib/source/ava/__tests__/answer-mode.test.ts src/lib/source/ava/__tests__/mode-grounding.test.ts src/components/source/canvas/analytics/__tests__/ScopeGate.artifact-quality.test.tsx src/lib/source/exports/__tests__/narrative-export-quality-gate.test.ts --runInBand`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit`
- Pass: `npx eslint src/lib/source/source-governance-enforcement.ts src/lib/source/agent-generation/types.ts src/lib/source/agent-generation/client-facing-hygiene.ts 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts' 'src/app/(maestro)/source/events/[eventId]/page.tsx' src/components/source/canvas/analytics/ScopeGate.tsx src/components/source/canvas/analytics/view-model.ts src/components/source/canvas/analytics/index.ts src/lib/source/exports/payloads/narrative-docx-payload.ts src/lib/source/ava/answer-mode.ts src/lib/source/ava/mode-grounding.ts src/lib/source/agent-generation/__tests__/client-facing-hygiene.test.ts src/lib/source/__tests__/source-governance-enforcement.test.ts src/lib/source/__tests__/source-artifact-readiness-governance.test.ts src/components/source/canvas/analytics/__tests__/ScopeGate.artifact-quality.test.tsx src/lib/source/ava/__tests__/answer-mode.test.ts src/lib/source/ava/__tests__/mode-grounding.test.ts src/lib/source/exports/__tests__/narrative-export-quality-gate.test.ts`
- Note: Jest reports pre-existing duplicate manual mock warnings for markdown/GFM mocks; the focused suites pass.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the shared web image. After deploy, run the signed-in Lakeshore Source AMS proof against `app.abarva.ai` and verify d01/d05/d09 readiness, aVa readiness answers, and blocked/marked export behavior.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Do not mutate shared ACA runtime directly from a branch.
- Approved image digest: To be captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed by this release.
- Feature/env flag update path: No new flag or env var.
- Live signed-in proof required: Yes, for the Lakeshore AMS event after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No database rollback is required because metadata additions are additive JSON fields; existing artifact bodies remain intact.

## Audit Evidence

- PR URL: Pending.
- Focused Jest output: local pass in `/tmp/nexus-source-artifact-governance`.
- TypeScript output: local pass with `NODE_OPTIONS='--max-old-space-size=8192'`.
- ESLint output: local pass on touched files.
- Live proof: Pending deployment.

## Known Gaps

- Live signed-in proof on `app.abarva.ai` is pending.
- This slice does not implement a full document parser or new schema migration.
- This slice does not make generated drafts final; it enforces that failed or unsafe drafts remain review-only.
