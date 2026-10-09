# u642 — The ninth gate read says whether it read

## Release ID

`2026-10-09-u642-gate-evidence-read-readback`

## Status

`candidate`

## Plain-English Summary

The previous release (u640) made the phase-gate evaluator say so when it could
not read the state it was judging, instead of reporting the documents it never
saw as missing. That release classified **eight** reads — the eight whose code
sits in the evaluator's own body.

There is a **ninth**. One criterion on the phase-2-to-phase-3 gate — "discovery
notes or workshop logs ingested", a HARD criterion, which means a reviewer
cannot cross that gate until it clears — asks a small helper function whether
this Move has any ingested discovery evidence recorded. That helper sits one
level down from the evaluator, so enumerating the reads visible in the
evaluator's body did not find it, and it still returned a bare yes/no.

The data-plane client never throws. A connection failure, a permission denial,
a timeout or a renamed column arrives as a result object whose error field is
the only signal that anything went wrong. The helper read the rows and
discarded that field, so a failed read returned **no** — the same answer as a
Move that has genuinely ingested nothing.

The consequence is the one u640 was written to remove, surviving inside the
function u640 hardened. A reviewer at a finished discovery phase, pressing the
approve-and-build control, would be told the gate is blocked because discovery
notes have not been ingested — a statement about a record that was never
actually read. The remedy that sentence invites is to upload or re-ingest notes
that may well already be in the workspace, which adds duplicate evidence items
without changing the verdict, because the next attempt reads the same
unreadable table.

This change makes that read report whether it read:

- the helper now returns either a presence answer or a read failure, as two
  mutually exclusive shapes rather than one shape with a discardable error
  beside it;
- when the read fails, the gate refuses with the same single named refusal u640
  introduced, naming the Move's ingested discovery evidence as the record it
  could not read, and stating explicitly that this is **not** a finding that
  any document is missing;
- the refusal keeps u640's instruction not to regenerate or re-upload anything
  to clear it, which is the advice that would otherwise undo signed work.

**The verdict does not change.** An unread record still refuses the gate —
failing closed is correct, because a record nobody could read cannot clear a
criterion a human has to sign behind. What changes is only what the refusal
says.

One ordering change comes with it. The criterion has five independent ways to
clear, four of which answer from state the evaluator has already read. Those
four are now tested first, and the database read is issued only when it is the
one that decides the answer. The result of the criterion is unchanged — these
are side-effect-free checks combined with "or", so their order cannot change
the outcome — but it means an unreadable evidence record can only refuse a gate
that nothing else had already cleared. A gate that was going to pass anyway
still passes.

Also, the list of reads the refusal can name is now exported from the module
that owns it, rather than re-typed by its tests. A hand-typed list is how the
ninth read went unclassified: the tests iterated eight names while the
evaluator issued nine, so every per-read case passed and none of them was
missing.

## Layer Impact

- **Layer 4 (Products)** — Moves. The phase-gate evaluator's refusal wording
  and one criterion's read ordering. Behaviour on readable state is byte-for-
  byte unchanged; the only new outcome is a named refusal on a read failure
  that previously produced a false absence.
- **Layer 3 (Canonical model)** — no schema, migration, or stored-value change.
  No read is added or removed; one existing read is issued less often.

Lane: `global-control-lane`.

## Client Applicability

- All clients: yes — the evaluator is shared and not feature-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a refusal-wording and read-ordering
  correction; gating it would leave the false-absence sentence live.

## Changes Included

- `src/lib/programs/governance.ts` — `hasProgramEvidence` becomes
  `readProgramEvidence`, returning a discriminated union; the
  `discovery_notes_ingested` branch tests its four in-memory arms first and
  refuses by name when the remaining read fails; the single refusal shape is
  extracted to `unreadableGateState` and now serves both the pre-loop
  classification and the in-loop read.
- `src/lib/programs/gate-state-readback.ts` — new `program_evidence` read with
  its own human-facing label; the read order is exported as
  `GATE_STATE_READS`; the module header's read count corrected from eight to
  nine, with a note on why the ninth was missed.
- `src/lib/programs/__tests__/gate-state-readback.test.ts` — the per-read
  matrix is derived from the exported order instead of a hand-typed list, with
  one literal assertion pinning the full set; new cases for the ninth read's
  label and its position in the refusal order.
- `src/lib/programs/__tests__/governance-gate-state-unreadable.test.ts` — a new
  describe for the ninth read (refuses by name, does not report the criterion
  as failed, names only the read that failed, stays hard) plus the ordering
  change's own regression surface: each of the three in-memory arms clears the
  criterion without issuing the read and survives an unreadable read.
- `docs/releases/records/u642-the-ninth-gate-read-says-whether-it-read.md` —
  this record.

No migration, no route signature change, no new dependency.

## QA / Validation

- **PASS** — `npx jest src/lib/programs src/lib/deliverables`: 529 suites,
  7747 tests green.
- **PASS** — the two directly affected suites: 51 cases green
  (`gate-state-readback.test.ts`, `governance-gate-state-unreadable.test.ts`).
- **PASS** — mutation testing, **8 of 8 mutants killed**, run against four
  suites (the two above plus `governance-gates.test.ts` and
  `governance-evaluate-gates.test.ts`):
  1. the read drops its error again (the defect this release removes) — killed;
  2. the branch stops refusing on an unread record — killed;
  3. the new read dropped from the exported read order — killed;
  4. the new read reuses a sibling's human-facing label — killed;
  5. the read is issued first again, so an unreadable record refuses a gate
     another arm had cleared — killed;
  6. the refusal names the wrong read — killed;
  7. the refusal is downgraded from hard to soft — killed;
  8. the read reports itself readable on a failed read — killed.
- **PASS** — `tsc -p tsconfig.json --noEmit` with an 8192 MB heap, exit 0.
- **PASS** — `npx eslint` on all four changed source files, exit 0.
- **PASS** — Prettier measured per file in place against the base revision.
  Three files were clean at base and are left clean. `governance.ts` was
  already unformatted at base at its import block (line 28) and is left exactly
  as it was there; the one reformat this change introduced was corrected, so it
  adds no new unformatted line.
- **NOT RUN** — live signed-in walk. The refusal direction requires a
  data-plane read to fail and cannot be staged from a browser; it is covered by
  the mutation-verified suites instead.
- **PRE-EXISTING, NOT FROM THIS CHANGE** — four component suites fail
  identically on the unmodified base revision (5 cases across
  `TenantIdentityStrip`, `HomeOverviewV2.tenant-switcher`,
  `HomeKnowAnswerRenderer`, `HomeKnowAsk`). Measured by restoring all four
  changed files to base and re-running those suites alone: same 4 suites, same
  5 cases. Out of scope here; recorded under Known Gaps.

Both test files live in `src/lib/programs/__tests__`, a directory already
wired into CI and in the required floor, so no workflow change is needed and
neither suite is dark.

## Rollout Plan

Merge to `main` by squash. The change is library code with no migration and no
flag, so it becomes active with the next image built and deployed by the
repo-owned ACA main deploy workflow. No separate rollout step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge; this
  release pins none.
- ACA runtime invariant: unchanged; no `az containerapp update` is part of this
  release.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable, no flag.
- Live signed-in proof required: yes, for the healthy direction — see Known
  Gaps.

## Rollback Plan

Revert the squash commit. The change is confined to four files, adds no
migration and no stored value, and writes nothing, so a revert restores the
prior behaviour exactly — including, deliberately, the false-absence sentence
it removes. There is no data to migrate back and no partially applied state to
reconcile.

## Audit Evidence

- The PR for this release and its CI run.
- The mutation results listed under QA, reproducible by applying each listed
  mutation to the named file and running the four suites.
- The base-versus-change Prettier measurement described under QA.
- The base re-run proving the four failing component suites predate this
  change.

## Known Gaps

- **No live signed-in proof.** The healthy direction — a gate that clears its
  ingested-evidence criterion from a readable record, and a gate that fails it
  with the concrete per-criterion reason when the record is genuinely empty —
  is asserted in tests but has not been walked by a signed-in user. That walk
  is owed, together with the walks already outstanding for the preceding
  releases in this series.
- **The refusal direction cannot be staged.** Producing it needs a data-plane
  read to fail. It is covered by mutation-verified suites, not by a browser
  check.
- **Four component suites are failing on the base revision.** Named under QA.
  They are unrelated to Moves gating and are not addressed here.
- **The gate's remaining reads outside this evaluator are not in scope.** This
  release completes the evaluator's own set at nine. Reads issued by other
  functions that happen to feed product surfaces are a separate enumeration.
