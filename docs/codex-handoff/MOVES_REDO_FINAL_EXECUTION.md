# Codex — Final Execution (autonomous, authorized to main + deploy)

You are AUTHORIZED to commit to `main` and deploy via the ACA `aca-main-deploy` workflow. Run this
end to end, autonomously. Do NOT come back to ask. Only stop if genuinely blocked — then state the
exact blocker, what you tried, and what you need.

Base off current `main` (PRs #3892/#3893 are merged + deployed; prod image `sha256:b18da663…`,
revision `ca-abarva-web-lab-eastus--md4c79699`). Read `docs/codex-handoff/MOVES_REDO_MASTER_HANDOVER.md`
for the slices/muscles/`generateArtifact`. The redo is live and P0 on the Meridian move
`2dbed99d-cca5-4f80-978a-c1175cc1714f` already passes the golden bar.

## 1. Tenant-binding hardening (do first — make the binding deterministic)
In `src/lib/auth/access-routing.ts`, `inferClientKeyFromEmail` recognizes human patterns
(`@<tenant>.example.com`, `+<tenant>@abarva.com`) but NOT the agent roster
(`<clientKey>-agent@abarva.example.com`). Today the agent tenant binding rests solely on Clerk
`publicMetadata.clientId`; if that's ever unset it falls to DEFAULT `apexretail`. Fix: map the
`AGENT_CLIENT_LOGINS` roster in `inferClientKeyFromEmail` so `meridian-agent@abarva.example.com` →
`meridian` even with no Clerk metadata. Add a unit test: each `<clientKey>-agent@…` → its `clientKey`;
a non-roster email → null/default. Keep it shared/universal (all agents), no per-tenant code.

## 2. Make-or-break tenant check (prove it)
After deploy: a **new** `meridian-agent` signed-in session creates a NEW Move and it resolves to
clientKey `meridian` (NOT apexretail/lakeshore), with `canCreatePrograms: true`. Record the move id +
the resolved clientKey as evidence. If it resolves wrong, §1 is the fix.

## 3. Complete the live P0→P5 run on Meridian (Slice 7)
On move `2dbed99d…`: P0 is done. Complete **P1 capture + approve the gate** (the gate correctly blocks
P1 today — feed it the capture + approval), then advance **P2 → P3 → P4 → P5**, generating each
deliverable through the live pipeline. At **P3, hold the golden bar hardest** — the Target Architecture
must hit the flashy bar (conceptual/logical/physical diagrams + native/non-native pattern + data flow,
real inline SVG, no `[DATA GAP]`), measured by `meetsGoldenBar` against `docs/build/golden-artifacts/*`.

## QA gate EVERY step (no exceptions)
`tsc` clean · `jest` green · touched-file eslint · the Moves E2E click-through · **golden bar** ·
second-tenant smoke (SkyHarbor) · `release:check` + release record · `audit:control-plane-purity:check`
· merge to `main` · `aca-main-deploy` · **live verify on app.abarva.ai**. A step is done only when its
live check is green and (for client-facing artifacts) the artifact meets the golden bar.

## Rules
Shared/universal — keyed by deliverable type + phase, never per-tenant, no per-client forks. Visual-first
by default. `[MISSING]` context is a blocking input, never invented. Never reject for length. Honest
reporting: never mark client-ready / complete what isn't; if an artifact is blocked, say why per
artifact. Squash-merge; rerun deploy on ACR ConnectionReset.

## Definition of done
Tenant binding deterministic + proven (a new meridian-agent Move resolves to `meridian`); the full
P0→P5 Meridian run generated, gated, and each client-facing artifact passing the golden bar (P3
architecture visually at the bar); merged to main and deployed; report per phase with move/version ids,
golden-bar results, and the resolved clientKey.
