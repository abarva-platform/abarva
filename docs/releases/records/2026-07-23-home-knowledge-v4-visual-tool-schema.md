# 2026-07-23-home-knowledge-v4-visual-tool-schema — enforce the visual contract in the tool schema

## Release ID

`2026-07-23-home-knowledge-v4-visual-tool-schema`

## Status

`candidate`

## Plain-English Summary

Moves the Home V4 visual contract from prose instruction into the forced-tool-use schema, closing
the two residual Claude-authorship defects that offline replay isolated.

Replay found that after four validator defects were removed, the remaining findings were not ~142
independent problems but **two systematic model behaviours**:

1. **`empty_state` omitted** on ~57 of Meridian's visuals — despite an explicit prompt line
   saying "Do not omit empty_state even when data_points are present."
2. **`visual_type: relationship_graph` declared on a `primary_visual` that then carried chart
   fields** (5 dimensions) — the model picked the graph type and filled the wrong contract.

Both were being asked for in prose. The tool schema for `client_visible` was
`{type: "object", additionalProperties: true}` — completely untyped, enforcing nothing. Prose
demonstrably is not holding, so the contract belongs in the schema.

`primary_visual` on dimension passes is now a typed `anyOf` discriminated on `visual_type`: a
chart type must carry the nine chart fields, a `relationship_graph` must carry the eight graph
fields, and **`empty_state` is required in both branches**. `visual_type` and `classification` are
constrained to their enums.

### Interaction with prompt caching — deliberate, and verified

`tools` renders at prefix position 0, so varying the tool schema by pass type invalidates the
prompt cache *between* pass types. This is deliberate and cheap: cross-pass-type sharing was
measured at only ~148 tokens, while the 13,171-token dimension-to-dimension cache is untouched
because **every dimension pass receives a byte-identical schema** — asserted directly in
validation below. Applied carelessly, a per-pass schema would have silently undone the caching
work shipped in the previous PR.

## Layer Impact

- `global-control-lane`: tool-schema construction in one operator script. No schema migration, no
  runtime read path, no writes.

## Client Applicability

- All clients: constrains generation for every tenant.
- Internal only: operator tooling.
- Feature flag: None.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`
  - `renderedVisualSchema()` — typed `anyOf` for chart vs relationship-graph visuals, both
    branches requiring `empty_state`.
  - `toolSchema(pass)` — dimension passes get a typed `client_visible`; all other passes keep the
    permissive object.
  - Call site passes `pass` through.

## QA / Validation

- `pass` — `node --check` clean; `npx eslint` exit 0.
- `pass` — **Cache safety asserted**: `toolSchema({type:"dimensions", key:"apps"})` and
  `toolSchema({type:"dimensions", key:"risks"})` serialise byte-identically; a non-dimension pass
  correctly differs.
- `pass` — `empty_state` present in the `required` array of **both** anyOf branches.
- `pass` — Chart branch requires all nine `requiredVisualFields`; graph branch requires all eight
  `requiredRelationshipGraphFields`.
- `n/a` — No migration, no runtime change, no database writes, no generation run.

## Rollout Plan

Merge + deploy through the normal ACA main lane. **The first paid run after this must be a
three-dimension canary, not a full tenant** — this changes generation behaviour and cannot be
proven offline. Replay-validate the canary output and check `HOME_V4_CACHE_UTILISATION` before
committing to a full tenant.

## Deployment Authority

- Repo-owned deploy workflow: Azure Container Apps main deploy after merge.
- Shared runtime mutators: none — operator script only.
- Migration application: none.
- Feature/env flag update path: none.
- Live signed-in proof required: no runtime-visible change.

## Rollback Plan

Revert the PR. The schema becomes permissive again, restoring the prior (defective but
non-failing) generation behaviour.

## Audit Evidence

- Schema-stability probe output showing byte-identical dimension schemas and `empty_state`
  enforced in both branches.
- Replay findings that isolated these two behaviours as the residual authorship defects.

## Known Gaps

- **Not verified against a live call.** A tool schema is advisory unless `strict: true` is set,
  which would require `additionalProperties: false` throughout and full specification of every
  field — a much larger change that risks rejecting legitimate variation. Models follow tool
  schemas far more reliably than prose, but this is a strong nudge, not a guarantee. The canary
  is what will tell us whether it held.
- Only `primary_visual` is typed. `dashboard_visuals`, `benchmark_exhibits`, `evidence_visuals`,
  and `priority_matrix_visual` remain untyped and are still governed by prose plus the validator.
  Extend once the canary shows the typed path works.
- The other four dimension tabs (`summary_tab`, `data_tab`, `relationship_tab`, `gaps_tab`,
  `evidence_tab`) are still untyped in the schema — the prose-only-tabs finding from the original
  audit is not addressed here.
