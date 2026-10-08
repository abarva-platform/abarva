# U-589 — A gate reader that asks only the record nothing writes

## Release ID

`2026-10-07-gate-record-read-from-both-records`

## Status

`candidate`

## Plain-English Summary

Two records can say that a phase gate on the consulting-move workflow was approved, and they do not
cover the same phases.

- `engagements.gates_passed` is a denormalized array of gate records.
- `phase_snapshots` is the authoritative record: the gate-approval route inserts an `approved` row
  for the phase it approved, and that row is what the phase surfaces re-read when they check
  whether an approval still holds.

**No reachable control appends phases 1 through 4 to the array.** That was measured, not assumed:

- The live gate-approval route writes `gates_passed` at exactly one place — the terminal P5 handoff
  — and what it appends is the bare number `5`, carrying no status and no signed-at.
- The live advance route does not write the array at all.
- The legacy phase-gate route does build a full array, but it has **zero product fetchers**.
- `recordGateApproval`, the one writer that produces a complete gate record, has **zero callers**.

So for a move walked through the product, that array holds whatever its seed wrote and nothing
more. Approving the P1, P2, P3 or P4 gate adds nothing to it.

Three readers in the deliverable-generation dependency bundle asked whether a phase's gate had
passed. **One of them consulted both records; the other two consulted only the array.** That
asymmetry between siblings in the same file is what located this.

- `gateApproved` fell back to the snapshots when the array was silent. Correct already.
- `loadDecisions` did not, so the decision history handed to generation stopped at whatever the
  move was seeded with.
- `loadPhaseCapture` did not, and this is the one that is not cosmetic. **Earlier-phase capture is
  inherited into a phase's generation context only for phases whose gate it believes passed.**
  Asking only the array meant no prior phase ever qualified, so a deliverable drafted at P3 or
  later was written without any of the capture answers from the phases before it.

**Nothing reported the omission.** An inherited capture block is additive, so being handed none is
byte-identical to a phase that genuinely had none to inherit.

This release puts the question in one named module that asks both records, and routes all three
readers through it. Each arm keeps the rule its original caller used, so this is the union of two
existing rules and not a new one: the array arm accepts the bare phase, its string forms, and the
seven recorded phase-key spellings with an approving status (an absent status reads as approved, as
that array has always been read); the snapshot arm requires `approved` exactly, as `gateApproved`
required it.

Nothing is relaxed. No gate is passed that neither record approves, and no criterion is waived.
What changes is that a gate approved in the product is now visible to the readers that already
intended to see it.

## Layer Impact

Release lane: `global-control-lane`.

- **Layer 4 — Products (Moves).** The generation dependency bundle's three gate readers, and the
  prior-phase capture inheritance and decision list they shape.
- **Layer 3 — Canonical model:** unchanged. No schema, no migration, no write. Both records are
  read exactly as they already were; neither is written here.
- Layers 1 and 2 are untouched.

## Client Applicability

- All clients: yes. Global control-lane read behaviour on the generation path.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The bundle is not flag-gated.

## Scope Boundary — Which Generation Path This Reaches

Stated plainly, because the wrong answer here would make this release vacuous.

This bundle is **not** what the phase workspace's Approve & Build enqueues. That control goes
through the orchestrated path, which does not construct this bundle. The bundle's reachable
consumers are the agent-dock draft-artifact tool (registered, and the path the agent voice doctrine
prescribes for "draft me a deliverable"), the governed roadmap build, the workspace artifact route,
and the premium branch of the deliverable queue worker.

So the fix is real and reachable on those entry points, and it does **not** change the orchestrated
Approve & Build. Whether the orchestrated path has the same inheritance rule and the same gap is a
separate question this release does not answer.

## Changes Included

- `src/lib/programs/approved-gate-phases.ts` (new): `gatesPassedContainsPhase` (the array arm),
  `snapshotsApprovePhase` (the authoritative arm), and `isGateApprovedForPhase` (the union both
  readers must ask). Pure; no I/O. The header records why neither arm is complete alone.
- `src/lib/deliverables/moves-generate-deps.ts`: the file-local array-only helper is retired and
  all three readers route through the shared predicate. `loadDecisions` and `loadPhaseCapture` now
  load the move's phase snapshots alongside the program, in the same `Promise.all`, once per call
  rather than per phase. `gateApproved` keeps its short-circuit before the snapshot read and
  otherwise delegates.
- `src/lib/programs/__tests__/approved-gate-phases.test.ts` (new): 13 cases over the module.
- `src/lib/programs/__tests__/moves-generate-gate-record-wiring.test.ts` (new): 6 cases that drive
  the two corrected readers through the bundle. Placed in this directory deliberately — see the
  wiring note below.
- `src/lib/deliverables/__tests__/moves-generate-deps.test.ts`: the module double for
  `getPhaseSnapshots` now resolves, which the bundle's new dependency requires.
- `docs/architecture/test-ci-coverage-census.json`: regenerated.

## QA / Validation

| Check | Command | Result |
| --- | --- | --- |
| New module suite | `npx jest src/lib/programs/__tests__/approved-gate-phases.test.ts` | **PASS** — 13/13 |
| New wiring suite | `npx jest src/lib/programs/__tests__/moves-generate-gate-record-wiring.test.ts` | **PASS** — 6/6 |
| Consumer's own suite | `npx jest src/lib/deliverables/__tests__/moves-generate-deps.test.ts` | **PASS** — 6/6 |
| Required directory sweep | `npx jest src/lib/programs/__tests__ --runInBand` | **PASS** — 165 suites, 2128/2128 |
| Consumer directory sweep | `npx jest src/lib/deliverables/__tests__ --runInBand` | **PASS** — 36 suites, 303/303 |
| Typecheck | `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` | **PASS** — exit 0 |
| Lint | `npx eslint` over the five changed/added files | **PASS** — exit 0 |
| Test-CI census | `npm run audit:test-ci-coverage:write` | **PASS** — see note |
| Tenancy fence census | `npm run audit:tenancy-fence-coverage:write` | **PASS** — no change; the new module performs no tenant-scoped read |
| Live signed-in walk | — | **NOT RUN** — owed, and not claimed here |

**Wiring note, because a correct module no caller reaches would pass every gate.** The consumer's
own suite directory is swept only by a non-required job. The wiring suite therefore lives in
`src/lib/programs/__tests__`, which is directory-swept by a required check, and imports the
consumer from there.

**Census note, measured at both ends.** The census committed on the base was already two files
behind its own tree: committed `2834 / 2669 / 2668`, and regenerating the base with this branch's
two new suites moved aside gives `2836 / 2671 / 2670`. With them it gives `2838 / 2673 / 2672`. So
the +4 in this diff is **+2 inherited from the base and +2 mine**. `uncoveredTestFiles` holds at
`165` across all three readings, which is the proof that both new suites are CI-covered rather than
dark.

**Mutation sweep — 7 applied, 7 killed.** The mutator asserts its pattern matches exactly once
before applying, so a pattern that no longer matches is reported rather than counted as a survivor.
That guard fired once during this sweep: the snapshot-load pattern occurs at both corrected
readers, and the ambiguous mutation was re-targeted rather than silently applied to one of them.

| # | Mutation | Killed by |
| --- | --- | --- |
| 1 | `loadPhaseCapture` reverted to the array-only reader | 1 case — the P2-inherited-into-P3 case |
| 2 | `loadDecisions` reverted to the array-only reader | 1 case |
| 3 | The union drops its snapshot arm | 4 cases |
| 4 | The union drops its array arm | 4 cases |
| 5 | The snapshot arm accepts any truthy status | 4 cases |
| 6 | `loadPhaseCapture` loads one phase's snapshots instead of the move's | 1 case |
| 7 | The array arm stops checking status | 1 case |

Mutations 1 and 2 are the ones that matter: each restores exactly the pre-release reader, so they
prove the module is actually consulted at both corrected sites rather than merely declared.
Mutation 6 proves the snapshot read is scoped to the move, which it must be, because these readers
ask about phases other than the one being generated.

## Rollout Plan

Merge to `main` by squash. The change is served by the next repo-owned ACA main deploy. It needs no
migration, no flag, and no data build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Nothing here deploys.
- Shared runtime mutators: none. No `az` command, no revision weight, no Container App template
  change.
- Approved image digest: not applicable — this release introduces no runtime image change of its own.
- ACA runtime invariant: unchanged; to be proven by the main deploy that carries this commit.
- Worker image invariant: unchanged. The queue worker's premium branch constructs this bundle and
  gains the corrected read with the image that carries this commit; no worker image is pinned here.
- Feature/env flag update path: not applicable — no flag.
- Live signed-in proof required: yes, for the inherited capture reaching a drafted deliverable.
  Owed and not claimed here.

## Rollback Plan

Revert the squash commit. The new module has no caller outside the one edited file; that file's edit
replaces one local helper with an imported predicate and adds one read to two existing `Promise.all`
calls. No data was written and no schema changed, so a revert is complete and immediate. The census
would need one regeneration after the revert, and the consumer suite's module double would revert
with it.

## Audit Evidence

- The PR and its CI run.
- The mutation table above, including the pattern-count guard that fired rather than mis-applying an
  ambiguous mutation.
- The census delta with `uncoveredTestFiles` held flat, as the wiring proof for both new suites.
- The reachability measurements behind the Scope Boundary section: zero product fetchers for the
  legacy route, zero callers for the complete-record writer, and one array write site in the live
  route.

## Known Gaps

1. **Nothing in this release makes the denormalized array correct.** It is still not appended to for
   phases 1 through 4 by any reachable control, and the terminal append still carries a bare number
   with no status and no signed-at. This release makes the generation readers stop depending on
   that; it does not fix the array. Whether that array should become a gate ledger at all, when
   `phase_snapshots` already is one, is a governance decision and is flagged rather than taken here.
2. **Four surfaces outside this release still read the array alone**, and therefore still cannot see
   a gate approved in the product: the engagement detail page, the engagement meta strip, the
   engagement list summary's baseline-locked and next-gate dates, and the home attention queue's
   pending-gate derivation. The list summary's baseline-locked date is the sharpest of these — it
   looks for a phase-2 gate record with an approving status and a signed-at, which no reachable
   control writes, so it reports no locked baseline however many gates were approved. Each is a
   separate consumer with its own correct source and is not changed here.
3. **The complete-record writer is dead and also carries a phase cap of 4.** `recordGateApproval`
   has no callers, and if it were wired as-is it would clamp the advanced phase to 4 — it could not
   advance a move into P5. Retire-or-fix is owed; wiring it unexamined would be a regression.
4. **The orchestrated generation path is not covered.** See the Scope Boundary section. Whether it
   carries the same inheritance rule, and the same gap, is unmeasured.
5. **Three definitions of the same question remain in the tree.** This release unifies the three
   readers in one file; a hardcoded phase-5 variant in the transformers and a parameterized variant
   local to the gate-approval route still restate the array rule independently.
6. **No live signed-in walk is claimed.** The corrected inheritance is exercised through the bundle
   under module doubles only.
