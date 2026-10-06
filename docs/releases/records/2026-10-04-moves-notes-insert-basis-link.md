# 2026-10-04-moves-notes-insert-basis-link — Moves: an insert from notes records its own charter basis (flag OFF)

## Release ID

`2026-10-04-moves-notes-insert-basis-link`

## Status

`candidate`

## Plain-English Summary

Two capabilities already exist behind flags, and until now they did not know
about each other.

- `moves_capture_notes_v1` lets a person paste their notes from a client
  conversation and insert a chosen passage into a capture question. The panel
  already classifies such a fill as the person's own assertion and says so.
- `moves_charter_basis_v1` asks, per P1 Charter question, **how do you know
  this?** — backed by evidence, I'm asserting this, or it's an assumption — and
  records the answer against the field.

The gap was that inserting from notes filled the value and then still left the
person to declare the basis by hand, for a field whose provenance the product
had just established. Worse, it invited the wrong answer: the person who pastes
a note and is then asked how they know it has every reason to click *Backed by
evidence*, because they are looking at something that reads like a source.

This change makes the insert record the basis it already names. Inserting a
note-derived passage into a P1 Charter question stamps **I'm asserting this** as
that field's basis, through the same save the basis control uses, and the panel
says per field that it will do so before the person presses Insert.

It is deliberately narrow about what it will claim:

- **It records only an assertion.** An insert can never produce approved
  evidence, and it never guesses at an assumption's owner or validation plan.
- **It never overwrites a basis the person already declared.** An
  approved-evidence basis is not silently downgraded, and an assumption does not
  lose its owner and its Discover validation plan because text was pasted into
  the field afterwards. The field keeps what the person said.
- **It says so only where it is true.** The panel marks the specific proposals
  whose insert will stamp a basis. On a field the basis control does not govern,
  or with the basis capability off, the wording is unchanged and the person
  declares the basis themselves — telling them otherwise would be a false claim
  about where an answer came from.
- **The answer itself still follows the ordinary path.** Insert fills the field
  and the person saves it, exactly as for a typed answer. Only the basis is
  written at insert time, because where the text came from is known then and is
  not recoverable from the text later.

The link is reachable only when **both** flags are on for a tenant. Both are
`includeTenants: []`, so there is no change to the live product: with either
capability off the dock behaves byte-for-byte as it does today.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability. No new
flag is introduced: the behaviour is the conjunction of two existing OFF flags
(`moves_capture_notes_v1` and `moves_charter_basis_v1`), which is why the notes
record named this wiring as the reason the two flags were kept separate.

- `4 PRODUCTS` (Moves): one behavioural link inside the existing capture dock,
  plus per-field wording in the notes panel. No new route, no new request, no
  new saver — the basis is written through the host's existing
  `saveCharterBasis`, the same call the per-field control makes.
- `3 CANONICAL MODEL`: **untouched.** No new field, table, column, or canonical
  key. The basis is written into the existing `p1_charter_basis` map on the
  phase-capture state, in the existing `workspace_assertion` shape that
  `parseP1CharterBasisInput` already validates server-side.
- Layers `1 CLIENT INTAKE` and `2 SOURCE ADAPTERS`: not involved. The pasted
  text is typed by a workspace user into the browser; it is not an intake tab,
  not loaded through an adapter, not registered as a dataset or corpus object.
  Nothing is sent to a model, so no `GovernedObject`/agent-context path applies.

## Client Applicability

- All clients: No (both flags off for all).
- Specific clients: None yet.
- Internal only: No.
- Public/demo only: No.
- Feature flags: `moves_capture_notes_v1` and `moves_charter_basis_v1` (tenant
  policy, both `includeTenants: []`). The link requires both.

## Changes Included

- `src/lib/programs/capture-notes-basis-link.ts` — **new.** The decision alone,
  kept pure and out of both surfaces so each branch can be pinned on its own.
  `basisForNotesInsert` returns the basis to record plus a reason, and the four
  branches are ordered widest-first: basis surface off, not a charter field,
  basis already declared, record the assertion.
  `notesInsertBasisRecordingKeys` derives the set of fields an insert would
  actually stamp, which is what the panel needs so its wording is true of the
  field in front of the person rather than true in general.
- `src/components/strategic-moves/CaptureNotesFill.tsx` — added a presentational
  `recordsBasisFor` prop. Proposals in that set carry a line saying the insert
  also records *I'm asserting this* and that it never reads as evidence, and the
  standing top-of-panel warning gains one sentence while such a proposal is on
  screen. The warning that a paste is never approved evidence is unconditional
  and unchanged.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the dock's
  `onInsert` now goes through `insertPhaseCaptureValueFromNotes`, which sets the
  visible value exactly as before and then, per the decision above, records the
  basis through the existing `saveCharterBasis`. The recording key set is passed
  to the panel.
- `src/components/strategic-moves/__tests__/capture-notes-basis-link.test.ts` —
  **new**, 9 cases. Registered by exact path in
  `.github/workflows/ai-surface-control-catalog.yml`; it lives in the
  strategic-moves test directory because that directory is named in a required
  status check, while `src/lib/programs/__tests__` is swept by no job.
- `src/components/strategic-moves/__tests__/CaptureNotesFill.test.tsx` — 4 added
  cases for the per-field wording and its absence.
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`. Covered test files 2518 → 2519;
  uncovered unchanged at 164, which is what says the new suite is registered
  rather than merely added.

## QA / Validation

- `npx jest` on `capture-notes-basis-link` and `CaptureNotesFill` — **PASS**,
  24/24 across 2 suites. Each branch of the decision is pinned with the other
  conditions **satisfied**, not falsified together: the surface-off case keeps a
  real charter key and a null existing basis, and the not-a-charter-field case
  keeps the surface on. A both-blank fixture would stay green with either half
  of the guard removed.
- Neighbouring suites — **PASS**, 172/172 across 6 suites: `CharterBasisField`,
  `MovesCaptureFlow`, `MovesCaptureWorkspace`, `MovesPhaseStandaloneClient`,
  `phase-capture-autosave-lanes`, `p1-charter-evidence`.
- **Mutation check of the two load-bearing guards** — **PASS**. (a) Removing the
  already-declared guard, so an insert would re-stamp a field, turned 4 of 9
  decision cases red. (b) Making the panel claim unconditionally that an insert
  records the basis turned 2 of 15 panel cases red. The file was restored
  between runs and the full 24/24 re-confirmed afterwards. The guards are pinned
  by assertions, not merely satisfied by the fixtures.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS**, exit code 0, zero diagnostics.
- `npx eslint` on all changed and added files — **PASS**, 0 errors. Three
  pre-existing unused-variable warnings in `MovesPhaseStandaloneClient.tsx`
  (`MovesCaptureFlow`, `PHASE_CANONICAL_KEYS`, `_phase`) are untouched by this
  change and present on `main`.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**, all gates.
- Signed-in live walk — **NOT RUN**, and not claimable. Both flags are off for
  every tenant, so the link fires on no surface and there is nothing to walk. It
  is owed as the gate on enabling the first tenant and recorded under Known Gaps.

## Rollout Plan

1. Merge with both flags unchanged at `includeTenants: []`. No tenant sees any
   change.
2. Enable `moves_charter_basis_v1` and `moves_capture_notes_v1` together for the
   synthetic demo tenant in a separate, single-purpose change, as
   `moves_capture_v2` and `moves_home_v2` were enabled.
3. Perform the signed-in walk on that tenant: on a P1 Charter, paste a notes
   block, confirm the marked proposals are exactly the charter questions with no
   basis yet, insert one and confirm the field's basis reads *I'm asserting
   this* and survives a reload, declare *Backed by evidence* on a second field
   and then insert into it and confirm the declared basis is unchanged, and
   confirm no field anywhere reads "evidence covered" off a paste. Record the
   result on the acceptance matrix.
4. Widen only after that walk passes.

## Rollback Plan

Leave either `includeTenants` empty, or remove the tenant from either flag — the
link stops firing and the dock returns to its current presentation immediately.
A full revert of this PR is also safe: there is no migration, no new table,
column, or canonical key, and no new persisted shape. A basis recorded before a
rollback is an ordinary `workspace_assertion` in the existing
`p1_charter_basis` map and survives it, exactly as if the person had declared it
on the field by hand.

## Deployment Authority

No deployment is requested or performed by this change. Shared Product/Lab web
traffic is shifted only by the repo-owned ACA main deploy workflow
(`.github/workflows/aca-main-deploy.yml`) against a digest-pinned image. This
change runs no `az` command, mutates no revision weight, and touches no Container
App template. It reaches the runtime only on the next ordinary main deploy, and
even then fires nowhere while both flags are empty. The ACA runtime invariant and
the signed-in client proof remain owed before any `live-proven` claim.

## Known Gaps

- **No signed-in proof, and none is claimable.** With both flags off for every
  tenant the link fires nowhere, so this record claims `merged`, not
  `live-proven`. The walk in step 3 above is owed as the gate on enabling the
  first tenant.
- **The gate dialog still says nothing about how much of the charter is
  assumed.** A reviewer can see each field's basis, and the hand-off screen
  carries the rollup, but the gate's own copy is governed by the approval flow
  rather than the capture flow. That remains the more consequential of the two
  surfaces and is unchanged here.
- **Editing an answer clears its basis, and still does not say why.** That
  behaviour is correct — a changed answer is no longer the thing the basis was
  recorded against — and it now also applies to a basis this change stamped: a
  person who inserts from notes and then rewrites the text will see the basis
  go blank. The control re-prompts but does not explain. Worth a one-line
  explanation, as the basis-UI record already noted.
- **An insert records the basis before the answer is saved.** The basis is
  written at insert time while the answer follows the ordinary save path, so a
  person who inserts and then navigates away leaves a basis recorded against an
  unsaved answer. This is the same state the existing control already permits
  when someone declares a basis before typing, and the control presents it with
  its `emptyValue` wording. Making the pair atomic would mean auto-persisting an
  inserted answer, which would change what Insert means, and was left out
  deliberately.
- **Measured at one width only.** jsdom does not lay out, so the added per-field
  line has not been rendered and measured at phone width. Owed with the
  signed-in walk.

## Audit Evidence

- Branch `feat/moves-notes-basis-link`, opened against `main` from an isolated
  worktree off `origin/main`.
- Test and typecheck output quoted under QA / Validation above, including the
  mutation runs and the restored-state re-confirmation.
- The new suite's registration is evidenced by the census delta: covered test
  files 2518 → 2519 with uncovered unchanged, in
  `docs/architecture/test-ci-coverage-census.json`.
