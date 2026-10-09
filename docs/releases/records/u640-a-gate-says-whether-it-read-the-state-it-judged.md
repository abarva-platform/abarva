# u640 — A gate says whether it read the state it judged

## Release ID

`2026-10-09-u640-gate-state-readback-refusal`

## Status

`candidate`

## Plain-English Summary

One function decides whether a phase gate may be crossed. It answers up to 38
named criteria — is the synthesis report signed off, is a baseline attested, is
a sponsor listed, was the solution route validated — and every one of those
answers comes from the same eight database reads it issues at the top:

- the Move's deliverable records;
- the phase capture modules;
- the engagement participants;
- the origination approval request;
- the Move's milestones;
- the latest stored version of the origination brief;
- the latest stored version of the synthesis report;
- the stored artifacts those deliverables point at.

All eight read only the returned rows and discarded the error field beside them.
The data-plane client this product uses **never throws** — it catches everything
internally and returns a result object whose error field is the only signal that
anything went wrong — so a connection failure, a permission denial, a timeout or
a renamed column arrived as *no rows*.

No rows is a legitimate state. A Move really can have produced no deliverable
and completed no module. So a failed read did not look like a failure; it looked
like a Move at the very beginning of its life. **30 of the 38 criteria read a
deliverable record**, and the capture-based fallback each of those criteria
carries reads the capture modules — so one failed read emptied both halves of
almost every criterion at once.

The gate then stated the consequence as fact. The approval route joins each
failed criterion's sentence into the refusal a signed-in reviewer reads, so the
refusal became a list of absences nobody had observed, for documents visibly on
screen in the same workspace — each with an action attached: approve or upload
the report, name a sponsor, capture a baseline, **regenerate the report**.

That last one does damage. Generating a deliverable that already exists resets
its status to draft. The sign-off is one of the hard criteria in the *same* gate
rule, so acting on the fabricated sentence un-signs the document the gate was
waiting for, and no retry undoes it. The reviewer was told to take the one
action that makes the gate harder to pass.

The gate's own file already held the rule this release applies, written 25 lines
*below* the eight reads that did not follow it: one of its other inputs is
deliberately shaped as "could this be evaluated?" rather than as a plain value,
because — in that code's own words — a missing value conflates *nothing is
recorded* with *I could not read the record*, and only the first of those may
override a recorded human decision. Same function, same class of fact, opposite
treatment.

Three things change:

1. **The gate refuses by name.** All eight reads are now classified. If any of
   them reports an error, the gate returns a single hard refusal that says the
   state could not be read, names which read failed, states plainly that nothing
   was concluded about any document, sign-off, captured answer or sponsor, asks
   for a retry, and explicitly rules out regenerating or re-uploading anything.
   **No verdict changes.** An unread state still refuses the gate, because an
   unread state cannot clear a hard criterion — only what the refusal says
   changes.

2. **The criteria panel stops stating a tally it never measured.** The layer
   that builds the workspace's criteria list already marked them "not verified"
   when the evaluator could not run, and said so in its own header comment. No
   surface ever read that flag: the panel rendered a tick or an empty circle per
   row and an "N of M hard met" count, which read an unchecked criterion exactly
   like a checked-and-unmet one. The panel now reads the flag, replaces the
   count with `Not evaluated`, marks each row `State unread`, and carries one
   sentence saying an unchecked criterion is not a failed one. The same screen's
   one-line gate summary read `Blocked by: <criterion label>` — naming a
   specific document as the blocker on the strength of an answer nobody
   computed, three inches above the ledger — and now says the gate state could
   not be read instead.

3. **A failed read is treated as structural.** The criteria builder already
   classified three evaluator-level failures as "not a per-criterion signal" and
   handled them correctly. A failed read is the fourth, and the only one of the
   four its existing `catch` could never see, because the client does not throw.
   It is now derived from the evaluator's own identifier so the two cannot
   drift.

An empty read keeps its meaning exactly. Only a reported error is a failed read,
so a Move that has genuinely produced nothing still gets its concrete
per-criterion answers, and no existing fixture changes behaviour.

## Layer Impact

- `global-control-lane` — shared gate-evaluation behaviour and the shared Moves
  phase workspace. Not feature-gated: the refusal and the panel's unevaluated
  state apply to every client whose Move crosses a gate.

Layer 3 (canonical model) is unchanged: no schema, no migration, no write. The
evaluator is read-only, and the new refusal path precedes nothing that writes.
Layer 4 (products) changes in the Moves phase workspace only.

## Client Applicability

- All clients: yes — the gate evaluator and the phase workspace are shared.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a refusal sentence and a display state on
  paths that already existed, with no verdict change, so gating it would leave
  the misstatement live for ungated tenants.

## Changes Included

- `src/lib/programs/gate-state-readback.ts` (new) — classifies the evaluator's
  eight state reads as readable or not, error authoritative, and composes the
  refusal sentence.
- `src/lib/programs/gate-criteria-verification.ts` (new) — derives the criteria
  panel's unevaluated state and its three distinct labels.
- `src/lib/programs/governance.ts` — reads `error` on all eight state reads;
  refuses by name before the criterion ladder runs.
- `src/lib/programs/transformers.ts` — adds the new identifier to the structural
  classification, derived from the evaluator's own constant.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — the gate
  ledger reads the verification state in both its mounts (the phase-0 section
  and the phase-1-and-up disclosure).
- Tests: `src/lib/programs/__tests__/gate-state-readback.test.ts`,
  `src/lib/programs/__tests__/gate-criteria-verification.test.ts`,
  `src/lib/programs/__tests__/governance-gate-state-unreadable.test.ts` (new);
  cases appended to
  `src/lib/programs/__tests__/strategic-moves-transformers.test.ts` and
  `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migration, no workflow edit. All five test locations are already swept by a
required job, two of them as whole directories and two by name.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__`: 201 suites, 2825 tests.
- **PASS** — `npx jest src/components/strategic-moves/__tests__ 'src/app/api/v1/programs/[programId]' src/__tests__/integration/programs src/lib/agent/tools`: 167 suites, 2802 passed, 20 skipped, 0 failed. This is every suite that exercises the evaluator, the two routes that call it, the agent tool that calls it, and the workspace that renders its output.
- **PASS** — mutation testing, **26 of 26 killed**. Includes the exact pre-fix
  revert (drop the refusal and let the criterion ladder run: 12 cases fail);
  downgrading the refusal from hard to soft (1); unwiring each individual read's
  error (4 separate mutants, 1-5 cases each); making a *skipped* read report a
  failure (2); dropping the new identifier from the structural classification,
  i.e. the mutation that proves the display half is not inert (1); reverting
  each of the panel's slots to the met/unmet wording (4 mutants, 1-6 cases
  each); and restoring the summary line's criterion name (1). Two mutants
  initially SURVIVED because the guards they changed were redundant — a
  `length === 0` check ahead of a vacuously-true `every`, and a second
  `evaluated` guard on a value only the evaluated arm reads. Both guards were
  removed rather than given a test no input could fail.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` over all ten changed files: 0 errors. Two
  pre-existing unused-import warnings in the workspace component, present at
  base and untouched.
- **PASS** — `node scripts/quality/check-named-suite-requiredness.mjs`: OK, 51
  directories swept by a required job.
- **PASS** — coverage census regenerated honestly: test files 2898 → 2901 and
  covered 2734 → 2737, which is the three new test files and nothing else;
  uncovered 164 unchanged.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **PASS** — Prettier measured per file, in place, against base. Two files were
  already unformatted at base and were left that way; one reformat proposed
  inside this change's own hunk was fixed by hand, and the remaining proposal in
  that file sits on an import line this change does not touch. The three files
  clean at base are clean here.
- **NOT RUN** — signed-in walk. See Deployment Authority.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds and
deploys the image; no separate action is needed. No migration, no flag, no
environment variable, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: unchanged by this PR; the standard post-deploy proof
  (template image, 100%-traffic revision image and worker job images all match
  the approved digest) applies to the deploy, not to this change.
- Worker image invariant: unaffected.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes**, and the **regression direction comes
  first**, because this change sits on the path the demo walk uses. A signed-in
  reviewer at a phase whose state reads normally must see the gate ledger
  unchanged: the same "N of M hard met" tally, the same ticks and circles per
  criterion, no unevaluated notice, the same hard-blocker sentences for
  criteria that genuinely fail, and an unchanged approval outcome. The refusal
  direction needs the data plane to fail a read and is not worth staging
  deliberately.

## Rollback Plan

Revert the squash commit. The change is read-path only — no migration, no schema
change, no write, no stored state — so a revert restores the previous behaviour
completely and immediately, with nothing to reconcile. Reverting restores the
fabricated-absence refusal, so prefer a forward fix if the problem is in the
wording rather than in the classification.

## Audit Evidence

- PR URL and its CI run on the merge commit.
- The mutation sweep's per-mutant result, quoted under QA above.
- The coverage census diff: a `+3 / +3` move with `uncoveredTestFiles`
  unchanged, matching exactly the three new test files.
- `scripts/quality/check-named-suite-requiredness.mjs` output.
- Owed: the signed-in regression walk described under Deployment Authority.

## Known Gaps

- **The signed-in walk is owed.** Nothing in this change is `live-proven`.
- **A governance question for the product owner.** The refusal fails closed: an
  unread state blocks the gate. That is the safe direction and it is what the
  previous behaviour also did, by accident, for the wrong reason. Whether a
  reviewer should instead be able to proceed on an explicitly recorded
  "state unreadable" acknowledgement is a governance decision and is not made
  here.
- **A second criteria renderer is still blind to the flag.** The programs detail
  page renders the same criteria list and does not read the verification state.
  It is not the phase workspace the walk uses, so it is left for a follow-up
  rather than widened into this change.
- **One more sentence on the same screen still states a fabricated count, and
  was deliberately NOT changed here.** The decision surface's last fallback
  reads "Resolve N hard gate blockers before advancing", whose N comes from the
  same unevaluated criteria. A fix was written and then **withdrawn**: that arm
  sits behind three earlier arms (evidence readiness unverifiable, open required
  evidence, a capture hold), and in every host fixture available one of those
  wins — so the change could not be exercised, and shipping a reader that no
  test proves runs is how an inert fix happens. It needs a fixture with
  readiness covered AND capture complete, which is a separate piece of work. The
  sharper half of the same defect — the summary line naming a specific criterion
  — IS exercised and is included.
- **The latest-version read's own sentence is now unreachable, not removed.**
  The P2 readiness ladder has an arm for "the record has no readable content",
  which a failed read used to reach. The refusal above now precedes it, so that
  arm is reachable only by a genuinely contentless stored record. It is left in
  place deliberately: it is the correct sentence for that state, and removing it
  would leave the state with no sentence.
- **Other reads elsewhere in the same family are untouched.** This change covers
  the gate evaluator's eight reads. The repo-wide sweep for the same
  error-dropping shape in other modules is not in scope here.
