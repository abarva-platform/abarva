# 2026-07-18-source-requirement-satisfaction-strip — Source Requirement Coverage Strip

## Release ID

`2026-07-18-source-requirement-satisfaction-strip`

## Status

`released` — merged, deployed, and live signed-in proof confirmed 2026-07-18.

## Plain-English Summary

The legacy Source event canvas now shows how much of the current stage's canonical artifact and evidence requirement set is covered by existing canvas state. The signal is computed from data already loaded into the canvas and does not add a new server call, route, or prop contract.

## Layer Impact

Application UI: adds a context-strip requirement counter to the legacy Source canvas.

Source governance/read model: reuses the canonical Source stage artifact and evidence requirement registry already present in the client bundle.

Release lane: `global-control-lane`, because the legacy Source canvas is shared behavior for clients who reach this route.

## Client Applicability

All clients: applies to Source events rendered through the legacy canvas.

Specific clients: none.

Internal only: no.

Public/demo only: no.

Feature flag: existing route/canvas flags decide whether a user reaches this canvas; this change does not add a new flag.

## Changes Included

- `src/components/source/canvas/UniversalCanvasShell.tsx`: renders `Requirement coverage {met} / {required}` from existing artifact and evidence state props.
- `src/lib/source/requirement-coverage.ts`: computes canonical requirement coverage without double-counting duplicate matching rows.
- `src/lib/source/__tests__/requirement-coverage.test.ts`: covers no-requirement, missing-state, unrelated-evidence, qualifying-state, duplicate-row, and upload-only minimum-state semantics.
- `src/__tests__/integration/source/source-event-canvas-render.test.tsx`: extends the Source canvas render test to cover the rendered context-bundle signal.

## QA / Validation

- Pass: `npx eslint src/components/source/canvas/UniversalCanvasShell.tsx src/lib/source/requirement-coverage.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx src/lib/source/__tests__/requirement-coverage.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pass: `npx jest src/lib/source/__tests__/requirement-coverage.test.ts src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand --testNamePattern="requirement coverage|context bundle reflects artifact \\+ criterion \\+ evidence counts"`
- Blocked (local only): local signed-in browser proof for Source canvas could not run — Clerk ticket sign-in succeeded for `cto@skyharbor-air.example.com` and `cfo@lakeshore-holdings.example.com`, but both sessions were routed to `/responsible-ai/acknowledgment` with `The acknowledgment ledger is unavailable`; the local runtime logged Azure Postgres DNS failure for `pg-abarva-context-lab-001.postgres.database.azure.com`. This is a known, standing local-environment limitation (private VNet Postgres unreachable from localhost), not specific to this change.
- **Pass — production live signed-in proof, 2026-07-18**: Anand signed in as `Anand Sundaram · FS Demo` on `app.abarva.ai`, created and self-approved a real Source event (`ARCT-AMS-2026-E9DFC651`), and reached the working canvas at Stage 2 (Scope). The context strip renders `Requirement coverage 0 / 8` — a real, canonical-spec-derived count, correctly showing an honest zero state (no evidence yet loaded for this stage) rather than a fabricated or missing value. Confirmed alongside the other context-strip signals (`Readiness 0/4`, `Artifacts 0/5`, `Evidence 4 sources`, `Gates 0/5`), all rendering coherently on the same page. Screenshot in this session's transcript.

## Rollout Plan

Merged to `main` and deployed through the repo-owned Azure Container Apps main deploy workflow. No migration, data load, or manual operator job was required.

## Deployment Authority

Repo-owned deploy workflow: used.

Shared runtime mutators: none.

Approved image digest: `sha256:60354d42ffe880fb7156308813c4525661756009add8d361498d1f1ec8d47095` (this digest also includes the later `2026-07-18-source-intake-self-approval-bypass` release, merged on top).

ACA runtime invariant: confirmed — `ca-abarva-web-lab-eastus--m782bbed4` is the active revision at 100% traffic, running the approved digest above.

Worker image invariant: no worker impact expected.

Feature/env flag update path: none.

Live signed-in proof required: yes — **done**, see QA/Validation above.

## Rollback Plan

Revert the Source canvas UI/test changes and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- PR diff, this release record, and the focused helper/render test output.
- Production live signed-in proof: `ARCT-AMS-2026-E9DFC651` on FS Demo, `Requirement coverage 0 / 8` rendering correctly in the context strip, 2026-07-18.
- ACA main deploy run (`aca-main-deploy.yml`, headSha `b3577b0575898ee13e731dd0aacde44f4eae6151`) — completed, success.

## Known Gaps

Local signed-in browser proof remains blocked by local Azure Postgres reachability (private VNet, unreachable from localhost) — a standing environment limitation, not a defect in this change. Production live proof is complete and is the authoritative verification for this release.
