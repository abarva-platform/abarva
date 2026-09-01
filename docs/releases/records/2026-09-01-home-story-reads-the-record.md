# 2026-09-01-home-story-reads-the-record — A planner's silence is not the record's silence

## Release ID

`2026-09-01-home-story-reads-the-record`

## Status

`candidate`

## Plain-English Summary

The landing surface of Home is the executive story: six sections, each answering one question a
leader arrives with. Two of the six reported themselves as **deferred** — "this section is
intentionally held", "the current evidence does not support a publishable claim".

That was not true. The evidence was in the same bundle, one prop away.

A section is populated by an upstream planner that writes a claim per section. When the planner
fails to produce one, the section rendered an empty state — while the rows that answer its question
sat in the bundle it was already holding. The reader was told the enterprise had nothing to say
about what it is betting on, when what had actually happened is that nobody wrote a sentence.

Sections now fall back to the deterministic depth engine: the same tables and findings that the
chapter pages compute directly from estate rows. A section with no planned narrative reports what
its rows say, labelled as read rather than written.

Against the current record this moves the story from **two sections ready** to **five of six**. The
sixth stays deferred, correctly: it asks what the enterprise _is_, and no estate file answers that.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 1 / intake:** unchanged.
- **Layer 2 / adapters:** unchanged.
- **Layer 3 / canonical model:** unchanged. No new value is computed; the same row filters that
  already run on chapter pages are reached from one more surface.
- **Layer 4 / products:** the executive story renders computed depth where a narrative is absent.

## Client Applicability

- All clients: yes. A section falls back only where the bundle carries rows for its families, so a
  tenant with a thinner record simply keeps the honest deferral.
- Feature flag: none.

## Changes Included

- `src/components/home/v4/chapter-page-content.ts`
  - `estateFromBundle(bundle)` — every estate family the bundle carries, keyed once from one
    object-type map. Previously this object was assembled inline at each call site, so a family
    added to the projection reached only the call sites someone remembered to update.
  - `sectionDepth(chapterIds, estate)` — depth across the several chapters a story section spans.
  - `chapterDepth` now delegates to the same internal, so both paths cannot diverge.
  - Fixes an omission on the way through: AI use cases had an unsupported-views builder that was
    never called, so views the AI rows could not support were silently dropped rather than named.
- `src/components/home/v4/ExecutiveStoryPage.tsx` — a section with no lead claim and non-empty depth
  renders findings, tables and unsupported views instead of an empty state; the rail and the
  readiness line report it as read from the record rather than deferred.
- `src/components/home/v4/HomeV4App.tsx` — two duplicated inline estate objects replaced by the
  shared builder.
- `src/components/home/v4/__tests__/story-from-record.test.tsx` (new) — 11 test cases.

### Why the fallback is honest rather than a filler

The distinction the surface has to hold is between _no answer exists_ and _no sentence was written_.
Filling a deferred section with a model's inference would collapse that distinction, which is precisely what
the deferral exists to prevent.

Deterministic depth does not. Every figure rendered is a filter over governed rows, carries its own
provenance mark, and opens the same rows in the record browser. The section says so in a line above
the findings, and its label reads _read from the record_ — a different word from _ready_, because it
is a different thing.

A section whose families are genuinely absent still renders the empty state. The test suite asserts
that too; a fallback that always fires would be a fallback that proves nothing.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — 128/128, fourteen suites
- PASS `tsc --noEmit -p tsconfig.json`
- PASS `npx eslint src/components/home/v4/` — 0 errors
- Rendered against the golden snapshot with the story plan removed entirely — the worst case — and
  read out of the DOM:

```
Executive story  5 of 6
  What this enterprise is      deferred
  What it is betting on        from record
  What it runs on              from record
  What it costs and returns    from record
  What is exposed              from record
  What needs attention         from record

06 · read from the record — What needs attention
  What does not reconcile — six today
  108 applications holding PHI authenticate on local accounts.
```

Tests assert both directions: that a section with rows stops reporting deferred, and that the one
without rows keeps doing so.

## Rollout Plan

Merge to main and deploy through the repo-owned workflow. No migration, no data-plane mutation, no
traffic-shaping outside the standard revision cutover.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none in this change
- ACA runtime invariant: not affected by the change; verified as part of the deploy
- Worker image invariant: not affected
- Feature/env flag update path: none
- Live signed-in proof required: yes, before this is called live-proven

## Rollback Plan

Revert the commit. Sections return to reporting themselves as deferred. Nothing else on the page
depends on the new exports beyond the two call sites that were previously inline.

## Audit Evidence

- Test output including the rail read-out above and the negative case.

## Known Gaps

- **The fallback reaches only families the projection has loaded.** Five families — metrics, risks,
  programmes, organisation and AI — are mapped in code but their page keys are not yet loaded in the
  shared data plane, so on the live record those sections fall back to the families that are
  present. Loading them is a separate governed change and is not attempted here.
- **Two of three designed charts remain unbuilt** — segment gap and cost concentration.
- A signed-in product proof is still owed for this surface.
