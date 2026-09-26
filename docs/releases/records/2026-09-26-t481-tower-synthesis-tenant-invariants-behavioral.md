# 2026-09-26-t481-tower-synthesis-tenant-invariants-behavioral — Tower synthesis cross-tenant invariants, proven by behaviour

## Release ID

`2026-09-26-t481-tower-synthesis-tenant-invariants-behavioral`

## Status

`candidate`

## Plain-English Summary

The Tower portfolio-synthesis endpoint carries six declared rules whose whole
purpose is that one client's information never reaches another client's answer.
Those rules were checked by reading the endpoint's own source file and looking
for words in it. Reading a file answers a spelling question, not a behaviour
question, so each rule was deliberately broken and the checks all stayed green:
the client identifier removed from the response cache key, so one client's
cached answer would be handed to the next; the client's display name replaced by
a different client's name, so every answer header named the wrong company; and
the client-scoped portfolio read called and its result thrown away in favour of
one fixed client's data for everybody. Twenty-one tests, all green, through all
three.

The six checks now read what the model is actually sent and what the caller
actually gets back, by running the real endpoint. Client content is taken from
the repository's own fixtures while the test runs rather than typed into the
expectation, so a leak spelled differently is caught exactly like one copied
word for word.

Writing the checks that way found a real leak that reading the file never could,
because the offending words live in an imported module rather than in the file
being read. A client with no Tower portfolio was told, correctly, in its request
that it had no programmes and must not invent any — and in the same request's
system instructions it was handed a different client's full programme inventory,
labelled as authoritative background. The repository already had the right
mechanism for this and already recorded the unconditional one as legacy; this
endpoint had not moved across. It now has. Six other endpoints still have not,
and that is filed as its own item rather than folded in here.

No user-visible copy, layout or route changed.

## Layer Impact

Release lane: **`global-control-lane`** — shared app behaviour for all clients,
not feature-gated and not client-scoped.

- **Layer 4 — Products (Tower):** the synthesis endpoint's system prompt now
  carries the demo/background context scoped to the signed-in tenant instead of
  the unconditional block. For the tenant that owns that fixture, the prompt is
  unchanged. For every other tenant, a foreign tenant's programme inventory is
  no longer present.
- **No layer 1–3 change.** No intake, adapter, canonical-model, schema,
  migration or dataset change. Identity still comes from the tenancy fence; this
  change consumes it in one more place rather than introducing a second source.

## Client Applicability

- All clients: yes — every tenant that reaches `/api/tower/synthesis`. For the
  fixture-owning demo tenant the prompt is byte-identical; for all others a
  foreign tenant's context is removed.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The existing flag that gates the demo portfolio read is
  untouched; this change does not read it, set it, or depend on it.

## Changes Included

- `src/app/api/tower/synthesis/route.invariants.test.ts` — six source-text
  regexes replaced by seven behavioural cases over the real exported `POST`.
- `src/app/api/tower/synthesis/route.ts` — the demo/background context block is
  now resolved through `getTenantSystemBlock(tenancy.clientKey)`, the resolver
  `src/lib/agent/demo-context.ts` already declares for this purpose, instead of
  the unconditional `AGENT_DEMO_SYSTEM_BLOCK`. Two lines of behaviour plus the
  comment that explains why.

Backlog item: `T-481`, row 13 of the `T-479` stale-suite draw. `T-481` was
released back on 2026-09-26 with its remainder named; this is that remainder for
row 13. Rows 1 and 18, and the two remaining byte-scanning cases in the Home
layer-boundary contract, are not in this change and `T-481` is released back
again for them.

## QA / Validation

All commands run from a dedicated worktree at base `841e50011`; the clean
baseline was taken in a **separate** worktree at the same commit, not a stash.

**Re-verification of the item before any edit, by mutation rather than by
reading.** Baseline over the three suites beside the route: 3 suites, 21 tests,
0 failing. Each of the following left all 21 green:

| mutation | what it destroys | scanner suite |
|---|---|---|
| M1 | tenant removed from the synthesis cache key | 21/21 green, including the case named `caches synthesis under a tenant-scoped key` |
| M2 | display name replaced by a foreign tenant's, hardcoded | 21/21 green, including `reads the active client display name from the tenancy seam` |
| M3 | tenant-scoped loader called, result discarded, one fixture for all | 21/21 green, including `loads the portfolio via the tenant-scoped helper` |

**Red first, then the fix.** With the new suite in place and the route
unchanged: **2 failed / 5 passed of 7**, both failures being the cases that
assert a non-fixture tenant receives no part of the fixture tenant, and both
naming the actual programme titles reaching the model. After the route change:
**0 failed / 7 passed of 7**.

**Mutation proof of the new suite — seven mutations, each caught, each by the
case whose name describes it first.**

| mutation | applied to | result |
|---|---|---|
| M1 | tenant removed from the cache key | 6 failed / 1 passed; first named failure is `never serves one tenant the synthesis cached for another with identical portfolio state`. It is broad on purpose: with the key collapsed, later cases also read a foreign cache entry. |
| M2 | display name hardcoded to a foreign tenant | 4 failed / 3 passed; `names the tenant the active-client seam returned, not the tenancy key` |
| M2b | the active-client row ignored and the tenancy key used in its place — the subtler half, and the one a hardcoded-name assertion alone would miss | 3 failed / 4 passed; same case |
| M3 | portfolio result discarded for the fixture | 2 failed / 5 passed; `tells a tenant with no portfolio so, and hands it no part of another tenant` |
| M4 | demo block reverted to the unconditional one | 2 failed / 5 passed; same two cases |
| M5 | demo block **re-spelled** — the fixture tenant's key passed as a literal for every tenant, resolver call intact | 2 failed / 5 passed, identical to M4. This is the direction `T-481` asks for: the guard sees the property destroyed by a re-spelling, not only by a deletion. |
| M6 / M7 | the derived populations blinded — the fixture key pointed at a tenant with no fixture (M6), and the tenant-scoped context-line set forced empty (M7) | 1 failed / 6 passed each; `hands the fixture tenant its own portfolio and its own demo context`. These prove the negative assertions are not green because nothing reaches the prompt at all. |

**Regression, same scope both sides, clean baseline in a separate worktree at
`841e50011`:**

| scope | baseline | branch |
|---|---|---|
| `src/app/api/tower src/__tests__/integration/atlas src/lib/reasoning` | 70 suites, 832 passed, 4 skipped, **0 failing** | 70 suites, 833 passed, 4 skipped, **0 failing** |
| `npm run test:behaviors` | 141 suites, 1437 passed, **0 failing** | 141 suites, 1437 passed, **0 failing** |

The +1 test is this change's: seven cases replace six.

**The replacement gates pull requests, measured rather than assumed.** `npx jest
--listTests` over `docs/ci/tower-test-baseline.json`'s `paths` verbatim selects
136 files and this suite is one of them — `src/app/api/tower` carries no
parenthesised or bracketed segment, so the pattern reaches it. This matters
because the `T-479` triage records rows 2, 13 and 18 as *live* false assurances
rather than dormant ones: the Surface Ratchet Guard has been running these six
regexes on every pull request and every push to `main`.

**Other checks.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit
--pretty false` exit **0** with `tsconfig.tsbuildinfo` deleted first, 0 `error
TS` lines. `npx eslint src/app/api/tower/synthesis/` exit **0**.
`node scripts/quality/tenancy-fence-coverage.mjs --check` exit **0**.

**What was deliberately not regenerated.** `--write` on the tenancy-fence census
produces two additions: this suite's promotion to the route's `behavioral` list
(correct, and the route was already classified `behavioral` through
`route-fix-c.test.ts`, so nothing about the route's coverage verdict changes),
and a row for `src/__tests__/behaviors/c406-contract-question-surface-reachability.test.ts`,
which arrived in `0df7cc2df` from another lane and is unrecorded drift that
predates this branch and is still in flight elsewhere. The `--check` gate exits
0 without either, so the census is left untouched rather than carrying another
lane's row into this pull request.

## Rollout Plan

Squash merge to `main`. The repo-owned ACA main deploy workflow builds and
deploys as usual. No migration, no data build, no flag change, no manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge
  to `main`. No branch, local or ad-hoc Azure command was run against any shared
  runtime by this change.
- Shared runtime mutators: none.
- Approved image digest: assigned by the main deploy workflow for the merge SHA;
  recorded in the claim log and pulse entry after the run completes.
- ACA runtime invariant: to be proven read-only after deploy — Container App
  template image, the 100%-traffic revision image and the required worker job
  images all on one digest.
- Worker image invariant: unchanged by this release; asserted as part of the
  invariant read above.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing a signed-in user reads changes.
  The change removes a foreign tenant's background context from a model system
  prompt; there is no rendered copy, route, layout or control difference to
  observe on a surface. The prompt itself is asserted at the destination by the
  suite in this change, which is the only place that difference is observable.

## Rollback Plan

Revert the commit. Two files, no migration and no data change, so the revert is
complete and immediate. Reverting restores the unconditional demo block — which
reinstates the leak — so a revert should be paired with reverting the suite, or
the suite will correctly go red and say so.

## Audit Evidence

- The pull request for this branch, its CI run, and the squash SHA.
- `src/app/api/tower/synthesis/route.invariants.test.ts` — the suite itself,
  whose header records the three mutations that beat its predecessor and what it
  does and does not claim.
- `docs/architecture/t479-stale-suite-triage.json`, row 13 — the triage verdict
  `rewrite_as_behavior` this change discharges. Not modified: it is a snapshot of
  its own base commit.
- The claim log entry for `T-481` under
  `source-backlog-executor#20260926T122658Z`, carrying the before/after and
  mutation numbers.
- ACA deploy run for the merge SHA and the read-only runtime invariant, appended
  after the run completes.

## Known Gaps

- **Six other production callers still inject the unconditional block**, filed as
  `C-527`: `src/app/api/tower/ask/route.ts`,
  `src/app/api/source/synthesis/route.ts`,
  `src/app/api/reasoning/stage-synthesis/route.ts`,
  `src/app/api/programs/synthesis/route.ts`,
  `src/lib/programs/nexus-free-text.ts` and
  `src/lib/prompts/sentinel.v1.0.0.ts`. Each needs its own behavioural proof at
  its own destination, and folding six prompt changes into one pull request is
  the shape of diff this whole workstream exists against. Untouched here.
- **Rows 1 and 18 of the `T-479` draw remain**, plus the two remaining
  byte-scanning cases in
  `src/app/(maestro)/home/__tests__/home-layer-boundary-contract.test.ts`.
  `T-481` is released back for them.
- **The tenancy fence itself is stubbed in this suite**, so nothing here proves a
  request is authenticated. That arm is driven by `route-fix-c.test.ts`; these
  cases assume a resolved tenancy and prove everything downstream stays inside
  it. The suite header says so.
- **One case still reads the route's source**, deliberately and as a second
  reading rather than as the guard: the cache is process state, so a key that
  drops the tenant is observable across requests only while the process lives.
  Removing the tenant from the key fails the behavioural case first — M1 above
  records both failing.
