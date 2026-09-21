# 2026-09-21-tower-grounding-boundary — Tower grounding cover-name and tenant-scoping suite repaired and made required

## Release ID

`2026-09-21-tower-grounding-boundary`

## Status

`candidate`

## Plain-English Summary

Two automated checks were supposed to prove that the assistant's Tower grounding
step (a) never lets a retired brand label reach a prompt in place of the approved
cover name, and (b) scopes what it reads to the right tenant. Both were failing,
and neither ran in any CI workflow, so nothing reported them.

Investigating before changing anything produced a different answer from the
obvious one, twice over.

**First: one check could never have passed, whatever the code did.** It declared a
stand-in for a "V7 Tower projection" loader and asserted that the code called it,
but it never actually installed that stand-in, so it was asserting against
something nothing could ever call. The fix is *not* to install it. The function
under test imports no V7 projection at all — that loader does not exist anywhere
in the codebase — and the tenant-candidate input the check was built around is
read by nothing in the function and passed by nobody at its only call site. The
contract that check described does not exist at either end. It has been replaced
by the tenant-scoping contract that *does* exist, asserted through the two
projection loaders the function genuinely calls.

**Second: the other check was passing its own fixture through unused.** It fed the
lookup an already-approved cover name and then asserted that name came back, so
it passed whether or not the cover-name control ran. Deleting its entire database
stand-in changed nothing — measured, not assumed. It now feeds the *retired* brand
label, which is what a real stored row could carry, and requires the approved
cover name to come out. That control can now fail, which is the whole point.

**The safety question this item was required to answer first.** Whether a test
like this can quietly read live tenant data while it runs depends on which of the
two database clients the code under test uses, and the two behave in opposite
ways. That is the finding most worth carrying forward:

- `@/lib/data-plane/azureRead` imports its driver directly. A forgotten stand-in
  there means a **real connection attempt** anywhere a database URL is configured.
- `@/lib/data-plane/postgresCompat` — the client this code uses — loads its driver
  through a deferred import that the test runner refuses to execute. Probed
  directly against a closed port with a database URL set, an unstubbed read
  returned an empty result with a loader error attached, in 0 ms, with no network
  connection opened.

So this suite was never able to read live tenant data. That is an accident of
configuration rather than a control, and it cuts the other way: because the
failure is swallowed into an empty result, an unstubbed read is indistinguishable
from a genuinely empty one, and a suite that forgets to stub the data plane goes
green on nulls it mistakes for "no rows". That is exactly why the cover-name check
above passed its fixture through unused. The stand-in is therefore now strict —
any table other than the single expected one raises — and one case asserts that
only that table is ever touched.

**Neither prior assessment was wrong; together they complete the picture.** The
two clients have opposite failure modes and neither is visible from a suite's
colour, so "is this suite safe to switch on?" cannot be answered by reading the
test. It has to be answered per data-plane client. That is filed as follow-up
work rather than swept in here.

## Layer Impact

**Release lane: `global-control-lane`** — shared control-plane tooling that applies
to all clients and is not feature-gated. It is the control plane rather than the
product surface: what changed is what CI proves about the shared grounding path,
not the grounding path itself. No client-data-lane, internal-admin, public-demo or
experimental surface is touched.

- **Layer 4 (Products) — Intelligence/Tower grounding path:** no runtime behaviour
  changed. **No application source file was modified.** The grounding path was
  read, probed and mutated locally to prove the checks can fail, then restored;
  the committed diff contains no product source.
- **Test, validator and CI tooling:** one test file rewritten against the
  boundaries the code actually imports; one workflow step added that runs it by
  exact file path; the committed CI coverage census refreshed to match.

## Client Applicability

- All clients: no behaviour change. Nothing ships to a client surface.
- Specific clients: none.
- Internal only: yes — CI and test tooling only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/atlas/__tests__/tower-grounding-client-name.test.ts` — rewritten.
  - The unusable V7-projection case is replaced by two cases asserting the
    resolved tenant key reaches `listMaterializedTowerReadModelForClient` and
    `listTowerBudgetRollupsForClient`, which are the projection boundaries the
    function imports, including the fallback where the row carries no tenant key
    and the value must come from the row's slug rather than the caller's input.
  - The cover-name case now feeds the retired brand label and asserts the approved
    cover name, taken from the register in code (`DEMO_SAFE_CLIENT_NAMES`) rather
    than a hand-typed literal, per the tenants-come-from-code rule. A second
    tenant is covered the same way.
  - The data-plane stand-in is strict, and a dedicated case asserts the single
    permitted table is the only one read.
  - The file header records the measurement and the reasoning, so the next agent
    does not re-derive it.
- `.github/workflows/unit-suites.yml` — one step added, naming the file by exact
  path, never a directory. The comment records the boundary probe and every
  mutation result.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Measured from the real suite, against a clean baseline over the same scope.

**The suite itself**, `origin/main` `437d518a3`, before any edit:

- **2 collected, 2 FAILED.**
- Case 1 failed because its expected label was stale: the cover-name control
  correctly produced the approved name, and the test demanded the fixture value.
- Case 2 failed with `Number of calls: 0` — the stand-in it asserted against was
  never installed, so that case could not pass however correct the code was.

**After: 5 collected, 5 passed.**

**Same-scope regression**, all nine Atlas suites (the eight in
`src/lib/atlas/__tests__` plus `src/lib/atlas/llm-determinism.test.ts`), run by
exact path:

- Before, on clean `origin/main` `437d518a3`: **9 suites / 38 tests — 1 suite and
  2 tests failing.**
- After: **9 suites / 41 tests — 0 failing.**
- The only suite whose result changed is the one in this change.

**Boundary probe**, the question this item was required to answer before repairing
anything. An unstubbed read through `@/lib/data-plane/postgresCompat`, driven with
`DATABASE_URL` pointed at a closed local port, returned
`{data: null, error: {message: "TypeError [ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG] ..."}}`
in 0 ms with no socket opened, because the driver is reached through
`new Function('specifier', 'return import(specifier)')`
(`src/lib/data-plane/postgresCompat.ts:77-80`) and the test runner refuses it. By
contrast `src/lib/data-plane/read-adapters/azureSession.ts:16` imports the driver
statically, so code reading through `azureRead` has no such protection. Both
statements were read from source and the first was confirmed by execution.

**Mutation testing — each control broken deliberately, in product source, and the
source restored afterwards** (`git diff` over `src/lib/atlas/tower-grounding.ts`
is empty in the committed change):

| Mutation | Result |
|---|---|
| Bypass cover-name canonicalization, return the stored row name | **2 of 5 fail** |
| **Comment decoy** — delete the call but leave `canonicalCioTowerTenantDisplayName` present in a comment | **2 of 5 fail** |
| Scope reads by the caller's supplied key instead of the tenant key resolved from the row | **2 of 5 fail** |
| Add a second, unstubbed data-plane read | **all 5 fail** |

The comment decoy is recorded because a name-appears-in-file gate is the exact
failure this backlog exists to repair; this control runs rather than merely
existing.

**Typecheck:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` — **exit code 0**, no diagnostics. The exit code is judged
directly, because a bare run exits 134 on this host with no output.

**Workflow validity:** `unit-suites.yml` parsed and the added step confirmed
present in the `unit-suites` job with the expected command.

**Pre-existing census drift, carried not caused.** The committed census was
already stale on `main` before this change: checked with this branch's workflow
and census files reverted to `HEAD`, the check reports coverage drift in
`src/lib/source/new-workspace`, a directory this change does not touch. That is
drift from an earlier merge that did not refresh the census. The regeneration here
carries the refresh rather than attributing it to this change or leaving it stale.

## Rollout Plan

Merge to `main` through the repo-owned pipeline. **No runtime rollout**: this change
adds one CI step and rewrites one test file. There is no image behaviour change to
ship, no migration to apply, no feature flag and no environment variable. It takes
effect as a required check on the next pull request. Nothing reaches a client
surface, so no staged rollout and no signed-in acceptance are involved.

## Deployment Authority

- **Repo-owned deploy workflow:** `.github/workflows/aca-main-deploy.yml`, which runs
  on merge to `main`. This change does not modify it.
- **Shared runtime mutators:** none. No `az containerapp` command, no revision weight
  change, no traffic shift, no worker job update, no registry build was run by this
  work, and none is required by it.
- **Approved image digest:** not applicable — no runtime image change is requested.
  The deploy that follows this merge carries whatever digest the repo-owned workflow
  builds from the merge SHA; this change contributes no application source to it.
- **ACA runtime invariant:** unchanged by this work and not asserted as evidence for
  it. The post-merge deploy will be observed for completion, and the template image,
  the 100%-traffic revision image and both governed worker job images are expected to
  remain equal to one another as usual; any inequality would be a pre-existing
  condition rather than an effect of this change, and would be reported as such.
- **Worker image invariant:** unchanged. `WORKER_JOB_NAMES` is untouched.
- **Feature/env flag update path:** none required.
- **Live signed-in proof required:** **no.** The committed diff is one test file, one
  workflow step, the regenerated census and this record. No application source file
  and no client-visible surface is modified, so there is no rendered behaviour for a
  signed-in check to accept. This is stated as not-applicable, not as passed.

## Rollback Plan

`git revert` the merge commit. That removes the one workflow step and restores the
previous test file, returning the repository to a state in which this suite is
failing and unreported. No migration, no data change, no flag and no runtime
behaviour has to be unwound, so there are no migration rollback constraints and no
ordering requirement against any other release.

## Audit Evidence

- Baseline, after, same-scope regression, boundary probe and all four mutation
  results are recorded above with their numbers.
- The added workflow step names the file by exact path, so the census and the
  workflow agree on what runs.
- No application source file is modified by this change.

## Known Gaps

- **A dead input on the function under test is deliberately NOT removed here.**
  `buildAtlasTowerCurrentState` accepts a `tenantKeyCandidates` field that its body
  never reads and that its only call site never passes. No caller is harmed today,
  but the field is a trap: a future caller could supply tenant candidates believing
  they scope the read, and be silently ignored. Whether to finish the wiring it
  implies or delete the field is a product call, not a test fix, so it is filed as
  follow-up rather than guessed at inside a test-only change.
- **The two data-plane clients have opposite test-time failure modes**, and which one
  a suite sits behind decides whether switching that suite on is safe. Neither mode
  is visible from a suite's colour. This change proves the boundary for one file; it
  does not sweep the class. Filed as follow-up.
- **The remaining Atlas suites stay unwired on purpose.** Six suites in
  `src/lib/atlas/__tests__` plus `src/lib/atlas/llm-determinism.test.ts` run in no
  workflow. They are green, but two of them assert by reading source as text, and a
  green text-matcher is worse than a red one because nothing will ever make it fail.
  Wiring them on the strength of colour alone is declined here; they remain open
  work, to be judged by technique and by boundary, one exact file path at a time.
- No signed-in acceptance is owed for this change, and none is claimed.
