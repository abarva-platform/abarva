# 2026-08-20-architecture-view-contract — Architecture view contract, projections, layout and SVG renderer

## Release ID

`2026-08-20-architecture-view-contract`

## Status

`candidate`

## Plain-English Summary

Architecture diagrams were previously drawn straight from ad-hoc shapes. Nothing in the system
could state what a box meant, whether two boxes were genuinely related, or where the evidence
behind either came from. That made two questions unanswerable: *does this diagram match the
approved design*, and *is this diagram true*. The second one matters more.

This adds the semantic layer underneath the drawing, so a view is a described model first and a
picture second.

**The contract** (`architecture-view-contract.ts`) declares semantic role, evidence basis
(`CANONICAL` / `ABARVA_DERIVED` / `CANDIDATE`), layer scheme, and audience level L0–L3. Audience
levels carry density ceilings the validator enforces — during development the validator caught a
view its author had pushed to 24 nodes at a level whose ceiling is 15, which is exactly the class
of error that otherwise ships and is only noticed by an executive who cannot read the slide.

`NodeAggregation` makes "this box stands for many records" a first-class, inspectable fact carrying
its member ids, rather than a labelling convention that later readers have to trust.
`deriveOrientation` computes edge direction from lane order instead of trusting an asserted value
that can silently contradict the layout it is drawn into. `canonicalNodeId` hashes rather than
truncates, after a 60-character truncation was found collapsing three distinct records into a
single id.

**The validator** rejects the provenance errors that are easy to make and invisible afterwards: an
aggregate claiming to be a canonical record, an aggregate with no members, a collapsed edge
claiming canonical status, an orientation contradicting lane order, a group whose provenance
disagrees with the node sharing its id, and any breach of the density ceiling. Lane order is
business-first; the consequence is that canonical system-to-function support edges run uniformly
backward, which is documented at the contract rather than worked around view by view.

**Layout** is a pure function, separated from SVG emission. The two properties easiest to fake by
eye — no overlapping boxes, no clipped labels — are therefore asserted in tests against real tenant
shapes rather than reviewed by squinting.

**Two projections** are included: an executive capability landscape (one node per business
function, deliberately no edges) and a capability-to-technology view (capability-scoped, with
individual system nodes below a fan-in threshold and canonical-field aggregation above it).

## Layer Impact

- `global-control-lane`. Presentation contract sitting over the canonical model, at the layer 3 →
  layer 4 boundary. It reads canonical objects and produces a described view; it never computes,
  invents, or reinterprets a canonical value, and it owns no data.
- No canonical model, data-plane, schema, or product-surface change.

## Client Applicability

- All clients: no. Nothing imports these modules, so no client receives any behaviour change.
- Specific clients: none.
- Internal only: yes — the code exists in the repo and is exercised only by its own tests.
- Public/demo only: no.
- Feature flag: none. The modules are inert by having no consumer, which is a stronger guarantee
  than a flag: there is no runtime path to reach them at all.

## Changes Included

- `src/lib/visual-system/architecture-view-contract.ts` — contract, validator, id and orientation
  derivation
- `src/lib/visual-system/layout/architecture-layout.ts` — pure layout function
- `src/lib/visual-system/architecture-svg-renderer.ts` — SVG emission and legend
- `src/lib/visual-system/projections/capability-landscape.ts`
- `src/lib/visual-system/projections/capability-to-technology.ts`
- Four test files under `src/lib/visual-system/__tests__/`

## QA / Validation

- **PASS** — 134 tests across the visual-system suite, including layout overlap and clipping
  assertions driven by real tenant shapes.
- **PRE-EXISTING FAILURE, not introduced here** — one failure in `storyline-deck.test.ts`
  (`clientReady` handoff gate). Verified by stashing these files and re-running: it fails
  identically without them. Not fixed here; tracked separately.
- **PASS** — `npx tsc --noEmit` clean.
- **PASS** — four proof renders produced and inspected as rendered output over HTTP, not as source.
  That is how two real defects were caught during development: an SVG `fill` presentation attribute
  silently overridden by a CSS class (23 invisible elements), and a member total double-counted
  across parent and child nodes. Neither was visible in tests or in source review.

## Rollout Plan

Merge to main. No runtime rollout: no consumer imports these modules, so there is no image
behaviour change, no migration, and no job run. Wiring a product surface to the renderer is a
separate change, deliberately held until the visual treatment is approved.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, deploy workflows, runtime images,
feature flags, environment variables, worker jobs, traffic, DNS, or environment promotion. It adds
library modules with no consumer.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a — no runtime update
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: none
- Live signed-in proof required: no — no surface renders this code

## Rollback Plan

Revert the commit. No consumer exists, so nothing else moves. No migration and therefore no
migration rollback constraint.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/6548
- CI run attached to that PR
- Four `*.view.json` payloads and their baseline renders, produced from two synthetic tenants'
  canonical estates and reviewed alongside this work
- Test output: 134 passing in `src/lib/visual-system`

## Known Gaps

- Seven of the nine planned architecture views are not built; they are blocked pending the approved
  visual treatment.
- Risk-join identity reconciliation is unresolved: `systems_impacted` resolves 34 of 55 references,
  with name drift between records. This must not be papered over with fuzzy matching inside the
  renderer — identity belongs to the canonical model, not to a drawing layer.
- The pre-existing `storyline-deck.test.ts` failure noted above remains open.
