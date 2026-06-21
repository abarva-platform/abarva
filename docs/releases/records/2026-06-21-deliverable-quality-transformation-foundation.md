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
- `docs/build/DELIVERABLE_QUALITY_TRANSFORMATION_BUILD_SEQUENCE.md` — authoritative build sequence.

## QA / Validation

- `tsc --noEmit` clean across all new modules.
- `jest` — 31 tests green across 4 suites (profiles, gates, assess seam, architecture renderer).
- The First Capital architecture exhibit was rendered to HTML and screenshot-verified for visual
  quality (premium consulting readout; current→target, named services, agentic overlay, waves).
- `node scripts/release-check.mjs --base origin/main --head HEAD` run locally.

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

## Known Gaps

- Not wired into the live orchestrator/persistence path (inert).
- W3 (PPTX storyline renderer reuse), W4 (remaining profile verticals + working-binder tier), and W5
  (full golden-sample library + regression) are not in this release.
- No live ACA generation proof yet — that is the explicit next phase before any client-facing change.
