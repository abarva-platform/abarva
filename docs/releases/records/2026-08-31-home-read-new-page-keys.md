# 2026-08-31-home-read-new-page-keys — Read the five intake families the projection now carries

## Release ID

`2026-08-31-home-read-new-page-keys`

## Status

`candidate`

## Plain-English Summary

The projection was extended to carry five intake families it had never held: metrics, risks,
programs, organisation ownership, and AI use cases. That was the write side. Nothing read them.

This is the read side. Those five become browsable record types, and two of them become surfaces
with tables and findings: the metrics family behind Performance & Value, and the risk register
behind What Needs Attention.

The metrics family is the one worth naming. Forty-three value claims are blocked, and **every one of
them already states the action that would unblock it and the period it is due**. That list has been
sitting in the record unreadable by any surface. It is now a table.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 3 / canonical model:** unchanged. This reads projection rows the loader already emits.
- **Layer 4 / products:** five new record types in the Home bundle; two new surfaces.

## Client Applicability

- All clients: yes, once the projection carries the rows for that tenant
- Feature flag: none

## Changes Included

- `scripts/data-build/technology-estate.ts` — the record-type union gains the five families, with
  labels and primary dimensions. The bundle field keeps its `technologyEstate` name deliberately;
  see the comment there.
- `src/lib/home/preview/ecl-projection-bundle.ts` — five row mappers and five record types. The
  loader puts the whole intake row in the payload, so each mapper renames to camelCase and does
  nothing else: no defaulting, no deriving, no filling.
- `src/components/home/v4/RecordBrowser.tsx` — column presets and slice pairings per family.
- `src/components/home/v4/page-tables.ts` — metric and risk tables and findings.
- `src/components/home/v4/chapter-page-content.ts`, `HomeV4App.tsx` — Performance & Value reads
  metrics; What Needs Attention reads the register.
- 5 new test cases.

### A family the projection has not loaded produces nothing

Each record type builds only when its page key has rows. That is what lets a surface report the
absence rather than render an empty table, and it means this ships safely before any load has run.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — 79/79, ten suites
- PASS `tsc --noEmit -p tsconfig.json` · `npx eslint` (0 errors)

### What the new surfaces produce

Against the intake:

```
Can this value be claimed      27 pending attestation · 16 not ready · 7 claimable
What would unblock each claim  43 of 43 blocked claims name their own action
Severity against control state 23 medium · 11 low · 6 high, $8.3M to remediate
```

Sample rows from the unblock table, verbatim from the record:

- _Finance will not attest until the comparison cohort is agreed_ → **Agree the cohort definition,
  then re-run** · FY2027 Q2
- _Benefit is real but not separable from two other programmes_ → **Agree an attribution method, or
  accept a share** · FY2027 Q2

And one finding that reconciles with the risk register independently: a single high-severity risk
has no operating control, and it is the evidence gap tied to the priority the enterprise declares
above all others.

## Rollout Plan

Merge to main. No migration, no data-plane mutation, no traffic change. The rows appear when the
governed load runs.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: not affected
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, after the governed load

## Rollback Plan

Revert the commit. The five record types stop building and the two surfaces lose their tables;
nothing else changes.

## Audit Evidence

- Test output, including the empty-family case that asserts nothing is built without rows.

## Known Gaps

- **Programs, organisation ownership and AI use cases are readable but have no surface yet.** They
  build as record types and are browsable; tables and findings for them are not written.
- **The rows require the governed migration and load before they appear.** The code is safe without
  it: absent rows produce no record type.
- Verified by test and typecheck; a signed-in browser check is owed after the load.
