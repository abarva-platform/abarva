# 2026-09-21-data-plane-test-boundary — What an unstubbed data-plane read does under jest, answered once and enforced

## Release ID

`2026-09-21-data-plane-test-boundary`

## Status

`candidate`

## Plain-English Summary

Whether it is safe to run a test that touches the database has, until now, depended on
something nobody could see from the test: **which database client the code underneath happens
to sit behind.** The repository has two families and they fail in opposite directions.

One family loads the Postgres driver eagerly. A test that forgets to substitute a stand-in
does not fail — it opens a real network connection. On a machine or a pipeline where a real
connection string is present in the environment, that is a live read of customer data on every
pull request, and nothing in the test output says so.

The other family loads its driver lazily in a way the test runner refuses, and then swallows
that refusal into an empty result. A test behind that client goes **green**, and its green
means "the read failed" exactly as often as it means "the table was empty."

So neither a passing test nor a failing one told you whether the test was safe. Three separate
pieces of work had each re-discovered half of this by hand and reached conclusions that looked
contradictory but were each correct for the client they happened to probe.

This release does two things. It records the answer **per client**, measured by running the
code rather than by reading it, in a file the next person reads instead of re-probing. And it
makes the dangerous half impossible rather than merely documented: under the test runner, a
client that would open a connection without a stand-in now **stops with a named error that
explains how to fix it**, instead of performing the read. Opting out is deliberate and visible
— you either substitute the boundary the code actually uses, or you set an explicit
environment flag for a suite that is genuinely meant to reach a database.

The recorded answers cannot quietly go out of date: every one of them is re-executed on each
CI run, so a client that changes how it loads its driver turns the build red rather than
leaving a document that used to be true.

## Layer Impact

**Release lane: `global-control-lane`** — shared engineering/CI behavior for all clients, with
no feature gate. It is the control lane rather than `client-data-lane` precisely because the
change reads and writes no client data; what it governs is whether a *test* may.

- **Layer 4 — Products:** none. No product surface, route, component or answer path is touched.
- **Test and CI tooling:** the jest module map now routes the Postgres driver through a guard;
  one new suite; one new CI step; the test-coverage census refreshed.
- **Layers 1–3:** unchanged. No schema, loader, adapter, projection or canonical object is
  modified, and no tenant data is read or written by anything in this change.

## Client Applicability

- All clients: no runtime behavior change. The guard is installed by the jest module map and
  is not part of any deployed bundle.
- Specific clients: none.
- Internal only: yes — engineering and CI.
- Public/demo only: no.
- Feature flag: none. The only switch is `ABARVA_TEST_ALLOW_DATA_PLANE_CONNECT`, which exists
  solely for a test lane that is meant to reach a real database.

## Changes Included

- `docs/architecture/data-plane-test-boundary.json` (new) — the per-entry-point verdict
  artifact: for each data-plane entry point, whether an unstubbed read under jest **connects**,
  **throws**, or **swallows**, with the probe that proved it and what reaches it.
- `src/testing/pg-test-boundary.ts` (new) — the enforcement. Re-exports the real driver with
  `Pool`/`Client` `connect()` and `query()` wrapped so an unstubbed call throws
  `ABARVA_TEST_DATA_PLANE_CONNECT_BLOCKED` by name instead of opening a socket.
- `jest.config.ts` — maps `^pg$` to that module.
- `src/lib/data-plane/__tests__/test-boundary.test.ts` (new) — re-proves every recorded verdict
  by execution on each run, and fails if the artifact and the code disagree in either
  direction.
- `.github/workflows/unit-suites.yml` — one step running that suite by exact file path.
- `docs/architecture/test-ci-coverage-census.json` — refreshed; `src/lib/data-plane/__tests__`
  moves `uncovered` → `partial`.

## QA / Validation

**The verdicts, each proved by execution against a closed local port
(`postgresql://probe:probe@127.0.0.1:59999/probe`), never against a real database:**

| entry point | driver load | unstubbed read | observed |
|---|---|---|---|
| `read-adapters/azureSession.ts` | static `import { Pool } from 'pg'` | **connects** | `ECONNREFUSED 127.0.0.1:59999` in ~3 ms — a socket was opened |
| `read-adapters/azurePostgresReadAdapter.ts` | static `import { Client } from 'pg'` | **connects** | `ECONNREFUSED` in ~2 ms |
| per-domain pools (probed on `src/lib/corpus/db.ts`) | static `import { Pool } from 'pg'` | **connects** | `ECONNREFUSED` in ~0 ms |
| `postgresCompat.ts` | `new Function('specifier','return import(specifier)')` | **swallows** | `{data: null, error: {message: 'TypeError [ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING_FLAG]…'}}` in 0 ms, no socket |

With nothing configured, the three connecting entry points throw
(`azure_read_adapter_no_connection`) and `postgresCompat` swallows again, into
`{data: null, error: {message: 'Missing …'}}` — so on that client the unconfigured case and
the failed case are indistinguishable from an empty table. That is the hazard the artifact
names, and it is why the remedy there is a strict stand-in rather than a gate.

**This suite: 0 → 12 collected, 12 passed.**

**Blast radius, measured over the whole collection rather than reasoned about.** The full jest
collection was run twice on this branch, baseline (mapping reverted) and with the guard, with
the final export shape in place:

- baseline: **330 suites failed / 2,635 total; 441 tests failed / 30,115 total**
- with the guard: **330 suites failed / 2,636 total; 441 tests failed / 30,127 total**
- **newly failing: 0. Newly passing: 0.** The failing-suite name sets are identical, compared
  set-wise and not by count. The deltas in the totals are exactly this change's own suite
  (+1 suite, +12 tests).

The 330 pre-existing failures are not caused by and not addressed by this change; they are
quoted here only as the same-scope baseline.

**Mutation proof — five mutations, each caught, comment decoy included:**

| mutation | result |
|---|---|
| delete the `^pg$` mapping (the enforcement removed entirely) | **3 of 12 fail** |
| gut the guard to a no-op, leaving `ABARVA_TEST_DATA_PLANE_CONNECT_BLOCKED`, `DataPlaneTestBoundaryError` and `connectAllowed` in a **comment** | **3 of 12 fail** |
| make the guard always allow the connect | **3 of 12 fail** |
| relabel one verdict in the artifact (`postgres-compat` → `connects`) | **2 fail** |
| add a client to the artifact with no probe behind it | **3 fail** |

Restored, the suite returns to 12 passed / 12.

**Other checks:** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
exit **0** (exit code judged directly, not inferred from grepping for `error TS` —
a bare run exits 134 on this machine and emits no diagnostics). `npx eslint` on both new files:
clean. `npm run audit:test-ci-coverage:check`: committed census matches a fresh run, no shape
drift.

## Rollout Plan

Merge to `main`. No runtime rollout: nothing here ships in a deployed bundle. The repo-owned
ACA deploy workflow will build and deploy the merge commit as it does for any merge, and this
change is inert in that image.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — unchanged.
- Shared runtime mutators: none. No `az containerapp` command, no traffic shift, no revision,
  no env var, no worker job.
- Approved image digest: not applicable — this change alters no runtime behavior.
- ACA runtime invariant: to be asserted after merge in the usual way (template image = 100%
  traffic revision image = worker job images).
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and none is claimed. The diff contains no application
  source and no client-visible surface.

## Rollback Plan

Revert the commit. The only change with any reach beyond test files is one line in
`jest.config.ts`; removing it restores the previous test-time behavior immediately and
completely. No migration, no data, no runtime state.

## Audit Evidence

- The PR and its CI run, including the runner log for the step
  `Run the data-plane test-boundary suite`, which must show the twelve cases executing rather
  than the step merely existing.
- `docs/architecture/data-plane-test-boundary.json` — the verdicts and the probe behind each.
- `src/lib/data-plane/__tests__/test-boundary.test.ts` — the re-proof.
- The baseline/guarded full-collection comparison quoted above.

## Known Gaps

- The `swallows` client cannot be fixed by a gate: no socket is ever opened, so there is
  nothing to intercept. The artifact says so and points at the strict stand-in shape in
  `src/lib/atlas/__tests__/tower-grounding-client-name.test.ts`. Making that shape the default
  for suites behind that client is follow-on work, not this change.
- The per-domain pool family is probed on one member and classified for the family. The
  enforcement does not depend on that classification being complete — the guard is installed on
  the driver itself, so a member nobody has listed is guarded anyway — but the artifact's
  `reachedBy` list for that family is a reading of the imports, not an execution.
- The `--experimental-vm-modules` question is untouched. If the test runner were ever given
  that flag, the `swallows` client would become a `connects` client; this suite would turn red
  on that change rather than letting it pass silently, which is the intent.
