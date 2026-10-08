# u607 — The deliverable sign-off refusal names its cause

## Release ID

`2026-10-08-deliverable-sign-off-refusal-naming`

## Status

`candidate`

## Plain-English Summary

Signing off a generated document is the only product action that records a
document as approved, and four of the phase gates' **hard** criteria can be
satisfied no other way — two on the P4 → P5 rule and two on the P5 → 6 rule.
None of those four has a prose fallback, so a sign-off that refuses without
saying why stops the Move at the gate with no next action.

That route can answer in 23 ways. Every refusal but three carries a sentence the
approval control renders to the reader. The three exceptions all returned the
bare machine token `not_found`, and the control prints the token verbatim when no
sentence is present. So a signed-in user saw the word `not_found` beside a
document that was visibly on screen — and the single token covered three
different causes needing three different responses:

1. the Move itself could not be read for that session;
2. the document is not part of that Move;
3. the document was read, but the guarded write matched no row.

The third is the one that matters, because its common cause is **not a failure**.
The write only applies to a document in `draft` or `in_review`, and the only
other value that column ever holds is `signed_off` — the state the user was
asking for. One agent tool records approval with no such guard, so a user who
accepts a document in conversation and then clicks Approve on the panel still
showing its pre-approval render was told `not_found` about a document that was
already approved. Success, reported as a missing record.

This gives each of the three its own code and its own sentence, and the
already-approved case says the approval is already recorded rather than that
something is absent. The naming lives in its own module with no database access,
so it is testable directly; the write layer keeps its boolean.

One thing deliberately did **not** change: the status code. A refusal from the
write layer is also how a document id belonging to another tenant is denied, and
an existing guard suite pins `404` for that denial. Answering anything else there
would both break that contract and let a caller tell a foreign id apart from an
absent one by status code alone. Only the already-approved case departs from
`404`, and only because reaching it requires a row this Move actually holds.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not feature-gated.

Layer 4 (Products) only, and only in the wording and status of one route's
refusals. Layer 1 (Client Intake), Layer 2 (Source Adapters) and Layer 3
(Canonical Model) are untouched: no schema, migration, adapter, intake or
read-model change. No gate criterion, gate rule, deliverable registry entry or
write path is modified — what is signable, and what signing does, are both
unchanged. The route reads two more columns in a query it already issued.

## Client Applicability

- All clients: yes — the refusal wording and codes change for every tenant that
  signs off a document.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is a refusal's wording and status; gating it
  would leave the unnamed token in place for the ungated path.

## Changes Included

- `src/lib/programs/deliverable-sign-off-outcome.ts` — new. Four named refusals
  with a sentence and an HTTP status each. No database access and no
  `server-only`, so a suite imports it directly rather than reaching through the
  write layer. Its header records why the three causes were indistinguishable,
  which column makes the third one reachable, and why the eligible-at-read case
  must keep `404`.
- `src/app/api/v1/programs/[programId]/deliverables/[deliverableId]/sign-off/route.ts`
  — the three bare `not_found` responses now return the named refusal's code,
  sentence and status. The deliverable read adds `status` and
  `signed_off_version` to a `select` it already performed; without them a write
  that matched nothing cannot be told from a row that is not there.
- `src/lib/programs/__tests__/deliverable-sign-off-refusal-naming.test.ts` —
  new, 16 cases. Placed in this directory rather than beside the route because
  the required catalog workflow sweeps it wholesale, so these cases are
  merge-blocking with no workflow edit.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/lib/programs/__tests__/deliverable-sign-off-refusal-naming.test.ts`
  → 16 of 16. Seven cases on the refusal vocabulary (distinct codes, distinct
  sentences, no `not_found` substring anywhere, the version named only when
  known, and the status-code contract) and nine on the route (the two added
  columns are selected, each of the three refusals emits its code and sentence,
  and a `draft` document still signs off).
- **PASS** — mutation testing, **nine mutations, nine killed**. Each mutation
  asserted its pattern occurred **exactly once** before being applied and the
  file was verified to have changed, so none silently no-opped; the baseline was
  re-run green afterwards. The tenancy-guard suite ran alongside the new suite
  for every mutation, so a status-code regression was visible:
  1. Each of the three route refusals reverted to the bare `not_found` → killed
     (1, 1 and 2 cases respectively).
  2. Dropping `status, signed_off_version` from the `select` → killed.
  3. Collapsing the already-approved branch so every write refusal reads the
     same → killed, 5 cases.
  4. Making the already-approved sentence say "not found" → killed.
  5. Returning `404` instead of `409` for the already-approved case → killed.
  6. Giving two refusals the same sentence → killed, 3 cases.
  7. Returning `409` for the eligible-at-read case — the leak, and the
     tenancy-contract break → killed, 3 cases, including the cross-tenant case
     in the guard suite.
- **PASS** — a regression caught and fixed mid-change, recorded because the
  first attempt was wrong. The eligible-at-read refusal was first written as
  `409`, which failed
  `src/__tests__/integration/programs/programs-mutation-routes-tenant-guards.test.ts`
  → *denies cross-tenant write attempts using foreign resource ids*, expected
  404, received 409. That suite models a foreign resource id as a `false` from
  the write layer and pins `404` deliberately. The fix was to narrow the
  departure from `404` to the already-approved case alone, and a new case now
  pins that contract directly so the next edit cannot widen it again.
- **PASS** — every suite that touches this route: the route's own suite, two
  programs integration suites and the evidence-basis phase-scope suite → 98 of
  98, including the tenancy guards.
- **PASS** — `npx jest src/lib/programs/__tests__` → 176 suites, 2,285 tests.
- **PASS** — `npx jest src/app/api/v1/programs src/__tests__/integration/programs`
  → 95 suites, 1,728 tests, 20 skipped, 1 suite skipped.
- **PASS** — all test trees were searched for an assertion pinning the old
  token before the change was written. No suite asserted
  `error === "not_found"` for this route; the one textual match is a comment in
  an end-to-end spec whose assertion is on success. This is checked because a
  behaviour fix that leaves behind the assertion pinning the defect reddens
  `main` for everyone.
- **PASS** — `npm run audit:test-ci-coverage` →
  `census drift: committed census matches this run`, so the base carries no
  inherited drift and the delta is clean: `testFiles` +1,
  `coveredTestFiles` +1, `pullRequestCoveredTestFiles` +1,
  `uncoveredTestFiles` **unchanged at 164**. Covered up with uncovered flat is
  the proof that the new suite is registered rather than orphaned. Absolutes are
  base-relative (2860 → 2861 at this base); the delta is the durable claim.
- **PASS** — `npm run audit:tenancy-fence-coverage` — no change; the new file is
  not a fence-scoped suite.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`,
  exit 0.
- **PASS** — `npx eslint` on all three changed source files, exit 0.
- **NOT RUN** — no signed-in walk. This changes what a refusal says on a live
  product surface, so a walk is the only way to observe it. See Known Gaps.
- **NOT RUN** — the already-approved path was not exercised against a live
  database. Its reachability is established by reading the writers of that
  column, not by observing it.

## Rollout Plan

Merge to `main` via squash. The change then rides the repo-owned Azure Container
Apps main deploy workflow like any other product change: no migration, no flag,
no data move, and nothing to sequence. Until that deploy completes the route
keeps its current wording, which is the pre-change behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only
  authority that may shift shared web traffic. Not invoked by this change.
- Shared runtime mutators: none. No `az containerapp` command, no traffic or
  revision weight change, no web or worker template change.
- Approved image digest: unchanged by this record; the main deploy workflow
  builds and pins it.
- ACA runtime invariant: unaffected here, and to be proven by the deploy
  workflow in the usual way before this is called live.
- Worker image invariant: unaffected. No worker code changes.
- Feature/env flag update path: not applicable. No flag.
- Live signed-in proof required: **yes** — see Known Gaps. This record may say
  `merged` and `deployed`; it may not say `live-proven`.

## Rollback Plan

Revert the squash commit. Four files and no state: the new module and suite are
removed, the route returns to its three bare tokens, and the census returns to
its previous counts. No migration, no data, no deployed artifact to unwind, and
no flag to flip. Reverting restores the unnamed refusal but breaks nothing — the
route's success path, the write layer and every gate criterion are untouched by
this change in both directions.

## Audit Evidence

- The pull request for this record and its CI run, in which the required
  `AI surface control catalog` check runs the new suite.
- `src/lib/programs/deliverable-sign-off-outcome.ts` — the four refusals, with
  the reasoning for the status-code contract in its header.
- `src/lib/programs/__tests__/deliverable-sign-off-refusal-naming.test.ts` — the
  16 cases, including the one pinning `404` for every refusal but the
  already-approved one.
- `src/__tests__/integration/programs/programs-mutation-routes-tenant-guards.test.ts`
  — unchanged, and the suite that caught the first attempt's status-code
  regression.
- `docs/architecture/test-ci-coverage-census.json` — the +1/+1/+1 delta with
  uncovered flat.

## Known Gaps

- **A signed-in walk is owed, and the regression direction comes first.** The
  case to observe is that a document in `draft` still signs off unchanged and
  its approval badge appears, because that is the path a demo walk uses and this
  change sits on it. The refusal directions matter less and two of the three are
  awkward to stage. Nothing in this change is `live-proven`.
- **The already-approved case still answers with a refusal, not a success.**
  Treating it as idempotent — recording nothing, answering success, and letting
  the control reload into the approved view — is arguably the better product
  behaviour, since the user's intent is already met. That was not done here: it
  turns a failure response into a success response, which is a larger claim than
  naming a cause, and it would need its own measurement of what the control does
  on success. Deliberately left as a product call.
- **The guarded write's ineligible-status set was established by reading
  writers, not by observing data.** Three values are written to that column
  anywhere in the repository, which is why `signed_off` is named as the only
  reachable ineligible one. A future writer introducing a fourth value would
  land in the eligible-at-read branch and be reported as "not recorded", which
  is honest but unspecific. The branch is deliberately written not to name a
  cause it cannot observe.
- **The approval control's rendering is unchanged.** It prints the sentence when
  one is present, which it now always is for these three paths, so no component
  change was needed. It was read to confirm that, not modified, and no new
  component test is added here.
- **The remaining 20 responses were read but not re-litigated.** Each already
  carries a sentence; whether each sentence names an action the reader can take
  is a separate question this change does not answer.

## Related

The two in-flight changes in this area are both CI-wiring only and touch no
product route, so neither resolves against this one. All three touch the
coverage census, which is the expected collision; the census is regenerated, not
merged by hand.
