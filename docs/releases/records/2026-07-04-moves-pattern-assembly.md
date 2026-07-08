# 2026-07-04-moves-pattern-assembly — Governed Claude Pattern Assembly (increment 12)

## Release ID

`2026-07-04-moves-pattern-assembly`

## Status

`candidate`

## Plain-English Summary

Adds an **"Assemble options"** action to the Moves phase workspace: AbarVa builds a governed packet from the Move's own data, **Claude** assembles candidate solution options / tradeoffs / risks through the **audited AI egress path**, and **AbarVa validates** each item — labeling it evidence-backed, an assumption, needs-confirmation, or not-recommended. **Claude never invents baselines, value, evidence, readiness, or approvals**: the system prompt forbids it, and the validator labels any unbacked number `needs_confirmation` and any overreach `not_allowed`. On any error the route returns no items and the deterministic feed-forward stands. Behind a new flag `moves_pattern_assembly` (requires `moves_phase_workspace_v2` + `ANTHROPIC_API_KEY`; Lakeshore on).

## Layer Impact

- `global-control-lane` (flag-gated): the presentational validated-output card + the panel affordance.
- `client-data-lane` / audited AI egress: new route `POST /api/programs/workspace/[moveId]/assemble-pattern` calls Claude via `preflightAnthropicDirectClient` (tenant AI-policy gate + Supabase audit) → `messages.create` (non-streaming) → parse → `validateAssembledResponse`. Anthropic-only; no OpenAI.
- `experimental`: gated by `moves_pattern_assembly` (off by default).

## Client Applicability

- All clients: no — off by default. Specific clients: **Lakeshore** (flag opt-in). Feature flag: `moves_pattern_assembly` (+ `moves_phase_workspace_v2`).

## Changes Included

- `src/lib/features/registry.ts` — `moves_pattern_assembly` flag.
- `src/app/api/programs/workspace/[moveId]/assemble-pattern/route.ts` — governed Claude call + validation; server owns `moveId`; deterministic-fallback on any failure.
- `src/components/strategic-moves/phase-workspace/AssembledPatternCard.tsx` — renders the validated items with client-friendly labels + the no-invention note.
- `StrategicMovePhaseClient.tsx` — builds the packet from real signals (conservative readiness defaults — bias to caution, never fabricate optimism), POSTs on "Assemble", renders. `MovePhaseWorkspacePanel.tsx` — the affordance + card.
- Reuses increment-1 `buildPatternAssemblyPacket` + `validateAssembledResponse`. Tests + proof.
- No migrations.

## QA / Validation

- Jest 88/88 — **pass** (card renders each label client-friendly + the "never invented" note + no raw-enum leak; empty → renders nothing; panel shows the assemble control only when the handler is present; panel renders validated output). Increment-1 validator tests still green (overreach → `not_allowed`, unbacked number → `needs_confirmation`).
- esbuild parse of client + route — **pass** (exit 0). Scoped strict `tsc` — **pass** (exit 0). ESLint — **pass** (exit 0).
- Governed egress: mirrors `/api/programs/synthesis` (`preflightAnthropicDirectClient` → `messages.create`); Anthropic-only per policy.
- **Live signed-in Lakeshore proof** — **run post-deploy** (click "Assemble options" → real Claude call via audited egress → validated, labeled items render).
- Full-project `tsc --noEmit` — **not run** (red from an unrelated merge; doesn't block build/deploy given `ignoreBuildErrors: true`).

## Rollout Plan

Squash-merge → ACA main-deploy auto-deploys → live for Lakeshore (flag on). No migration. Same phase-workspace flag family.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (auto on merge). No ad-hoc Azure commands.
- AI egress: uses the existing audited path (`ANTHROPIC_API_KEY`, tenant AI policy, Supabase audit sink) — no new egress mechanism.
- ACA runtime invariant / worker invariant: confirmed by the feature rendering + a real Claude call succeeding live on `app.abarva.ai`.
- Feature/env flag update path: code-defined flag; requires `ANTHROPIC_API_KEY` (already present in prod).
- Live signed-in proof required: yes — a real assembled+validated result on the Lakeshore phase page, post-deploy.

## Rollback Plan

Set the flag `includeTenants: []` (instant off) or revert the PR. No data written; no schema.

## Audit Evidence

- PR URL: (added on open). Tests: jest 88/88 + scoped tsc 0 + eslint 0 + esbuild parse 0.
- Every Claude call is audited by the egress path (prompt/response SHA256, tenant, workflow `moves-pattern-assembly`, data class `confidential`).

## Known Gaps

- **No-invention is enforced at two layers** (prompt + validator); a determined model could still phrase an unbacked claim qualitatively — those surface as `assumption`/`needs_confirmation`, never as fact. Persisting assembled items (as an approved artifact) reuses increment 10 and is a follow-on.
- The packet's control/evaluation readiness use conservative defaults (bias toward blocking) where the Move lacks a per-dimension score — never fabricated optimism.
- Full-project `tsc --noEmit` red from an unrelated merge; does not block build/deploy.
