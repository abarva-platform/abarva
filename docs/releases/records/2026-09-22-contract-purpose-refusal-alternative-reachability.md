# 2026-09-22-contract-purpose-refusal-alternative-reachability — Contract-purpose refusal control: make every alternative reachable

## Release ID

`2026-09-22-contract-purpose-refusal-alternative-reachability`

## Status

`candidate`

## Plain-English Summary

The Source contract workspace refuses to describe "what this contract is" when the stored
purpose text is really database column values rather than a reviewed sentence. It decides that
by testing the text against a short list of values that mean "never reviewed" — `absent`,
`unknown`, `unresolved`, `none`, `null`, `n/a`, `for_cause_only`.

One of those seven could never match. The text was first passed through a helper that deletes
snake_case identifiers, and `for_cause_only` is the only snake_case entry in the list — so it
had already been removed from the string before the list was consulted. The two mechanisms want
opposite things about the same input: the list refuses the whole value, while identifier
stripping keeps whatever prose survives. Because stripping ran first, a stored purpose reading
`Managed services scope for the analytics estate for_cause_only` was presented to a reader as
`Managed services scope for the analytics estate` — a reviewed-purpose characterisation with a
governing termination clause silently removed from it, which is precisely what the list was
written to prevent.

This change consults the list on the raw value first, so the refusal happens as written. It also
moves the list out of the 3,900-line surface file into a small module of its own, and adds a test
that enumerates the list's own entries rather than restating them, so an entry added later that
the stripper would swallow fails a required check instead of quietly becoming dead.

**A decision was required and is recorded here.** The item offered two readings: delete the
unreachable entry (accepting that stripping is the intended behaviour), or apply the list before
stripping (accepting that refusal is intended). Refusal was chosen. Deleting the entry would make
the code honest while permanently blessing the silent removal of a governing clause from a
sentence still labelled a reviewed purpose; refusing leaves the reader with "Purpose review
needed", which understates rather than overstates what was reviewed. The change is one line of
ordering and is cheap to reverse if the other reading is preferred.

## Layer Impact

Release lane: `global-control-lane` — shared control-plane behaviour reaching all clients, not feature-gated.

- **Layer 4 — Products (Source).** Presentation only. The contract-purpose card refuses one
  additional class of stored value instead of rendering a stripped version of it.
- No change to layers 1–3. No canonical object, loader, adapter, schema, or stored value is
  touched; nothing is written, migrated, or recomputed.

## Client Applicability

- All clients: yes — the surface is shared, and the behaviour change applies wherever a stored
  `purpose_summary` or `scope_summary` carries a standalone unreviewed-value token.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

Scope of the behaviour delta is narrow and was measured rather than assumed: only a value
carrying a standalone token that equals a list entry outright changes outcome. A listed word
inside a longer identifier (`none_selected`, `benchmarking_absent`) has no word boundary, is not
matched, and is still stripped exactly as before. The six non-snake_case entries were already
reachable and are unaffected.

## Changes Included

- `src/lib/source/contract-purpose-refusal.ts` — new. Now owns the refusal control entire:
  `UNREVIEWED_PURPOSE_TOKENS`, `isUnreviewedPurposeValue()`, `usableText()`,
  `withoutIdentifierTokens()` and `usableScopeSummary()`, with the ordering requirement stated
  beside the list it orders.
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` — those five helpers
  moved out; the surface imports them. `withoutIdentifierTokens` is re-exported from its original
  location so importers and the export-reachability baseline see no change.
- `src/__tests__/behaviors/source-contract-purpose-refusal-alternatives.test.ts` — new behaviour
  suite enumerating the control's own alternatives, importing from lib.
- `src/app/(maestro)/source/preview/workspace/__tests__/contractPurposeProse.test.ts` — one added
  case asserting the card still calls the control, which the lib suite by construction cannot see.
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`
  — comment only; retires the note that filed this defect and points at its repair.

No migration, no route, no script, no job.

## QA / Validation

Measured on branch `claude/exec-run-20260922T064353Z` from `origin/main`
`8c8e1f32847964ee0c7263fac12b53f63cc860a1`.

**Red first, on unmodified product behaviour.** The new suite was run with the list still applied
after identifier stripping:

```
Tests: 1 failed, 7 passed, 8 total
● refuses a purpose carrying the standalone token for_cause_only
  Expected: "Purpose review needed"
  Received: "What this contract is"
```

The six other alternatives passed in that same run, which is the evidence that the defect is
isolated to the one snake_case entry rather than general to the control.

**Green after the ordering fix.** Across both suites that hold this behaviour:
`Tests: 16 passed, 16 total`.

**Three deliberate mutations, each against the final structure:**

| mutation | result |
|---|---|
| restore the original order (list applied after stripping) | `2 failed, 14 passed, 16 total` |
| delete the `for_cause_only` entry from the list | `2 failed, 13 passed, 15 total` |
| make the card call `withoutIdentifierTokens` instead of the control | `1 failed, 15 passed, 16 total` |

The second mutation's total drops from 16 to 15 because the cases are generated from the list, so
deleting an entry also deletes its case. The explicit membership assertion exists for that reason:
without it, removing the alternative would have left the suite green with one fewer test — the
same "gate that cannot fail" shape this change repairs. The third mutation is why the surface case
exists: the lib suite cannot see whether the card still calls the control, and only that case fails.

**Full runs, each judged by exit code rather than by grepping its output:**

- `npm run coverage:behavior-gate` — **exit 0**. `Test Suites: 101 passed, 101 total`,
  `Tests: 844 passed, 844 total`; gate observed lines 91.01% (floor 90), statements 91.01%
  (floor 90), functions 63.53% (floor 60), branches 70.32% (floor 50).
- Source workspace directory, 33 suites — exit 0, `Tests: 286 passed, 286 total`.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no
  diagnostics.
- `npx eslint` over the five changed files — exit 0.
- `node scripts/audit/route-reachability-check.mjs` — exit 0, "No new unreachable components or
  exports."

**Two controls caught intermediate drafts of this change, and both were obeyed rather than worked
around.** They are recorded here because the repair they forced is most of why the change has the
shape it does.

*First, export reachability.* The initial draft exported the token list from the surface file
itself. `route-export-reachability.test.ts` failed, because an export under `src/app` that only a
test imports is a new unreachable export:

```
"exportsAdded": [
  "src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx#UNREVIEWED_PURPOSE_TOKENS"
]
```

Moving the list into `src/lib/source/` — where the surface's own import makes it reachable —
resolves it. `docs/architecture/unreachable-components.json` is not modified.

*Second, the behaviour coverage floor, which failed in hosted CI on the first push and is the
reason the control moved wholesale.* Every test passed in that run — `101 passed`, `844 passed` —
and the job still failed, because the floor is a coverage-percentage gate and not a pass/fail of
tests:

```
Behavior coverage gate failed:
- lines: 82.4% < 90%
- statements: 82.4% < 90%
- functions: 47.88% < 60%
```

The cause was the new suite's own import. It reached the control through the workspace shell, and
the floor measures coverage over everything a suite loads, so that one import put 14,495 lines
into the denominator with 3,274 covered — 8,466 lines from `WorkspaceExecutiveShell.tsx` alone,
7,650 of them unexercised, plus its import tree. The repair was to move the control into lib so
the suite can hold the ordering without loading the surface. That is why `usableScopeSummary` and
its helpers now live beside the list rather than inside the surface, and the module comment says
so.

This was a local reporting failure before it was a CI failure: the same gate had been run locally
and its output piped through a grep for the jest summary lines, which discarded the gate's own
verdict and its non-zero exit. Every command quoted above is now reported by exit code.

**Baseline.** `main`'s behaviour floor is green by construction — it is a required context on the
`main` ruleset, so no merge lands with it failing. The denominator delta from this change is a
single small, fully-exercised module: no behaviours suite imported the workspace shell before this
change and none imports it after, so the observed 91.01% moves in the same direction as the
baseline rather than resting on a new exclusion. This PR's hosted run re-establishes it
independently.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds the image and shifts
traffic. No migration, no flag, no job, no manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`. No
  hand-run Azure command.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow for the merge SHA; recorded in the
  claim register when the run completes.
- ACA runtime invariant: to be proven after deploy — Container App template image digest must
  equal the 100%-traffic revision digest.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: not owed. The change alters one refusal branch in a pure
  function and is proven at the function's own boundary by the behaviour floor. It renders no
  new surface and reaches no tenant data, so a signed-in session would exercise nothing the
  floor does not already exercise.

## Rollback Plan

Revert the squash commit. There is no migration and no stored state, so revert is complete and
immediate. If only the behaviour is unwanted but the structure is not, the narrower reversal is
to move the `isUnreviewedPurposeValue(raw)` call back below `withoutIdentifierTokens` in
`usableScopeSummary` — one line, and the enumerating test will fail and say so.

## Audit Evidence

- PR for this branch, and its hosted check run, including `Behavior coverage floor`.
- The red/green/mutation figures quoted above, each reproducible with
  `npx jest --runTestsByPath src/__tests__/behaviors/source-contract-purpose-refusal-alternatives.test.ts`.
- `node scripts/audit/route-reachability-check.mjs --json` — `exportsAdded` empty on the merged
  shape.
- Claim register lines for this item under agent identity
  `source-backlog-executor#20260922T064353Z`.

## Known Gaps

- The choice of refusal over deletion is a recorded judgement, not an instruction from the item
  owner. It is flagged in the backlog entry so it can be reversed cheaply if the other reading
  is preferred.
- The separator short-circuit at the top of `usableScopeSummary`
  (`/\s[-–—]\s(?:present|absent)(?:\b|_)/i`) was left exactly as it was. It is reachable and was
  not in scope; it is not covered by the new enumeration, which tests the token list only.
- `WorkspaceExecutiveShell.performance.test.ts` is still run by no workflow. That is the open
  question in T-595 and was not settled here.
- The surface-wiring case added to `contractPurposeProse.test.ts` runs in `unit-suites.yml`, which
  is **not** a required context on `main`. So the control's own behaviour is merge-blocking while
  the assertion that the card still calls it is not. That asymmetry is a consequence of the
  coverage floor's denominator, not a choice about what matters, and it is the same tension T-595
  is open on. Filed as U-500 rather than resolved inside this change.
