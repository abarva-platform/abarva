# 2026-10-02-home-industry-context — Home v4 cockpit Industry context section

## Release ID

`2026-10-02-home-industry-context`

## Status

`candidate`

## Plain-English Summary

Adds an "Industry context" section to the Home v4 executive cockpit. It lists the analytical lenses
the governed record already carries — sector patterns and expert lenses — grouped by the kind the
record files each under, each shown as a short label with a plain-English kind tag. It is framed for
a newly arrived executive as "the forces shaping payer-providers like this one." The section is
qualitative orientation only: it states, in words, that it is not the enterprise's own attested fact
and not a peer benchmark, and it invents no number, no applicability, and no
business-versus-technology classification, because none of that is in the record. It renders only on
the opening orientation chapter and only when the record carries at least one lens.

## Layer Impact

Layer 4 (Products — Home) only, shipping in the `global-control-lane`. This is a presentation-only
projection change: a new read-only cockpit band reads an existing field off the signal packet and
renders its labels grouped by the in-record `kind`. No Layer 1 intake, Layer 2 adapter, or Layer 3
canonical model object is touched, and the band calculates nothing — it reflects labels the record
already holds, so the model supplies no fact or value.

## Client Applicability

- All clients: yes — shared Home v4 cockpit behavior, not feature-flagged.
- The band is self-gating: it appears only on the opening orientation chapter and only when the
  served record carries analytical lenses, so a tenant whose record has none sees no change.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/home/v4/ChapterPage.tsx`: new `IndustryContextSection` component plus a small
  reader for the lenses field, and one gated render site on the opening orientation chapter.
- `src/components/home/v4/__tests__/industry-context.test.tsx`: new test suite for the band.
- `docs/releases/records/2026-10-02-home-industry-context.md`: this record.

## QA / Validation

- `node scripts/quality/typecheck.mjs`: passed — typecheck clean, exit 0.
- `npx eslint` on the two changed source files: passed, exit 0.
- `node scripts/ci/test-ratchet.mjs docs/ci/home-test-baseline.json`: passed — "no movement away
  from the baseline"; 856/884 tests green afterwards, up from 850/878 before, with the 12 baselined
  failing suites unchanged.
- New suite (6 tests, all green) asserts the real labels render grouped by kind, the raw machine
  kind never reaches the reader, no invented number or currency appears, and the band is absent on
  other chapters and when the record carries no lens.
- Live signed-in browser render not performed here: it needs real auth and data-plane credentials
  this worktree does not hold.

## Rollout Plan

Merge to `main` by squash PR. No runtime rollout of its own — it ships with the next scheduled Home
image build and deploy through the repo-owned Azure Container Apps workflow. No migration, no flag,
no environment change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged by this record).
- Shared runtime mutators: none; this change mutates no shared runtime, traffic, or image template.
- Approved image digest: not applicable to this record; the standard digest-pinned deploy applies.
- ACA runtime invariant: unchanged.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, on the next Home deploy, as the standard Home route proof.

## Rollback Plan

Revert the single commit. The change is additive and presentation-only — removing the component and
its render site returns the cockpit to its prior output with no data, schema, or migration
implication.

## Audit Evidence

- The two changed source files and the new test file listed under Changes Included.
- Gate output quoted under QA / Validation: typecheck, eslint, and the test-ratchet before/after
  counts.
- PR URL and CI run to be attached when the PR is opened.

## Known Gaps

- The same lenses are also rendered on the leadership chapter by the pre-existing perspective layer;
  this record adds a distinct, newcomer-framed orientation band on the opening chapter and does not
  retire that layer. A later phase may consolidate the two treatments.
- Quantitative peer benchmarks are deliberately out of scope until a governed comparison dataset
  exists; no placeholder metric tiles were added.
