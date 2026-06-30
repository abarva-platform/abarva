# 2026-06-30-source-p0-demo-cleanup — Source P0 Demo Cleanup

## Release ID

`2026-06-30-source-p0-demo-cleanup`

## Status

`candidate`

## Plain-English Summary

This release starts the Source P0 hardening pass by making the main Source demo path read as one aVa-guided sourcing experience instead of exposing older internal agent names. It also adds a demo-safe Source capability map that positions Source as technology sourcing intelligence, governed execution, and value proof while clearly separating live workflow capabilities from coming-next contract/spend intelligence.

## Layer Impact

- `global-control-lane`: Source user interface copy, navigation, and demo explanation change for all clients using the shared Source surface.
- `public-demo`: The new Source capability map is designed for demo/storytelling use and avoids overclaiming unavailable contract/spend intelligence.

## Client Applicability

- All clients: Shared Source navigation, intake, portfolio, event-canvas document/evidence labels.
- Specific clients: None.
- Internal only: None.
- Public/demo only: Capability map copy is demo-safe but lives inside authenticated Source.
- Feature flag: None.

## Changes Included

- Added `/source/capabilities`.
- Added `Capabilities` to Source sub-navigation.
- Replaced visible Source demo-path references to older internal agent names with aVa/Source language in intake, portfolio, event advisor error text, artifact generation labels, and evidence readiness labels.
- Replaced database/operator wording in empty artifact and editor helper text with business-facing copy.
- Added regression coverage confirming `d02_value_target` is available as a non-blocking Strategy-stage generation option alongside the existing strategy memo, scope memo, and RFP package path.

## QA / Validation

- `npx jest tests/unit/source-subnav-active-state.test.ts --runInBand` — passed, 15 tests.
- `npx jest src/lib/source/canvas-substrate/__tests__/scaffold.test.ts --runInBand` — passed, 15 tests; confirms scaffold behavior remains intact.
- `npx jest src/lib/source/__tests__/agent-generation-prompt-registry.test.ts --runInBand` — passed, 2 tests.
- `npx eslint src/components/source/SourceSubNav.tsx 'src/app/(maestro)/source/events/page.tsx' 'src/app/(maestro)/source/capabilities/page.tsx' src/components/source/SourceEventsPortfolio.tsx src/components/source/SourceEventsAgentDockView.tsx src/components/source/SourceOriginatePage.tsx src/components/source/canvas/workspace-tabs/DocumentTab.tsx src/components/source/canvas/workspace-tabs/EvidenceTab.tsx tests/unit/source-subnav-active-state.test.ts` — passed.
- `npx eslint src/lib/source/agent-generation/prompt-registry.ts src/lib/source/__tests__/agent-generation-prompt-registry.test.ts` — passed.
- `node scripts/release-check.mjs --base origin/main --head HEAD` — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — baseline dependency/type-package failures remain outside this release (`js-yaml`, Azure Document Intelligence, axe Playwright); no Source P0 stale-file regression remained after restoring current-main Source internals.

## Rollout Plan

Merge through the approved main branch path and deploy `app.abarva.ai` via the Azure Container Apps runbook. After deploy, run signed-in Source smoke on `/source/queue`, `/source/new`, `/source/capabilities`, and a Source event canvas.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow / Azure Container Apps runbook for `app.abarva.ai`.
- Shared runtime mutators: None outside the normal web image deployment.
- Approved image digest: Pending until merge/deploy.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` remains the authoritative runtime for `app.abarva.ai`; no Vercel production deploy is authorized or used as proof.
- Worker image invariant: No worker/job image change is included in this release.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes — Source golden path must be verified after ACA deploy with a signed-in tenant session.

## Rollback Plan

Revert the Source UI/capability-map commit and redeploy the previous ACA image. No schema or data migration is included.

## Audit Evidence

- PR URL: pending
- CI run: pending
- Browser screenshots: pending
- Local command output: focused Jest, ESLint, and release-check passed in the clean branch; TypeScript baseline dependency gaps recorded above.

## Context Ingestion Evidence

Not applicable. This release does not change ingestion, parsing, Blob staging, corpus loading, embeddings, or retrieval.

## Known Gaps

- This is the first P0 cleanup slice, not the complete Source P0 mission.
- Internal file/function names and hidden runtime routes may still use older legacy names even though the touched visible Source path is cleaned.
- Claude generation already includes `d02_value_target` plus the current Strategy/Scope/RFP path; the broader 12-artifact P0 generation target remains open.
- Live browser proof has not been run in this candidate pass yet.
