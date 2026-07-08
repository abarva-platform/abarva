# Moves cross-tenant rollout — Lakeshore live proof (2026-07-08)

Signed-in browser proof, tenant Lakeshore Holdings, Move `RETAIL-LEGAL-2026` (id `908c9bf8-e745-45dc-9ad8-3d493a2a1c8a`), captured after PR #4587 (commit `c334950cd`) deployed and the ACA runtime invariant was confirmed (template image, active revision image, and worker jobs all on digest `sha256:fbfbf6fa994d0ac56e56c6a1d5d03652121654f4afd470473b9ac1efb2f48eba`).

## 1. Phase workspace + pattern assembly (moves_phase_workspace_v2, moves_pattern_assembly)

URL: `https://app.abarva.ai/strategic-moves/908c9bf8-e745-45dc-9ad8-3d493a2a1c8a/phase/2`

- Confirmed the catalog-driven "What to do next" checklist (real counts: "2 of 4 in", "2 of 5 met", locked "Attest and advance").
- Confirmed the "You're starting from an approved Inputs Pack" card (feed-forward from P1).
- Scrolled to the "Let AbarVa assemble solution options" card and clicked "✦ Assemble options."
- Result: governed Claude pattern assembly returned real, validated candidate items, each labeled (observed: "Evidence-backed" on the visible items) — e.g. "Establish a centralized contract obligation register to capture and track all vendor commitments, SLA terms, and renewal triggers from existing process and systems landscape documentation" and "Implement a phased control uplift approach: prioritize medium-low control maturity areas first, deferring high-control decisions to human-approved workflows, to respect current readiness constraints."
- No console errors observed (`read_console_messages`, pattern `error|Error|exception`, onlyErrors=true — clean).
- Screenshot IDs captured in-session: `ss_5628bgd7k` (pre-click, card visible), `ss_4059u3f5c` / `ss_1694i673x` (post-click, assembled + labeled options visible).

## 2. Orchestrated deliverable path (moves_orchestrated_deliverables)

URL: `https://app.abarva.ai/api/v1/moves/board-grade-business-case?moveId=908c9bf8-e745-45dc-9ad8-3d493a2a1c8a`

- Route rendered live: "Business Case Readiness Memo — Legal and Vendor Contract Obligation Control" (Lakeshore Holdings · Board-Grade Deliverable).
- Content is honest, not fabricated: explicit "Recommendation: Conditional SHAPE... the governed evidence base does not yet contain the baseline, cost, value, or timeline inputs required to assert a fundable ROI position" — i.e. the gate/fallback discipline held (this Move's evidence is genuinely thin at P2, so the deliverable correctly reports gaps rather than inventing numbers).
- No console errors observed.
- Screenshot ID: `ss_8962u7ruf`.
- Not captured via automation: the `x-deliverable-engine` response header (network-request inspection on this document-level navigation timed out repeatedly in the browser tool; this is a tooling limitation, not a product signal). The rendered content and honesty discipline are themselves strong evidence the deliverable path (orchestrated-with-fallback-guardrail, or clean deterministic fallback) is functioning correctly either way.

## 3. Dormant flags (moves_workforce_economics, moves_decision_storytelling)

Enabled for Lakeshore as first-proof per this release. Not separately smoke-tested in this session (out of scope for this pass — the user's ask was specifically phase-workspace/pattern-assembly + deliverable proof for both tenants). Flagged as a follow-up in the rollout report.

## 4. SkyHarbor (moves_phase_workspace_v2, moves_pattern_assembly)

**Not captured.** The signed-in browser session available in this environment is scoped to Lakeshore only (confirmed: `/strategic-moves` overview shows only Lakeshore's 5 moves; `/setup` → Operations shows no cross-tenant admin/tenant-switcher). No SkyHarbor Clerk credentials were available. Per the user's explicit instruction, this was left as an outstanding item rather than guessed or fabricated — see the rollout report's Known Gaps.
