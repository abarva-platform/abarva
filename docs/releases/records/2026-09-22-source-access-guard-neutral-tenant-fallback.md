# 2026-09-22-source-access-guard-neutral-tenant-fallback — Source access guard can refuse without naming an account

## Release ID

`2026-09-22-source-access-guard-neutral-tenant-fallback`

## Status

`candidate`

## Plain-English Summary

Source's access-guard page is what a reader sees when a link points at an item their
account cannot open. It is deliberately written to name no account at all when the
reader's own tenant cannot be determined — the sentence it falls back to is "This Source
item is not available for your current account."

That fallback could never happen. The guard asked a shared helper for the tenant's
display name, and that helper answers with the *default* account's name for any input it
does not recognise, rather than admitting it does not know. So a reader whose tenant
lookup failed outright was shown a real account name on the one surface whose entire job
is to refuse a link without disclosing anything.

The helper now comes in two forms. The lenient one is unchanged and still used by the
roughly 150 surfaces that render a tenant name to a reader already inside that tenant,
where falling back to the default is the established behaviour. A new strict form answers
"unresolved" instead of guessing, and the access guard asks that one. A failed tenant read
now renders the neutral phrase, in the page heading and in the surrounding chrome.

## Layer Impact

Release lane: `global-control-lane` — shared product and helper behaviour, reaching all clients,
not gated by a feature flag.

- **Layer 4 (Products — Source).** One route file, `src/app/(maestro)/source/not-found.tsx`.
  The rendered sentence changes only in the case where the tenant cannot be resolved; every
  resolvable tenant renders exactly the name it did before.
- **Shared display-name helper (`src/lib/client-config.ts`).** `canonicalClientDisplayName`
  keeps its name, signature and behaviour; its body is now a thin wrapper over a new
  `canonicalClientDisplayNameOrNull`, which is the same resolution logic without the
  default-account tail. No other caller changes.
- No change to layers 1–3: no intake tab, adapter, canonical object, schema, migration,
  tenant data, retrieval path or model prompt is touched.

## Client Applicability

- All clients: yes — the guard is a shared product surface. The behaviour only differs for
  a reader whose tenant cannot be resolved, which is an error or unauthenticated-edge path,
  not a normal signed-in one.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The change is small and strictly reduces what the surface discloses,
  so gating it would leave the disclosing branch live behind a flag for no benefit.

## Changes Included

- `src/lib/client-config.ts` — adds `canonicalClientDisplayNameOrNull`; `canonicalClientDisplayName`
  now delegates to it and applies the default-account fallback itself. Behaviour for existing
  callers is unchanged and is asserted to be unchanged.
- `src/app/(maestro)/source/not-found.tsx` — asks the strict form, so its `?? "your current account"`
  fallback is reachable.
- `src/app/(maestro)/source/__tests__/not-found-source.test.tsx` — the `it.failing` case that
  pinned this defect is replaced by two real rendering cases; one of them also asserts the
  chrome's tenant label, so a repair that fixed only the heading would fail.
- `src/lib/__tests__/client-config-canonical.test.ts` — three cases fixing the contract of the
  strict form: parity with the lenient form on every registered key and alias, `null` on every
  unresolvable input, and free-text names still passed through.
- `.github/workflows/unit-suites.yml` — runs the not-found suite. Its recorded quarantine reason
  ("source-text-only") stopped being true when the suite was rewritten to render the component,
  and the comment is corrected in place rather than deleted.
- `src/__tests__/behaviors/source-readiness-route-suite-ci-coverage.test.ts` — the control that pins
  that step's ownership. It failed in CI on this branch, correctly: it recorded the suite as
  quarantined. Its record is updated to match the wiring, and a third case is added — see below.

## QA / Validation

Red first, on unmodified product code at `origin/main` `5a6b4df8eff02ad8becb1afba849646fbc9482da`:
the five new cases failed, and the guard case failed for the right reason — the rendered heading
came back naming the default account rather than the neutral phrase. After the fix: 16 passed,
0 failed across the same two suites.

Clean baseline over the same scope, same invocation both sides:

| scope | clean `5a6b4df8e` | branch |
|---|---|---|
| `src/lib/__tests__` (directory) | 4 failed / 21 passed / 25 total | 4 failed / 24 passed / 28 total |
| `src/app/(maestro)/source/__tests__` (3 suites) | 0 failed / 21 passed | 0 failed / 22 passed |

The four failures are pre-existing and identical by test name on both sides (diffed, not
eyeballed): one control-plane hardcoded-reference purity scan and three `getActiveClientRow`
cases. None is caused or repaired here.

**Mutations: 8 constructed, 8 caught, 0 escapes.**

1. Guard calls the lenient helper again → 2 failed.
2. Strict form returns the default instead of `null` → 3 failed.
3. Strict form drops its `isClientKey` guard → 3 failed.
4. Lenient wrapper loses its default fallback (i.e. the ~150 other callers change behaviour) → 1 failed.
5. Heading fixed but the chrome still names the account → 1 failed.
6. Workflow wiring removed again → 2 failed.
7. Quarantine list returned to the stale `.test.ts` path it actually carried → 1 failed.
8. Census expectation left at the old covered count → 1 failed.

Mutation 7 is run against the real historical defect rather than a constructed one: the stale path
is the one that was in the file.

**A gate caught a real omission on this branch, and it is recorded rather than smoothed over.**
The first push failed `Behavior coverage floor`: `source-readiness-route-suite-ci-coverage.test.ts`
pins exactly which files that workflow step owns and which are quarantined, and the workflow edit
above moved one file across that line. The local floor run had been made *before* the workflow was
edited and was therefore stale — the control, not the local run, is what noticed. Updating the
control's record is not weakening it: the record has to move with the wiring, and the two mutations
above prove it still fails when the wiring and the record disagree.

Updating it surfaced a second, older defect in the same control. **Both quarantine entries named
`.test.ts` paths that did not exist** — the two suites were renamed to `.tsx` when they were
rewritten to render — and the assertion passed anyway, because it tests `command.includes(path)`
and `.test.tsx` contains `.test.ts` as a substring. So the quarantine half of the control was
pinning two filenames that were not in the repository, and would have gone on passing if the real
files had been wired. A third case now asserts every pinned path exists before the other two run.

Gates: `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` **exit 0**, judged
by exit code and with an empty diagnostic file, not by grep. `npx eslint` over the four changed
source files exit 0. `npm run coverage:behavior-gate` (the required `Behavior coverage floor`
check) exit 0 **re-run after the final edit**: 97 suites, 819 tests, all passing. The edited workflow step was run verbatim as
CI will run it — 6 suites, 49 tests, all passing — and both `(maestro)` paths are quoted, so the
route-group parentheses cannot be read as a regex capture group.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds the image and shifts
traffic; nothing here is deployed by hand. No migration, no data build, no job run, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded in the claim register after the deploy run publishes its
  invariant artifact; not asserted here.
- ACA runtime invariant: to be read from the carrying run's own `Verify ACA runtime invariant`
  step, not inferred.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. The changed branch is reached only when the tenant read
  fails or resolves to nothing, which a signed-in session by definition does not do, so a
  signed-in pass would exercise the unchanged path and prove nothing about the fix. The
  rendering tests drive the failure case directly.

## Rollback Plan

Revert the squash commit. There is no migration, no persisted state and no flag, so revert is
sufficient and immediate. Reverting restores the previous behaviour, in which the guard names
the default account on an unresolvable tenant.

## Audit Evidence

- The PR, its diff and its check runs.
- The red-then-green and mutation numbers above, each reproducible with
  `npx jest --runTestsByPath "src/app/(maestro)/source/__tests__/not-found-source.test.tsx" "src/lib/__tests__/client-config-canonical.test.ts"`.
- The `Behavior coverage floor` run on the PR.
- The CI log line for the newly wired suite, which prints the file path it ran.

## Known Gaps

- **Forty more unreachable fallbacks of the same shape, deliberately not fixed here.** Measured on
  this branch: 40 call sites across 36 files write `canonicalClientDisplayName(...) ?? <fallback>`,
  and every one of those fallbacks is as dead as this one was. Most are surfaces a reader is already
  inside, where the default account is the right answer and the dead `??` is merely noise — but at
  least two read as guards, including a "record not served" component whose intended label is
  `"this client"`. Sorting guards from ordinary surfaces is a per-surface judgement, not a mechanical
  sweep, so it is filed as its own backlog item rather than folded in here.
- The lenient helper still declares `string | null` while never returning `null`. Narrowing the type
  would touch every caller; the misleading declaration is now documented at the definition instead.
- The newly wired suite runs in `Unit suites that pass on main`, which is **not** a required context
  on the `main` ruleset. It therefore runs on every PR but does not block a merge. That is the open
  question T-595 asks about named suites, and this change does not settle it.
