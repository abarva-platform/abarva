# 2026-10-06-moves-approval-currency-scope — An unevaluable approval-currency check no longer vetoes a recorded sign-off

## Release ID

`2026-10-06-moves-approval-currency-scope`

## Status

`candidate`

## Plain-English Summary

A Moves phase gate reads two separate facts about a document: did an authorized user
sign it off, and does that sign-off still stand against the evidence approved for the
document's phase. The second check needs a phase. It took the phase from the
deliverable registry, and when the registry carried no entry for the document's type
the lookup returned nothing — which the gate then read as "the sign-off is out of
date" rather than "I cannot tell".

For one document type that difference closed the first gate permanently. The P0
origination brief is not a registry entry, three of the P0 hard gate criteria all read
that single document, and no other document can satisfy them. The deliverable sign-off
route accepts that type and, on the approve-an-edited-upload path, records a link to
the approved file. Sign-off only acts on a draft or in-review document, so once the
document was signed off with that link the gate could not be unstuck by signing it
again: the document sat there signed off while the gate reported all three criteria
failed, with no action available that could change the answer.

This change states the rule explicitly. A currency check is either evaluable or it is
not, and only an evaluable check may overturn a recorded human approval. When it is
not evaluable the sign-off stands and the gate logs the registry gap once per document
type, so the gap is visible rather than inferred from a gate that quietly stopped
failing. Where the check IS evaluable nothing changes — a stale link still blocks.

## Layer Impact

- `global-control-lane` — layer 4 (Products · Moves). Phase-gate evaluation only. No
  schema, no data-plane, no retrieval, no model prompt, and no change to which
  criteria a gate declares or their severity.

## Client Applicability

- All clients: yes — the gate evaluator is shared and not flag-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change narrows an existing veto to the cases where it can be
  evaluated; it adds no new behaviour to gate behind a flag.

## Changes Included

- `src/lib/programs/deliverable-approval-currency.ts` (new) — owns the question "can
  this document's approval currency be checked at all?", returns the phase or the
  reason it cannot (`unregistered_deliverable_key`,
  `phase_outside_evidence_basis_range`), carries the operator sentence, and reports an
  unevaluable type once per process.
- `src/lib/programs/governance.ts` — `isSignedOff` resolves the scope first and returns
  the recorded sign-off when no currency check can run, instead of computing a lineage
  verdict from a phase that does not exist. The two existing vetoes are unchanged for
  every document the registry can phase-resolve.
- `src/lib/programs/__tests__/deliverable-approval-currency.test.ts` (new) — 10 cases.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — 3 cases added
  against the existing `evaluateGate` harness, including the companion case proving a
  registered document with a stale link still blocks.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- PASS `npx jest src/lib/programs/__tests__/deliverable-approval-currency.test.ts` — 10/10.
- PASS `npx jest src/lib/programs/__tests__` — 130 suites, 1326 tests.
- PASS `npx jest src/lib/programs src/app/api/v1/programs src/app/api/programs src/__tests__/integration/programs`
  — 410 suites, 6002 tests, 1 suite / 20 tests skipped (pre-existing skips).
- PASS `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- PASS `npx eslint` on the four changed files — exit 0.
- PASS mutation review — 13 mutations, 13 killed. Six against the scope resolver (drop
  the unregistered arm, collapse the two reasons into one, drop the lower bound, widen
  the bound, drop the type from the operator sentence, make the sentence claim the
  approval was verified), two against the report (dedupe on the reason alone, no
  dedupe at all), five against the gate wiring (fall through to the veto — the
  behaviour before this change, remove the report call, report the wrong identifier,
  remove the registered-document link veto, remove the generated-lineage veto). One
  earlier mutation (treat an unevaluable scope as phase 1) survived because the early
  return made the computed verdict unread; it was removed by hoisting the return above
  the lineage comparisons rather than by adding a test, so the mutation no longer
  exists to survive.
- PASS census regeneration — `audit:test-ci-coverage:write`: files 2769 -> 2771,
  covered 2605 -> 2607, uncovered flat at 164. Flat uncovered is the evidence both new
  and changed suites sit in CI-reached directories.
- NOT RUN live signed-in walk. This is a gate-evaluator change and the walk is a
  human-in-the-loop step; see Deployment Authority.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow then builds and
deploys as usual. No migration, no flag, no environment variable, no worker job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path
  that may shift shared Product/Lab web traffic.
- Shared runtime mutators: none in this change. No `az containerapp update`, no ad-hoc
  `az acr build`, no traffic or revision-weight change.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by
  this record.
- ACA runtime invariant: to be proven after the deploy — Container App template image,
  100%-traffic revision image, and required worker job images all matching the merged
  digest.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, before this may be called `live-proven` — a
  signed-in walk advancing a Move out of P0 with the origination brief signed off
  through the approve-an-edited-upload path. That walk is an authorized human step and
  was not performed here.

## Rollback Plan

Revert the squash commit. The change is three source edits and two suites with no
schema, data, or configuration component, so a revert restores the prior evaluator
exactly. Reverting reinstates the dead end described above, so prefer rolling forward.
No migration rollback applies.

## Audit Evidence

- The PR for this record, its CI run, and the diff of `isSignedOff`.
- `src/lib/programs/__tests__/deliverable-approval-currency.test.ts` — the case
  enumerating which sign-off-backed criteria can be currency-checked, written as a
  literal so a registration or an alias rename moves a row rather than passing
  silently.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — the P0 case
  (unevaluable scope, link present, no hard failures, gap reported) and its companion
  (registered document, stale link, still blocked).
- The `[moves] deliverable approval currency not evaluable` log line in a deployed
  revision's logs names every type still in this state.

## Known Gaps

- The registry gap itself is not closed. Twelve criterion/type pairs across four gates
  read a document type the registry cannot phase-resolve; in every group except P0's,
  at least one sibling type IS resolvable, so this change is what keeps those groups
  honest rather than permissive. Registering the missing types is a separate decision
  with wider consequences, because registry entries also drive phase build sets and
  document display sets.
- `isApprovedMoveEvidenceBasisCurrent` answers only for P1–P5. A document legitimately
  belonging to P0 therefore has no evidence basis to be current against even once
  registered. That bound is mirrored here, with the suite asserting agreement by
  calling the function at the edges rather than restating the numbers, but it is not
  changed.
- The companion gap in the P0 flow is untouched: sign-off acts only on a draft or
  in-review document, so a document already signed off cannot be re-signed to refresh
  its approval link. Nothing in this change needs that, but it remains the reason the
  dead end was unrecoverable rather than merely wrong once.
- The gate layer's criterion-to-document-type joins are still inline literals inside
  the evaluator's switch, which is why the new suite has to restate them to check them.
