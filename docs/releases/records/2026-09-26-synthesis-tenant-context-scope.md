# 2026-09-26-synthesis-tenant-context-scope — Scope the synthesis routes' model context to the resolved tenant

## Release ID

`2026-09-26-synthesis-tenant-context-scope`

## Status

`candidate`

## Plain-English Summary

Two streaming answer routes — `POST /api/source/synthesis` and
`POST /api/programs/synthesis` — built their model system prompt by appending a
fixed demo-context block that describes ONE fixture tenant's programmes,
patterns, cost pressures and sourcing event. The block was unconditional: it did
not depend on which tenant was asking. So any tenant that reached the point where
the prompt is composed would have been described to the model, and recorded in the
AI egress ledger, using another tenant's inventory.

**Nothing was leaking in the deployed product, and the reason matters more than
the reassurance.** Both routes refuse a non-fixture tenant with `404` before the
prompt is composed — but that refusal is not a control. It happens because the V6
pack reader needs a directory under `datasets/` that is not in the repository, so
the pack resolves to nothing and the route gives up. The two directories its map
names are absent and are not gitignored, so they are absent from the built image
too. Restoring either one is an ordinary data-loading change that no reviewer
would read as a security change, and on the commit it landed both routes would
have started composing the wrong tenant's context with no code change at all.

This change replaces the accident with a control. Both routes now resolve the
demo block from the same server-resolved tenant key their instance fence already
compares against: the fixture tenant keeps its rich block, every other tenant
gets the general platform context only. The tenant is also added to each route's
answer-cache key, because a prompt that varies by tenant behind a cache key that
does not is the same kind of accident one layer down.

Two behavioral suites now prove this by driving the real handlers, and both
directories they live in have been wired into CI — they were run by no workflow
at all, which is how a proof becomes decoration.

## Layer Impact

- **`global-control-lane`** — shared control-plane behavior on two API routes.
  The answer text a tenant receives is unchanged for the fixture tenant and
  unchanged in practice for every other tenant, because no other tenant currently
  reaches prompt composition on either route. What changes is what WOULD be sent
  if one did.
- **Layer 4 (Products: Source, Moves)** — projection surfaces only. No canonical
  object, schema, migration, projection or dataset is touched. No product gains
  or loses ownership of data.
- **Test/CI tooling** — two directories moved from run-by-nothing to run-by-CI,
  and the committed coverage census was refreshed to match.

## Client Applicability

- All clients: yes — both routes are shared control-plane code with no per-client
  gate.
- Specific clients: none singled out. The one tenant whose behavior is
  deliberately preserved is the synthetic fixture tenant used for demos.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The scoping is unconditional and is not flag-gated, because
  a flag would reintroduce a state in which the unscoped block is reachable.

## Changes Included

- `src/app/api/source/synthesis/route.ts` — the prompt builder takes the
  canonical active-tenant key and resolves the demo block from it
  (`getTenantSystemBlock`) instead of importing the unconditional block; the
  answer-cache key is prefixed with that tenant key.
- `src/app/api/programs/synthesis/route.ts` — the same two changes. Note this
  route composes the prompt at two call sites (the egress preflight and the model
  stream), and both are scoped; a fix applied to only one is covered by a
  mutation below.
- `src/app/api/source/synthesis/__tests__/route.invariants.test.ts` — new, 5
  cases.
- `src/app/api/programs/synthesis/__tests__/route.invariants.test.ts` — new, 5
  cases.
- `.github/workflows/unit-suites.yml` — one step naming both `__tests__`
  directories. Named as directories rather than files so a suite added beside
  them joins CI on the commit that adds it.
- `docs/architecture/test-ci-coverage-census.json` — refreshed via
  `npm run audit:test-ci-coverage:write` for the shape change the wiring causes.
- `src/__tests__/behaviors/product-directory-ci-coverage.test.ts` — the dark
  test-directory ratchet lowered from 172 to 170, with a dated entry in the
  file's own log explaining which two directories left and why the figure moves
  by two rather than one. See QA below for the per-directory measurement and the
  both-directions proof.

## QA / Validation

**Re-verified on `main` before writing any code.** The filed before-state held:
both directories `TENANT_DATASET_BY_KEY` names under `datasets/` are absent from
the tree, and `git check-ignore` exits `1` on both, so they are not gitignored and
are absent from the built image either; both routes still imported the
unconditional block. The directory names are deliberately not written out here —
this record is public, and naming tenant dataset paths in it is a habit worth not
having once the tenants are real. The map is in the tree for anyone reproducing
this.

**Failing first, in the direction that matters.** A case asserting today's `404`
would pin the ABSENT DIRECTORY rather than the control, and would go green again
the day the directory returns — which is the defect. So both suites stub the pack
reader to RESOLVE for a non-fixture tenant, which is the only way to reach
composition today and is one restored directory away from being the real tree,
and then assert on what reached `messages.stream({ system })` and the egress
prompt. Before the fix: **2 failed / 2 passed** in each suite. After: **5 passed /
5 passed**. The tenant-scoped lines asserted on are computed at run time as the
diff between what the resolver returns for the fixture tenant and for any other,
so a reworded block moves the expectation instead of breaking the test.

**Mutation check — 9 mutations, 9 caught, each verified to be a real change
before it was run** (a no-op mutation reads exactly like a caught one):

| # | Mutation | Source | Programs |
|---|---|---|---|
| M1 | restore the unconditional block | caught | caught |
| M2 | fixture key hard-coded as a literal | caught | caught |
| M3 | tenant dropped from the cache key | caught | caught |
| M4 | tenant read from the REQUEST body instead of the server | caught | caught |
| M5 | scoped for the model stream but not for the egress record | n/a (single call site) | caught |

Control restored after every mutation: 4 suites / 20 tests passing.

**M4 initially SURVIVED on the programs route, and the suite was wrong rather
than the fix.** Every case had left the request's id field empty for the fixture
tenant, so no case distinguished "the block follows the tenant the server
resolved" from "the block follows something in the request". The case added to
close it is an ordinary request rather than a contrived one — the fixture tenant
naming its own instance/programme id, which the product surfaces actually send —
and under M4 the rich block disappears. Both suites carry it.

**Scope regression against a clean baseline worktree at `origin/main`
`92f5836b3`, not a stash, same scope and same command both sides**
(`src/app/api/source/synthesis`, `src/app/api/programs/synthesis`,
`src/app/api/reasoning/stage-synthesis`, `src/lib/agent`):

- before: **0 failing / 1056 passing / 77 suites**
- after: **0 failing / 1066 passing / 79 suites**

**Typecheck** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` with `tsconfig.tsbuildinfo` removed first — **exit 0**, judged on
the exit code rather than on a grep, and 0 lines of output.

**Lint** `npx eslint src/app/api/source/synthesis src/app/api/programs/synthesis`
— exit 0.

**One thing CI caught that local validation did not, fixed at the cause.** The
`Behavior coverage floor` gate failed on the first push:
`product-directory-ci-coverage.test.ts` ratchets the number of dark test
directories outside `src/__tests__` with an **equality** assertion, deliberately,
so that a DECREASE fails as loudly as a rise — an unrecorded decrease would hand
the next dark directory a ceiling with room in it. Wiring two directories moved
that set from 172 to 170, which is the gate working, not a defect in it.

Lowering the recorded figure is the action the file's own header prescribes, and
it was done on a per-directory measurement rather than on the count: the dark set
was captured from the census on a clean worktree at `origin/main` `92f5836b3` and
on this change, and the set difference is **exactly** the two directories wired
here leaving, with **nothing entering**. Both were fully uncovered rather than
partial, which is why the figure moves by two.

The ratchet was then proven to still fail in both directions, because a figure
edited to make a gate green is worth nothing if the gate stopped being able to
refuse:

| direction | mutation | result |
|---|---|---|
| rise | un-wire both directories, leave the figure at 170 | caught |
| decrease | leave the figure stale at 172 with the wiring in place | caught |

Control restored: 3 passed.

**Census** `node scripts/quality/test-ci-coverage-census.mjs --check` — clean both
before the wiring (as a baseline) and after the refresh. The intermediate state
was checked deliberately and reported `-uncovered` for both directories, which is
the evidence the wiring took effect rather than merely being written down.

## Rollout Plan

Merge to `main` by squash. The repo-owned ACA main deploy workflow builds and
deploys from the merge SHA; no manual Azure command, no flag, no migration, no
data build. Nothing about the change requires a deploy to be correct — the routes
behave identically to today for every tenant that can currently reach them.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to
  `main`. No branch, local or ad-hoc Azure command touches shared runtime here.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy run for the merge SHA;
  recorded in the execution pulse entry for this item, not asserted here.
- ACA runtime invariant: to be proven after merge — Container App template image
  equals the 100%-traffic revision image equals the approved digest.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no, and this is a measured statement rather
  than a convenience.** The behavior changed here is only reachable for a tenant
  whose V6 pack resolves, and no tenant's pack resolves in the deployed image
  because the datasets are absent from it. A signed-in check would therefore
  exercise the unchanged fixture-tenant path and prove nothing about the control.
  The proof that does bear on it is the behavioral suite, which reaches the
  composition the deployed image cannot. If the datasets are ever restored, a
  signed-in check becomes both possible and owed, and the first suite case in each
  file goes red to say so.

## Rollback Plan

Revert the squash commit. No migration, no data change, no flag, no cache
persistence beyond an in-process `Map` that dies with the revision, so revert is
sufficient and immediate. The cache-key change is forward and backward safe: a
changed key is a miss, not a wrong answer.

## Audit Evidence

- Pull request and its CI run (all required checks finished and passed before
  merge).
- The two new behavioral suites, which are the executable form of this record's
  claims — including the first case in each file, which asserts that today's
  refusal comes from an unresolved pack rather than from a fence, and so goes red
  if the dataset situation changes.
- The mutation table above is reproducible: each mutation is a single textual
  substitution in the named route file.
- The refreshed coverage census, which records both directories as covered where
  it previously recorded them as run by no workflow.
- Backlog item `C-532`, and the claim/release lines for it in the execution
  register.

## Known Gaps

- **The pack reader's existence is still undecided.** Whether
  `buildV6SourceEventInstanceForTenant` / `buildV6ProgramInstanceForTenant`
  should resolve at all is a product decision filed as `D-511` and deliberately
  not taken here. This change makes the branch safe; it does not argue for
  keeping it.
- **The cache-key hardening is reachable on one route and structural on the
  other.** On the programs route the collision is genuinely reachable once the
  datasets return, because the instance id comes from a dataset column
  (`program_id` / `record_id`) and two tenants may legitimately declare the same
  value. On the source route the builder tenant-prefixes the id, so the collision
  is not reachable today; the key is scoped there so the safety stops depending on
  an id-minting convention in another module. The suite says which is which
  rather than implying both are live defects.
- **Four other callers of the unconditional block remain**, outside this item's
  scope. `C-527` closed one and named the rest; one of them
  (`buildAvaTowerAskPrompt`) has no production caller at all, which is a separate
  decision filed as `C-531`.
- **No signed-in acceptance was run and none is owed** — see Deployment
  Authority for why, stated as a measurement rather than as an absence.
