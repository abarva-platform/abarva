# Tenant scenario model (Gate 2.1 Phase B, draft, not promoted)

**This is infrastructure for future generators, not a new tenant input standard.** Nothing in the
runtime pipeline reads from this directory, and no existing `datasets/tenant-inputs/active/**` file
was touched to build it. It exists so Phase C (Meridian's typed source adapter) and Phase D (targeted
synthetic enrichment) have one shared, validated engine to build on, instead of each writing its own
independent row-generation logic the way the current synthetic data evidently was.

## Why this exists

Gate 2 ([#5664](https://github.com/abarva-platform/abarva/pull/5664)) and Gate 2.1 Phase A
([#5665](https://github.com/abarva-platform/abarva/pull/5665)) found that today's synthetic tenant
data was generated as independent per-domain row factories, not from one connected enterprise model.
The clearest evidence: `applications_systems.vendor` holds an opaque ID (`VDR-00001`) that doesn't
match anything in `vendors_contracts` (which has no ID column at all) — the two domains were
generated without a shared identity space, so `vendor` never had a real value to resolve against
in the first place. Names generated independently for `programs_initiatives.business_sponsor` and
`org_ownership.leader_name_or_role` likewise don't reliably coincide.

## What this is

- **`scenario-model-manifest.json`**: declares 24 entity types (enterprise, business unit, function,
  leader, workforce role, application, platform, data asset, integration, vendor, contract, spend
  line, program, AI use case, risk, metric, process, managed service, industry pattern, expert lens,
  interview, evidence source, evidence item, relationship), each with a stable-ID prefix, its own
  fields, its reference fields to other entity types, and how it projects into the already-approved
  v3/v4-candidate CSV columns.
- **`scripts/data-build/tenant-scenario-model/scenario-model.mjs`**: the runtime engine — stable-ID
  generation (`{TYPE_PREFIX}-{NNN}`, e.g. `LEADER-006`, `SYS-021`, `PRG-014`), graph construction,
  validation (every reference resolves to a real entity of the right type; every required reference
  is present), and projection (turning one entity into a CSV row, resolving reference fields to their
  target's display name since the approved v3 columns are contractually free-text names).

## How references stay ID-based without breaking the approved v3 schema

The v3 template set is still the only approved standard, and its reference columns (`business_sponsor`,
`vendor`, `data_source`, etc.) are documented as free-text names, not IDs — changing that is a
separate, larger decision this phase does not make. Instead: **inside the scenario graph**, every
reference is a stable ID first (`program.refs.sponsor_ref = "LEADER-006"`), and projection resolves
that ID to the target entity's display name only at the moment a CSV row is produced. Every generator
built on this model is also required to emit `scenario-id-crosswalk.csv` (entity_type, stable_id,
display_name, projected_domain, projected_row_identity) alongside the CSVs — so ID-based
cross-referencing is possible for any tool that wants it (a future Gate 2 rerun, for instance),
without requiring the v3 schema itself to change.

## What this is NOT

- Not a data mutation. No tenant's `active/current` files changed.
- Not a promoted schema. `universalTemplateStandardV3IsOnlyApprovedStandard` in
  `tenant-input-registry.json` is unchanged.
- Not yet used by anything. Phase C is the first real consumer (Meridian's 16 schema-mismatched
  domains, adapted through this model rather than hand-written per domain).
