# 2026-06-19-workforce-economics-moves-brief — Workforce Economics substrate + Moves binding brief

## Release ID

`2026-06-19-workforce-economics-moves-brief`

## Status

`candidate`

## Plain-English Summary

Adds the AbarVa Workforce Economics reference substrate (the parametric `Workforce_Taxonomy_Master.xlsx` workbook and its openpyxl build script) to the repo, plus a consolidated session readout and a Codex execution brief to bind that substrate into the Moves module (the business-case / roadmap / estimation deliverable arc). This release adds documentation, a reference artifact, and a generator script only — it changes no application runtime behavior, no schema, and no data plane.

## Layer Impact

- **global-control-lane**: documentation and shared reference tooling. New files: a Codex handoff brief (`docs/codex-handoff/`), a reference workbook (`docs/workforce-economics/`), and a generator script (`scripts/workforce-economics/`). No runtime code path, route, schema, or tenant data is modified. The actual Moves binding is a planned follow-on engineering phase described in the brief.

## Client Applicability

- All clients: the workforce economics substrate is a universal, tenant-agnostic reference model (towers, roles, rates, geos, agent economics, pods). No per-tenant gating; no client data involved (synthetic/anonymized provider archetypes only).

## Changes Included

- `docs/codex-handoff/WORKFORCE_ECONOMICS_MOVES_BINDING_BRIEF.md` — CREATED: session readout (Part A) + Codex brief to bind Workforce Economics into Moves (Part B, phases WE-1..WE-5).
- `docs/workforce-economics/Workforce_Taxonomy_Master.xlsx` — CREATED: 17-sheet parametric reference workbook (21 towers, 139 capabilities, 321 role families, 891 priced rate-card units, 17 geos, 23 provider archetypes, 5 agent platforms, 107 pods, Estimation Engine + Business Case).
- `scripts/workforce-economics/build-workforce-taxonomy.py` — CREATED: openpyxl generator (source of truth for the workbook data).
- `.gitleaks.toml` — MODIFIED: allowlist `docs/workforce-economics/` (binary xlsx false-positive guard).
- `docs/releases/records/2026-06-19-workforce-economics-moves-brief.md` — CREATED: this record.

## QA / Validation

Status: PASS (artifact generation + validation) / NOT-RUN (no runtime to test — docs/tooling only)

- PASS: workbook formulas validated with the python `formulas` library — 0 errors across 14,848 cells. (LibreOffice not installed locally, so the xlsx skill's `recalc.py` was not used; Excel recalculates on open.)
- PASS: estimation-engine worked example verified consistent (Traditional $1.71M / AI-Native $0.72M, 18→8 humans, 2.4x productivity, ROI 322%→895%).
- NOT-RUN: application runtime / integration — this release adds no runtime code.

## Rollout Plan

Docs + reference artifact + generator script. Merge to `main`; `aca-main-deploy` will rebuild the web image on push (no behavior change). No feature flag. The Moves binding itself rolls out later via the phased WE-1..WE-5 plan in the brief, each gated and live-proven on ACA.

## Rollback Plan

`git revert` the squash commit removes the three added files and the gitleaks allowlist line. No schema, data, or runtime change to unwind.

## Audit Evidence

- Brief: `docs/codex-handoff/WORKFORCE_ECONOMICS_MOVES_BINDING_BRIEF.md`
- Reproducible generator: `scripts/workforce-economics/build-workforce-taxonomy.py` → regenerates the committed workbook.
- Memory: `project_workforce_economics_platform.md`.

## Known Gaps

- The Moves binding (WE-1..WE-5) is specified, not built.
- The generator script writes to `~/Downloads/` by default; Codex will parameterize the output path when wiring WE-1.
- Workbook formulas have no cached values (created via openpyxl); they compute on open in Excel/Numbers.
