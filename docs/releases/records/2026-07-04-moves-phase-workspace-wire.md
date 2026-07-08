# 2026-07-04-moves-phase-workspace-wire — Moves phase-workspace live mount (increment 3)

## Release ID

`2026-07-04-moves-phase-workspace-wire`

## Status

`candidate`

## Plain-English Summary

Turns on (for opted-in tenants) a guidance panel at the top of the Moves phase workspace: "How to complete this phase" and "Sessions and templates for this phase", built from the governed phase-template catalog for whatever phase the move is on. It is mounted behind a feature flag (`moves_phase_workspace_v2`) that is off by default; Lakeshore is opted in so we can prove it live. When the flag is off, the workspace is exactly as it was. Only the two cards backed by real catalog data are shown — the richer cards (options, workstreams, upload mapping) are intentionally not shown live yet, because a real move doesn't carry that data and showing demo data on a live page would be fabrication.

## Layer Impact

- `global-control-lane` (flag-gated): new feature flag + a presentational panel mounted into `StrategicMovePhaseClient`. Additive; no route/data/model change. Runtime behavior changes only for tenants where the flag is on.
- `experimental`: the capability is feature-flagged and off by default (tenant opt-in).

## Client Applicability

- All clients: no — off by default.
- Specific clients: **Lakeshore** (opted in via `includeTenants` for live proof).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_phase_workspace_v2` (policy `tenant`; env allowlist `ABARVA_FEATURE_MOVES_PHASE_WORKSPACE_V2_TENANTS`).

## Changes Included

- `src/lib/features/registry.ts` — new `moves_phase_workspace_v2` flag (tenant; Lakeshore opt-in).
- `src/components/strategic-moves/phase-workspace/MovePhaseWorkspacePanel.tsx` — new presentational panel (numeric phase → catalog).
- `src/components/strategic-moves/phase-workspace/index.ts` — export.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — `useFeature` hook + flag-gated mount in the `workspace` prop.
- `__tests__/phase-workspace.test.tsx` — +3 mount tests.
- Proof: `proof/moves-phase-workspace-wire-2026-07-04/phase-workspace-panel-p2-render.html`.
- No migrations, routes, scripts, or env-var requirements.

## QA / Validation

- Jest 15/15 (`src/components/strategic-moves/phase-workspace`), incl. 3 mount tests.
- esbuild parse of the edited client — exit 0 (JSX balanced; the only build-breaking class given `typescript.ignoreBuildErrors: true`).
- Scoped strict `tsc` (components + lib) — exit 0. ESLint on changed files — exit 0.
- Feature registry test passes. Unrelated `neo4j-gate` test fails identically with changes stashed (pre-existing, env-gated).
- Panel render proof: real component → static HTML, self-checks pass.
- Live signed-in Lakeshore proof: captured post-deploy (see PR / audit evidence).

## Rollout Plan

Merge to `main` (squash). ACA main-deploy auto-deploys the merge commit (digest-pinned via the repo-owned workflow). Flag is on for Lakeshore via the registry, so the panel is live for Lakeshore once the new revision takes 100% traffic; off for everyone else.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto on merge to main). No ad-hoc Azure commands.
- Shared runtime mutators: none by hand.
- Approved image digest: the `main-<sha>` image the workflow builds/pushes for this merge.
- ACA runtime invariant: to be confirmed post-deploy (template image = 100%-traffic revision image = approved digest).
- Worker image invariant: unaffected (no worker change).
- Feature/env flag update path: flag defined in code (`registry.ts`), tenant-scoped; no env mutation of the shared runtime required.
- Live signed-in proof required: **yes** — Lakeshore phase page shows the panel; captured after the new revision is healthy.

## Rollback Plan

Fastest: set `includeTenants: []` on the flag (or remove the Lakeshore entry) and merge — instant off, no data impact. Full: revert the PR. No migration/data/artifact to unwind.

## Audit Evidence

- PR URL: (added on open).
- Tests: jest 15/15 + scoped tsc 0 + eslint 0 + esbuild parse 0.
- Proof: `proof/moves-phase-workspace-wire-2026-07-04/phase-workspace-panel-p2-render.html` + live signed-in screenshot post-deploy.
- Report: `reports/moves-phase-workspace-wire-implementation-2026-07-04.md`.

## Known Gaps

- Only the two catalog-backed cards are live; options/workstream/upload/assessment cards await real data (Pattern Assembly, increment 4).
- Guidance only — no live upload→classify wiring yet.
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy or this change.
