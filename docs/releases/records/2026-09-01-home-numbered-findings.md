# 2026-09-01-home-numbered-findings — Number the findings, and make the stripe rule real

## Release ID

`2026-09-01-home-numbered-findings`

## Status

`candidate`

## Plain-English Summary

Every claim on a chapter carried a coloured left border. It looked like meaning and was not: a
reader could not say what navy meant versus red beyond "this one is a risk", which the words already
said. It is also the device the house conventions ban outright.

Claims are numbered instead. A number says how many findings there are and which one this is, and
it survives being read aloud.

The wider point is the guard. A previous change removed one expression of the stripe and asserted
against that expression, so a second form of the same device survived untouched and untested.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged.
- **Layer 4 / products:** claim rows are numbered; the stripe assertion is rewritten.

## Client Applicability

- All clients. Feature flag: none.

## Changes Included

- `bands.tsx` — `ClaimRow` takes an index and renders `01`, `02`, `03` in a mono column where the
  coloured border was. Severity labels are unchanged and still carry their reserved colour.
- `every-surface.test.tsx` — the stripe assertion rewritten.

### Why the previous assertion did not hold

It matched `inset Npx 0 0` — the box-shadow form — because that is the form the change in front of
it had removed. A `border-left: 3px solid` on every claim row is the same device, was present the
whole time, and passed.

Two attempts at a fix were themselves instructive and are recorded here rather than tidied away:

1. A regex over **every styled element in the chapter** caught the claim rows and also caught a
   blockquote's left rule and the mark on a conflicting source — devices that carry meaning. A guard
   that needs an exemption list stops being a guard.
2. An earlier attempt at rewriting the assertion **silently did not apply** — the edit did not match
   after formatting, the old narrow test remained, and the suite passed. It was only found by
   mutating the source and noticing the suite still passed.

The assertion now covers the elements the rule is actually about — the cards and rows carrying a
claim, a finding or an absence — and is mutation-tested: reinstating the claim-row stripe fails all
five cases.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **197/197**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- **Mutation-tested:** claim-row stripe reinstated -> 5 of 5 fail; removed -> 197 pass

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. Claims return to a coloured left border.

## Audit Evidence

- Mutation-test result above.

## Known Gaps

- **Other single-side rules remain on this surface** — on the architecture page, the rail's selected
  item, a quotation, and the conflicting-source mark. Some carry meaning and some are decoration,
  and this change does not sort them. The rail's selected state is a design question handled where
  the rail is; the rest want a judgement per site rather than a sweep.
- The prose-only chapters are numbered but not yet re-laid-out; the questions and limits blocks the
  design calls for are a further change.
