# 2026-10-08-review-decision-refusal-copy — A refused review decision states whether it was recorded

## Release ID

`2026-10-08-review-decision-refusal-copy`

## Status

`candidate`

## Plain-English Summary

A reviewer working through a Move reaches a step where they read a prepared
diagnostic document and record a decision on it: accept it as good enough to
start shaping the next phase's draft, ask for revisions, or hold it for
missing evidence. That recorded decision is not cosmetic — the deliverable
generator reads it back before it will produce the next phase's document, so
the whole step stalls until a decision exists.

Both halves of that step could refuse, and neither refusal said anything a
reviewer could act on.

Opening the review panel loads a review packet. When that load failed, the
screen cleared the packet and every decision control with it, and printed a
bare internal token — `not_found` — in a 10.5-pixel line beside the Review
button. A reviewer saw the controls disappear with no account of why, and the
token was the only thing on offer. Worse, the reader was written to show only
that token: when the server did send a plain-English sentence alongside it
(the workspace-lookup-unavailable case does), the sentence was discarded in
favour of the token.

Recording a decision could refuse too, and there the stakes are different: a
failed recording means the decision was _not_ saved and the phase has not
moved, which is precisely the thing the reviewer needs to be told. Instead
they got the same bare token, or `HTTP 404`.

Now every refusal of either half carries an authored sentence that names the
cause and the next step, and — this is the substance of the change — the same
cause says two different things depending on which half refused, because the
consequence differs. A failed load says the packet could not be read, that
the document and any decision already on it are unchanged, and that the
controls are hidden for that reason. A failed recording says, in plain terms,
that the decision was NOT recorded and the phase is unchanged. The one case
where neither claim is honest — an unclassified server failure, which can
occur after the row was already written — says only to reload and check,
rather than guessing.

The sentence is also now laid out so it can be read. It previously rendered in
the control row, in an auto-sized column beside the document title, with
wrapping switched off; a sentence there renders as one unbreakable line and
squeezes the title away. It now has its own full-width row.

## Layer Impact

- **Layer 4 (Products — Moves).** Product-surface copy and layout on the
  document cabinet, plus reader-side handling of one route's refusals. No
  change to what the route decides, to any status code, or to any recorded
  value.
- **Layers 1–3 unchanged.** No intake, adapter, canonical-model, schema, or
  data-plane change. No migration.

Lane: `global-control-lane`.

## Client Applicability

- All clients: yes — the document cabinet renders for every tenant, and this
  route's refusals are tenant-independent.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The cabinet mount is not behind a Moves capture flag;
  it renders on both the capture-v2 and legacy workspace views.

## Changes Included

- New `src/lib/programs/move-review-decision-refusal.ts` — the refusal code
  set this reader can reach, an authored sentence per code per call, and
  `describeMoveReviewDecisionRefusal`. Plain module (not `server-only`), so a
  client component and a suite can both import it.
- `src/app/api/v1/programs/[programId]/artifacts/[artifactId]/review-decision/route.ts`
  — each refusal emit annotated `satisfies MoveReviewDecisionRefusalCode`. No
  behaviour change; this makes a new code a compile error until the copy
  module names it, rather than letting it fall through to a default.
- `src/components/strategic-moves/FileCabinetPanel.tsx` — both calls to that
  route now describe their refusal through the module, passing which call
  refused; the refusal renders in its own full-width wrapping row instead of
  the no-wrap control row.
- New `src/lib/programs/__tests__/move-review-decision-refusal.test.ts`.
- Cases added to the existing
  `src/components/strategic-moves/__tests__/FileCabinetPanel.review-readback.test.tsx`.
- `docs/architecture/test-ci-coverage-census.json` regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__ src/components/strategic-moves/__tests__ 'src/app/api/v1/programs/[programId]/artifacts' src/__tests__/behaviors/moves-e2e-write-routes-required-ci-coverage.test.ts src/__tests__/behaviors/moves-approval-write-routes-required-ci-coverage.test.ts`
  — 237 suites, 3,390 tests, all passing. Includes the route's own suite and
  both behaviour suites that name this surface.
- **PASS** — new module suite: 25 cases. New host-render cases: 5, bringing
  that suite to 24.
- **PASS** — mutation testing, 11 mutations, **11 killed**, both directions:
  reverting each reader to its old bare-token expression (2); collapsing the
  per-call split in either direction (2); dropping the server-detail
  precedence (1); making the unclassified-failure sentence over-claim that
  nothing was recorded (1); returning the raw code as a fallback (1);
  widening the code predicate to accept anything (1); restoring the no-wrap
  in-row render (1); weakening the failed-load sentence so it no longer
  accounts for the hidden controls (1); and introducing an unnamed refusal
  code in the route, which the `satisfies` annotation turns into a type error
  (1).
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on all five changed/added source files: no output,
  0 errors.
- **PASS** — census regenerated honestly against main's committed values:
  `2880/2716` → `2881/2717`, `uncoveredTestFiles` unchanged at 164. The one
  new test file lands in `src/lib/programs/__tests__`, which the required AI
  surface control catalog sweeps wholesale, so no workflow edit was needed and
  the file is covered on arrival.
- **PASS** — `npm run release:check -- --base origin/main --head HEAD`.
- **NOT RUN** — signed-in walk. No runtime proof is claimed; see Known Gaps.

## Rollout Plan

Merge to `main` by squash. This is application code with no migration, no
flag, and no environment change; it reaches the Product/Lab web runtime on the
next repo-owned ACA main deploy, in the normal image build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not
  modified by this change.
- Shared runtime mutators: none. No `az` command is run by or for this change.
- Approved image digest: not applicable — this change assigns no digest and
  shifts no traffic.
- ACA runtime invariant: unchanged; to be proven by the next main deploy in
  the usual way, not by this record.
- Worker image invariant: unchanged; no worker job touched.
- Feature/env flag update path: not applicable — no flag, no env var.
- Live signed-in proof required: **yes.** See Known Gaps.

## Rollback Plan

Revert the squash commit. The change adds one module and one test file and
edits three files; nothing persists state, so a revert is complete and
immediate with no data to unwind and no migration to reverse.

## Audit Evidence

- The PR for this branch and its CI run.
- The new module suite and the added host-render cases, both of which assert
  against the real panel component rather than a stub, so the reader's wiring
  is what is pinned.
- The mutation results listed under QA / Validation.

## Known Gaps

- **A signed-in walk is owed and has not been run.** Nothing here is
  `live-proven`. The direction worth checking first is the ordinary one: open
  a document's Review panel on a healthy workspace and confirm the packet and
  decision controls still appear unchanged, since the refusal path now shares
  a render row with that panel's sibling messages.
- **The three other routes this panel calls still print bare tokens.** The
  document-approval, approved-replacement-upload, and review-regeneration
  handlers each still throw `detail || error || HTTP <status>`. They answer
  different routes with their own code sets and were deliberately left out of
  scope; each needs its own enumeration. They do, however, benefit from the
  layout half of this change, since all four handlers write to the same
  message slot.
- **One refusal code is reachable only in principle.** The shared tenancy
  response's own `forbidden` arm cannot fire on this route, which calls
  `requireTenancy()` with no requested workspace key; the `forbidden` named in
  the copy module is the route's own permission refusal. The module comments
  say so, and no case asserts the unreachable arm.
- **The failed-load path still clears the panel.** This change explains the
  cleared state rather than preserving it. Keeping a stale packet on screen
  would be worse — it would invite a decision against facts that could not be
  re-read — so the refusal names the hidden controls instead. Whether the
  panel should offer a retry control in place of a reload instruction is a
  product call, not settled here.
