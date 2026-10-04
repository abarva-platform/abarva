# 2026-10-03-solicitation-acceptance-dependency — State the acceptance dependency in the function that depends on it

## Release ID

`2026-10-03-solicitation-acceptance-dependency`

## Status

`candidate`

## Plain-English Summary

A sourcing event can run as an RFI or an RFP, and the workspace names which one on the phase rail,
in the Files folder names, and in the next-action link. That name is only legitimate once somebody
has formally accepted the motion — an accepting user and an acceptance time are both recorded
against the event.

Until now exactly one function enforced that. The read layer refused to report a motion that had
not been accepted, and the page turned that refusal into "no motion", so by the time the label
function ran, an unaccepted motion could not reach it. The label function therefore read only the
motion and never the acceptance, and it was right — but only because of a fence in a different
file that nothing in the label's own code or tests mentioned.

The cost of leaving that unsaid is specific: relax the fence and an unaccepted motion would be
announced as an accepted RFP on a client-facing rail, with no test objecting. This change states
the dependency in the function that depends on it — the label returns the neutral "Market package"
unless both acceptance fields are recorded — and pins the fence itself with the cases that were
missing.

Three test cases also had names that promised more than their fixtures delivered. Two were named
for an *accepted* motion and supplied no acceptance at all; a third was named for "unknown or
unapplied" authority and only ever exercised the unknown half. They have been given the fixtures
their names claim rather than renamed to match what they were doing.

**This is a latent guard, not a rendering repair.** No client surface renders differently today,
because the fence upstream already prevented the case. Nothing here should be read as fixing a
defect a user could see.

## Layer Impact

**Release lane: `global-control-lane`.** Shared app behaviour for all clients, behind no feature
gate. It is this lane rather than `client-data-lane` because nothing client-scoped changes: no
schema, no RLS, no seed, no ingestion, no retrieval, no private data-plane path.

- **Layer 4 — Products (Source).** `sourceNewMarketPackageLabel` in
  `src/lib/source/new-workspace/phase-state.ts` now requires the acceptance fields before it will
  name a motion. `sourceNewCurrentPhaseLabel` and `sourceNewNextAction` inherit the dependency
  through it. `SourceNewOperatorContextInput` gains the two acceptance fields as optional members;
  the component's event view already carried them, so no caller signature changed.
- **No other layer.** No intake tab, adapter, canonical object, schema, migration, route handler,
  prompt, or dataset is touched. No data is read or written differently.

## Client Applicability

- All clients: no observable change. The behaviour this guard protects is unreachable from the
  live read path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/new-workspace/phase-state.ts` — the label requires both acceptance fields, with a
  comment stating why the dependency is restated here rather than left to the upstream fence.
- `src/lib/source/new-workspace/phase-state.test.ts` — six unit cases over the label, the phase
  label and the next action.
- `src/lib/source/new-workspace/__tests__/event-authority.test.ts` — three cases pinning
  `resolveAuthority`: each acceptance field blank on its own, and a whitespace-only field.
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx` — the two accepted-motion cases
  get the acceptance their names claim; the neutral case becomes a table over one unknown and three
  unapplied fixtures.
- `src/app/(maestro)/source/new/[eventId]/page.test.tsx` — two cases driving the real page with the
  real authority read: an unaccepted motion reaches the workspace as `null`, an accepted one passes
  through with its acceptance.

No production file other than `phase-state.ts` changed.

## QA / Validation

**Scope** — `src/lib/source/new-workspace`, `src/components/source/new-workspace`, and
`src/app/(maestro)/source/new`, the same scope before and after, measured by setting the working
tree aside and re-running rather than by recalling an earlier number.

| run | suites | tests |
|---|---|---|
| clean baseline on `origin/main` `1ba24079b1` | 15 | 201 passed, 0 failed |
| after | 15 | 215 passed, 0 failed |

**Red first, per suite, before the production change:**

- `phase-state.test.ts` — 5 failed / 34 passed. The sixth new case (an accepted motion still names
  itself) passed from the start on purpose: it is the guardrail an over-broad fix would break.
- `SourceNewWorkspace.test.tsx` — 3 failed / 65 passed. The three unapplied rows failed; the unknown
  row passed, for the same reason.
- `event-authority.test.ts` and `page.test.tsx` — green from the start. Those cases pin behaviour
  that is already correct and was simply unasserted, so their necessity rests on mutation alone,
  and that is stated here rather than dressed up as a repair.

**Mutation — six applied, six caught.** Each changes behaviour; none is a no-op rename.

| # | mutation | result |
|---|---|---|
| 1 | the label stops requiring acceptance (back to the bare motion branch) | 8 failed / 113 passed across the four suites |
| 2 | the label stops trimming, so a whitespace acceptance field reads as acceptance | 1 failed |
| 3 | `resolveAuthority` drops the accepting-user half of its acceptance branch | 3 failed: the new per-half case, the whitespace case, and the page's unaccepted-motion case |
| 4 | `resolveAuthority` drops the acceptance-time half | 1 failed: the matching per-half case |
| 5 | the page passes the motion through regardless of `authority.kind` | 1 failed |
| 6 | `resolveAuthority` stops trimming | 1 failed |

**The finding that decided the shape of the fix, and it was not in the filed item.** A case named
"fails closed when an asserted motion lacks the named acceptance" already existed — but it blanks
*both* acceptance fields, so either half of the branch satisfies it alone. Under mutations 3 and 4
that pre-existing case stayed **green** while the new per-half cases went red. The new assertions
are therefore necessary rather than redundant, which the register's redundant-guard rule requires
be demonstrated and not asserted.

**Typecheck** — `tsconfig.tsbuildinfo` removed first, then
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`: **exit 0**, 0 diagnostics.
The exit status was captured directly, not inferred from a grep over piped output.

**Lint** — `npx eslint` over the five changed files: exit 0, no findings.

**Wider sweep** — `npx jest src/components/source src/lib/source`: 430 suites, **1 failed / 4492
passed** before and after. The one failure is
`governed-vendor-proposal-facts.test.ts › runs accepted facts through the mandatory gate with
requireAgentReady: false`, and it was confirmed pre-existing by stashing this change and re-running
that path on clean `origin/main`, where it fails identically. It is unrelated to this work and is
not quoted here as a count this change caused.

**No browser walk, and that is the correct scope, not an omission.** The behaviour these guards
cover is unreachable from the live read path, so a signed-in reading could not distinguish a pass
from a fail. Jest and `tsc` are the whole proof available for it.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys as usual. No migration,
no flag, no job, no data build, and no runtime configuration change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: whatever the main deploy workflow produces for the merge commit.
- ACA runtime invariant: to be proven after merge — Container App template image equal to the image
  on the 100%-traffic revision.
- Worker image invariant: no worker code changes; no worker image is expected to move.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no**, and the reason is stated under QA rather than waived.

## Rollback Plan

Revert the single commit. The change is four test files and one pure function with no persisted
state, no schema and no configuration, so a revert restores the previous behaviour completely and
immediately. No migration rollback is involved.

## Audit Evidence

- The pull request and its CI run.
- The before/after and mutation numbers in this record, each reproducible from the commands quoted
  beside them.
- The pre-existing failure claim is reproducible by checking out `origin/main` `1ba24079b1` and
  running the named test path.

## Known Gaps

- The component keeps its own `hasAcceptedSolicitationMotion` helper, which asks the same question
  as the label now asks. Consolidating them is a reasonable follow-up and was deliberately not done
  here: it would change a component source file this change otherwise does not touch, and the
  duplication is correct today rather than wrong.
- The guard is latent. If the upstream fence is ever removed on purpose, these cases will need to be
  revisited together rather than one at a time.
