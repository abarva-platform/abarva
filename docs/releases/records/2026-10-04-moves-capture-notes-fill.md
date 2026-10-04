# 2026-10-04-moves-capture-notes-fill — Moves: governed fill-from-notes in the capture dock (flag OFF)

## Release ID

`2026-10-04-moves-capture-notes-fill`

## Status

`candidate`

## Plain-English Summary

A consultant comes out of a client conversation with a page of notes, not with
answers typed into the right seven boxes. Today the capture flow makes them
re-read their own notes and retype each answer by hand, which is slow and loses
the words the client actually used.

This change — behind a feature flag (`moves_capture_notes_v1`, **off for every
tenant**) — adds a **Paste client notes** panel to the capture dock. Paste the
notes, press **Propose fills**, and each unanswered question on the phase is
offered the passage of the notes that appears to belong to it, together with the
line it came from and the words that earned the match. Then the person inserts
the ones that are right, field by field, and dismisses the rest.

Three things make it a governed affordance rather than an autofill:

- **Nothing is written until the person inserts it.** Pasting writes nothing.
  Proposing writes nothing. Only pressing *Insert* on a specific field writes,
  and it writes exactly what a typed answer would write, through the same saver.
- **The proposal is the client's own words, verbatim.** The matcher is
  deterministic — no model call — so what is proposed is an exact span of the
  pasted text, cited by line. The reviewer checks the source, not a paraphrase.
- **A note-derived fill is an assertion, never evidence.** Notes a workspace user
  typed after a conversation are their own account of it. The panel says so and
  every proposal carries assertion wording; nothing in it can read "evidence
  covered" or "backed by evidence". This matches the three-basis model the P1
  charter basis work introduced.

It also refuses to do damage: a question that already holds an answer is skipped
and reported as skipped (a paste can never overwrite captured work), and a
structured field whose value is JSON — a facts table, an estimate model — is
never proposed into, because prose would corrupt it.

Because the flag is off everywhere, there is **no change to the live product**:
the dock renders byte-for-byte what it renders today for every tenant, including
the synthetic demo tenant that has the capture redesign enabled.

## Layer Impact

Release lane: `experimental` — feature-flagged, non-default capability
(`moves_capture_notes_v1`, off for all tenants). When off, the capture dock is
byte-for-byte the current presentation.

- `4 PRODUCTS` (Moves): one new presentation affordance inside the existing aVa
  capture dock, above the workspace tab row. It proposes into the canonical
  capture sections for the phase being worked and writes through the host's
  existing `setVisiblePhaseCaptureValue` — the same path a typed answer takes,
  with the same autosave, revision, and gate behaviour. No new route, no new
  request, no second saver.
- `3 CANONICAL MODEL`: **untouched.** No new field, table, column, or canonical
  key. Proposals live in component state and cease to exist when the panel
  closes; only an inserted value reaches the capture state, as an ordinary value.
- Layers `1 CLIENT INTAKE` and `2 SOURCE ADAPTERS`: not involved. The pasted text
  is typed by a workspace user into the browser; it is not an intake tab, is not
  loaded through an adapter, and is not registered as a dataset or corpus object.
  Nothing is sent to a model, so no `GovernedObject`/agent-context path applies.

## Client Applicability

- All clients: No (flag off for all).
- Specific clients: None yet.
- Internal only: No.
- Public/demo only: No.
- Feature flag: `moves_capture_notes_v1` (tenant policy, `includeTenants: []`).

## Changes Included

- `src/lib/programs/capture-notes-proposal.ts` — **new.** The deterministic
  matcher. Splits pasted notes into reviewable blocks (paragraphs, and each
  bullet or numbered line as its own block, so one excerpt is one fact), scores
  each block against each eligible section's label and description on distinct
  content-term overlap, and assigns greedily best-first with stable tie-breaks.
  A block is used at most once and a section receives at most one proposal, so no
  excerpt appears twice and no field has two candidates. A block must hit at
  least two distinct section terms to be proposed at all. Every proposal carries
  the verbatim excerpt, its 1-based source line, the matched terms, and a
  `basis` that is the literal `"workspace_assertion"` — a constant, not a
  judgement, so the type system forbids a note-derived fill ever claiming
  approved evidence. Sections that are already answered or are structured are
  excluded up front and returned in `skippedAnswered` / `skippedStructured`.
- `src/components/strategic-moves/CaptureNotesFill.tsx` — **new.** The
  propose → review → insert panel: collapsed by default, a textarea, a
  *Propose fills* button disabled on empty notes, then one card per proposal with
  the field name, the verbatim excerpt, `line N · matched …`, *Insert into
  <field>* and *Dismiss*. An amber banner states once that an inserted value is
  recorded as the user's assertion and not as approved evidence. Editing the
  notes clears stale proposals rather than leaving them to be inserted against
  text that no longer exists. Design-locked tokens only (cream `#f5f1eb`,
  surface `#fff`, ink `#2c2c2a`, teal `#1d9e75`, amber `#ba7517`; Fraunces /
  Inter / JetBrains Mono), and the card shape follows the dock's existing
  aVa-draft propose/insert/dismiss pattern so it reads as native.
- `src/components/strategic-moves/MovesCaptureWorkspace.tsx` — one optional
  `notesFill` slot rendered at the top of the dock workspace. Absent by default,
  so an unchanged host renders an unchanged dock.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — new
  `captureNotesEnabled` prop (default `false`). When true it fills the slot with
  `CaptureNotesFill`, handing it the phase's canonical sections paired with their
  current displayed values, and wiring insert to `setVisiblePhaseCaptureValue`.
- `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx` —
  resolves `moves_capture_notes_v1` server-side with the same tenant context as
  the other Moves flags and passes it down. Gated separately from
  `moves_capture_v2` so the dock affordance can be reviewed on its own.
- `src/lib/features/registry.ts` — registers `moves_capture_notes_v1`
  (`policy: "tenant"`, `includeTenants: []`).
- `.github/workflows/ai-surface-control-catalog.yml` — registers the new
  component suite by exact path; `docs/architecture/test-ci-coverage-census.json`
  refreshed (`npm run audit:test-ci-coverage:write`): +2 test files, +2 covered,
  uncovered unchanged at 164.
- `docs/product/NEXUS_MANUAL_AND_AVA_TRAINING_GUIDE.md` — regenerated
  (`npm run docs:nexus-manual`) after the registry change.

## QA / Validation

- `npx jest` on `capture-notes-proposal`, `CaptureNotesFill`,
  `MovesCaptureWorkspace`, `MovesCaptureFlow` — **PASS**, 33/33 across 4 suites.
  The suites pin the governance invariants, not just the happy path: every
  excerpt is asserted to be a substring of the pasted input; `basis` is asserted
  to be `workspace_assertion` and the serialized result asserted not to contain
  `approved_evidence`; an answered field is asserted to be skipped rather than
  proposed over; a structured field is asserted never to receive prose; pasting
  and proposing are each asserted to leave `onInsert` uncalled; and the rendered
  panel is asserted not to contain "evidence covered" or "backed by evidence".
- **Mutation check of the four load-bearing invariants** — **PASS**. Each of
  (a) removing the structured-field skip, (b) removing the already-answered
  skip, (c) lowering the two-term match floor to one, and (d) allowing one note
  block to be reused across fields was applied to the matcher in turn; each
  turned a test red, and the file was restored between runs. The invariants are
  pinned by assertions, not merely satisfied by the fixture. The `basis` constant
  needs no mutation case: its type is a single-member literal union, so changing
  it fails typecheck.
- Flag-off behaviour — **PASS**: `MovesCaptureWorkspace` is asserted to render
  no notes panel when the host supplies no slot (the flag-off path), while still
  rendering the tab row and the capture flow.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS**, exit code 0, zero diagnostics.
- `npx eslint` on all changed and added files — **PASS**, 0 errors. Three
  pre-existing unused-variable warnings in `MovesPhaseStandaloneClient.tsx`
  (`MovesCaptureFlow`, `PHASE_CANONICAL_KEYS`, `_phase`) are untouched by this
  change and present on `main`.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**, all gates.
- Signed-in live walk — **NOT RUN**, and not claimable. The flag is off for every
  tenant, so the panel renders on no surface and there is nothing to walk. It is
  owed as the gate on enabling the first tenant, and recorded under Known Gaps.

## Rollout Plan

1. Merge with the flag registered and `includeTenants: []`. No tenant sees any
   change; the dock renders as today everywhere.
2. Enable for the synthetic demo tenant in a separate, single-purpose change, as
   `moves_capture_v2` and `moves_home_v2` were enabled.
3. Perform the signed-in walk on that tenant: paste a notes block into a P1
   capture, confirm the proposals quote the paste verbatim with the right line
   numbers, confirm an answered field is reported as skipped and not proposed
   over, insert one proposal and confirm it saves and the field's basis presents
   as an assertion rather than as evidence, and dismiss one and confirm nothing
   was written. Record the result on the acceptance matrix.
4. Widen only after that walk passes.

## Rollback Plan

Leave `includeTenants` empty, or remove the tenant from it — the affordance
disappears and the dock returns to its current presentation immediately, with no
data to unwind. A full revert of this PR is also safe: there is no migration, no
new table or column, and no persisted artifact of a proposal. Values a person
inserted before a rollback are ordinary capture values and survive it, exactly as
if they had been typed.

## Deployment Authority

No deployment is requested or performed by this change. Shared Product/Lab web
traffic is shifted only by the repo-owned ACA main deploy workflow
(`.github/workflows/aca-main-deploy.yml`) against a digest-pinned image. This
change runs no `az` command, mutates no revision weight, and touches no Container
App template. It reaches the runtime only on the next ordinary main deploy, and
even then renders nowhere while the flag is empty. The ACA runtime invariant and
the signed-in client proof remain owed before any `live-proven` claim.

## Known Gaps

- **The per-field basis is not recorded from an insert yet.** The matcher
  classifies a note-derived fill as `workspace_assertion` and the panel says so
  in words, but it does not yet write that basis into the `p1_charter_basis` map
  that `moves_charter_basis_v1` reads. Until it does, inserting from notes on P1
  fills the value and the person still declares the basis on the field's own
  control. Wiring the insert to pre-select *I'm asserting this* is the next
  increment and is the reason the two flags are separate.
- **The matcher is lexical, so it will miss a passage that shares no vocabulary
  with the question's wording** — a note saying "Dana signed off, wants an
  update every other Friday" will not reach a *Sponsor commitment* field that
  never uses the word "sponsor". This is a deliberate floor, not an oversight: a
  wrong proposal costs the reviewer more than a missing one, and the panel says
  plainly when nothing matched rather than inventing a fill. A model-assisted
  pass would need the governed agent-context path and is out of scope here.
- **Only one proposal per field per paste.** A field whose answer is spread over
  three separate paragraphs gets the single best one; the person pastes again or
  types the rest.
- **No signed-in walk.** Owed on first tenant enablement, as above.

## Audit Evidence

- Flag definition and its scope: `src/lib/features/registry.ts`
  (`moves_capture_notes_v1`, `policy: "tenant"`, `includeTenants: []`).
- Server-side flag resolution:
  `src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx`.
- Governance invariants as executable assertions:
  `src/lib/programs/__tests__/capture-notes-proposal.test.ts` and
  `src/components/strategic-moves/__tests__/CaptureNotesFill.test.tsx`.
- CI registration of the new suite by exact path:
  `.github/workflows/ai-surface-control-catalog.yml`; census:
  `docs/architecture/test-ci-coverage-census.json`.
- The basis vocabulary this panel is consistent with:
  `src/lib/programs/p1-charter-evidence.ts` (`P1CharterBasisInput`) and release
  record `2026-10-04-moves-p1-charter-basis-gate`.
