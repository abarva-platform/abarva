# 2026-10-05-u568-journey-aware-phase-rail-read-through — Source workspace phase rail: journey read-through and defect pin

## Release ID

`2026-10-05-u568-journey-aware-phase-rail-read-through`

## Status

`candidate`

## Plain-English Summary

The Source workspace shows an event's progress as four phases. The fourth of
them stands for the market-package stage. One of the two governed sourcing
journeys — the incumbent-renegotiation journey — declares that stage **skipped**:
an event on that journey will never visit it.

The workspace did not know which journey an event was on. So a renegotiation
event in flight was shown that fourth phase labelled `Later`, which claims
pending work the governed path will never ask for, and once the event moved
past, the same phase read `No record`, which claims a gap in work that was
never on its path.

This change gives the surface the fact it was missing: the event's sourcing
motion is carried onto the workspace view, and the resolved journey — including
which phases it skips — can now be read from it. Nothing the operator sees
changes yet. **What the rail should do about a skipped phase is a product
decision and is deliberately not taken here**: drop the phase, or mark it
skipped in its own words. Relabelling it `Recorded` is not an option, because
that would assert work nobody did.

So that the defect cannot quietly persist, the two wrong labels are pinned by
two expected-failure tests. They pass today by failing, and they turn the
required suite red the moment the rail stops making either claim — which is how
the chosen remedy gets noticed rather than merged silently.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not
feature-gated. It changes no rendered output and no client-scoped data.

- **Layer 4 — Products (Source).** A read-through onto the Source workspace
  view plus two pinned test cases. No rendered output changes.
- **Layer 3 — Canonical model.** Unchanged. The journey resolver
  (`getSourceJourneyForEvent`) is already journey-complete; nothing is inferred
  here that it does not already decide, and no new vocabulary is introduced.
- Layers 1 and 2 untouched. No schema, loader, adapter or projection change.

## Client Applicability

- All clients: the read-through ships for every tenant the Source workspace
  serves. It changes no rendered output, so no tenant sees a behaviour change.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/new-workspace/phase-state.ts` — adds
  `SOURCE_NEW_PHASE_STAGE_KEYS` (the canonical stages each product phase stands
  for), `sourceNewJourneyForEvent`, `sourceNewPhaseIsSkipped` and
  `sourceNewSkippedPhases`.
- `src/components/source/new-workspace/SourceNewWorkspace.tsx` — adds
  `sourcingMotion` to `SourceNewEventView`.
- `src/app/(maestro)/source/new/[eventId]/page.tsx` — passes the event's
  recorded motion through, from the same field the stage plan snapshot on that
  page already resolves from, so the rail and the stage plan cannot end up on
  different journeys.
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx` — four
  passing cases for the read-through and two expected-failure pins for the
  rail's two wrong labels.

## QA / Validation

Baseline and result measured over the same scope in a clean worktree off
`origin/main` at `9125818a21`.

- **Defect reproduced by execution first.** With the two pins written as
  ordinary tests: `2 failed, 4 passed` in
  `SourceNewWorkspace.test.tsx` — the rail rendered `Later` for the skipped
  phase on an in-flight renegotiation event and `No record` once past it.
- **With the pins marked as expected failures:** `74 passed, 74 total` in that
  suite. It runs by named file in the required `AI surface control catalog`
  check.
- **The pin was deliberately broken** by inverting one assertion so its body
  passes: Jest reported `Failing test passed even though it was supposed to
  fail`, `1 failed`. The pin is therefore live, not decorative.
- **Six mutations of the delivered half, all killed** (baseline `2 failed,
  4 passed`; each mutation adds at least one failure):
  `every`→`some` in the skipped-phase predicate (`3 failed`); the
  empty-stage-set guard inverted (`5 failed`); the motion field read as `null`
  (`3 failed`); the trigger read as `null` (`3 failed`); the `rfi` phase mapped
  to no stage (`5 failed`); the `define` phase mapped to one stage
  (`3 failed`).
- **Both affected suite directories, whole:**
  `npx jest src/lib/source/new-workspace src/components/source/new-workspace`
  → `20 suites, 260 tests, all passed`.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` →
  exit `0`, no diagnostics.
- `npx eslint` over the four changed files → exit `0`.

One assumption was corrected by execution during the work: the first draft of
the read-through test asserted that an event with no recorded motion resolves
to the competitive journey. It does not — the resolver reads the event's own
facts, and the fixture's trigger text resolves it to the renegotiation journey.
That case is now asserted as the resolver actually behaves, and it widens the
defect: it is not confined to events that carry the motion explicitly.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys as usual. No migration, no data build, no flag, no env var, no worker
job change. Nothing about this change requires a deploy to be correct — it
alters no rendered output — so no live signed-in proof is claimed for it.

## Deployment Authority

Not applicable in substance; recorded for completeness.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change runs no Azure command.
- Approved image digest: whatever that workflow pins for the merge commit; this
  record asserts no digest.
- ACA runtime invariant: unchanged by this release.
- Worker image invariant: unchanged by this release.
- Feature/env flag update path: none used.
- Live signed-in proof required: no — no rendered output changes. The remedy
  that follows will change rendered output and will need one.

## Rollback Plan

Revert the squash commit. The change is additive: four new exported functions,
one optional field on a view interface, one pass-through, and test cases. No
state is written and no stored shape changes, so a revert needs no migration or
backfill.

## Audit Evidence

- Pull request and its CI run, including the required `AI surface control
  catalog` check that runs the suite holding the pins.
- The baseline/result and mutation numbers above are reproducible with the
  commands named in **QA / Validation** at the merge commit.
- Backlog item `U-568` and the claim line for it in the append-only register.

## Known Gaps

- **The remedy is not taken, by design.** Which way the rail reports a skipped
  phase — dropped, or marked skipped in its own words — is a product decision.
  Until it is made, a renegotiation event still reads `Later` or `No record` on
  the market-package phase. The two expected-failure pins hold that open.
- The new `sourcingMotion` field has no consumer in the component yet; the
  remedy is its first one. The pins are what prevent that from being forgotten.
- `sourceNewSkippedPhases` reports only phases whose every canonical stage is
  skipped, and `request`/`suppliers` map to no canonical stage, so neither can
  ever be reported as skipped. That is correct for the two journeys defined
  today and is stated in the code; a future journey that skips intake would
  need the mapping extended rather than the rule relaxed.
- Nothing here addresses the Responses-stage reachability question filed
  separately as `D-522`; this item was found while settling that one and is
  independent of it.
