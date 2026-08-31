# 2026-08-31-home-programme-and-ai-surfaces — Programmes and AI, and a claim that would have been false

## Release ID

`2026-08-31-home-programme-and-ai-surfaces`

## Status

`candidate`

## Plain-English Summary

Two more intake families become surfaces: the programme portfolio behind Strategy & Value Creation,
and the AI use-case register alongside it.

The programme surface produces a finding that neither of its columns holds alone. Status and
completion are declared separately in the record, and they disagree: **ten programmes report on
track at under 10% complete**, including the one carrying the enterprise's largest declared
priority. That is a governance fact rather than a delivery one, and nothing in the record explains
how the assessment was reached.

The AI surface produced a claim that would have been false, caught before it shipped and described
below.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 3 / canonical model:** unchanged.
- **Layer 4 / products:** two new surfaces with tables and findings; one new unsupported-view check.

## Client Applicability

- All clients: yes, once the projection carries the rows
- Feature flag: none

## Changes Included

- `src/components/home/v4/page-tables.ts` — programme status against money and progress, the
  blocking-reason list, AI status and value-archetype tables, and their findings.
  `unsupportedAiViews` names the value columns the use-case file does not carry.
- `src/components/home/v4/chapter-page-content.ts`, `HomeV4App.tsx` — Strategy & Value Creation
  reads programmes and AI.
- 5 new test cases.

### A claim that would have been false

The AI value fields — whether a use case may book realized value, and how much has been finance
validated — live in the benefits ledger, not in the use-case file this surface reads. Written
naively, the finding fired off the absent column and stated **"18 of 18 AI use cases may not book
realized value"**.

Every one of those eighteen rows is silent on the question. An absent column and a column full of
"no" are the same rows and opposite claims, and the original version picked the wrong one.

The finding now fires only where the gate is actually declared, and the absence is reported as a
view the page cannot build — naming the column and where it really lives. This is the second time
this session that distinction has caught a false statement, which is the argument for the check
existing at all.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — 91/91, ten suites
- PASS `tsc --noEmit -p tsconfig.json` · `npx eslint` (0 errors)

### Gate observed failing

A use-case set with no `realizedValueAllowed` column must produce no booking-gate finding and must
name that column as unsupported. A set that declares the gate must produce the finding and must not
name it. Both asserted.

### What the programme surface produces

```
Status                Programs   Budget    Expected value   Median complete
on_track                    16   $433.0M         $479.1M                8%
active                      10    $63.7M          $89.3M               65%
at_risk                      5   $107.0M         $130.4M                8%
planning                     4    $81.0M          $84.2M                3%
```

Reported status and declared progress do not move together: the programmes calling themselves on
track have a median completion of 8%, while those marked merely active sit at 65%.

## Rollout Plan

Merge to main. No migration, no data-plane mutation, no traffic change.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: not affected
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, after the governed load

## Rollback Plan

Revert the commit. The two surfaces lose their tables and findings; nothing else changes.

## Audit Evidence

- Test output including both halves of the booking-gate case.

## Known Gaps

- **Organisation ownership is readable but has no surface.** It builds as a record type and is
  browsable; tables and findings for it are not written.
- **The AI value story stays incomplete until the benefits ledger is a page key of its own.** The
  surface now says so rather than implying the answer is no.
