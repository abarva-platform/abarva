# 2026-09-25-source-estimate-disclosure-mounted — Mount the Source estimate-assumption disclosure on a surface a reader reaches

## Release ID

`2026-09-25-source-estimate-disclosure-mounted`

## Status

`candidate`

## Plain-English Summary

Source shows a renewal "should-cost" range — a low and a high dollar figure for
what a contract ought to cost. Those two numbers are **modelled**, not read off
a signed price: the model assumes a vendor margin, a small run-the-service team,
a rate card, a twelve-month term and a share of delivery offshore, and it assumes
no transition cost and no cloud or model consumption. None of that was visible
to the reader. Two dollar figures appeared on the screen with nothing saying what
had been assumed to reach them.

A component that says exactly this already existed in the codebase and was fully
tested — but nothing imported it except its own test, so no estimate anyone saw
actually carried it. This change mounts it on the renewal cockpit and makes the
model record its assumptions in the same code that applies them, so the sentence
and the number cannot drift apart.

It also states, for the first time, how many Source surfaces show an estimate at
all, and which of them disclose one — see Known Gaps for the one that still does
not.

## Layer Impact

Release lane: `global-control-lane` — shared app behavior for all clients, not
feature-gated and not client-scoped.

- **Layer 4 — Products (Source).** The renewal cockpit now renders the
  estimate-basis and assumptions block beneath the should-cost range. No number
  on the screen changes.
- **Layer 3 — Canonical model (read side only).** `RenewalShouldCost` gains
  `estimateBasis` and `estimateAssumptions`, built by the same function that
  applies the assumptions. The should-cost inputs move from inlined literals to
  exported named constants; the values are unchanged, so every existing figure is
  byte-identical.
- No intake, adapter, loader, migration or tenant data is touched.

## Client Applicability

- All clients: yes — the disclosure is unconditional on the renewal cockpit.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. A caveat behind a flag is not a caveat.

## Changes Included

- `src/lib/source/renewal-cockpit/cockpit.ts` — export
  `RENEWAL_SHOULD_COST_VENDOR_MARGIN_RATIO`, `RENEWAL_SHOULD_COST_DURATION_MONTHS`,
  `RENEWAL_SHOULD_COST_OFFSHORE_RATIO`, `RENEWAL_SHOULD_COST_ROLE_MIX`,
  `RENEWAL_SHOULD_COST_RATE_CARD`; record `estimateBasis` and
  `estimateAssumptions` on `RenewalShouldCost` from those same bindings.
- `src/components/source/RenewalCockpitView.tsx` — mount
  `EstimateAssumptionDisclosure` inside the should-cost card.
- `src/components/source/__tests__/RenewalCockpitView.estimate-disclosure.test.tsx`
  — new behavioral suite, four cases.
- `.github/workflows/ai-surface-control-catalog.yml` — run that suite.
- `docs/security/ai-surface-control-catalog.json` — the `risk-caveat` control on
  `source-estimate-assumption-disclosure` moves from `status: "none"` to a real
  behavioral-test path; `routeReachable` becomes `true`; `unreachableReason` is
  removed.
- `docs/architecture/unreachable-components.json` — baseline refreshed by the
  repo-owned audit, which now finds the component reachable.
- `src/__tests__/behaviors/uncovered-control-known-suites.test.ts` — two cases
  updated in place; see QA below for why, and why neither was weakened.

## QA / Validation

**Red first, on a clean baseline over the same scope.** The final suite run
against unmodified `origin/main` sources: **3 of 4 failing.** With the change:
**0 of 4 failing.** The one case that passes in both directions is the negative
control, which is what a negative control should do.

```
npx jest --runTestsByPath src/components/source/__tests__/RenewalCockpitView.estimate-disclosure.test.tsx
```

**Then the fix was broken deliberately, nine ways.** Each line records what the
suite did.

| # | mutation | result |
|---|---|---|
| 1 | unmount the disclosure from the view | 3 failed |
| 2 | move the offshore constant, pin its sentence to a stale literal | **survived — see below** |
| 3 | truncate the assumption list at the mount point | 1 failed |
| 4 | add a second disclosure to the ordinary leverage card | 3 failed |
| 5 | move the offshore constant, sentence pinned (after the repair) | 1 failed |
| 6 | pin the margin sentence to a stale literal | 1 failed |
| 7 | pin the term sentence to a stale literal | 1 failed |
| 8 | remove the workflow step that runs the new suite | 2 failed |
| 9 | re-park the surface as `routeReachable: false` | 2 failed |

**Mutation 2 survived, and that was a defect in the test, not in the fix.** The
assumption assertions joined all the rendered lines and searched the joined
string for the constant's percentage. When the offshore sentence was pinned to a
stale "40%", the *next* sentence — which quotes the effective split across the
role mix — happened to carry the new number, and absorbed the mutation. A second
source cancelling a mutation reads exactly like a correct fix. The assertions now
capture each figure from the one sentence that owns it (and assert that exactly
one sentence owns it), which is mutations 5, 6 and 7 above.

**Two existing cases in `uncovered-control-known-suites.test.ts` went red, both
correctly, because this change closed the state they were written against.**
Neither was deleted or weakened:

- *"proves the drifted reason it was written for is gone"* was pinned to this
  surface while it was uncovered. It now asserts the strictly stronger end
  state — no prose branch at all, a behavioral test that exists and that the
  catalog workflow runs, and `routeReachable: true`. Mutations 8 and 9 confirm it
  still fails.
- *"fails when a suite exists that the uncovered control does not name"* is a
  test of the **audit's** behavior that happened to name this surface. Covering
  the surface would have retired it. It now derives both the uncovered control
  and the suite it must be told about from the catalog and a walk of the tree, so
  covering the next surface cannot retire it either. Breaking that branch of the
  audit still turns it red (verified).

**Independent audits, before and after — these are the audits' numbers, not a
claim of mine.**

| | `origin/main` | this branch |
|---|---|---|
| behavioral coverage of reachable controls | 32 of 32 | **33 of 33** |
| reachable share of declared controls | 32 of 40 (80%) | **33 of 40 (82.5%)** |
| controls on no screen | 8 of 40 | **7 of 40** |
| unreachable files under `src/components`, `src/app` | 416 | **415** |

`scripts/audit/route-reachability-check.mjs` reported the component reachable
again on its own, before its baseline was refreshed.

**Everything else run:**

- `npx jest --runTestsByPath` on the renewal cockpit, negotiation brief, vendor
  email draft, the disclosure's own suite and the cockpit action-bar suite —
  29 of 29 pass.
- `src/__tests__/behaviors/{uncovered-control-known-suites,unreachable-reason-claims,catalog-claim-binding,catalog-coverage-two-denominators}.test.ts`
  — all pass.
- `node scripts/audit/ai-surface-control-catalog.mjs` — passes.
- `node scripts/audit/qa-inventory-claims-check.mjs` — passes, no new stale claims.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no diagnostics.
- `npx eslint` on all changed source files — exit 0.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys from
the merge commit. No migration, no flag, no data build, no job.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: set by the main deploy workflow; recorded on the PR after the run.
- ACA runtime invariant: to be proven after deploy — Container App template image, 100%-traffic revision image and required worker job images all equal the approved digest.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not owed for merge. The control is proven from
  rendered output by a suite the catalog workflow runs. A signed-in look at the
  renewal cockpit is worth having and is not a gate on this change.

## Rollback Plan

Revert the PR. Nothing is stateful: no migration, no data build, no flag. The
catalog and orphan-list entries revert with it, and the audits return to the
`origin/main` figures in the table above.

## Audit Evidence

- The PR and its CI run.
- `src/components/source/__tests__/RenewalCockpitView.estimate-disclosure.test.tsx`
  and the `Exercise Source estimate assumption disclosure` step in
  `.github/workflows/ai-surface-control-catalog.yml`.
- `node scripts/audit/ai-surface-control-catalog.mjs` output, before and after.
- `node scripts/audit/route-reachability-check.mjs` output.

## Known Gaps

**The census this change was asked to produce, and what it leaves open.**

Scanning Source component and route files for an estimate-marking token next to
a money render gives **36 candidates**; the repo's own route-reachability audit
says **23 are reachable**. Reading all 23, **9 actually render a savings or cost
estimate to a reader** and 14 are lexicon false positives — a file's
`graphStatus: "projected"`, a banned-phrase regex, prose describing a stage, a
doc comment, a `projectedCurrentStage` variable, a `projected: []` data key, and
teaching content in the Learn case study.

Of those 9, **7 already carried a disclosure of some kind** before this change —
a model badge and provenance note, a confidence pill and value guardrail, an
inline "not validated", a caveat block, a label that says "(event estimate)", and
one that states outright it is neither a saving nor a forecast. **2 carried
none.** This change covers **1 of the 2**.

**The one still open:** the approvals queue and the event approval page both
render the requester's declared `estimated_value_usd` as a bare figure with no
qualifier and no label — in one case appended to an event code as `· $X`, in the
other as a "Value target" fact. The word "estimate" never reaches the reader, so
a self-declared number reads as a measured one. That is a *different* repair from
this one: it needs the label the two intake surfaces already use, not an
assumptions card, and it sits in two route files outside this change's scope. It
is filed as its own backlog item rather than folded in here.

Not addressed, deliberately: `SourceBafoNegotiationModelPanel` and
`SourceCommercialExecutiveBrief` both render an estimated impact and both carry
no disclosure, but both are themselves components no route reaches. Mounting a
control inside an unreachable component produces a green assertion over something
no reader sees, which is the exact failure this item was filed about.
