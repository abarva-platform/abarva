# Release Record — aVa Capture-Field Contract and Deferral Guard

## Release ID

`2026-08-21-ava-capture-field-contract-and-deferral-guard`

## Status

Merged — pending live proof. Inert by design: nothing emits or renders a
capture-field proposal yet. This lands the contract and the guard first so the
prompt and UI work has something to be correct against.

## Plain-English Summary

The Moves phase page has a "Draft proposed inputs" button. Live testing showed
it does not draft.

aVa's entire reply was: _"Looking at the active program — [Move name] — I'll
draft the P1 inputs from what's confirmed in the upstream record. Let me pull
the charter and origination brief together now."_ It then stopped. No fields,
no values, nothing.

That failure was invisible, because the client attaches a readiness chart, two
tables, two citations, two metrics and a next-steps list to **every** answer on
this surface. A one-sentence non-answer therefore rendered as a dense, sourced
scorecard. A reader skimming it would reasonably conclude the drafting had
happened.

Two changes:

1. **A `capture-field` artifact contract** — the shape a real proposal must
   take: phase, section key, value, and citations. Modelled on the existing
   `brief-field` artifact that Origination already uses, so this follows a
   proven pattern rather than inventing one.
2. **A deferral guard** — an answer that only promises work no longer renders
   with evidence furniture attached. It reports plainly that nothing was
   produced.

### Two decisions worth recording

**Citations are required, and an uncited proposal is dropped rather than
rendered.** A proposal a reviewer cannot trace is not a draft; it is a guess in
a draft's clothing. Silence is a safe output on a governed surface. An
untraceable suggestion in front of an approver is not.

**Proposals are never auto-applied.** Origination's equivalent artifact writes
straight into its fields. Phase capture will not: each proposal will need an
explicit insert action, because most of what P1 captures — sponsors, scope,
commitments, decision rights — is exactly the governed content that should not
be filled in by a model without a human act. Once inserted, the existing badge
machinery does the rest: an inserted value is a local draft, so it reads
`Editing` and cannot reach `Done` until the server acknowledges a save.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 (Products — Moves phase surface and the shared agent artifact
protocol). No canonical model change, no schema change, no migration.

## Client Applicability

All clients receive this change — it is not feature-flagged and no client is
opted out. The deferral guard affects aVa answers on Moves phase pages. The
artifact contract is inert until the prompt and UI increments land.

## Changes Included

- `src/lib/agent/artifacts.ts` — add `CaptureFieldArtifact`, its parser case,
  union member and type-guard entry.
- `src/lib/programs/deferral-only-answer.ts` (new) — detect an answer that
  promises work without doing any.
- `src/lib/programs/moves-chat-answer-packet.ts` — withhold readiness context
  from a deferral and report `no_data`.
- Two new test files, 46 tests.

## QA / Validation

**Status: pass.**

- `jest .../capture-field-artifact.test.ts` — **pass**, 29/29.
- `jest .../deferral-only-answer.test.ts` — **pass**, 17/17, including the
  verbatim text observed live.
- `tsc --noEmit` — **pass**, clean. `eslint` — **pass**, clean.
- `jest src/lib/agent src/lib/programs src/lib/ava-answer` — the failing-suite
  set is byte-identical to the pre-change baseline, verified by a stashed
  comparison.

Two defects were caught by these tests during development and fixed:

- The shared `stringArray` helper accepts any string of non-zero length, so a
  citation of `"  "` satisfied the citation requirement while citing nothing.
  The parser now requires non-blank citations.
- Splitting the answer into sentences was too coarse: models pack scene-setting
  and a promise into one sentence. Clause-level splitting was needed, plus
  dropping paired-dash appositives — otherwise the Move's own name read as
  substance and the real non-answer passed the guard.

## Rollout Plan

Standard main deploy through the repo-owned ACA main deploy workflow.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` only.

## Rollback Plan

Revert and redeploy. No migration to unwind, no persisted state depends on
either change.

## Audit Evidence

The reserved regression Move was used for the live observation that prompted
this work. Its capture values were confirmed unchanged afterwards — the assist
panel has no write path — and the content-addressed revision remained
`d66cbb39f61461dd` throughout.

## Known Gaps

- **Nothing emits a `capture-field` artifact yet**, so the button still does not
  draft. That is the next increment (prompt), followed by the insert-as-draft
  UI. Until then the guard makes the failure visible instead of disguised.
- The deferral detector is heuristic and English-only. It is tuned to
  false-negative-averse behaviour: a missed deferral restores the original
  invisible failure, whereas a false positive suppresses context on a real
  answer and will be reported. It does not attempt to detect a confident,
  fluent, wholly fabricated answer — that is a different problem.
- The two standing citations on genuine Moves answers still describe the
  attached readiness tables rather than the prose. They are accurate about the
  artifacts, but a reader may take them as backing the narrative. Separating
  artifact-level from prose-level citations is not addressed here.
