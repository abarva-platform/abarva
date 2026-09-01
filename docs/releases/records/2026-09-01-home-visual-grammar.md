# 2026-09-01-home-visual-grammar — Give each kind of statement its own form

## Release ID

`2026-09-01-home-visual-grammar`

## Status

`candidate`

## Plain-English Summary

A claim, a description, an exposure, an absence and a question rendered at one weight, separated
only by a coloured edge stripe down the left of a card. A reader had to parse which was which.

An edge stripe is also the one device the house conventions ban outright: it reads as generated
filler and carries no meaning anyone can name.

Each kind now announces itself in words. Colour is unchanged.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged, except one authored sentence reworded (see below).
- **Layer 4 / products:** finding and absence forms, and a new declared-provenance block.

## Client Applicability

- All clients. Feature flag: none.

## Changes Included

- `TableSet.tsx` — `STRIPE` becomes `KIND_FORM`. Every edge stripe is removed. An exposure carries a
  dot and the words _the record says this is wrong now_; an absence carries a dot and _not carried
  by the record_, above the view it cannot build; an established finding carries neither, taking its
  weight and its provenance mark instead.
- `ChapterPage.tsx` — a declared-provenance block at the head of a chapter.
- `ecl-projection-bundle.ts` — the synthetic-data disclosure reworded from internal phrasing to a
  sentence addressed to a reader.

### Colour is unchanged, and why

The reserved values already match the ones Tower's executive action queue and decision row use:

```
red    #a32d2d   rated high severity, and nothing else
amber  #ba7517   absence, and nothing else
green  #1d9e75
```

A second palette exists in Tower's pressure cards (`#E04444`, `#D97706`, `#0E9F8C`). That is an
inconsistency inside Tower rather than a standard this surface should adopt, and it is noted here
rather than acted on.

### The disclosure was in the wrong place, not the wrong words

The synthetic-data disclosure travelled as a **context item** — filed among the client's own
evidence, counted in their governed-fact total, and read at the same weight as a finding about their
enterprise.

It is the honest sentence on the page. Deleting it in a vocabulary sweep would have made the page
less honest while looking like cleanup. It is a declaration about the record, so it now renders as
one: at the head, in its own form, never counted as a finding.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **191/191**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- Rendered and read out of the DOM: exposure and absence marks present with their words, and
  **zero elements carrying an inset edge stripe**
- **Mutation-tested:** reinstating one stripe fails the no-stripe assertion; removed, all pass

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. Forms return to edge stripes and the disclosure to a context item.

## Audit Evidence

- Mutation-test result above.
- DOM read-out of the marks and the stripe count.

## Known Gaps

- The declared-provenance block renders only where the record carries such a declaration. The stored
  copy does not, so it is exercised against the served path only and the test skips when absent.
- Question and description forms are unchanged in this pass; they were already distinct in weight.
