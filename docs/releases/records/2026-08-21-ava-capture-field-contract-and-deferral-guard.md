# Release Record — aVa Capture-Field Contract and Deferral Guard

## Release ID

`2026-08-21-ava-capture-field-contract-and-deferral-guard`

## Status

Ready for review — pending live proof. The contract and guard are now wired
through deterministic Moves chat draft generation and the phase page can insert
cited proposals as local drafts. Nothing is saved until the user explicitly
saves through phase capture.

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

Four changes:

1. **A `capture-field` artifact contract** — the shape a real proposal must
   take: phase, section key, value, and citations. Modelled on the existing
   `brief-field` artifact that Origination already uses, so this follows a
   proven pattern rather than inventing one.
2. **A deferral guard** — an answer that only promises work no longer renders
   with evidence furniture attached. It reports plainly that nothing was
   produced.
3. **A deterministic phase-input draft path for Moves chat** — draft-intent
   turns load approved upstream phase capture, build cited proposals with the
   same helper used by `/phase-input-draft`, and stream `capture-field`
   artifacts. The route does not call the model to invent field values.
4. **Insert-as-draft UI** — parsed `capture-field` artifacts become proposal
   cards on the phase page. The user may insert one into local draft state, edit
   it, and then save through the existing revision-fenced phase-capture path.

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
draft path is constrained to Moves phase surfaces and active phase-capture
fields.

## Changes Included

- `src/lib/agent/artifacts.ts` — add `CaptureFieldArtifact`, its parser case,
  union member, type-guard entry, and artifact-channel instructions.
- `src/lib/programs/deferral-only-answer.ts` (new) — detect an answer that
  promises work without doing any.
- `src/lib/programs/moves-chat-answer-packet.ts` — withhold readiness context
  from a deferral and report `no_data`.
- `src/lib/programs/ava-chat/*` — classify phase-input draft requests and build
  deterministic `capture-field` artifacts from cited proposals.
- `src/app/api/chat/agent/route.ts` — load existing phase capture values
  read-only and short-circuit draft-intent turns with deterministic artifacts.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — ingest
  streamed `capture-field` artifacts, surface cited proposals, and insert them
  as local drafts only.
- New and updated tests covering the parser, deferral guard, deterministic
  draft answer, and client insert-as-draft flow.

## QA / Validation

**Status: pass.**

- `jest .../capture-field-artifact.test.ts` — **pass**, 29/29.
- `jest .../deferral-only-answer.test.ts` — **pass**, 17/17, including the
  verbatim text observed live.
- Focused regression suite — **pass**, 5 suites / 128 tests:
  `capture-field-artifact`, `phase-input-draft-proposals`,
  `deferral-only-answer`, `ava-chat/packet`, and
  `MovesPhaseStandaloneClient`.
- Follow-up focused suite after UI/server edits — **pass**, 2 suites / 80
  tests: `ava-chat/packet` and `MovesPhaseStandaloneClient`.
- `tsc --noEmit` — **pass**, clean.
- Targeted `eslint` — **pass**, clean.
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

- Live signed-in proof is still pending. Local and unit validation prove the
  contract, deterministic draft generation, and client insert-as-draft flow.
- The deferral detector is heuristic and English-only. It is tuned to
  false-negative-averse behaviour: a missed deferral restores the original
  invisible failure, whereas a false positive suppresses context on a real
  answer and will be reported. It does not attempt to detect a confident,
  fluent, wholly fabricated answer — that is a different problem.
- The two standing citations on genuine Moves answers still describe the
  attached readiness tables rather than the prose. They are accurate about the
  artifacts, but a reader may take them as backing the narrative. Separating
  artifact-level from prose-level citations is not addressed here.
