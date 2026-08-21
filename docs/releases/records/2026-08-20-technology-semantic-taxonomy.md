# 2026-08-20-technology-semantic-taxonomy — Governed technology semantic taxonomy

## Release ID

`2026-08-20-technology-semantic-taxonomy`

## Status

`candidate`

## Plain-English Summary

A shipped diagram labelled Epic Caboodle — Epic's enterprise data warehouse — an integration
component, alongside Epic Clarity (an operational reporting database), SQL Server, and a Tableau
extract file. Anyone who works in the domain discredits that in three seconds, on a page whose
entire argument is that every value shown is recorded.

The cause was structural, not a typo. The projection mapped the `platformOrDatabase` field directly
to an architectural tier. That field is heterogeneous by design — its name says "or database" — and
it means different things per tenant: one tenant's six values are two movement tools and four
stores, the other's five values are genuinely movement tooling plus the string
`Direct point-to-point`, which is the *absence* of a platform. No lane assignment from that field
can be correct for both.

This release adds the audit and the taxonomy. It changes no projection or renderer yet.

**Why the taxonomy is code and not a source column.** With a real client we do not control their
extract, and requiring them to declare that Caboodle is a warehouse asks the client to perform the
analysis they engaged us for. What a vendor product *is* travels with the product, not with the
tenant — so it is reviewed once here and applies to every tenant that runs it.

**Design rules that make it defensible.** Exact reviewed aliases only, never substring matching:
"SQL Server" is a substring of "Epic Clarity (SQL Server)", and matching it would call a reporting
database a database platform. Unknown stays unknown and surfaces as "Unclassified — to validate"
rather than being placed in whichever lane is visually convenient. Movement mechanisms are a second,
separate taxonomy that cannot resolve to a platform type or the reverse — conflating them is exactly
how "SQL Server is integration middleware" happens.

## Layer Impact

- `global-control-lane`. A shared semantics module under the visual system. Reads nothing, writes
  nothing, imports no tenant data.
- No canonical model, data-plane, schema, or product-surface change. Nothing consumes it yet.

## Client Applicability

- All clients: no — no consumer exists in this release.
- Internal only: yes.
- Feature flag: none; the module is inert by having no importer.

## Changes Included

- `docs/architecture/CURRENT_STATE_FLOW_SEMANTIC_AUDIT.md` — the field-level audit
- `src/lib/visual-system/semantics/technology-semantic-taxonomy.ts` — the taxonomy
- `tests/behaviors/technology-semantic-taxonomy.test.ts` — 29 tests

## QA / Validation

- **PASS** — 29 tests. Written as domain assertions rather than mapping checks: each asks whether a
  knowledgeable reviewer could discredit the view on that point. Includes the four products that
  were previously misclassified, an assertion that none of them can ever be treated as a movement
  platform, that ETL / streaming / API-ESB stay three distinct types rather than collapsing into
  "middleware", that a shorter alias cannot swallow a longer recorded value, and that an unreviewed
  product stays `unknown` / `unclassified` with its raw value preserved.
- **PASS** — isolated `tsc --strict` on the module; `eslint` clean.
- **NOT RUN** — full repository typecheck. It exhausts heap locally on this machine; CI is
  authoritative and gates the PR.

## Rollout Plan

Merge to main. No runtime change — nothing imports the module. Steps 3–7 of the correction
(projection, renderer, snapshot regeneration, tests, live proof) follow as separate changes.

## Deployment Authority

Not applicable — adds a library module with no consumer. No image, flag, env, traffic or job change.

## Rollback Plan

Revert the commit. No consumer exists, so nothing else moves.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/6567
- The audit document itself, which records the measured distributions the taxonomy answers to

## Known Gaps

- **The projection still maps `platformOrDatabase` to a lane.** This release does not fix the live
  diagram; it establishes the semantics the fix will use. The interim lane relabel shipped earlier
  reduces the false claim but does not remove it.
- **Endpoints are still not joined to the application register**, so one tenant continues to render
  `APP-0093` rather than `Workday Core HR`.
- **One tenant's target topology is a generator artifact** — 499 flows to 499 distinct destinations,
  zero convergence, sequential ids. No projection can make that read as an estate; it needs source
  regeneration.
- **That tenant's snapshot is also stale** — 310 integration rows against 499 in the active source.
- `annualCostUsd` holds 3 distinct values across 301 records; the record browser labels it
  "not usable" rather than showing it.
