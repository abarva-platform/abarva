# 2026-10-02-deck-status-column-coloring — Colour-coded status tables in decks

## Release ID

`2026-10-02-deck-status-column-coloring`

## Status

`candidate`

## Plain-English Summary

A board table should read at a glance — a risk level, an acceptance pass/fail, a
readiness state should be visible by colour, not buried in a uniform grid. The
generated decks had a dark header (shipped separately) but every cell was the
same colour.

This adds an optional, opt-in way for a generated table to mark its status column
(the risk level, the pass/fail, the readiness, the owner-type). When it is
marked, the renderer colours that column's cells by value: red for high / fail /
at-risk, amber for medium / in-progress, green for low / pass / on-track. A table
that marks no status column renders exactly as before. The generator is told to
include an owner or decision column at the end of a decision table, and to mark a
status column when one exists.

## Layer Impact

Release lane: `global-control-lane` — shared Moves deck-rendering behavior for all
clients, not feature-gated.

- `PRODUCTS` (Moves): an optional `statusColumn` on a table and its colouring in
  the PPTX renderer, plus a generator instruction. No change to content, figures,
  evidence, slide count, or any gate.

No change to the canonical model, source adapters, or client intake.

## Client Applicability

- All clients: yes — any generated deck whose table declares a status column.
- Specific clients: none. Internal only: no. Public/demo only: no. Feature flag:
  none (opt-in per table via `statusColumn`).

## Changes Included

- `src/lib/deliverables/shared/cell-tone.ts` (new): deterministic, format-agnostic
  value → tone (critical / warn / good / neutral) map + hex colours.
- `src/lib/deliverables/orchestrator/types.ts`: optional `RenderableTable.statusColumn`.
- `src/lib/deliverables/orchestrator/renderers.tsx`: the PPTX table renderer
  colours the declared status column's cells by value; out-of-range index is
  ignored (plain table). `repairStructuredTable` already preserves the field.
- `src/lib/deliverables/orchestrator/prompt-builder.ts`: both synthesis/render
  schema hints carry `statusColumn`, with an instruction to include an
  owner/decision column and mark a status column when present.
- Tests: the tone mapping (incl. whole-word matching); that the PPTX renders the
  tone fill only for a declared status column and ignores an out-of-range index.

## QA / Validation

- Rendered a deck with a three-row risk table (High / Medium / Low) and confirmed
  the Impact column renders red / amber / green while other columns stay plain.
- `npx jest src/lib/deliverables` — 108 suites / 1,286 tests pass.
- Scoped `tsc` over changed files: no type errors. `eslint`: clean.
- `npm run release:check --base origin/main --head HEAD`: all gates pass.

## Rollout Plan

Merge to main via squash. No runtime rollout step of its own: it takes effect in
the web image the repo-owned ACA main deploy workflow builds from the merge SHA.
No migration, no flag, no env change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (on merge
  to main).
- Shared runtime mutators: none introduced.
- Approved image digest: the digest the main deploy workflow produces for the
  merge SHA.
- ACA runtime invariant: unchanged; no env/flag/scale/secret change.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: generate one deck on an affected Move after
  deploy and confirm a status column colours by value.

## Rollback Plan

Revert the PR and redeploy from the reverted SHA through the main deploy
workflow. No migration or data change to unwind.

## Audit Evidence

- PR URL: (added on open).
- CI run on the PR.
- Local render screenshot + test/lint/typecheck output above.

## Known Gaps

- Colouring is applied in the PPTX renderer (the lead deck format), consistent
  with the dark-header change. Mirroring it in the HTML / DOCX / PDF table
  renderers is a fast follow.
- `value_tree` exhibit SVG builder and a plain-English-mirror prompt beat remain
  from the deck-quality remediation sequence.
