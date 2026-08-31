# 2026-08-31-application-estate-segmentation — Segment the application estate deterministically

## Release ID

`2026-08-31-application-estate-segmentation`

## Status

`candidate`

## Plain-English Summary

Executives ask four questions about an application estate: what kind of system is it, where does it
run, which part of the business does it serve, and is it clinical. Three of those are already
columns in the source file, so segmenting on them is arithmetic, not interpretation. The fourth —
what kind of system it is — is carried in a free-text category column with 79 values, so it becomes
a lookup over a mapping a human owns rather than a judgement a model makes on every run.

Asking a model to segment an estate produces categories that read well and do not reconcile to a
count. This computes the segmentation instead, so every cell can be checked by filtering the source
file, and the model's job shrinks to saying what the pattern means.

The mapping is a declared file because the questions inside it are business decisions, not technical
ones. Whether population health belongs to the plan or the provider moves roughly fifteen
applications, and it is the client's call, not the model's. That entry carries a written note saying
so.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 1 / client intake:** unchanged. Reads the existing estate file.
- **Layer 3 / canonical model:** unchanged. No schema, migration, or projection change.
- **Layer 4 / products:** unchanged. Nothing here is on a request path yet.
- **Build/QA tooling:** adds a deterministic segmentation engine, a reporter, and a declared map.

## Client Applicability

- All clients: no — the map is industry-shaped
- Specific clients: applies cleanly to the integrated-delivery-network tenant; correctly refuses the
  airline tenant, which needs its own map
- Internal only: yes — build tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `config/segmentation/health-system-v1.json` (new) — 79 category-to-archetype assignments, 22
  business-function assignments carrying business line, clinical flag, and office layer, and the
  hosting normalisation. Carries its own rationale for being declared rather than inferred.
- `scripts/data-build/application-segmentation.ts` (new) — segmentation, crosstabs, and the
  estate-share-versus-revenue-share comparison. Pure and deterministic.
- `scripts/data-build/report-application-segmentation.ts` (new) — CLI; prints four crosstabs and
  writes them as JSON for a page packet.
- `scripts/data-build/__tests__/application-segmentation.test.ts` (new) — 10 cases.

## QA / Validation

- PASS `npx jest scripts/data-build/__tests__/application-segmentation.test.ts` — 10/10
- PASS `npx eslint` on all three new TypeScript files
- PASS `tsc --noEmit -p tsconfig.json` (full project)
- Ran against both active tenants

### Gate observed failing

- An unmapped source value is **named**, not absorbed into an "other" bucket that would hide how
  much of the estate went unsegmented. Covered by a planted case.
- Run against the tenant the map was not written for, the reporter segments 9.7% of the estate and
  lists all 96 unmapped values by name. A taxonomy for one industry applied to another should fail
  loudly, and it does.
- Crosstab totals are asserted to reconcile across rows, columns and the grand total, and every
  application is asserted to land in exactly one cell.

### What the numbers say for the delivery-network tenant

306 applications, $436.5M annual cost, zero unmapped values.

| line | apps | app share | cost share | revenue share | gap |
| --- | ---: | ---: | ---: | ---: | ---: |
| provider | 241 | 78.8% | 87.2% | 60% | **+27.2** |
| plan | 33 | 10.8% | 5.7% | 40% | **−34.3** |
| corporate | 32 | 10.5% | 7.1% | — | — |

Revenue shares are declared facts from the enterprise profile, not derived here. The line carrying
40% of revenue runs on 5.7% of technology cost. That is either the finding of the engagement or a
hole in the record, and the table does not decide which — it makes the question unavoidable.

Two further observations the crosstabs surface: departmental clinical systems hold $273.0M of the
$436.5M, against $19.2M for the clinical core, so the estate is not the single-platform shop it
looks like from the outside; and the two lines run on incompatible hosting models — the plan is
SaaS-led, the provider is 96% self-hosted or vendor-hosted.

## Rollout Plan

Merge to main. No runtime rollout, no image build, no traffic change, no migration.

## Deployment Authority

- Repo-owned deploy workflow: not exercised
- Shared runtime mutators: none in this change
- Approved image digest: not applicable
- ACA runtime invariant: not affected
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: no — no product surface changes

## Rollback Plan

Revert the commit. All four files are additive and unreferenced by any runtime path.

## Audit Evidence

- Test output, including the unmapped-value planted case.
- The reporter output for both active tenants, which is re-derivable from the source file at any
  time and states its own unmapped set.

## Known Gaps

- **The second tenant has no map.** It needs its own industry taxonomy; the reporter names all 96
  unmapped values, which is the input to writing one.
- **Not yet wired to a page packet.** The reporter writes JSON; nothing consumes it.
- **The contested assignment is unresolved by design.** Population health is assigned to the plan
  line with a written note; moving it shifts roughly fifteen applications and is the client's call.
- **Cost is taken as declared.** `annual_cost_usd` is used as given; this release does not
  reconcile it against the spend file.
