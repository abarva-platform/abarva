# 2026-07-17-moves-prepare-context-briefing — Moves Prepare Tab Shows What Nexus Already Knows

## Release ID

`2026-07-17-moves-prepare-context-briefing`

## Status

`candidate`

## Plain-English Summary

A UX audit of Strategic Moves (confirmed by Anand) found that phases feel like "enter inputs → upload files" rather than "Nexus already understands context." Investigation found that `NexusCurrentStateBriefingPanel` — a fully-built executive-read briefing (cited sections, recommended follow-up questions, live Q&A) backed by a real, working API route — existed in the codebase but was never mounted anywhere. This release mounts it at the top of every P2–P5 phase's Prepare tab, above the existing command-center grid, so operators see Nexus's existing enterprise context for the Move before being asked to upload anything.

A second audit item — resurfacing `SessionPlaybookPanel` (facilitator session guides) on the same tab — was investigated and **intentionally not done** in this release: `SessionPlaybookPanel` was removed from this exact location earlier the same day in `62c3b5d96` ("Remove legacy Moves prepare wall", #4962) as a deliberate declutter, and an existing test (`MovesPhaseStandaloneClient.test.tsx`) explicitly asserts it stays absent from Prepare. Re-adding it here would have silently reverted same-day work. See Known Gaps.

## Layer Impact

- `global-control-lane`: `MovesPhaseStandaloneClient.tsx` is the shared Strategic Moves phase workspace for every tenant; this changes shared UI, not tenant data.

## Client Applicability

- All clients: yes — every tenant's Moves P2–P5 Prepare tab now shows the context briefing.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`: import and mount `NexusCurrentStateBriefingPanel` (`@/components/strategic-moves/NexusCurrentStateBriefingPanel`, pre-existing component, pre-existing API route `src/app/api/v1/programs/[programId]/nexus/current-state-brief/route.ts`) inside `PhasePreparePanel`, framed with a "What Nexus already knows" intro section, above the existing command-center grid.

## QA / Validation

- Pass: `npx eslint src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
- Pass: `npx jest src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` (20/20, including the "legacy prepare wall" regression tests — confirms this change does not reintroduce `SessionPlaybookPanel`/`MovePhaseWorkspacePanel`)
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false` (plain `tsc` without the memory flag hits a known pre-existing local Node/V8 SIGABRT unrelated to this change)
- Not run: live signed-in browser proof. Local dev environment has no valid Clerk session (`/sign-in` redirects to the public homepage without real Clerk credentials configured) — could not be exercised end-to-end locally.

## Rollout Plan

Merge to `main`, deploy through the repo-owned ACA main deploy workflow. No data migration, no flag, no worker job — pure client-side UI mount.

## Deployment Authority

- Repo-owned deploy workflow: required (shared web image).
- Shared runtime mutators: none.
- Approved image digest: produced by the ACA main deploy workflow after merge.
- ACA runtime invariant: required after deploy.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: yes — open a real Move's P2–P5 Prepare tab post-deploy and confirm the briefing panel loads real data and the Q&A box works.

## Rollback Plan

Revert this PR and redeploy through the ACA main deploy workflow. No data or schema changes to unwind.

## Audit Evidence

- This PR's diff (10 lines, one file).
- `MovesPhaseStandaloneClient.test.tsx` full pass, including the same-day "legacy prepare wall" regression coverage.
- ACA main deploy run after merge.
- Post-deploy live signed-in proof (pending).

## Known Gaps

- `MOVES-PLAYBOOK-6` (resurfacing rich session/facilitator guides) is **not done** here — it conflicts with the same-day deliberate removal of `SessionPlaybookPanel` from this tab (`62c3b5d96`, #4962). Re-approaching this needs an explicit decision on where facilitator guides should live now that the compact Prepare tab is the intended design (e.g., a dedicated tab/route, not inline in Prepare) rather than simply reverting the declutter.
- `NexusCurrentStateBriefingPanel` shows the current enterprise-context state, not a Move-specific delta ("what this Move added to context" — the second half of the audit's context-visibility ask). No component exists for that yet; it would need new backend work.
- Only wired into P2–P5 (`PhasePreparePanel`). P0 (`P0OriginationHandoff`) and P1 (`PhaseCaptureEditor`/`PostureCards`) use different Prepare components and are out of scope here.
