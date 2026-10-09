# u635 — The document cabinet states where a file's bytes are

## Release ID

`2026-10-08-u635-move-artifact-storage-state`

## Status

`candidate`

## Plain-English Summary

The document cabinet is where a reviewer confirms that evidence and
deliverables actually landed. It drew that confirmation from one boolean — a
row's recorded storage marker being the "stored in blob" value — and rendered
it as a green `Vault` chip or a red `Storage pending` chip.

Three different situations reached the red chip, and only one of them is a
problem.

**A generated deliverable is not a problem at all.** Rows read from the
generated-artifact table carry no storage marker, because those deliverables
are rendered from their recorded content when the reviewer downloads them and
never occupy the blob vault. Every one of them — the whole output of Approve &
Build — was therefore marked red, with nothing pending and nothing for anyone
to do.

**An uploaded file whose bytes were not stored is unrecoverable.** When object
storage is unavailable, the artifact writer still registers the row and records
the marker that says the bytes did not land. For an upload the only copy of
those bytes was the request body; nothing re-attempts the upload, and the
download route answers `404 artifact_unavailable` for that row forever.
`Storage pending` named a wait that never ends, and its tooltip repeated the
label instead of explaining it. The action the reviewer actually needs — upload
the file again — was nowhere on the surface.

**A row that records nothing is a third thing.** Rows whose metadata predates
the storage marker carry no value, which is not the same claim as "not stored".

Because the needless red chip sat on every generated row, the one that needed
action carried no signal. The two defects hid each other.

The upload confirmation had the same defect in sharper form. An upload whose
bytes were not retained differed from a healthy one **only by the absence of
the four words " to secure storage"**, in the same success colour, and the
panel advanced its phase selector as though the upload had completed. The
reviewer could then approve the extraction — approving discovery evidence is a
hard precondition for crossing the discovery gate — and that approval would
create a citation whose source document can no longer be produced.

So the four states are declared, each with its own label, its own tooltip and
its own tone, and only the unrecoverable one asks the reviewer to act. The
upload confirmation says, in that case, that the contents were not retained,
that nothing re-attempts it, that the file has to be uploaded again, and that
evidence from the attempt should not be approved.

Nothing is refused that was previously accepted. The upload still stores what
it can; the change is that the surface stops reporting a loss as a completion
and stops warning about rows that are healthy.

## Layer Impact

- `4 PRODUCTS` (Moves) — product copy and state classification on the document
  cabinet: the per-row storage chip and the upload confirmation. No stored
  record, no gate, no readiness computation and no route changed.
- `3 CANONICAL MODEL` — unaffected. The artifact writer, the storage marker it
  records, the upload route and the artifact list route are all untouched; this
  change only reads the fields they already send.

Release lane: `global-control-lane`. Behaviour is identical for every tenant;
nothing here is flag-gated.

## Client Applicability

- All clients: yes — shared product copy on the cabinet, which is the one
  upload surface the redesigned capture flow can reach.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The cabinet renders under the redesigned capture flow and
  the legacy canvas alike.

## Changes Included

- `src/lib/programs/move-artifact-storage-state.ts` — new, client-safe. Declares
  the four storage states, the marker values the artifact writer records
  (pinned to it rather than retyped), the per-state label, tooltip, tone and
  "does the reviewer have to act" flag as data, and the upload-outcome
  describer. An absent or non-boolean retention field resolves to `unknown`,
  which renders exactly the sentences this surface rendered before the field
  was read, so a producer that stops sending it cannot cause a false alarm.
- `src/components/strategic-moves/FileCabinetPanel.tsx` — two call sites:
  - the per-row chip reads the declared state, resolved from the row's own
    marker plus the already-present discriminator for whether the row is served
    by the generated-artifact route;
  - the upload confirmation reads the classified outcome, and the panel's error
    state and phase-selector advance follow the outcome's "needs action" flag
    instead of the extraction result alone.
    Nothing else in the panel changed, and the refusal path still renders the
    existing upload-refusal copy.
- `.github/workflows/ai-surface-control-catalog.yml` — the new component suite
  is named in the required catalog beside the four sibling cabinet suites, with
  the reason recorded in the step's comment block.
- Suites: `src/lib/programs/__tests__/move-artifact-storage-state.test.ts`
  (new, 22 cases) and
  `src/components/strategic-moves/__tests__/FileCabinetPanel.upload-retention.test.tsx`
  (new, 8 cases against the real panel).
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** `npx jest src/components/strategic-moves/__tests__ src/lib/programs/__tests__`
  — 242 suites, 3497 tests. The two new suites contribute 30 of those; the
  cabinet's four pre-existing suites are unchanged and green.
- **PASS** `npm run test:behaviors` — 208 suites, 2163 tests.
- **PASS** `npx jest src/__tests__/behaviors/named-suite-requiredness.test.ts`
  — 8 tests. The new suite is named in the required catalog only and not also
  by an exact path in the non-required job, so the control has nothing to
  reconcile.
- **PASS** Mutation testing, 13 mutants, **13 killed**, both directions. Suite
  and test counts were compared against the baseline on every mutant (101
  tests, 7 suites) so that a mutant cannot be recorded as killed by failing to
  compile:
  - under-fix: the chip restored to the original boolean, i.e. the defect
    itself (3 cases); the component made to stop passing the generated-route
    discriminator, so generated rows go red again (1 case); the panel's error
    state made to read the extraction result only, so an unretained upload
    reports as complete again (1 case); the "do not approve evidence" clause
    dropped (2 cases); the also-unregistered-extraction clause dropped
    (1 case); the unretained message given back its `Uploaded …` opening, which
    is what made it read as a success (1 case).
  - over-fix: a row with no marker made to claim the bytes were lost (3 cases);
    a non-boolean retention field made to claim a loss (2 cases); the storage
    clause made unconditional (1 case).
  - inversion and precedence: the two marker values swapped (6 cases); the
    serving route made to outrank a recorded marker (1 case); the unrecoverable
    state made not to ask for action, in the state table (1 case) and in the
    outcome describer (3 cases).
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`
  — exit 0, zero lines of output. The exit code is read on its own, because a
  heap abort also prints no diagnostic.
- **PASS** `npx eslint` on the changed and new source and test files — exit 0,
  no errors and no warnings.
- **PASS** Prettier, measured in place per file. Both new files are clean. The
  cabinet component **warns at the base commit**, and a bare `--write` pulled
  three pre-existing reformats into the diff; those three were restored to
  their base text, and Prettier's remaining complaints are at exactly those
  three pre-existing locations, none of them inside an added hunk.
- **PASS** Census, basis stated, and the basis MOVED during the run. At this
  branch's original base `main` committed **2885/2721**, while a regeneration
  of that tree plus this branch's two new test files read **2890/2726** — a
  delta of five for two added files, because the base carried **three**
  pre-existing units of drift from earlier squashes that each regenerated
  honestly against the same parent and landed identical. `main` then advanced
  by one squash that added two test files of its own and regenerated from that
  same drifted base, so it now commits **2890/2726** — numerically identical to
  what this branch had written. **That is why the merge was textually clean and
  why a clean merge is not evidence the number is right**: taking either side
  unchanged would land a census two files low. After merging `main` forward and
  regenerating, this branch reads **2892/2728**, which is `main`'s committed
  value plus exactly this branch's two files. That the delta is exactly two is
  the check. `release:check` exits 0 on the inherited drift and this change does
  not own it. `uncoveredTestFiles` is unchanged at **164**.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** Signed-in walk. No live proof is claimed.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys the
image; no separate step is required. No migration, no flag change, no
environment variable, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No Azure command is run by or for this change.
- Approved image digest: assigned by the main deploy workflow on merge.
- ACA runtime invariant: unchanged by this record; the standing invariant check
  applies to whatever digest that workflow produces.
- Worker image invariant: not applicable — no worker job changed.
- Feature/env flag update path: not applicable — no flag or variable changed.
- Live signed-in proof required: **yes**, and it is **owed**. The regression
  direction matters most: a healthy evidence upload must still confirm itself in
  the success colour with the same sentence, and the rows of a healthy cabinet
  must read `Vault` for uploaded files and `Rendered on request` for generated
  deliverables — not an alarm. The refusal direction matters less and is harder
  to stage, since it needs object storage to be unavailable. This record may say
  `merged` and `deployed`; it may not say `live-proven`.

## Rollback Plan

Revert the squash commit. The change adds one module and two suites, names one
suite in one workflow step, and replaces two expressions in one component.
Nothing is written, nothing is refused, and no stored data is touched, so there
is no migration or data-repair constraint. Reverting restores the prior labels
and the prior upload sentence exactly; its one consequence is that generated
deliverables would again carry a red storage warning and an unretained upload
would again report as complete.

## Audit Evidence

- The pull request and its CI run.
- The mutation table above: 13 mutants, 13 killed, each named with the direction
  it tests, with suite and test counts compared against the baseline so a
  non-compiling mutant cannot be miscounted as killed.
- The module suite, which pins the state partition, the marker values against
  the writer's own exported constants, and the per-state copy as data —
  including that exactly one state asks the reviewer to act, and that no label
  or tooltip describes the loss as a wait.
- The component suite, which renders the real panel: a vault row, a
  generated-artifact row, an unretained row, a row that records nothing, and a
  real upload answered as retained, as unretained, as unregistered and as
  refused.

## Known Gaps

- No signed-in walk. Nothing in this change is `live-proven`.
- The upload route still accepts a file whose bytes were not stored. Its
  sibling document-ingestion route passes the writer's `requireBlobStored`
  option and fails closed on exactly this condition; making this route match
  would refuse an upload that is accepted today, which is a governed behaviour
  change and not this record's call. This change makes the state visible so
  that decision can be taken on evidence.
- The download route answers an unretained row with `artifact_unavailable` and
  a detail that reads "not found or storage unconfigured", which conflates a
  row that does not exist with a row whose bytes do not. The chip now names the
  state before the reviewer clicks, but the route's own answer is unchanged.
- The two other readers of the upload route — the evidence control on the
  capture steps and the current-state family uploader — ignore the retention
  field entirely. Both sit inside the branch the redesigned capture flow
  replaces, so neither is reachable for a tenant enrolled in it; they are left
  for the change that addresses that branch rather than widened into here.
- A row carrying an unrecognised marker resolves to "records nothing" rather
  than to either answer. That is deliberate and asserted, but it means a future
  third marker value would be reported as unknown until this module is told
  about it.
