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

## 9. Live-proof results (2026-07-08, post-deploy)

**Deploy:** PR #4587 merged as `c334950cd`; `aca-main-deploy.yml` run [28962009346](https://github.com/abarva-platform/abarva/actions/runs/28962009346) succeeded; ACA runtime invariant confirmed by the workflow itself — template image, active revision image, and worker jobs all on digest `sha256:fbfbf6fa994d0ac56e56c6a1d5d03652121654f4afd470473b9ac1efb2f48eba`.

**Lakeshore — DONE.** Full proof in `proof/moves-cross-tenant-rollout-lakeshore-live-2026-07-08/README.md`:
- Phase workspace v2: checklist with real counts, approved-Inputs-Pack card, confirmed rendering.
- Pattern assembly: clicked "✦ Assemble options" live → Claude returned real assembled options, each labeled (observed "Evidence-backed"), no console errors.
- Orchestrated deliverables: `board-grade-business-case` route rendered live "Business Case Readiness Memo," correctly reporting the evidence gap rather than fabricating a number (honesty discipline held), no console errors.

**SkyHarbor — BLOCKED, not a code issue.** The available browser session is scoped to Lakeshore only; no cross-tenant switcher exists (checked `/strategic-moves` overview and `/setup` → Operations), and no SkyHarbor Clerk credentials were available. The flag change is live in the deployed code (confirmed via the ACA runtime invariant), but SkyHarbor's phase-workspace-v2/pattern-assembly rendering has not been visually/functionally verified. **Action needed:** either share SkyHarbor demo credentials, or have an operator run the equivalent smoke test and drop the proof under `proof/moves-cross-tenant-rollout-skyharbor-live-<timestamp>/`.

**Not tested this pass:** `moves_workforce_economics` and `moves_decision_storytelling` on Lakeshore (enabled but not separately smoke-tested — no known reason to expect an issue, but unverified).

## 10. Live-proof results, part 2 (2026-07-08, SkyHarbor + dormant-flag follow-up)

**SkyHarbor — DONE.** Full proof in `proof/moves-cross-tenant-rollout-skyharbor-live-2026-07-08/README.md` (Move `GLOBAL_NETWORK_AIRLINE-CANARY-2026`, P3, 60%):
- Phase workspace v2: real checklist ("4 of 4 in", "0 of 2 met"), guidance card rendered, no console errors. **Cross-tenant proof complete** — phase_workspace_v2 is now proven on both Lakeshore and SkyHarbor.
- Pattern assembly: clicked "✦ Assemble options" live → real, SkyHarbor-specific evidence-backed options about IROPS command architecture (not overfit to Lakeshore's legal use case), no console errors. **Cross-tenant proof complete.**
- Orchestrated deliverables: re-confirmed healthy (5 existing board-grade deliverables listed at 100/100 quality) — this was SkyHarbor's original proof tenant, so this re-confirms no regression rather than new cross-tenant proof.
- Confirmed tenant isolation: while signed in as SkyHarbor, a direct Lakeshore moveId URL correctly returned "This item is not available for this account."

**Both `moves_phase_workspace_v2` and `moves_pattern_assembly` are now fully cross-tenant proven** (Lakeshore ✅ + SkyHarbor ✅) — candidates for a 3rd-tenant cohort per §8.

**Lakeshore dormant flags — INCONCLUSIVE, honest reason.** Full notes in `proof/moves-lakeshore-dormant-flags-live-2026-07-08/README.md`. `moves_workforce_economics` and `moves_decision_storytelling` both attach to the kernel-derived Costed Business-Case Pack. Lakeshore's `RETAIL-LEGAL-2026` Move (and all 5 of Lakeshore's active Moves, checked) resolves to an **UNBOUND** kernel state ("No curated Domain Function Pack covers this Move's function") — an existing, correct, honest-fallback behavior unrelated to this release. With no kernel deck to attach to, neither flag has anything to visibly render on any current Lakeshore Move. The page loads cleanly with no console errors either way, so nothing broke — but the actual new content (workforce estimate-twice view / decision-storytelling deck) remains functionally unverified. **Open follow-up:** find or create a Move that resolves to a curated Domain Function Pack (any tenant) to complete this proof.

## 11. Updated rollout matrix (post live-proof)

| Capability | Lakeshore | SkyHarbor | Status |
|---|---|---|---|
| Phase workspace v2 | ✅ proven | ✅ proven | Cross-tenant proof COMPLETE |
| Pattern assembly | ✅ proven | ✅ proven | Cross-tenant proof COMPLETE |
| Orchestrated deliverables | ✅ proven | ✅ proven (pre-existing) | Cross-tenant proof COMPLETE |
| Workforce economics | ⚠️ deployed, unverified (kernel-unbound Move) | off | First-proof INCONCLUSIVE — needs a kernel-bound Move |
| Decision storytelling | ⚠️ deployed, unverified (kernel-unbound Move) | off | First-proof INCONCLUSIVE — needs a kernel-bound Move |
| Strict gate approval | optional (off) | optional (off) | Decision still open (§6) |
