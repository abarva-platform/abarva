# 2026-10-08-the-document-cabinet-states-what-it-knows-about-its-review-lists — The document cabinet states what it knows about its review lists

## Release ID

`2026-10-08-the-document-cabinet-states-what-it-knows-about-its-review-lists`

## Status

`candidate`

## Plain-English Summary

The document cabinet on a Move's discovery step lists evidence awaiting human
review, evidence that was approved, and evidence that was rejected. All three
lists come from one read, and that read also reports whether the review state
behind them could be loaded at all.

The panel held that report in a single boolean, initialised to "available" and
written only when the read succeeded. Two things followed.

**The warning written for a degraded read was suppressed by a failed one.** The
read's own health field distinguishes a successful answer whose review sub-read
failed from a read that did not complete. The panel's warning — telling the
reviewer not to use newly uploaded files for phase decisions until the review
state loads — fired only for the first. When the whole read failed, the loader
threw before any state was written, so the boolean kept its initial value and
the panel asserted the review state was fine in the case where strictly less was
known about it.

**And the lists kept their previous contents while saying nothing about it.**
This is the part a reviewer meets. Approving the last pending item posts the
decision, which succeeds, and then refreshes. If that refresh fails, the item
the server has already approved is still listed under "1 evidence item awaiting
review", beneath copy stating that pending evidence is excluded from phase
generation — so a decision that was recorded is reported as not taken. The only
control on offer is to approve it again, and that cannot succeed: the write
filters on a pending decision and the route answers 409 with the code
`no_pending_review`, which the panel printed verbatim as the reviewer's next
action. None of the four refusal codes that route declares carried a sentence, so
every failure of the review decision reached a signed-in user as a snake_case
token.

This change gives the cabinet four readback states instead of two booleans'
worth. A read that has not run yet warns about nothing, because a warning there
would fire on every initial paint. A read that reported health is current. A read
whose review sub-read failed keeps the existing warning and keeps its queue
current, because the route did answer. A read that failed, or answered without
saying, is unknown: the panel says the lists may be out of date, and the review
controls are withheld rather than offering a decision that would be refused.
Each refusal code now has a sentence that names what happened and what the
reviewer can do, and the raw code is no longer rendered.

## Layer Impact

- Lane: `global-control-lane`

**Products** — Moves. One product surface changes: the document cabinet's
evidence-review area on a phase workspace. No other product reads this state.

**Canonical model** — untouched. No schema, read model, projection, migration or
route behavior changes. Both routes involved are read as-is; the change is
entirely in how the client classifies and presents their answers.

## Client Applicability

- All clients: yes. This is shared product behavior and is not flag-gated.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behavior is a correction to an existing surface rather
  than a new capability, and the state it replaces had no flag either.

## Changes Included

- `src/lib/programs/evidence-cabinet-readback.ts` — **new.** Owns two facts: what
  a readback state asserts about the lists beside it
  (`describeEvidenceCabinetReadback`, four states), and what each declared
  refusal of a review decision means in product language
  (`describeEvidenceDecisionRefusal`, plus the enumerated code list and its type
  guard). No database access and not `server-only`, so a suite imports it
  directly. Written as a new module rather than appended to the existing
  `evidence-review-dispositions.ts` so that concurrent work on that file does not
  collide.
- `src/components/strategic-moves/FileCabinetPanel.tsx` — replaces the
  availability boolean with the readback state; sets it on both the success and
  the failure path of the loader (the failure path previously set nothing);
  renders the module's warning instead of a hardcoded sentence; withholds the
  review editor while the queue is stale; and names a refused decision instead
  of throwing its error code into the panel's banner.
- `src/components/strategic-moves/__tests__/FileCabinetPanel.review-readback.test.tsx`
  — **new**, 19 cases.
- `.github/workflows/ai-surface-control-catalog.yml` — names the new suite in the
  required "Exercise Moves visible AI liability controls" step, which lists
  strategic-moves suites by exact path rather than sweeping the directory.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- `npx jest --runTestsByPath src/components/strategic-moves/__tests__/FileCabinetPanel.review-readback.test.tsx`
  — **PASS**, 19/19. Seven cases on the readback states, eight on refusal
  naming, and five that render the **real** `FileCabinetPanel` with the **real**
  `EvidenceReviewEditor` — no component stubs, because the finding is that the
  host's wiring was wrong and a mock that drops the prop would hide it.
- Mutation testing — **11 mutations, 11 killed.** Both directions covered:
  - removing the loader's failure-path write (the defect itself) — 2 fail;
  - making an absent health field read as available — 2 fail;
  - removing the editor's stale-queue guard — 1 fail;
  - reverting the refusal namer to the raw code — 1 fail;
  - giving the un-run state a warning (the initial-paint regression this
    change had to avoid) — 1 fail;
  - letting a carried health field outrank a failed read — 1 fail;
  - marking a degraded-but-answered queue stale (the over-blocking
    direction) — 2 fail;
  - suppressing the banner — 3 fail;
  - dropping a refusal code from the enumerated list — 1 fail;
  - weakening the already-decided sentence — 1 fail;
  - no longer preferring a server-supplied sentence — 1 fail.
- `npx jest src/components/strategic-moves src/components/engagement src/lib/programs/__tests__`
  — **PASS**, 240 suites / 3,386 tests. Run because the change tightens a
  control the existing cabinet suites exercise; every fixture that renders a
  pending review already supplies the health field, so the tightening does not
  reclassify any of them.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS**, exit 0.
- `npx eslint` on the three changed source files — **PASS**, exit 0, no errors
  and no warnings.
- `node scripts/quality/check-named-suite-requiredness.mjs` — **PASS**, exit 0,
  50 directories swept.
- Census — base measured in a separate clean worktree of the base commit, which
  carries **no inherited drift**: `coveredTestFiles` 2714, `uncoveredTestFiles` 164. The branch reads 2715 / 164, which is base **+1** with the uncovered
  count unchanged — the proof that the new suite is registered rather than dark.
- Prettier — the modified panel **warns at base**, so it was left in place; the
  three hunks prettier proposes on it all fall on pre-existing lines and none on
  a line this change adds. Both new files are clean.
- `npm run release:check -- --base origin/main --head HEAD` — see the pull
  request; run locally with this record present.
- Live signed-in walk — **NOT RUN.** This changes what a signed-in reviewer sees
  on the discovery step, so it is owed before the behavior can be called proven.

## Rollout Plan

Merge to `main` and deploy through the repo-owned ACA main deploy workflow with
the rest of that revision. No migration, flag, worker, environment variable or
Azure action is introduced by this change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. No ad-hoc Azure command is part of this change.
- Approved image digest: not applicable — no deploy is performed here.
- ACA runtime invariant: not asserted by this record; it is asserted by whichever
  deploy carries this commit.
- Worker image invariant: not applicable; no worker changes.
- Feature/env flag update path: not applicable; no flag is introduced.
- Live signed-in proof required: **yes.** A reviewer-visible surface changes.

## Rollback Plan

Revert the pull request. The panel returns to the single availability boolean,
which restores the two reported behaviors: a failed read asserts the review
state is fine, and a refused decision prints its error code. Nothing persists, no
schema or stored state is involved, and no other surface reads the new module —
so the revert is complete in one step with no data to reconcile.

## Audit Evidence

- The new suite is named in a required job, so the behavior is checked on every
  pull request rather than only here. `check-named-suite-requiredness.mjs`
  asserts that naming, and the census confirms the suite is counted as covered.
- The five host-render cases bind the module to the surface: the wiring is
  asserted by rendering the real component, and removing any one of the four
  wiring points fails a case (see the mutation list above).
- The enumerated refusal-code list is asserted whole, so a fifth code added to
  the route and not named here fails a case rather than falling through to the
  default sentence unnoticed.

## Known Gaps

- **The queue is withheld, not reconciled.** When a refresh fails, the lists on
  screen are still the previous read's. This change stops them being presented
  as current and stops offering a decision on them, but it does not re-read or
  reconcile them; the reviewer reloads. Retrying the read automatically would
  need a retry policy the panel does not have, and a wrong one would hide a
  persistent outage behind a spinner.
- **The route still emits no `detail`.** The naming lives entirely in the client.
  The module prefers a server-supplied sentence when one exists, so moving the
  naming server-side later is additive, but today a second client of that route
  would have to repeat this mapping. There is only one client.
- **The approve route's refusal codes are enumerated by reading it, not derived
  from it.** The list is asserted whole so a divergence fails a case, but the
  case fails on the list rather than on the route, so a new code is caught here
  rather than at the route that introduced it.
- **`presentationMode` on the same panel has no supplier.** Measured while
  auditing this surface: the prop is declared, defaults false, and only changes
  one font size, so it is inert rather than wrong. Left alone; retiring it is a
  separate tidy.
- **Not live-proven.** No signed-in walk has exercised this surface.
