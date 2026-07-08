# 2026-07-04-moves-phase-template-upload-mapping — Moves phase-template + upload-mapping intelligence layer

## Release ID

`2026-07-04-moves-phase-template-upload-mapping`

## Status

`candidate`

## Plain-English Summary

Adds the typed data/intelligence layer that will make the Moves phase workspace phase-specific and use-case-aware. It gives each phase (Understand Current State, Choose the Approach, Build the Plan, Prepare to Execute, Track Outcomes) a governed catalog of session templates, a model for classifying what a user uploads into that phase's findings and the next phase's inputs, and a governed loop for using Claude as a pattern *assembler* (never the source of truth for numbers). It ships with a Lakeshore Legal Contract Intake demo fixture. This is increment 1 of 2 — the data foundation and its proof; the on-screen cards and their wiring into the phase page are a following increment.

## Layer Impact

- `global-control-lane`: new shared library `src/lib/programs/phase-templates/` (template catalog, upload classification, feed-forward inputs packs, dynamic pattern-assembly packet + validator). Pure typed logic; no runtime route, no DB migration, no model call wired yet. Behavior is available to future callers but nothing in the running app imports it yet, so live behavior is unchanged.

## Client Applicability

- All clients: no — nothing is wired into a live surface yet.
- Specific clients: Lakeshore is the demo fixture subject (Legal Contract Intake & Obligation Control).
- Internal only: library + proof + report + this record.
- Public/demo only: no.
- Feature flag: none yet (no runtime surface to gate). Increment 2 UI will be flag-gated.

## Changes Included

- New: `src/lib/programs/phase-templates/{building-blocks,types,catalog,classification,pattern-assembly,index}.ts`, `fixtures/lakeshore-legal.ts`, `__tests__/phase-templates.test.ts`.
- Proof: `proof/moves-phase-template-upload-mapping-2026-07-04/{template-catalog.json,template-catalog.csv,lakeshore-legal-demo-fixture.json}`.
- Report: `reports/moves-phase-template-upload-mapping-implementation-2026-07-04.md`.
- No migrations, no routes, no scripts, no env changes.

## QA / Validation

- Jest: `npx jest src/lib/programs/phase-templates` — 12/12 pass (catalog completeness; P2/P3 required sets; P3 decision-summary → selected approach + deferred + controls + human-in-loop + P4 inputs; Move-scoped default; no automatic enterprise promotion; feed-forward packs; no internal jargon; pattern-assembly overreach + unbacked-number guards).
- Types: scoped strict `tsc --noEmit` on the module — exit 0. Module is self-contained (relative imports only, no `@/`), so it is unaffected by the unrelated `main` breakage.
- Proof emission: module compiled and a node script wrote the 3 artifacts cleanly; JSON valid; CSV 28 rows; catalog `{P2:6,P3:6,P4:6,P5:5,TOWER:5}`.
- `git diff --check`: clean (no whitespace errors).
- Full-project typecheck/build NOT run: `main` is already red from an unrelated feature merge (~136 typecheck errors + one ESLint parse error). Targeted validation only, per the "state the unrelated blocker clearly" instruction.

## Rollout Plan

Merge to `main` via PR (squash). No runtime rollout: no route, migration, image, or flag change. Nothing becomes user-visible until increment 2 wires the UI behind a feature flag.

## Deployment Authority

- Repo-owned deploy workflow: not triggered — no runtime image or traffic change.
- Shared runtime mutators: none.
- Approved image digest: n/a (no deploy).
- ACA runtime invariant: unaffected (no image/template change).
- Worker image invariant: unaffected.
- Feature/env flag update path: n/a this increment; increment 2 UI to be flag-gated.
- Live signed-in proof required: not for this increment (no live surface). Required before increment 2 is claimed live.

## Rollback Plan

Revert the PR. No migration, no data write, no deployed artifact — revert is complete and safe with no replay constraints.

## Audit Evidence

- PR URL: (to be added on open).
- Tests: jest 12/12 + scoped tsc exit 0 (see QA / Validation).
- Proof artifacts: `proof/moves-phase-template-upload-mapping-2026-07-04/`.
- Report: `reports/moves-phase-template-upload-mapping-implementation-2026-07-04.md`.
- Design reference: `Moves Phase Workspace · standalone (1).html` (Claude Design) + `docs/build/moves-design/`.

## Known Gaps

- UI cards + phase-page wiring (increment 2) not shipped; on-screen acceptance criteria not met yet.
- No real DOCX/XLSX template generation and no live upload→classify binding yet.
- `classifyUpload` maps from provided/parsed outputs or template defaults; it does not parse document contents.
- `main` is broken from an unrelated merge; full-project build was not run.
