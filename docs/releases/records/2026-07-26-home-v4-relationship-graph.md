# 2026-07-26-home-v4-relationship-graph — real relationship graph, and a real counting bug fixed

## Release ID

`2026-07-26-home-v4-relationship-graph`

## Status

`candidate` — verified locally against real fixture content and real regenerated candidate data,
not yet merged.

## Plain-English Summary

Second slice of the V4 Knowledge experience productization work (PR4 of the home-v4 pivot). Two
things, found together while building the second:

1. **A real counting bug**, found by direct inspection of freshly regenerated real tenant data, not
   assumed: `relationship_samples` is not one fixed shape across tenants. Two of the three review
   tenants (`first-capital`, `skyharbor-air`) carry real typed edges
   (`from_object_name`/`to_object_name`/`relationship_type`); the third (`meridian-health`) carries a
   genuinely different real shape instead (`business_name`/`use_case`/`affected_systems`, a
   semicolon-joined system list, no typed edges at all). The single-shape reader silently produced
   `node_count: 0` on meridian-health — not an honest "no relationship evidence" state, a real bug
   reading fields that never existed in that tenant's actual rows. `deriveGraphBinding()` now detects
   which real shape a given tenant's rows have and derives correct counts from either.
2. **A real graph, not just counts.** `graph_binding` was always counts-only ("40 relationships...
   not yet rendered as a graph in this view") — the graph renderer already existed
   (`RelationshipGraphVisual`, built earlier this session for the legacy Change & Transformation
   pass) but nothing fed it real book-mode data. The `rel` dimension now gets a real
   `relationship_graph` `primary_visual`: relationship-type-shaped tenants group by the real
   relationship type (uses/owns/runs_on/...) with real from→to example pairs; the alternate-shape
   tenant groups by real use case with the real systems its gaps affect. The other 5
   graph-eligible dimensions (`apps`/`infra`/`architecture_dependencies`/`integrations`/`data`) keep
   the now-correctly-counted text summary rather than getting an identical graph under a different
   label — showing the same graph 6 times would be exactly the "one all-tenant hairball repeated"
   the graph feature is meant to avoid.

## Layer Impact

- `internal-admin` lane: this changes only the V4 book-mode generator's deterministic rendering step
  and the `/home/v4-preview` candidate-review rendering. No tenant currently has an approved V4
  pack, so no client-facing surface is affected.

## Client Applicability

- Internal only. No client-visible surface changes.

## Changes Included

- `scripts/knowledge/build-home-knowledge-v4-review-pack.mjs`: new `hasTypedRelationshipEdges()` and
  `distinctAffectedSystems()` helpers; `deriveGraphBinding()` now shape-detects instead of assuming
  one fixed row shape; new `resolveRelationshipGraphVisual()` builds a real `HomeV4GraphVisual` for
  the `rel` dimension from whichever real shape a tenant's rows actually have.
- `src/components/home/v4/HomeV4ExplorerShell.tsx`: no longer shows the counts-only text summary
  underneath a dimension that already has a real graph `primary_visual` (would otherwise show a
  real graph immediately followed by "not yet rendered as a graph in this view" — a contradiction).
- `scripts/knowledge/__tests__/run-relationship-graph-tests.mjs` (new): 17 tests covering both real
  row shapes, the empty case, non-graph-eligible dimensions staying `null`, and the real node_groups/
  examples produced for each shape.
- `package.json`: new `home:knowledge-v4:test-relationship-graph` script entry.

## QA / Validation

- `pass` — `npx eslint`, zero findings.
- `pass` — full-project `tsc --noEmit` (expanded heap), zero errors.
- `pass` — full production `npm run build`, zero errors.
- `pass` — new test suite: 17/17 passing, using representative rows from both real shapes observed
  in actual regenerated tenant data (not invented field names).
- `pass` — existing generator suites unaffected: manifest-validator (25/25), prompt-preflight (6/6),
  dimension-headline tests (11/11).
- `pass` — zero-cost preflight proof against all 3 real fixture books: `first-capital` and
  `skyharbor-air` each produce a real 4-8-group `relationship_type_map` graph with real from→to
  examples; `meridian-health` produces a real 7-group `initiative_system_map` graph with real
  affected-system examples (previously would have shown 0 nodes).
- Live signed-in browser verification against `/home/v4-preview` was not possible from this
  environment (same platform-admin-session gap as the chapter-navigation PR) — verification instead
  used the same zero-cost preflight renderer-proof mechanism the generator's own test harness uses,
  against the real fixture content `/home/v4-preview` serves.

## Rollout Plan

1. Merge to `main` → `aca-main-deploy.yml` builds and deploys the new image.
2. Takes effect the next time any tenant is regenerated. No currently-approved content is touched
   (none exists).
3. Live signed-in verification on `/home/v4-preview`, once a platform-admin session is available, to
   confirm the rendered graph matches the local preflight proof.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`, triggered by merge.
- Shared runtime mutators: none.
- Live signed-in proof required: yes, deferred (same outstanding gap as
  `2026-07-25-home-v4-chapter-navigation.md`) — not skipped, explicitly documented.

## Rollback Plan

Revert the PR. No schema or data change; `deriveGraphBinding()`/`resolveRelationshipGraphVisual()`
are pure functions over already-generated content.

## Audit Evidence

- This PR's diff and CI run.
- New test suite output (17/17 passing).
- Real fixture-book preflight output showing the corrected graph_binding counts and the new real
  `primary_visual` node_groups for all 3 tenants (captured during local verification, see QA above).

## Known Gaps

- Live signed-in browser verification is deferred, same as the chapter-navigation PR.
- The other 5 graph-eligible dimensions still show text-only summaries by design (see Plain-English
  Summary) — not a gap, a deliberate choice given the data doesn't support 6 genuinely distinct
  groupings. If a future dataset adds real per-object-type tagging, revisiting that decision would
  be reasonable.
