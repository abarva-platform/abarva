# Components/view models pinned to `SOURCE_INCOMPLETE`

Per the task brief: "the live Airline corpus currently contains only ~10 structured interview rows
and no complete C-suite transcript family. Therefore Leadership Agenda, C-suite Perspectives,
Leadership Disagreements, Executive Commitments, and full aVa leadership reasoning must resolve to
`SOURCE_INCOMPLETE`... today — do not build logic that tries to synthesize these from thin data, and
do not use illustrative/prototype quotes as a fallback for real ones under any circumstance,
including in tests."

This PR encodes that as a **fixed allow-list** inside the assembler (see
`VIEW_MODEL_ASSEMBLER_INTERFACES.md` §5), not a runtime row-count heuristic — the assembler does not
try to infer "is this sparse" from the data itself.

## The five, and the corroborating evidence found in code (independent of the task brief's own note)

1. **Leadership Agenda** (`LeadershipAgendaViewModel`, sourced from `EnterpriseBriefV1.perspectives`)
2. **C-suite Perspectives** (same field — Brief mode's "Leadership against evidence" section, per
   `brief/PerspectivesPanel.tsx`)
3. **Leadership Disagreements** (would require ≥2 differing perspectives on the same topic; cannot
   exist while the source field is empty)
4. **Executive Commitments** (would require a perspective linked to a target/decision; same upstream
   dependency)
5. **Full aVa leadership reasoning** (`AvaKnowledgePacket.executivePerspectiveRefs` — necessarily empty
   when no perspectives exist to reference; aVa correctly refuses per
   `DeterministicAvaReasoningProvider.ask()`'s own "refuse rather than estimate when scope carries no
   usable evidence" rule)

Corroborating evidence, found independently while reading the real implementation (not just taking
the task brief's note at face value):

- `consumption-server/shape.ts::shapeEnterpriseBrief` **unconditionally** sets `perspectives: []` and
  `interpretation: null` — there is no code path in the real server-side reader that populates these
  fields at all today, regardless of corpus size. This is a stronger statement than "the data is
  sparse" — the wiring itself doesn't exist yet.
- The foundation-closure record's `projection.counts` object lists 12 named projections with real row
  counts; `executive_perspective_v1` and `strategic_interpretation_v1` are **not among them** — i.e.
  the projection-build job that ran for `airline-demo-new` did not even attempt to build these two
  projections in this pass.
- `CONSUMPTION_PROJECTION_REGISTRY.json`'s own entry for `executive_perspective_v1` states
  `"partial_data_behavior": "synthetic/interview signals must carry source_basis"` — i.e. the contract
  itself anticipates and requires provenance-tagging for exactly this kind of thin-interview content,
  reinforcing that it is not meant to be filled with anything that lacks a real `source_basis`.

## What the assembler does instead (the "honest empty state," not a workaround)

`LeadershipAgendaViewModel`'s `ViewModelEnvelope` for `airline-demo-new` today:

```ts
{
  readiness: "SOURCE_INCOMPLETE",
  unavailableReason:
    "The interview corpus for this tenant does not yet support a complete leadership perspective " +
    "set (executive_perspective_v1 has not been built for the active baseline). This is a known " +
    "source-completeness gap, not a rendering or provider defect.",
  data: null,
  evidenceRefs: [],
  knownGapRefs: [],
  asOf: <the active baseline's asOf>,
  knowledgeBaselineRef: "airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1",
}
```

`data: null` is load-bearing: per the hard rule in the task brief and in `states.ts`'s own
`NON_VALUE_AVAILABILITY_STATES`, this must never be replaced by an empty array rendered as "no
perspectives exist" (a false claim — perspectives may well exist in the raw interview material; what's
missing is the governed, published projection) nor by any illustrative/prototype quote. The
`unavailableReason` string is the only content shown.

## Tests proving this (see `TEST_PLAN.md` §2 for the full list)

`src/lib/knowledge/view-model/__tests__/assembler.test.ts` includes a dedicated test asserting
`getLeadershipAgenda()` returns `readiness: "SOURCE_INCOMPLETE"` and `data: null` for the real
(HTTP-runtime-shaped) `airline-demo-new` case, using a locally-constructed envelope that mirrors what
`consumption-server/reader.ts` actually returns today (empty `perspectives`, `interpretation: null`) —
not the rich `fixture-airline-demo-new` fixture, which deliberately DOES have CIO/COO quotes populated
(`src/lib/knowledge/fixtures/airline-demo-new.ts`) precisely so the fixture path can demonstrate the
_mechanism_ working end-to-end once real data exists. The two are tested as clearly distinct cases,
each labeled by which provider/tenant it represents, so neither is ever presented as a stand-in for
the other.
