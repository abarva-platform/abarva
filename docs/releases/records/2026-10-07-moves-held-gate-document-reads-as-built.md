# 2026-10-07-moves-held-gate-document-reads-as-built — a document held below gate stops reading as built

## Release ID

`2026-10-07-moves-held-gate-document-reads-as-built`

## Status

`candidate`

## Plain-English Summary

A phase document that was held below its quality bar told the reader it was
built, and then gave them nothing to do about it.

The Move phase workspace lists every document the phase declares, with a status
beside each one. When the page loads, those statuses are seeded from the
documents already stored against the Move. The seed read only whether a stored
document *existed* — so a document the generator had held back, because it did
not clear its quality contract, was seeded as a finished build. It rendered as
"Built" in green, it counted toward the summary line "the phase documents are
built", and it offered a "Download final" link to a document that is not final.

The same stored status is read a second time, by the control that submits the
phase gate approval from the documents already on the record. That reading is
correct: it screens a held document out and withdraws the submission, because a
held document is not something the gate can rely on. The two readings therefore
contradicted each other on one screen. The reader was told every document was
built, the one forward control had quietly disappeared, and nothing anywhere
said which document was held or why.

This change makes both readings use one rule. A stored document in a held state
is now reported as blocked rather than built: it shows "Build blocked", it is
counted in the line that says how many outputs are held, and it carries the
existing "Why this output is blocked" disclosure with a sentence naming the
document, the state it is in, and the re-run that replaces it. A superseded
document is described as not being the current version rather than as a quality
failure, because those are different facts and only one of them means the
document is bad.

Two smaller corrections come with it. A held document no longer offers its draft
as the final download. And the build button now reads as a re-run whenever a
document is already on the record, held or not — previously a held document made
the count of built documents zero, so the button read as a first build while the
blocker sentence beside it was telling the reader to re-run, naming a control
that was not on screen under that name.

No gate moved. No criterion changed severity, no phase became easier or harder
to exit, and the submission control screens exactly the documents it screened
before. This change only makes the per-document status list state what the
submission control already knew.

## Layer Impact

**Release lane: `global-control-lane`.** The phase workspace is shared
control-plane behaviour for every client, not feature-gated and not
client-scoped.

Layer 4 (Products — Moves) only. The phase workspace's per-document status list
and the shared module that decides whether a stored document is a usable build.
No change to layers 1-3: no intake tab, no source adapter, no canonical model
object, no read model, no query and no migration is touched.

## Client Applicability

Ships in the `global-control-lane` named above.

- All clients: yes — the status list reports a held document honestly.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is unconditional.

No client gains or loses a capability. A reader whose phase has no held document
sees exactly what they saw before.

## Changes Included

- `src/lib/programs/phase-build-settlement.ts` — exports `heldArtifactStatus`
  (the normalized held state of a stored document, or null when it is a usable
  build) and `heldArtifactBlocker` (what to say about a held one). The
  submission plan's own screen now calls the former instead of restating it.
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx` — the seeded status
  list calls the same rule: a held document seeds as blocked with its blocker
  sentence, is not offered as a final download, and makes the build control read
  as a re-run.
- `src/lib/programs/__tests__/phase-build-settlement.test.ts` — cases for the
  shared rule and its wording.
- `src/components/strategic-moves/__tests__/phase-approve-and-build-settle.test.tsx`
  — cases for what the reader sees.

No new test file, so the test-coverage and tenancy-fence censuses are unchanged.

## QA / Validation

- **PASS** — defect reproduced before the change and re-measured after, on the
  same rendered component: a held gate document showed "Built" with the summary
  line claiming the documents were built, no blocked label and no disclosure;
  after the change all five readings report the hold.
- **PASS** — `npx jest src/components/strategic-moves/__tests__ src/lib/programs/__tests__`:
  2092 tests passed, 0 failed.
- **PASS** — mutation check, 8 mutations over both changed source files, 7
  killed. The survivor (a held row reporting 100% progress) was diagnosed, not
  left as a coverage gap: the progress figure is rendered only for a row whose
  status is `running`, and a seeded row never has that status, so the mutation
  changes nothing a reader or a caller can observe. The line is kept for the
  row's internal consistency.
- **PASS** — `npx eslint` over the four changed files: 0 problems.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`: exit 0.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — live signed-in walk. This is a client-surface change and needs a
  signed-in reader to confirm it on a real Move with a held document; that proof
  is owed and is not claimed here.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds and
deploys the resulting image; no manual Azure step, no migration, no flag and no
environment variable is involved.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`.
- Shared runtime mutators: none. No command in this change writes to a shared
  Container App, revision weight or template.
- Approved image digest: assigned by the main deploy workflow for the squash
  commit; not pinned by this record.
- ACA runtime invariant: to be proven by that workflow's own post-deploy check,
  not by this record.
- Worker image invariant: unaffected — no worker job changes.
- Feature/env flag update path: not applicable; the change is unconditional.
- Live signed-in proof required: yes, and it is **not** yet captured. This
  record does not claim `live-proven`.

## Rollback Plan

Revert the squash commit and let the main deploy workflow build the previous
tree. There is no migration, no flag and no stored state to unwind: the change
only decides what a status row says about a document that is already stored, so
a revert restores the prior reading immediately and loses no data.

## Audit Evidence

- The pull request for this record, its CI run, and the squash commit on `main`.
- The two test files listed above, which pin both the shared rule and what the
  reader sees, including the case that a usable stored document still reports as
  built.
- The mutation result recorded under QA, including the diagnosis of the survivor.

## Known Gaps

- **The live signed-in walk is owed.** No one has yet seen this on a real Move
  with a held document. The automated cases cover the rendered component, which
  is not the same proof.
- **A held document is still held for a reason the reader cannot always act on.**
  The blocker sentence says to re-run, and a re-run is the right remediation for
  a transient hold — but if a document is held because its quality contract asks
  for a rendered visual the generator did not produce for that phase, re-running
  will hold it again. Naming the specific quality finding in the row, and
  deciding what a reader should do when a re-run cannot clear it, is a separate
  change and a product decision, not covered here.
- **The gate itself does not read the held status.** The server-side criterion
  check treats any stored row as present, so a held document can still satisfy a
  document-only criterion. That is unchanged by this release and is deliberately
  not changed here: tightening it would add a blocker to a phase mid-flight. It
  is recorded as a known asymmetry to sequence separately.
