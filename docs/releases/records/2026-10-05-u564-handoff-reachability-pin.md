# 2026-10-05-u564-handoff-reachability-pin — Pin the unreachable capture hand-off view with a behavioural test

## Release ID

`2026-10-05-u564-handoff-reachability-pin`

## Status

`candidate`

## Plain-English Summary

The Moves capture flow has four views: three question steps and a fourth
"hand-off" view that reads back what was captured. The fourth view is currently
unreachable in the only configuration the product actually renders, so the
read-back screen — and everything hosted on it — is shipped, switched on, and
seen by nobody.

The cause is a single either/or in the footer. The last step renders *either* the
host's governed approve control *or* the built-in primary button, and the primary
button's click handler is the one and only thing in the component that advances
to the hand-off. Because the host supplies an approve control on every path that
mounts the flow, the primary never renders, so nothing calls the advance. The
other ways in are closed too: the starting view is typed to the three question
steps only and is clamped to them by the host, and the step bar moves backwards
only.

**This change adds no product behaviour and fixes nothing.** It adds one
behavioural test that pins the defect, because today no suite can see it. The
test renders the flow the way the host renders it — with an approve control
present on the last step — and asserts the hand-off is reachable. That assertion
is the correct one and it does not hold today, so the test is marked
`it.failing`: the suite stays green while the defect stands, and turns red the
moment any remedy makes the hand-off reachable, which is what forces whoever
lands the remedy to promote the case to a plain `it` rather than leaving the
assertion unowned.

Why no existing control caught this: the hand-off's contents are imported and
referenced, so the module-graph reachability audit considers them live. Only a
branch that never executes makes them dead, and nothing reads for that. The three
existing cases in this suite that touch the area each miss it in a different way
— two reach the hand-off but pass no approve control, so they walk a footer the
product never renders, and the third passes one but asserts only that it replaces
the built-in Submit, never that the hand-off survives it.

**Which remedy to take is explicitly not decided here.** That half of the backlog
item is a product decision: either make the fourth view reachable alongside the
approve control, or move what it hosts onto a surface that already renders. The
test is written to be independent of that choice — it presses every forward
affordance the last step offers rather than one button by name, so a remedy may
label its control however it likes.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 — Products (Moves):** test-only. One behavioural case is added to an
  existing component suite. No component, route, loader, adapter, projection,
  schema, flag, or canonical object is touched, so no layer's behaviour changes.

## Client Applicability

- All clients: no behaviour change — this release adds a test and a record.
- Specific clients: none.
- Internal only: yes, in effect — the only artifact is developer-facing.
- Public/demo only: no.
- Feature flag: none added or changed. The defect the test pins sits upstream of
  the flags that gate the hand-off's contents, which is why switching those flags
  on did not make the screen appear.

## Changes Included

- `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx` — one
  `it.failing` case, plus the comment block recording the four facts that close
  every path into the hand-off and why no existing case covers it.
- This release record.

No source file changed. The component mutation described under QA was applied
only to prove the pin fires, and was reverted.

## QA / Validation

Baseline and result over the same scope, measured on `main` `ead3fcec28`:

- `npx jest --runTestsByPath src/.../MovesCaptureFlow.test.tsx` — **before:**
  9 passed, 0 failing. **After:** 10 passed, 0 failing.
- **The assertion fails for the right reason.** With `.failing` temporarily
  removed, the case fails at the final reachability assertion
  (`expect(queryByTestId("mcf-handoff")).toBeInTheDocument()`, received `null`) —
  not at any of the three setup assertions that pin the configuration first
  (last step reached, approve control present, hand-off not yet shown). 1 failing
  after, 0 before.
- **The pin fires — mutation check.** A candidate remedy was applied to
  `MovesCaptureFlow.tsx` (render the approve slot *and* a control calling
  `go(3)`, instead of one or the other). The suite went red with
  `Failing test passed even though it was supposed to fail. Remove .failing to
  remove error.` — 1 failing, 9 passed. The other nine cases stayed green under
  that mutation, which is the same point from the other side: no existing case
  objects to the remedy either. The mutation was then reverted and
  `git diff --stat` confirms one file changed, the test file.
- Whole component directory: `npx jest src/components/strategic-moves` — 40
  suites, 490 tests, all passed.
- Host suite included: `MovesPhaseStandaloneClient.test.tsx` — green (171 tests
  across the two suites together).
- `npx eslint` on the changed file — exit 0, no findings.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  **exit 0**, zero diagnostics (exit code judged, not grepped).
- **The pin can actually fail a merge, which is checked rather than assumed.**
  A test that only turns red in a job nothing requires is decorative.
  `MovesCaptureFlow.test.tsx` is named by exact path in the *Exercise Moves
  visible AI liability controls* step of the `ai-surface-control-catalog` job,
  whose `name:` is `AI surface control catalog` — one of the 19 contexts in
  `docs/ci/required-status-checks.json`. So when a remedy makes the hand-off
  reachable and leaves `.failing` in place, the merge is blocked, which is the
  whole mechanism this release depends on. That directory is not swept by
  pattern, so a suite runs there only by being named: a future suite added
  beside this one must be named in that step deliberately, as the step's own
  comment says.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing in the deployed image changes, no
migration, no flag, no environment variable, no worker job. The repo-owned deploy
workflow will build and deploy the merge commit as it does every merge; that
deploy carries no behaviour change from this release.

## Deployment Authority

Not applicable — this release cannot affect Azure Container Apps, deploy
workflows, runtime images, feature flags, environment variables, worker jobs,
traffic, DNS, or environment promotion.

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  and not invoked by hand.
- Shared runtime mutators: none.
- Approved image digest: not applicable; no runtime update is requested.
- ACA runtime invariant: unaffected.
- Worker image invariant: unaffected.
- Feature/env flag update path: not used.
- Live signed-in proof required: **no** — there is no client-visible change to
  observe. A signed-in walk already stands as the evidence for the defect itself:
  the hand-off was observed absent on the enabled path, at the place it would
  have appeared.

## Rollback Plan

Revert the single commit. No migration, no data, no runtime state to unwind.
Reverting restores the state in which the defect is invisible to every suite,
which is the condition this release exists to end.

## Audit Evidence

- The PR for this branch, and its CI run.
- The `it.failing` case and its comment block in
  `src/components/strategic-moves/__tests__/MovesCaptureFlow.test.tsx`.
- The four source facts it pins, re-verified on `ead3fcec28`:
  `MovesCaptureFlow.tsx` — the footer either/or, the single `go(3)` caller inside
  its `else`, the starting-view type, and the backwards-only step bar;
  `MovesPhaseStandaloneClient.tsx` — the approve slot that is non-null in every
  branch in which the flow mounts, and the clamp on the starting view.

## Known Gaps

- **The remedy is not included and is a decision, not an oversight.** Which way
  the hand-off becomes reachable — make the fourth view reachable alongside the
  approve control, or move what it hosts onto a surface that already renders —
  is the gated half of the backlog item and is owed a product decision.
- **A reachable hand-off is not a correct one.** Even once reachable, the content
  the view hosts cannot be verified by this test or by a walk: its counts need a
  recorded basis, which needs a server write. The test asserts reachability and
  claims nothing about what the view then shows.
- The test presses every forward affordance in the footer. A remedy that puts its
  way on somewhere other than the footer will make this case fail as "still
  unreachable" and should move the assertion rather than widen it silently.
