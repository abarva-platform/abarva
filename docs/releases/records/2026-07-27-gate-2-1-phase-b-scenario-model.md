# 2026-07-27-gate-2-1-phase-b-scenario-model — one connected model, not per-file row factories

## Release ID

`2026-07-27-gate-2-1-phase-b-scenario-model`

## Status

`candidate` — new infrastructure with zero consumers wired up yet. No tenant data changed.

## Plain-English Summary

Gate 2.1 Phase B. Gate 2.1 Phase A's blocker ledger ([#5665](https://github.com/abarva-platform/abarva/pull/5665))
confirmed the root cause behind several referential-integrity findings: today's synthetic tenant data
was generated as independent per-domain row factories, not from one connected enterprise model —
`applications_systems.vendor` holds an ID that has no matching field anywhere in `vendors_contracts`
because the two domains were never given a shared identity space to begin with.

This adds the typed tenant scenario model the architectural decision called for: a declarative
manifest of 24 entity types (enterprise, business units, functions, leaders, workforce roles,
applications, platforms, data assets, integrations, vendors, contracts, spend lines, programs, AI use
cases, risks, metrics, processes, managed services, industry patterns, expert lenses, interviews,
evidence sources, evidence items, relationships), each with a stable-ID prefix, its own fields, and
reference fields to other entity types — plus the runtime engine (stable-ID generation, graph
construction, validation, and CSV projection) that Phase C and Phase D will build real tenant graphs
on top of.

References resolve by stable ID first inside the graph; projection into the already-approved v3 CSV
columns (which are contractually free-text names, not IDs — a separate decision this phase does not
make) resolves each reference to its target's display name at write time. Every generator built on
this model is required to also emit a `scenario-id-crosswalk.csv`, so ID-based cross-referencing
stays possible for tooling that wants it without changing the approved v3 schema.

## Layer Impact

- `internal-admin` lane, generator infrastructure. No layer below "reports/scripts on disk" is
  touched; nothing in `datasets/tenant-inputs/active/**` changed.

## Client Applicability

- Internal only. Zero tenant-facing or runtime effect. Not yet consumed by anything.

## Changes Included

- `datasets/tenant-inputs/templates/universal/tenant-scenario-model/scenario-model-manifest.json`
  (new): the 24-entity-type declarative catalog.
- `datasets/tenant-inputs/templates/universal/tenant-scenario-model/README.md` (new): what this is,
  why it exists, and explicitly what it is not (not a data mutation, not a promoted schema, not yet
  used by anything).
- `scripts/data-build/tenant-scenario-model/scenario-model.mjs` (new): stable-ID generation
  (`{TYPE_PREFIX}-{NNN}`), graph construction (`createGraph`/`addEntity`), validation
  (`validateGraph` — every reference resolves to a real entity of the declared type, every required
  reference is present, no duplicate IDs), and projection (`projectEntity` — resolves an entity plus
  its references into a flat CSV row; `buildCrosswalk` — the ID/name crosswalk every generator must
  emit).
- `scripts/data-build/tenant-scenario-model/__tests__/run-scenario-model-tests.mjs` (new, 19/19
  passing): manifest self-consistency checks, the ID generator, the user's own worked example
  (Program `PRG-014` referencing a sponsor, two systems, a data asset, a vendor, a metric, and a
  risk — proven end to end from graph construction through validation through CSV projection), and
  validation-failure cases (unresolved reference, wrong-typed reference, missing required reference,
  duplicate ID).

## QA / Validation

- `pass` — `npx eslint`, zero findings on both new files.
- `pass` — `run-scenario-model-tests.mjs`, 19/19, including a manifest self-consistency check that
  every `referenceField.refType` names a real declared entity type and every `projectsTo.domain`
  names a real domain Gate 2 already knows about (catches a typo in the manifest before anyone builds
  on it, not after).
- Not applicable: no runtime/UI surface, no live signed-in verification needed, no data to spot-check
  yet since no generator has built a real graph on this model.

## Rollout Plan

None. This is infrastructure, not a rollout. Phase C (Meridian's typed source adapter) is the first
real consumer and is next.

## Deployment Authority

- Repo-owned deploy workflow: not applicable.
- Shared runtime mutators: none.
- Live signed-in proof required: no.

## Rollback Plan

Revert the PR. Nothing outside the two new `tenant-scenario-model` directories was touched, and
nothing else in the repo imports from them yet.

## Audit Evidence

- This PR's diff and CI run.
- Test suite output (19/19 passing).

## Known Gaps

- No real tenant graph has been built on this model yet — Phase C is where that starts, for
  meridian-health specifically.
- The v3 CSV schema itself is not changed to carry real ID-based foreign keys (e.g.
  `applications_systems` still has no `vendor_id` column). The crosswalk file is this phase's answer
  to that gap; a future decision could still choose to extend the approved schema directly, but that
  is out of scope here.
- `integration`, `contract`, and `control` entity types share a CSV row with a sibling entity
  (`integration` shares `data_assets_integrations` rows with `data_asset`; `contract` shares
  `vendors_contracts` rows with `vendor`; `control` is not yet modeled distinctly from `risk` at all,
  both projecting to `risks_controls`). This mirrors the real v3 schema (which combines these
  concepts into one table each) rather than inventing new CSV files — Phase C/D will confirm this
  merge logic works for real generated data, not just the fixture in this PR's tests.
