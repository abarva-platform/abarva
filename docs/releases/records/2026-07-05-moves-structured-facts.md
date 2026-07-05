# 2026-07-05-moves-structured-facts — Structured diagnosis facts (metric·value·source)

## Release ID

`2026-07-05-moves-structured-facts`

## Status

`candidate` — verified live on the Lakeshore P2 Move before merge.

## Plain-English Summary

Turns the P2 **baseline metrics** capture from a free-text box into a **structured
facts table** — one row per fact with **metric · value · source** — so the
diagnosis is captured as real, provenance-tagged facts instead of prose. The
operator adds/edits rows in the workbench; each fact records where it came from
(the source/evidence). Those facts are folded into deliverable generation as real
`baselineMetrics` (`metric: value [source]`), which sharpens the metrics-backed
diagnostic thesis.

Backward-compatible: an existing free-text baseline capture becomes a single
source-less fact, so nothing is lost.

## Layer Impact

- `global-control-lane`: the phase-capture contract (adds a `structured` flag), the
  Moves capture UI (`FactsEditor`), and the capture→context binding
  (`moves-generate-deps`) for all clients. Persistence is unchanged — the facts are
  stored as JSON in the existing section value.

## Client Applicability

- All clients: yes — every tenant capturing P2 baseline metrics.
- Specific clients: n/a
- Internal only: no
- Public/demo only: no
- Feature flag: none.

## Changes Included

- `src/lib/programs/diagnosis-facts.ts` (new) — `DiagnosisFact` +
  parse/serialize/`factsToBaselineMetrics`/`factsToPromptText`, pure + fully tested.
- `src/lib/programs/phase-capture-contract.ts` — `structured?: "facts"` on
  `PhaseCaptureSection`; set on P2 `baseline_metrics`.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — `FactsEditor`
  (metric·value·source rows, add/remove, JSON-serialized); rendered for structured
  sections in place of the textarea.
- `src/lib/deliverables/moves-generate-deps.ts` — the capture-bind parses the
  structured facts into `baselineMetrics` and renders readable facts (not raw JSON)
  into the generation `currentState`.
- `StrategicMoves.module.css` — facts-editor styles.
- Tests: `diagnosis-facts.test.ts` (7) + capture-contract suites updated.

## QA / Validation

Overall status: **static PASS; live verification before merge.**

- `jest` diagnosis-facts (7) + capture suites (12) + moves-generate-deps (1) → **PASS**.
- `tsc --noEmit` (8GB heap) → **PASS** (0 errors); `eslint` → **PASS**.
- Live proof before merge: on the P2 Move, the baseline section renders the facts
  table; adding a fact + Save persists it; the value round-trips.

## Rollout Plan

Merge to `main` → ACA "main deploy" → re-verify live. No migration; existing
free-text baseline values render as one fact and can be restructured in place.

## Deployment Authority

- Repo-owned deploy workflow: "ACA main deploy".
- Shared runtime mutators: none — same capture persistence path (JSON in the value).
- Live signed-in proof required: yes — facts table renders + saves.

## Rollback Plan

Revert the PR. The `structured` flag disappears → baseline renders as a textarea
again; any JSON already saved shows as text (recoverable). No data migration.

## Audit Evidence

- PR URL: (added on open)
- CI: jest + tsc + eslint clean.

## Known Gaps

- Only P2 `baseline_metrics` is marked structured; other evidence-heavy sections
  (P4 estimates/value) could adopt the same `structured: "facts"` flag next.
- The `source` field is free text; linking it to a specific `evidenceNeedPacket`
  (a picker) is a follow-up that would make provenance clickable.
