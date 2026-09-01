# 2026-09-01-home-lands-on-the-chapters — Home opens on the briefing

## Release ID

`2026-09-01-home-lands-on-the-chapters`

## Status

`candidate`

## Plain-English Summary

Home is two rails: the briefing, then the evidence. A reader lands in the briefing, at chapter one.

That is not what it did. A six-section summary layer stood in front of the chapters, reporting its
own build state to the reader — a section counter, readiness pills, and two sections that described
themselves as deferred. It came off the landing path; the chapters are the landing surface.

Reviewing every one of the resulting surfaces then found five more defects, each the same shape:
the page addressed the builder rather than the reader, or repeated itself.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 1 / intake:** unchanged.
- **Layer 2 / adapters:** unchanged.
- **Layer 3 / canonical model:** unchanged. No value is computed differently; one signal-packet
  sentence is worded differently at build time.
- **Layer 4 / products:** the Home landing surface, its chapter content, and the removal of a
  build-status page and the pre-v4 component set.

## Client Applicability

- All clients: yes. Every change is structural, none is tenant-conditional.
- Feature flag: none.

## Changes Included

### The landing surface

- `HomeV4App` opens on chapter one of the briefing. The executive-story view, its hash routes
  and its rail entry are removed; `ExecutiveStoryPage.tsx` is deleted.
- The vocabulary rules that page carried move to `cxo-language.ts`, because they were never that
  page's rules — they belong to every surface a client reads.

### Language that belonged to the build

- Machine identifiers (`value_realisation`, `on_premise`, `legacy_stable`) were printed in prose,
  table cells, the architecture crosstab, the platform-inventory line, the constant-column note and
  the evidence browser. **No component called the laundering function at all** — it existed only on
  the deleted page. Fixed at the source where the sentence is built, and at each render path.
- The gate now matches **by shape** — two or more lowercase words joined by underscores — rather
  than against a list of terms somebody thought of in advance. Tokens carrying digits are left
  alone: a reference is something a reader may need to quote back.
- Removed: the "CXO readout" label, the counters of statements/exhibits/questions/limits, and the
  cards that narrated their own emptiness ("No exposure has been established for this chapter").
- Reworded authored strings that said "governed projection" and "source projection".

### Exhibits and tables that did not belong to their page

- The renewal timeline was drawn on all eight chapters, wherever contract rows existed. It now
  draws only where the chapter reasons from contracts — Strategy, and Performance & Value.
- Technology & Data and What Needs Attention rendered **five identical tables**. Table sources and
  finding sources are now separate: What Needs Attention still reasons about applications without
  re-describing them.

### The interviews

- Leadership Perspective showed **2 excerpts from one office**. The record holds **17 from five**.
  The chapter-evidence branch was evaluated before the leadership branch, so the chapter whose whole
  subject is what leaders said got whichever signals its own claims happened to cite.
- Now: every excerpt, grouped by the office that said it, rendered as a quotation rather than as the
  sentence the packet built around it.
- The day-one briefing had the same defect — five quotes, all one office, taken by rank. Now
  round-robin: no office gets a second quote until every office has one.

### Sunset

- Deleted `HomePreviewApp`, `ChapterSection`, `CurrentState`, `TechnologyEstateTable` and their
  tests — 1,021 lines of the pre-v4 Home, orphaned.
- `CurrentState` was reachable in the nav as "What has been loaded". It reported the packet's
  internals — "2 signals · 0 governed facts" for a family whose register beside it reads 306.
- Its tenant-isolation test was **ported to the current surface**, and only then was the old one deleted.
  Tenant isolation is a property of Home, not of whichever component draws it.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **163/163**
- PASS `tsc --noEmit -p tsconfig.json`
- PASS `npx eslint` — 0 errors
- `src/components/home` against `origin/main`: **8 failures before, 5 after**. Three removed with
  the dead code; none introduced.
- A new sweep renders **every** surface and asserts no machine identifier and no build-state
  language on any of them — the earlier gate checked the landing page only, which is why five other
  render paths were leaking.

## Rollout Plan

Merge to main and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: verified as part of the deploy
- Worker image invariant: not affected
- Live signed-in proof required: yes, before this is called live-proven

## Audit Evidence

- Test output for the 163-case suite, including the every-surface sweep.
- Rendered output of all fifteen surfaces, read out of the DOM, showing zero machine identifiers and
  zero build-state language.
- Before/after failure counts for `src/components/home` measured against `origin/main`.

## Rollback Plan

Revert the commit. The landing surface returns to the summary layer and the deleted components
return with it. Nothing outside Home imports any of them.

## Known Gaps

- **One chapter still cannot answer its question.** How We Operate holds a single grounded
  statement and tabulates infrastructure, because the organisation rows are not loaded. It no longer
  narrates that absence, but the gap is real and is a data-plane matter.
- Five families — metrics, risks, programmes, organisation and AI — are mapped in code but their
  page keys are not loaded in the shared data plane.
- Tooltip attributes still carry stored values; only visible text is laundered.
- A signed-in product proof is still owed.
