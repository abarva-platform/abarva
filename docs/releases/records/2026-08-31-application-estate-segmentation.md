# 2026-08-31-application-estate-segmentation — Segment every domain onto the declared business spine

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

- `config/segmentation/health-system-v1.json` (new) — 79 category-to-archetype assignments, 25
  business-function assignments carrying segment key, clinical flag and office layer, and the
  hosting normalisation. Carries its own rationale for being declared rather than inferred, and a
  written note on each contested assignment.
- `scripts/data-build/segment-spine.ts` (new) — cross-domain attribution onto the declared spine,
  and each segment's share of each domain against its declared revenue share.
- `scripts/data-build/report-segment-spine.ts` (new) — CLI for the cross-domain table.
- `scripts/data-build/__tests__/segment-spine.test.ts` (new) — 7 cases.
- `scripts/data-build/application-segmentation.ts` (new) — segmentation, crosstabs, and the
  estate-share-versus-revenue-share comparison. Pure and deterministic.
- `scripts/data-build/report-application-segmentation.ts` (new) — CLI; prints four crosstabs and
  writes them as JSON for a page packet.
- `scripts/data-build/__tests__/application-segmentation.test.ts` (new) — 10 cases.

## QA / Validation

- PASS `npx jest scripts/data-build/__tests__/application-segmentation.test.ts` — 11/11
- PASS `npx jest scripts/data-build/__tests__/segment-spine.test.ts` — 7/7
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

### The spine is declared, not invented

An earlier revision of this work invented a three-way split and hardcoded the revenue shares beside
it. That was wrong: the intake already declares the segments in `01b_business_segments.csv`, with a
revenue share, a revenue figure and a named P&L owner for each, and the AI use-case file already
carries the same vocabulary. Two segmentations that do not share a vocabulary cannot be crossed,
which is the entire value. Every domain now joins the declared spine, and the revenue shares are
read from that file rather than restated.

### What the numbers say for the delivery-network tenant

Six domains attributed, **zero unattributed records** in any of them.

| segment | rev% | apps | vendors | risks | workforce | metrics | AI |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Hospital & Acute Delivery | 42 | 220 / $364M | 19 / $174M | 10 | 14 | 8 | 8 |
| Health Plan Operations | 40 | 33 / $25M | 13 / $67M | 10 | 9 | 24 | 6 |
| Ambulatory & Physician Network | 15 | 13 / $7M | **0** | 2 | 6 | 1 | 3 |
| Shared Enterprise Services | 3 | 40 / $41M | 40 / $256M | 18 | 16 | 17 | 1 |

Share of each domain against declared revenue share, negative meaning the segment gets less than its
revenue implies:

| segment | rev% | apps | vendors | risks | workforce | metrics |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Health Plan Operations | 40 | 10.8% (−29.2) | 18.1% (−21.9) | 25% (−15) | 20% (−20) | 48% (+8) |
| Hospital & Acute Delivery | 42 | 71.9% (+29.9) | 26.4% (−15.6) | 25% (−17) | 31.1% (−10.9) | 16% (−26) |
| Ambulatory & Physician Network | 15 | 4.2% (−10.8) | **0% (−15)** | 5% (−10) | 13.3% (−1.7) | 2% (−13) |
| Shared Enterprise Services | 3 | 13.1% (+10.1) | **55.6% (+52.6)** | 45% (+42) | 35.6% (+32.6) | 34% (+31) |

Three observations the table makes unavoidable. A segment carrying 15% of revenue has no vendor
contract attributed to it at all. The segment carrying 3% of revenue holds 55.6% of vendor contracts
and 45% of recorded risk, so the commercial and risk concentration sits in shared services rather
than in either operating business. And the segment carrying 40% of revenue runs on 10.8% of the
applications.

The table does not decide whether each of those is a finding or a hole in the record. It makes the
question unavoidable, which is the job.

Within the application estate itself: departmental clinical systems hold $273.0M of the $436.5M
against $19.2M for the clinical core, so this is not the single-platform shop it looks like from
outside; and the two operating segments run incompatible hosting models — one SaaS-led, the other
almost entirely self-hosted or vendor-hosted.

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
- **Two contested assignments are unresolved by design.** Clinical informatics is the larger one —
  99 of 306 applications — and a shared-services reading is equally defensible; it is the single
  decision that most changes every table here. Population health is the smaller, at roughly fifteen
  applications. Both carry written notes; both are the client's call, not the tool's.
- **Programs are not yet attributed.** That file joins on a sponsor role rather than a business
  function, so it needs the org file as an intermediate hop. Not in this release.
- **Cost is taken as declared.** `annual_cost_usd` is used as given; this release does not
  reconcile it against the spend file.
