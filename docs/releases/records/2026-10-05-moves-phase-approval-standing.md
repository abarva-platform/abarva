# Moves phase workspace: a passed gate is not a read approval

## Release ID

`2026-10-05-moves-phase-approval-standing`

## Status

Merged pending — opened as a release candidate PR against `main`, squash
auto-merge armed. Not `live-proven`: the signed-in walk of this build is owed
once a deploy carries it.

## Plain-English Summary

Open a Move's earlier phase — one the Move has since moved past — and the phase
workspace told you, in four places at once, that the phase was **approved**:

- the progress header's status chip read `Approved`;
- the approve step's heading read `P1 is already approved`;
- its body read `The approved output is carrying forward into P2 Discover`;
- the gate panel read `This phase is already approved and read-only. The
  approved output is carrying forward into P2 Discover.`
- and the closed-phase banner read `✓ P1 is already approved.`

Every one of those sentences rested on a single boolean, and that boolean was
seeded from the Move's **position**: `terminalComplete || phase < currentPhase`.
In other words, the only thing the screen actually knew was that the Move had
advanced past this phase.

Advancement is gated, so the sound reading of that fact is that the phase's
**gate passed**. It is not a reading of an approval. Nothing on this screen
fetches a gate-approval record — there is no approver, no decision date, no
record id behind the word. A person was being told a decision had been made and
given no way to tell that claim apart from the one made a second after they
click Approve & Build, which *is* a read of a real decision: the response this
session just handled. The two were the same boolean.

This change splits them. The session's own approval is now its own state,
seeded `false`, because a record of a decision should not be manufactured from
a position. A new pure module turns the four inputs into one `standing` —
`recorded`, `handed-off`, `advanced-past`, or `open` — and owns every sentence
derived from it. An inferred standing now says `Gate passed`, and the header
carries a `title` stating the basis in plain words: *"The Move has advanced past
this phase, so its gate passed. No approval record was read on this screen."*
A recorded one still says `Approved`, because there it is true.

Permissiveness is deliberately untouched. Which gate controls unlock still turns
on exactly the same condition as before, so no control appears or disappears;
only what the screen *says* changes. A test asserts that equivalence over the
whole input space, so the two cannot drift apart later.

Sweeping the phrase across the component found a fifth instance of the same
class on a different trigger: a readiness line reading `P2 Discover can start
from the approved record.` keyed on `isFullyReady`, a statement about open prep
items that says nothing about an approval at all. It now says
`from this phase's record.`

This is the same defect as the approvals overview's constant `Approved` column
and the capture strip's inferred figures that preceded it — a client-visible
claim derived from something that did not measure it — found by asking of this
word, as of those figures, *what read this?*

## Layer Impact

Lane: `global-control-lane` — the corrected surfaces are the phase workspace's
progress header, approve step and gate panel, which are not behind a redesign
flag and render for every tenant. It declares no new flag, changes no flag's
enrollment, and is a correctness fix rather than a new capability, so there is
no OFF flag available to hide it behind.

Layer 4 (Products · Moves) only. No change to layers 1–3: no intake template,
no source adapter, no canonical model object, no schema, no migration, no
loader, no read model, no API route. Nothing is read from the data plane that
was not read before, and nothing is written.

One shared seat is touched: the AI-surface control catalog gains the new
suite by exact path, and the test-CI-coverage census is refreshed to match.

## Client Applicability

All clients. The phase workspace is the Moves per-phase surface for every
tenant, and these five strings render wherever a phase is closed. Every tenant
that opens a phase its Move has advanced past sees the corrected wording after
the deploy.

No real client data, identity, or engagement is involved. The change reads a
Move's own phase position and this session's own approval result; it invents
nothing and persists nothing.

## Changes Included

- `src/lib/programs/phase-approval-standing.ts` — new pure module.
  - `PhaseApprovalStanding`: `recorded` | `handed-off` | `advanced-past` |
    `open`, with the distinction between a read decision and an inference
    carried in the type.
  - `resolvePhaseApprovalStanding(input)`: a recorded approval outranks both
    inferences; hand-off outranks advancement.
  - `phaseApprovalHeaderLabel`, `phaseApprovalHeaderBasis`,
    `phaseApprovalDecisionTitle`, `phaseApprovalDecisionText`,
    `phaseApprovalGateNote`, `phaseApprovalCompletionHeadline`: the six strings,
    each `null` on an open phase so the caller keeps its readiness wording.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx`
  - `gateApproved` splits into `gateApprovedThisSession` (state, seeded
    `false`) and a derived `gateApproved = isHistoricalPhase ||
    gateApprovedThisSession`, which is value-identical to the old state for
    every existing consumer — twenty-odd gating expressions are unchanged in
    both text and meaning.
  - `approvalStanding` is resolved once and passed to `PhaseBody` as a prop, so
    the header word and the decision copy cannot disagree.
  - `PhaseProgressHeaderState` gains an optional `basis`, rendered as the status
    element's `title` at both of its render sites.
  - The readiness line's `the approved record` becomes `this phase's record`,
    with a comment recording that the branch measures readiness.
- `src/components/strategic-moves/__tests__/phase-approval-standing.test.ts` —
  new suite, 29 cases.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  - The two cases that held the old copy as a selector are conformed to the
    shipped wording, and each gains a negative guard over the rendered nodes
    for the claim shapes the defect emitted. The guard is deliberately narrower
    than "no `approved` anywhere": `Required evidence approved or waived` is a
    real, recorded evidence decision and keeps its word.
- `.github/workflows/ai-surface-control-catalog.yml` — the new suite, by exact
  path.
- `docs/architecture/test-ci-coverage-census.json` — refreshed.

## QA / Validation

- **PASS** — rebased onto the current default branch; the only conflict was the
  hand-edited catalog path list, resolved by keeping both sides (a sibling's new
  path and this one are purely additive). Net delta after the rebase: 6 source/doc
  files, which is what says no sibling work leaked in and none of theirs was dropped.
- **PASS** — both generated coverage censuses regenerated and re-checked, exit 0
  each (`audit:tenancy-fence-coverage:check`, `audit:test-ci-coverage:check`).
  Both carried drift inherited from the default branch, not introduced here: the
  fence census was missing an API route a sibling added, and the coverage census
  under-counted test files on disk by three beyond the one this change adds.
  Refreshing them here is what makes these two required checks green on this head;
  the files are generated, so a sibling refresh landing first is an identical-content
  no-op.
- **PASS** — registration of the new suite is proven by the census delta:
  `coveredTestFiles` rose while `uncoveredTestFiles` stayed at 164.
- **PASS** — `npx jest src/components/strategic-moves/__tests__/phase-approval-standing.test.ts`:
  1 suite, 29 tests.
- **PASS** — the whole `src/components/strategic-moves/__tests__` directory:
  36 suites, 495 tests, 17s, re-run after the rebase. Run in full rather than as a subset because the
  host component the change edits is rendered by many sibling suites, and
  because the sweep below was found only by running them.
- **PASS** — `tsc -p tsconfig.json --noEmit`, exit code 0 (judged on the exit
  code, with `node_modules` present; an earlier run in a fresh worktree exited
  0 only because `npx` could not find TypeScript at all).
- **PASS** — `eslint` over the four changed/added source files, exit code 0.
  Three pre-existing `no-unused-vars` warnings in the host component are
  present on `origin/main` unchanged and are not touched here.
- **PASS** — mutation check, **6 of 6 killed**:
  1. a recorded approval no longer outranking the inferences — 1 red;
  2. the inferred standings saying `Approved` again — 3 red;
  3. the basis line dropping its "no approval record was read" disclaimer —
     1 red;
  4. the decision title reverting to `is already approved` — 3 red;
  5. the completion headline dropping the hand-off fact — 3 red;
  6. **the host re-seeding the session flag from the advancement inference** —
     2 red. This is the one worth quoting: it is the defect itself, restored,
     and the suite catches it through the rendered component rather than only
     in the pure module.
- **PASS** — census delta measured by moving the new suite aside and running
  the writer on the base first: `coveredTestFiles` 2534 → 2535 with
  `uncoveredTestFiles` unchanged at 164, which is the proof the suite is
  registered rather than merely present. Re-measured after a rebase onto a base
  that had moved by two merges; the pre-rebase figure was 2532 → 2533, and the
  census was regenerated again after the rebase because an identical committed
  count can otherwise drop the file out of the net delta entirely.
- **NOT RUN** — signed-in walk. This build is not deployed; the walk is owed
  and is recorded as a gap below.
- **NOT RUN** — phone-width measurement. The suite runs in jsdom, which does
  not lay out.

## Rollout Plan

Squash-merge to `main` through the repo-owned main deploy workflow. No flag
change, no enrollment change, no env or secret change, no data build, no
migration. The change is wording plus the state split behind it; no control
appears, disappears, or changes its enabled condition.

## Rollback Plan

Revert the squash commit. The new module and its suite are self-contained
additions; the host edits are a state split that is value-identical for every
existing consumer, one new prop, one optional interface field, and five string
substitutions. Nothing persists state, so a revert restores the prior wording
immediately with no data to unwind.

## Deployment Authority

Only the repo-owned ACA main deploy workflow may shift shared Product/Lab web
traffic. No ad-hoc Azure command was run for this change: no
`az containerapp update`, no revision weight change, no registry build, no
traffic assignment. No shared runtime template was touched. This record claims
`merged`, not `live-proven`.

## Known Gaps

- **The signed-in walk of this build is owed**, together with the walks of the
  other open slices in this workstream, once a deploy carries them. The
  corrected wording is the half with user-visible consequence, and a closed
  phase is the state to open.
- **A sixth instance of the same claim sits in an unmounted panel.** A phase
  workspace panel component renders `<phase> is approved` and `The approved
  output is carrying forward into <next>` off a `completed` prop. It is
  referenced by nothing but its own suite — `grep` over `src/` returns its own
  file and its own test only — so no reader can be shown it today. It is left
  untouched rather than swept, on the standing rule that an unreachable
  component is not a client-visible defect and editing it widens a diff without
  fixing anything. Whether it should be mounted or retired is a separate
  question.
- **No approval record reaches this screen, so `recorded` is reachable only
  within the session that performed the approval.** Reload the page after
  approving and the standing falls back to `advanced-past`: correct, and
  visibly weaker than it needs to be. Threading a real gate-approval record —
  approver, decision date, record id — so a past approval can be *read* rather
  than inferred is a data slice and is deliberately not bundled here. It is the
  change that would let these surfaces say `Approved` truthfully again.
- **The basis is a `title`, so it is hover-only and invisible on touch.**
  Whether the basis deserves visible text beside the chip is a copy decision on
  a design-locked surface and is recorded here rather than taken unilaterally.
- **The readiness line's fix is the narrower one.** `isFullyReady` still drives
  a sentence about what the next phase can start from; the line now describes
  the record rather than approving it, but whether a readiness measure should
  word that sentence at all is untouched.
- Nothing on these surfaces has been measured at phone width.

## Audit Evidence

- Branch `exec/moves-redesign-20261005T134942Z`, one commit, six files.
- Net delta against `origin/main` by `git diff --stat origin/main...HEAD`,
  recorded on the PR.
- Mutation runs listed under QA / Validation, each reverted from a backup copy
  of the touched file immediately after its run; the final state of both files
  is the committed one, re-verified green after the last revert.
- Census base measured with the new suite moved aside, never stashed.
- `npm run release:check -- --base origin/main --head HEAD`, run locally
  before the push.
