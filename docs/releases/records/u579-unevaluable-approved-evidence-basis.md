# U-579 — An approved-evidence basis that cannot be read is not a stale approval

## Release ID

`2026-10-07-unevaluable-approved-evidence-basis`

## Status

`candidate`

## Plain-English Summary

When a user signs off a phase document, the product records that human approval. Later, every phase
gate that depends on that document re-checks one more thing: does the approval still stand against
the evidence the Move has approved *now*? If new evidence landed after the sign-off, the approval is
stale and the gate should hold until someone looks again.

That check needs two inputs: the document's phase, and a snapshot of the Move's approved evidence.
The repository already states the rule for what happens when the first input is missing — only a
check that can actually run may overturn a recorded human approval, because "I cannot tell" and
"this is stale" are different facts, and the second one can leave a user with no action that would
ever satisfy the gate.

The rule had only been applied to the first input. The second input — the evidence snapshot — is
built by a loader that answers "nothing" for **five distinct reasons that all mean "I could not
read this"**: either review query erroring, either of two row caps being exceeded, the evidence-item
query erroring, or an approved review whose evidence row the tenant-scoped read did not return. A
Move with nothing approved does **not** take any of those paths; it comes back as a real snapshot
with zero rows. So "nothing" from the loader means *unevaluable*, never *nothing approved*.

The gate evaluator read both of its currency comparisons as `false` in that case, and the veto below
them fired. The effect: **every signed-off document linked to a generated file read as not signed
off, so the whole gate ladder held — and nothing anywhere said why.** Two lines earlier, the same
function deliberately lets an unevaluable check pass and writes a log line explaining it.

A sixth cause sat one level up and was not the loader's: the evaluator skipped the load entirely when
the request carried no tenant key, which the tenancy type permits and the tenancy assertion does not
require. The sibling approval route in the same flow resolves the same snapshot with a fallback, so
one half of the gate flow could evaluate currency where the other half could not.

This change gives the evaluator a basis that says whether it is readable and, when it is not, why —
and splits the linked-file check in two. The half that asks "does this file belong to this tenant,
this Move, this document, and is it the current version?" needs no snapshot, so it keeps its veto.
Only the evidence comparison is skipped when the basis cannot be read, and that is reported once per
Move per reason rather than passing silently.

## Layer Impact

Release lane: `global-control-lane` — shared gate-evaluation logic in the Moves control plane,
applying to every client with no feature gate.

- **Canonical model (layer 3):** unchanged. No schema, migration, or stored-value change. The
  snapshot loader, its queries, and its row caps are untouched.
- **Products (layer 4):** Moves only. Phase gates that read a signed-off deliverable can now be
  satisfied while the approved-evidence basis is unreadable, instead of holding with no stated
  reason. No other product reads this evaluator.

## Client Applicability

- All clients: yes — shared control-plane behavior, not feature-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- New `src/lib/programs/approved-evidence-currency-basis.ts` — resolves the approved-evidence basis
  as evaluable-or-not with a named reason, declares whether the tenant-scoped reads were issued at
  all, renders an operator-readable explanation, and reports once per Move per reason.
- `src/lib/programs/governance.ts` — `evaluateGate`'s `isSignedOff` now resolves that basis instead
  of a bare snapshot-or-null, splits the linked-file integrity half (snapshot-independent, keeps its
  veto) from the evidence-currency half, and leaves a recorded sign-off standing when the basis
  cannot be read.
- `src/lib/programs/__tests__/approved-evidence-currency-basis.test.ts` — new suite for the resolver,
  the explanation text, and the report-once behavior.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — seven host-level cases through
  `evaluateGate` itself, since the split exists only inside that function's closure.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

No migrations, routes, scripts, workflows, images, or flags changed.

## QA / Validation

- **PASS** `npx jest src/lib/programs/__tests__ --runInBand` — 156 suites, 1998 tests. This is the
  directory the required `AI surface control catalog` check sweeps, so both suites are CI-wired.
- **PASS** `npm run test:behaviors` — 202 suites, 2102 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` over all four changed/added source files — exit 0.
- **PASS** Non-vacuity proven, not assumed: with `governance.ts` restored to `origin/main` and the
  new host cases kept, exactly the four cases that assert the behavior change fail, and the three
  that assert preserved vetoes pass. A suite over the new module alone would have passed with the
  wiring reverted.
- **PASS** Mutation testing, 9 mutations, 8 killed. Killed: flipping the declared
  tenant-scope-resolved flag; folding the throw reason into the unavailable reason; dropping the
  tenant-key trim; dropping the reason from the report-once key; dropping either early return;
  moving the current-version check out of the integrity half; dropping the integrity veto. The one
  survivor was **diagnosed, not reported as a gap**: a redundant conjunct in the currency expression
  that the veto one line above already implies, so removing it changes no behavior. It is kept
  deliberately and the file now says so.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** Live signed-in walk. This change has no runtime rollout of its own and the demo Move's
  first blocking step is a human evidence approval that is not an agent action.

## Rollout Plan

Merge to `main`. No runtime rollout of its own: the behavior ships with the next scheduled ACA web
image built from `main` by the repo-owned deploy workflow. No migration to apply, no flag to set, no
environment variable to change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az containerapp update`, no traffic shift, no revision weight
  change is performed or required by this release.
- Approved image digest: not applicable — this release introduces no image of its own.
- ACA runtime invariant: unchanged, and not asserted by this release. It must be re-proven by
  whichever `main` deploy first carries this commit, before that deploy is called live-proven.
- Worker image invariant: unchanged. No worker job image, payload shape, or schedule changed.
- Feature/env flag update path: none required.
- Live signed-in proof required: yes, for the deploy that carries this commit — not for the merge.
  This record claims `merged` only.

## Rollback Plan

Revert the squash commit. The change is confined to one new module, one evaluator function, two test
suites, and a regenerated census; it writes nothing, so a revert needs no data repair and no
migration rollback. Reverting restores the prior behavior exactly, including its silent hold.

## Audit Evidence

- PR URL and its CI run on this branch, including the required `AI surface control catalog`,
  `Behavior coverage floor`, `Typecheck + reasoning-layer tests`, `ESLint`, and
  `Release record and impact note` checks.
- Census delta in `docs/architecture/test-ci-coverage-census.json`: `testFiles` 2820 → 2822,
  `coveredTestFiles` 2656 → 2658, uncovered unchanged — the registered-suite proof. Two of those
  four counts move by more than the one added file because the committed census on `main` is one
  file stale; regenerating with the added suite removed reproduces that offset.
- The new log line, `[moves] approved-evidence currency basis not evaluable`, carries the Move id,
  the reason, and the operator-readable detail. Its absence from a gate decision is now itself
  evidence that the basis WAS readable.

## Known Gaps

- **The gate still does not render the reason to the user.** The unevaluable basis is reported to the
  logs, mirroring the sibling check, but no Moves surface shows it. Three other signals in this area
  flow and are rendered nowhere either.
- **The row caps are unchanged.** A Move that exceeds the approved-review or review-activity cap
  still yields an unreadable basis, which now passes rather than holds. That is a deliberate
  consequence of the rule this release applies, not a cap increase — raising or paginating the caps
  so the basis stays readable at scale is separate and not done here.
- **The leg order below the split is unchanged.** A linked file that has been superseded by a
  re-render is still refused before the document's own recorded lineage is consulted, so a
  regenerated document can close a gate its approval basis would still satisfy. Classified here as
  integrity and pinned by a test so a later change to it is deliberate; the product question of
  whether a superseded render should refuse a standing approval is open.
- **No live proof.** No signed-in walk was performed and none is claimed.
