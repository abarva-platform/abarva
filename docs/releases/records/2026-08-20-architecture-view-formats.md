# 2026-08-20-architecture-view-formats — Granular zones, executive bands, and view formats

## Release ID

`2026-08-20-architecture-view-formats`

## Status

`candidate`

## Plain-English Summary

An architecture picture is only worth showing a client if the boxes are in the right
places. Getting that right is a semantics problem, not a drawing problem, and the earlier
projection got it wrong in ways that were individually small and collectively fatal: a
database product placed in an integration lane, an ETL tool filed as an artifact, a
reporting database grouped with data marts.

This release completes the semantic model behind those views.

**Two altitudes, one model.** Fifteen granular zones describe what a thing actually is —
source system, integration middleware, ETL platform, ETL pipeline artifact, warehouse,
mart, operational reporting database, lakehouse, BI platform, and so on. Five executive
bands roll those up for a board-level view. Both derive from the same classification, so
the detailed and the summary picture cannot disagree.

**Six view formats, each with its own admission rules.** An executive landscape, an
end-to-end data flow, a platform topology, a movement profile, a lineage trace, and an
estate evidence view are different questions, and each one has a different bar for what it
may show and what it must refuse. Only the end-to-end data flow requires topology fitness,
because it is the only one whose meaning depends on the relationship graph being
sufficiently complete.

**The fitness gate refuses rather than beautifies.** When the recorded relationships are
too sparse or too conflicted to support a flow view, the view is withheld with a stated
reason instead of being rendered as a picture that looks authoritative and is not.

Product identity is kept separate from architectural role throughout. A warehouse appliance
is a database platform; what it is being used AS is a separate assertion about the entity
that sits on it.

## Layer Impact

Release lane: `global-control-lane`. Shared projection and semantics behaviour, not scoped
to a client and not feature-gated.

- **Layer 3, canonical model** — no schema change. The taxonomy reads existing canonical
  fields and adds no attribute.
- **Layer 4, products** — changes how architecture views classify and place entities. Any
  surface reading `buildCurrentStateFlow` or the semantic taxonomy is affected. Placement
  changes are the point of the release: the previous placements were wrong.

## Client Applicability

- All clients: yes, for any surface that renders an architecture or flow view. The change
  is to classification quality, not to which data is visible.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/visual-system/semantics/technology-semantic-taxonomy.ts` — 15 granular zones, 5
  executive bands, alias resolution without substring inference
- `src/lib/visual-system/semantics/architecture-view-formats.ts` — six format policies with
  per-format admission rules
- `src/lib/visual-system/projections/current-state-flow.ts` — lanes derived from zones;
  returns fitness, unclassified and conflict counts alongside the view
- `tests/behaviors/technology-semantic-taxonomy.test.ts`,
  `tests/behaviors/architecture-view-formats.test.ts`

## QA / Validation

- `npx jest tests/behaviors/technology-semantic-taxonomy.test.ts
  tests/behaviors/architecture-view-formats.test.ts` — 70 passed, 2 suites
- The specific misplacements that prompted the work are asserted as tests, so each is a
  regression rather than a note: database product in an integration lane, ETL tool filed as
  an artifact, reporting database grouped with marts, an integration platform falling
  unzoned because its name appeared in brackets.
- Unknown stays unknown: the taxonomy resolves against reviewed aliases and never infers
  from substrings, so an unfamiliar product is reported rather than guessed into a lane.
- Not validated: no signed-in browser proof in this release. Nothing here renders on its
  own; a consuming surface change would carry that proof.

## Rollout Plan

Merge to main. No image build, migration, flag or ACA action in this release. It becomes
visible when a surface that consumes these projections is next deployed.

## Deployment Authority

Not applicable. No Azure Container Apps, workflow, image, flag, environment variable,
worker job, traffic, DNS or environment promotion effect.

- Repo-owned deploy workflow: not invoked
- Shared runtime mutators: none
- Approved image digest: n/a
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no — no route or rendered surface changes in this release

## Rollback Plan

Revert the PR. The taxonomy is a pure function library with no persisted state, so a revert
restores the previous classifications immediately and completely.

## Audit Evidence

- The PR and its commit message
- `docs/architecture/CURRENT_STATE_FLOW_SEMANTIC_AUDIT.md` — the audit that enumerated the
  misplacements
- The two test suites, where each historical misplacement is an assertion

## Known Gaps

- The classifications remain judgements made inside a projection at display time. Moving
  them to reviewed intake columns is the subject of a separate, in-flight change; until
  that lands, a correct classification here is still not something anyone approved.
- Only `end_to_end_data_flow` enforces topology fitness. The other five formats have
  admission rules but no equivalent whole-view refusal.
- No consuming surface has been updated to use the six formats yet.
