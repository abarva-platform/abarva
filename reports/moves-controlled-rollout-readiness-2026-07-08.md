# Moves Controlled-Rollout Readiness — 2026-07-08

## Objective

Moves is built end-to-end (data layer → P0–P5 workflow → gates → deliverables → agent chat). The open question is no longer "does it work," it's "how do we move it from single-tenant proof to controlled rollout without breaking tenant isolation, approval governance, or product quality." This report inventories every Moves feature flag, confirms proof tenants, cross-proves the two advanced capability pairs, enrolls the two dormant flags in first-proof mode, and lays out the rollout ladder plus what's still open.

## 1. Flag inventory (before this release)

| Flag | Policy | Enabled tenants (pre-change) |
|---|---|---|
| `moves_phase_workspace_v2` | tenant | lakeshore |
| `moves_pattern_assembly` | tenant | lakeshore |
| `moves_orchestrated_deliverables` | tenant | skyharbor |
| `moves_workforce_economics` | tenant | *(none — dormant)* |
| `moves_decision_storytelling` | tenant | *(none — dormant)* |

No `moves_*` flag has `platform` policy. Nothing is default-on.

## 2. Confirmed proof tenants (before this release)

- **Lakeshore** proves: phase workspace v2, Claude pattern assembly.
- **SkyHarbor** proves: orchestrated (Claude multi-pass) board-grade deliverables.
- **Dormant** (built, tested, zero tenants): workforce economics estimate-twice view, decision-storytelling exhibit-led deck.

## 3. Rollout matrix (after this release)

| Capability | Lakeshore | SkyHarbor | Next cohort | Default-on? |
|---|---|---|---|---|
| Phase workspace v2 | ✅ (proven) | ✅ (cross-proof, this release) | evaluate after SkyHarbor smoke-proof | no |
| Pattern assembly | ✅ (proven) | ✅ (cross-proof, this release) | evaluate after SkyHarbor smoke-proof | no |
| Orchestrated deliverables | ✅ (cross-proof, this release) | ✅ (proven) | evaluate after Lakeshore smoke-proof | no |
| Workforce economics | ✅ (first proof, this release) | off | pick 2nd tenant after Lakeshore proof holds | no |
| Decision storytelling | ✅ (first proof, this release) | off | pick 2nd tenant after Lakeshore proof holds | no |
| Strict gate approval | optional (off) | optional (off) | **decision needed** — see §6 | no |

## 4. Changes made this release

Edited `src/lib/features/registry.ts` `includeTenants` allowlists only — no code path, schema, or route changes:

1. `moves_phase_workspace_v2`: `["lakeshore"]` → `["lakeshore", "skyharbor"]`
2. `moves_pattern_assembly`: `["lakeshore"]` → `["lakeshore", "skyharbor"]`
3. `moves_orchestrated_deliverables`: `["skyharbor"]` → `["skyharbor", "lakeshore"]`
4. `moves_workforce_economics`: `[]` → `["lakeshore"]`
5. `moves_decision_storytelling`: `[]` → `["lakeshore"]`

## 5. Smoke-test acceptance criteria (both tenants, post-deploy)

- Page loads (no client-side crash).
- No console errors.
- No network 5xxs.
- Phase workflow (checklist, gate state, feed-forward) intact and unchanged for flags not being tested.
- Deliverable generation succeeds OR falls back cleanly to the deterministic deck (never a hard failure).
- No internal IDs, schema/table names, or engine-internal language leak into rendered UI.
- Tenant data isolation confirmed (SkyHarbor session never sees Lakeshore move data or vice versa).

Results are recorded live, signed-in, per tenant, under `proof/` — see the release record's Audit Evidence section for links once captured.

## 6. Open governance decision: gate-approval strictness

Self-approve (any authenticated tenant user can advance their own phase gate) is the current default everywhere, including both proof tenants. `GATE_APPROVAL_STRICT_MODE` exists and restricts approval to sponsor/approver roles, but it is opt-in, not default, and this release does **not** flip it.

Recommendation carried into this report per the user's stated posture: before any client-production tenant goes live on Moves, decide whether strict mode should be the default for that tenant class:

| Environment / tenant type | Recommended gate mode |
|---|---|
| Demo / lab / synthetic | self-approve allowed |
| Pilot tenant | configurable |
| Client production | strict mode default |

This is deliberately left as a decision to make, not a flag flipped in this release — Moves is a transformation-governance product, and changing who can approve gates is a governance call, not a rollout-mechanics call.

## 7. What this release deliberately does NOT do

- Does not enable any flag platform-wide or default-on.
- Does not enable any flag for a third tenant/cohort — only the two proof tenants, per flag.
- Does not touch strict gate-approval mode.
- Does not add new Moves features — this is rollout-ladder work only.

## 8. Next steps after this release's live-proof lands

1. If SkyHarbor smoke-proof for phase-workspace-v2/pattern-assembly is clean → both flags are cross-tenant proven; candidate for a 3rd-tenant cohort.
2. If Lakeshore smoke-proof for orchestrated-deliverables is clean → cross-tenant proven; candidate for a 3rd-tenant cohort.
3. If Lakeshore first-proof for workforce-economics/decision-storytelling is clean → pick a 2nd proof tenant next.
4. Bring the gate-approval-strictness decision (§6) back to the product owner before any client-production tenant onboarding.
