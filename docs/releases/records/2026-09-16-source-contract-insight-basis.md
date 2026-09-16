# Source contract insight basis substrate

## Release ID

`2026-09-16-source-contract-insight-basis`

## Status

`candidate`

## Plain-English Summary

Extend the existing contract-claim spine with a typed value effect, versioned reporting cutoffs, explicit rule origin and kind, and a per-contract insight result. A computed insight cannot be stored without a value and input references; a blocked insight must name its missing inputs. This is structure only and makes no new product claim.

## Layer Impact

`client-data-lane`. This adds Layer 3 schema for reporting cutoffs, rule provenance, and contract insight results. Existing records, read models, application routes, and dataset contents are unchanged.

## Client Applicability

- All clients: the additive schema is available after migration apply.
- Specific clients: none; no client-scoped records are created.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Add a tenant- and version-scoped reporting-cutoff record, with a disclosure required for a simulation date.
- Add nullable business-domain and sourcing-category keys to the canonical contract record; no existing contract is classified by this change.
- Extend opportunity claims with a typed value effect and playbook rules with diagnostic-vs-decision and origin fields.
- Add a tenant-scoped, versioned contract-insight result with state and reference constraints.

## QA / Validation

- The migration applied to an isolated local PostgreSQL cluster with minimal prerequisite table stubs.
- A supported computed insight with input references inserted successfully.
- A computed insight without input references failed the database check. Dropping that check in the disposable cluster allowed the same invalid insert, confirming the guard was exercised.
- Scoped repository validation and full-schema integration remain required before database apply.

## Rollout Plan

Merge through a protected pull request. A web deployment does not apply this migration. Run the lab migration workflow in status mode, then apply only through that workflow after separate approval and dependency readback. No data build is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: no web deployment is required for schema availability.
- Shared runtime mutators: none in this release.
- Approved image digest: not applicable.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: only after a later product read path adopts these objects.

## Rollback Plan

Before any new rows depend on the schema, a follow-up migration may remove these additive objects and columns. Once data is loaded, preserve the records and use a forward repair instead of dropping them.

## Audit Evidence

Inspect the pull request, migration diff, release-check output, and isolated PostgreSQL constraint test. Database migration status and readback must be attached separately before any claim of applied schema.

## Known Gaps

The loader guard, read-model use, signed-in product proof, and governed dataset reload are separate follow-on slices. Schema presence alone does not make insights agent-ready or client-visible.
