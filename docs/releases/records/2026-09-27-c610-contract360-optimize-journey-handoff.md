# 2026-09-27-c610-contract360-optimize-journey-handoff — Contract 360 `Open Optimize` opens the Optimize journey

## Release ID

`2026-09-27-c610-contract360-optimize-journey-handoff`

## Status

`candidate`

## Plain-English Summary

On a contract's Contract 360 page there is one visible command called **Open Optimize**. It did
not open the Optimize journey. It moved the Contract 360 tab row to a tab of the same name, so a
user who pressed the only button that says "optimize this contract" stayed exactly where they
were, on a different tab of the same page. The dedicated seven-step Optimize journey at
`/source/optimize` worked, but only for someone who typed its address and appended the contract
id by hand.

**Open Optimize** is now a link into that journey, carrying the contract the user is looking at.
Pressing it opens the journey on that contract; the browser's Back button returns to the contract
the user came from, because the workspace already mirrors the selected contract and tab into the
address bar. The Contract 360 Optimize tab is unchanged and still reached from the tab row — the
tab and the journey are two different destinations and now have two different controls, rather
than one control that claimed to be both.

The link is only offered when the view model holds a governed journey URL for a resolved
contract. With no contract there is no link, rather than a link into a journey with nothing
loaded in it.

## Layer Impact

Release lane: **`global-control-lane`** — shared Source product behaviour for all clients, not
feature-gated and not client-scoped. No client data-plane, admin-only or demo-only element.

- **Layer 4 (Products — Source).** One affordance on the Contract 360 briefing strip changes from
  a callback that re-selected a tab into an anchor carrying the existing governed journey URL.
  No new URL shape is introduced: `vm.optCtaHref` is the same value the contract header action
  already navigates to, built by `contractOptimizationIntakeHref`.
- **Layer 3 (Canonical model).** Not touched. No read, write, projection, migration or schema
  change. No value is computed, relabelled or promoted.
- **Layer 1–2 (Intake, adapters).** Not touched.

Tenant scoping is unchanged and is asserted rather than assumed: the contract id travels in a
query parameter, and `/source/optimize` re-resolves it against the signed-in tenant's own
register on every request. An id the tenant does not hold resolves to no contract and triggers no
optimization read.

## Client Applicability

- All clients: yes — a shared Source product surface, not feature-gated.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a corrected destination for an affordance that already
  shipped, so gating it would leave the wrong destination live behind the flag.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/Contract360Surfaces.tsx` —
  `ContractCaseThreadStrip` renders an anchor to `vm.optCtaHref`; the `onOpenOptimize` prop is
  removed rather than left in place unused.
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx` — the caller stops
  passing a tab-select callback. This is the one line that carried the defect.
- `src/app/(maestro)/source/preview/workspace/workspace.css` — the anchor joins the rule that
  already styled the button, so the affordance keeps the type it had.
- `src/app/(maestro)/source/preview/workspace/__tests__/Contract360Surfaces.test.tsx` — the
  journey handoff, the fail-closed case, and the reshaped pre-existing cases.
- `src/app/(maestro)/source/optimize/__tests__/page.financial-access.test.tsx` — three cases for
  the destination's contract-id scoping.

No migration, script, loader, adapter, workflow or deploy file is touched.

## QA / Validation

**Clean baseline first, in a worktree checked out at `origin/main` `0a6f73356`, before any edit.**

| scope | before | after |
|---|---|---|
| the three suites touched or depended on | 3 suites, 40 tests, **0 failing** | 3 suites, 45 tests, **0 failing** |
| `npx jest "src/app/(maestro)/source"` | 45 suites, 384 tests, **0 failing** | 45 suites, 389 tests, **0 failing** |
| the six workspace suites the AI-surface catalog workflow names | — | 6 suites, 87 tests, **0 failing** |

The five new tests are the whole of the `+5`. No inherited failure is claimed or absorbed.

**Red first, on unmodified product code.** Three of the thirteen cases in the component suite
failed before the fix and pass after it:

- `hands the selected contract to the dedicated journey, not to the Contract 360 tab`
- `offers no journey affordance when the view model holds no governed contract href`
- `does not invent an optimization case from loaded opportunities`

**The three route cases passed before the fix, and that is what they are for.** They are not
red-first and are not presented as such: the destination already resolved a query id against the
tenant, and the cases pin that it keeps doing so now that a visible affordance sends ids to it.
Their non-vacuity is established by mutation below, not by their colour.

**Six mutations, each applied to the shipped code and reverted, reported by which case fired
rather than by a count — a redundant guard absorbing a mutation reads exactly like one that
caught it.** Every mutation was confirmed to have changed the subject before its result was read.

| # | mutation | result |
|---|---|---|
| M1 | the affordance goes back to a callback button | **3 of 13** — exactly the three that were red before the fix |
| M2 | fall back to a contract-less `/source/optimize` when no governed href exists | **exactly 1** — the fail-closed case, absorbed by nothing |
| M3 | the component composes the defect's own URL (workspace path + `contractTab=Optimize`) instead of using the governed href | **exactly 1** — the journey case |
| M4 | the destination trusts the query id, fabricating a contract from it instead of resolving it | **2 of 4** — the new scoping case, and the pre-existing financial-access case with it |
| M5 | the destination's point read is scoped to a different tenant | **exactly 1** — the new scoping case |
| M6 | the destination's downstream opportunity read is scoped to a different tenant | **exactly 1** — the new positive case |

M2 and M3 matter most: they are the two ways a future edit could keep the anchor and still get the
handoff wrong — an empty journey, or a URL composed locally instead of taken from the one governed
builder.

**Where these run.** Both suites are already named by exact path in
`.github/workflows/unit-suites.yml`, so no runner is owed and no CI wiring changed. The route cases
went into the existing wired suite for that reason rather than into a new file whose runner would
have had to be established first.

**Typecheck and lint.** `tsconfig.tsbuildinfo` deleted first, then
`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, judged on
the exit code, zero diagnostic lines. `npx eslint` over the four changed source files — **exit 0**.

**A compile-time guard, worth naming because it is stronger than a test here.** Removing the
`onOpenOptimize` prop means the tab-select cannot be reintroduced at the call site without a
deliberate type change; `tsc` rejects the old call outright.

**The visual claim, and how it was established — by reading the cascade, not by rendering.** A
signed-in render of this surface needs live Clerk and Azure credentials, and a dev server cannot be
started from an unattended run, so no screenshot was taken and none is claimed. What the stylesheet
gives, read directly: `.sw-root button { font-family: inherit }` and `.sw-root a { color: #0f6e56;
text-decoration: none }` already existed, and the rule the anchor now joins supplies the 12px/700
type to both elements — so family, size, weight and colour are identical and the CSS change is
load-bearing rather than cosmetic. **One delta, stated rather than glossed:** `.sw-root a:hover`
gives the anchor a hover colour the button did not have, which is the hover every other link in
this workspace already has.

## Rollout Plan

Squash-merge to `main`. The repo-owned `aca-main-deploy` workflow builds the digest-pinned image
and shifts Product/Lab web traffic. No migration, no data build, no ACA job, no flag or environment
change. No worker job behaviour changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, triggered by the merge. No
  branch, local or ad-hoc Azure command is used.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded on this record after the deploy run completes.
- ACA runtime invariant: to be proven by reading Azure directly — the web Container App template
  image, the 100%-traffic revision image, and both delivery worker job images on one digest-pinned
  reference.
- Worker image invariant: unchanged by this release; asserted as part of the invariant read above.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **yes, and owed.** See Known Gaps.

## Rollback Plan

Revert the PR and let the repo-owned workflow deploy the revert; the previous ACA revision is
available for an immediate traffic shift meanwhile. There is no data, schema or state component, so
a revert restores the prior behaviour exactly — the affordance returns to selecting the Contract
360 Optimize tab.

## Audit Evidence

- The pull request, its check run, and the squash merge SHA.
- The `aca-main-deploy` run keyed to that exact merge SHA, and the Azure read proving the digest
  triple.
- The before/after and mutation tables above, each reproducible with the commands named in them.

## Known Gaps

- **Signed-in read-only replay of the action is owed.** The acceptance asks for it after deploy.
  This lane must not discharge a signed-in acceptance, so it is recorded as a debt and not as a
  pass. Nothing in this record should be read as live-proven.
- **On the Contract 360 Optimize tab there is still no command that opens the dedicated journey.**
  The strip suppresses the affordance there, and `headerActions` suppresses its sibling on the
  same tab, so the tab most about optimization is the one surface with no handoff. That
  suppression predates this change and its removal was deliberately not folded in: it is a
  separate visible-behaviour decision, and a green case currently asserts the suppression. Named
  here so it has a carrier rather than living as an unstated consequence.
- **Two affordances still carry near-identical labels for one destination** — the strip's `Open
  Optimize` and the header's `Open optimize plan` now go to the same journey. That is an
  improvement on them disagreeing, but the duplication is a copy decision nobody has made.
- The strip's link is not proven end-to-end through a rendered shell. The chain is covered in two
  hops — this suite asserts the strip renders `vm.optCtaHref` verbatim, and
  `buildViewModel.numeric.test.ts` asserts that value resolves to `/source/optimize` with the
  selected contract — and the caller's half rests on the type system rather than on a test.
