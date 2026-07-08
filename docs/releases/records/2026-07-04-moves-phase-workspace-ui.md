# 2026-07-04-moves-phase-workspace-ui — Moves phase-workspace UI cards (increment 2)

## Release ID

`2026-07-04-moves-phase-workspace-ui`

## Status

`candidate`

## Plain-English Summary

Adds the nine client-facing cards that render the Moves phase workspace — how to complete the phase, the session templates, the current-state assessment map, the recommended solution building blocks (with a clear "not recommended yet" guardrail), the solution options, the upload-mapping summary, the next-phase readiness pack, the block-to-workstream preview, and the client final-review gate. They render the typed layer from increment 1 (PR #4557), driven by the Lakeshore Legal demo fixture, and match the approved Claude Design look. This is increment 2 of the phase-workspace slice: the cards + a standalone preview. They are **not** wired into the live phase page yet — that is increment 3, which needs `main` green first.

## Layer Impact

- `global-control-lane`: new shared presentational module `src/components/strategic-moves/phase-workspace/`. Pure React over the typed layer; no route mounts it, no data fetch, no DB, no model call. No live behavior change until increment 3 gates it into the phase page.

## Client Applicability

- All clients: no — not wired into any live route.
- Specific clients: Lakeshore is the demo fixture subject.
- Internal only: components + preview + proof + report + this record.
- Public/demo only: no.
- Feature flag: none yet; increment 3 will gate the mount behind `moves_phase_workspace_v2` (off).

## Changes Included

- New: `src/components/strategic-moves/phase-workspace/{styles,primitives,cards,PhaseWorkspaceComposition}.tsx`, `index.ts`, `__tests__/phase-workspace.test.tsx`.
- Proof: `proof/moves-phase-workspace-ui-2026-07-04/phase-workspace-lakeshore-render.html`.
- Report: `reports/moves-phase-workspace-ui-implementation-2026-07-04.md`.
- No migrations, routes, scripts, or env changes.

## QA / Validation

- Jest: `npx jest src/components/strategic-moves/phase-workspace` — 12/12 pass (per-card fixture render; client-friendly labels not raw keys; Move-scoped + no-auto-promotion note; guardrails present; full composition renders every card with no dev/schema terms).
- Types: scoped strict `tsc --noEmit` (`jsx: react-jsx`) over components + lib — exit 0.
- Lint: ESLint on the new dir — exit 0.
- Server-render proof: real components + real fixture → static HTML (9 content self-checks pass), served over HTTP and screenshotted in-browser across the full scroll — all nine cards confirmed visually, every governance cue visible.
- Full-project build NOT run: `main` is red from an unrelated feature merge; the module is self-contained (relative imports only), so it is unaffected. Verification was server-render + browser screenshot, not the running Next app.

## Rollout Plan

Merge to `main` via PR (squash). No runtime rollout — no route, migration, image, or flag change. User-visible only after increment 3 wires the mount behind a flag.

## Deployment Authority

- Repo-owned deploy workflow: not triggered — no runtime image or traffic change.
- Shared runtime mutators: none.
- Approved image digest: n/a (no deploy).
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: n/a this increment; increment 3 mount to be gated by `moves_phase_workspace_v2` (off by default).
- Live signed-in proof required: not for this increment (no live surface). Required before increment 3 is claimed live — and increment 3 requires `main` green first.

## Rollback Plan

Revert the PR. No migration, no data write, no deployed artifact — revert is complete and safe.

## Audit Evidence

- PR URL: (to be added on open).
- Tests: jest 12/12 + scoped tsc exit 0 + ESLint exit 0 (see QA / Validation).
- Proof: `proof/moves-phase-workspace-ui-2026-07-04/phase-workspace-lakeshore-render.html`.
- Report: `reports/moves-phase-workspace-ui-implementation-2026-07-04.md`.
- Design reference: `Moves Phase Workspace · standalone (1).html` (Claude Design).

## Known Gaps

- Not wired into the live phase page (increment 3, needs `main` green).
- Presentational only — the gate button and template rows are styled, not interactive; upload→classify and template download are increment 3.
- Verified via server-render + browser screenshot, not the running Next app.
