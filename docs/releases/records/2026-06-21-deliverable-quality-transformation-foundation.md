# 2026-06-21-deliverable-quality-transformation-foundation — Deliverable Quality Transformation (foundation)

## Release ID

`2026-06-21-deliverable-quality-transformation-foundation`

## Status

`candidate`

## Plain-English Summary

This lays the foundation for turning AbarVa Move deliverables from long, legalistic,
evidence-heavy AI documents into senior-consultant-quality client artifacts (machinery hidden,
judgment on top, visuals carry the story). It adds, as inert library code that nothing in the live
generation path imports yet:

- a typed **DeliverableProfile registry** (one contract per deliverable: audience, decision purpose,
  format tier, evidence mode, required exhibits, acceptance checks) — length is advisory only, never
  an enforced word cap;
- automated **quality gates** (machinery/phase-label leakage, the "so what" filler test, scattered
  missing-input placeholders, source-register placement, exhibit completeness, and business-case
  mode-downgrade so a thin-data "Business Case" is honestly retitled to a Readiness Memo);
- the **ArchitectureModel + premium HTML renderer** — a cloud-agnostic exhibit (current→target
  physical architecture, named services drawn from the engagement's solution, data flow rendered
  distinct from the AI control/decision flow, the agentic "come-alive" overlay, control points,
  implementation waves), proven on a grounded First Capital sample.

No client-facing generation behavior changes in this release — the modules are not yet wired into the
orchestrator. Wiring + live ACA proof is the next phase.

## Layer Impact

- `experimental` lane: new, non-default deliverable-quality capability staged for the existing
  `moves_decision_storytelling` feature flag. Pure library additions under `src/lib/deliverables/`
  and `src/lib/visual-system/`; no runtime route, worker, or data-plane change.

## Client Applicability

- All clients: no change (modules are inert / not wired).
- Specific clients: none.
- Internal only: yes — foundation code only, behind future flag gating.
- Public/demo only: none.
- Feature flag: `moves_decision_storytelling` (the surface this will wire behind when live).

## Changes Included

- W0 `src/lib/deliverables/profiles/` — DeliverableProfile registry + machinery lexicon (commit `be489d0c1`).
- W1 `src/lib/deliverables/quality/transformation-gates.ts` — automated gates (commit `3967869cc`).
- W2 `src/lib/visual-system/architecture-model.ts` + `architecture-html-renderer.ts` + First Capital
  fixture — cloud-agnostic architecture exhibit (commit `55e7eff19`).
- Seam `src/lib/deliverables/quality/assess-deliverable.ts` — gates + mode-downgrade entry point.
- W1 vertical `src/lib/deliverables/synthesis/charter-shaper.ts` — decision-first, machinery-free
  charter; the shaped narrative is proven to PASS the gates.
- W3 `src/lib/visual-system/storyline-deck.ts` — board-final storyline deck model + HTML renderer
  (one governing message/slide, decision by slide 2, evidence→speaker notes).
- W5 `src/lib/deliverables/__tests__/golden-regression.test.ts` — byte-stable snapshots of the
  architecture HTML, handoff deck, and charter markdown.
- Shared First Capital fixtures (architecture, charter, handoff).
- `docs/build/DELIVERABLE_QUALITY_TRANSFORMATION_BUILD_SEQUENCE.md` — authoritative build sequence.

## QA / Validation

- `tsc --noEmit` clean across all new modules.
- `jest` — 66 tests green across 11 suites (profiles, gates, assess seam, architecture renderer,
  charter shaper, storyline deck, golden regression).
- First Capital artifacts rendered + screenshot-verified for visual quality: the Target Architecture
  HTML (current→target, named services, agentic overlay, waves) and the Executive Handoff deck
  (10 storyline slides, decision by slide 2, evidence off-slide).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — Release Control Gate passed.

## Rollout Plan

No runtime rollout. Merge to main carries inert library code only; nothing imports it into the live
generation path. The next phase wires it behind `moves_decision_storytelling` and proves it on a live
ACA generation run before any client sees a changed artifact.

## Deployment Authority

Not applicable — no ACA, deploy-workflow, runtime-image, worker, env/flag, traffic, or DNS change in
this release.

- Repo-owned deploy workflow: unchanged.
- Shared runtime mutators: none.
- Approved image digest: n/a (no image change).
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: `moves_decision_storytelling` (future wiring; not flipped here).
- Live signed-in proof required: yes, at the wiring phase — not in this release.

## Rollback Plan

Revert the PR. Because the modules are inert (no live path imports them), revert is a clean no-op on
runtime behavior; no migration or data rollback is involved.

## Audit Evidence

- PR URL: (this PR).
- CI run: GitHub Actions on the PR.
- Local validation: `tsc` clean; 31 jest tests green; rendered exhibit screenshot.
- No deployment URL (no runtime rollout).

## WIRE phase (governed pipeline enforcement)

- §0a/§0b added to the build sequence: the 8-stage governed pipeline (broker → profile → governed
  generation → exhibits → quality gate → renderer → persist → audit) and the **Deliverable Quality
  Contract** as a first-class capability, separate from egress governance.
- Profile registry extended with contract fields + **14 Source artifact profiles** (strategy memo …
  value ledger), profiled distinctly; RFP/pricing/evaluation/transition allowed deep/exhaustive depth.
- `assessClientDeliverable` is now the **blocking gate** returning result states (`client_ready` /
  `internal_draft` / `blocked_missing_inputs` / `blocked_missing_exhibits` / `blocked_quality` /
  `blocked_governance`), evaluating against the profile across 12 dimensions (not word count).
- Generation pass is **governed by construction** — the model call is an injected adapter; a direct
  SDK client is impossible by type.
- **Wired into `persistDeliverable`**: the contract runs for every deliverable (tenant-agnostic);
  non-`client_ready` artifacts are quarantined as internal drafts when enforcement is on. Enforcement
  is staged per tenant via flag, then platform-default. Existing persistence behavior unchanged.

## WIRE phase — complete (flag-gated, deploy-dark)

The full governed pipeline is now wired end-to-end, behind two tenant flags (both default OFF, so
deploy is byte-identical to today):

- `deliverable_structured_exhibits` — `runDeliverableForTenant` generates the ArchitectureModel via
  the **governed adapter** (egress-owned client), grounded in the tenant's own generated narrative,
  and hands it to persistence; the profile's renderer (premium HTML architecture) draws it and its
  exhibits satisfy the gate.
- `deliverable_quality_contract` — enforces the contract at persistence (non-`client_ready` →
  quarantined as internal draft). Off = observe-only (gate still runs and records the state).

Same path for every tenant; SkyHarbor IROPS is only the context proof point.

## Known Gaps

- Both flags **default OFF** — the staged per-tenant flip (then platform-default) is the rollout.
- Native **PPTX export** still renders as the HTML storyline deck (the model is PPTX-ready).
- **No live ACA generation proof yet** — the one remaining frontier. Flipping the flags for a tenant
  + a signed-in run (SkyHarbor IROPS) proves the whole pipeline live; because it is tenant-agnostic,
  that proof covers First Capital, Morgan Street, PHS, Delta, and every future tenant.
- W3 storyline deck renders to HTML; **native PPTX export** (reuse expert-kernel `pptx-renderer`) is
  not yet wired — the model is PPTX-ready.
- W4 remaining profile verticals (discovery, root-cause, solution design, operating model, sourcing,
  value measurement shapers) + the working-binder tier are not yet built (charter is the proven pattern).
- No live ACA generation proof yet — the explicit next phase before any client-facing change. Same
  gate-fragility + tenant-session blockers documented for the deck wiring.
