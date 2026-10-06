# 2026-09-23-t741-quality-cli-guard-declines-through-a-symlink — Control gates that silently declined to run

## Release ID

`2026-09-23-t741-quality-cli-guard-declines-through-a-symlink`

## Status

`candidate`

## Plain-English Summary

Seven build-blocking checks in `scripts/quality/` and `scripts/release-control/` did nothing
at all, and reported success, whenever they were started through a symbolic link to the
repository folder.

Each of these scripts is both a library and a command. To tell the two apart it asked "is the
file I am, the file that was asked for?" — and answered it by comparing the path the caller
typed against its own resolved location. Those two spellings differ whenever any part of the
path is a symlink. The scripts concluded they had been imported rather than run, skipped their
entire body, printed nothing, and exited 0. A caller, or a CI step, sees success.

This is the same defect a prior item found and repaired in one other directory
(`scripts/exec/`, which now carries a shared, correct helper). That repair audited only its own
directory. This change applies the same helper to every affected gate in the two directories
that hold the build-blocking checks, and adds a test that runs each gate twice — once through a
real path, once through a symlink it creates itself — and requires an identical exit code and
identical output.

Two of the seven are the control that makes a quarantine entry expire once its reason is fixed,
so a stale test exclusion cannot sit unnoticed. One of them is invoked with `--rerun` from
`package.json`. That control was one symlink away from never running.

## Layer Impact

**Release lane: `global-control-lane`** — shared build and release control behavior, for every
client, with no feature gate. It is in this lane because the scripts are repository-wide gates,
not because any client-visible behavior moves; nothing client-scoped is touched, so this is not
`client-data-lane`.

- **Layer 4 — Products:** none. No product code, route, component, tenant data, schema or
  answer path is touched. No user-visible behavior changes.
- **Build and release tooling:** seven check scripts now decide correctly whether they were run
  or imported. Their checking logic is unchanged; only the decision about whether to execute it
  changed. One new test file, one new workflow, one new `package.json` script.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — repository build and release controls only
- Public/demo only: no
- Feature flag: none

## Changes Included

Guards replaced with the shared `isDirectInvocation` from `scripts/exec/cli-entry.mjs` rather
than re-spelled locally, so the writer and the reader of this rule cannot drift apart:

| file | guard before |
|---|---|
| `scripts/quality/check-integration-ci-visibility.mjs` | `path.resolve(process.argv[1])` compared to own path |
| `scripts/quality/check-intelligence-integration-quarantine.mjs` | `path.resolve(process.argv[1])` compared to own path |
| `scripts/quality/test-ci-coverage-census.mjs` | `path.resolve(process.argv[1])` compared to own path |
| `scripts/quality/check-integration-root-quarantine.mjs` | ``import.meta.url === `file://${process.argv[1]}` `` |
| `scripts/quality/check-intelligence-library-quarantine.mjs` | `import.meta.url === pathToFileURL(process.argv[1]).href` |
| `scripts/quality/check-source-ava-library-quarantine.mjs` | `import.meta.url === pathToFileURL(process.argv[1]).href` |
| `scripts/release-control/check-tenant-narrative-term-drift.mjs` | ``import.meta.url === `file://${process.argv[1]}` `` |

Added:

- `scripts/quality/cli-invocation-guard.test.mjs` — discovers every guarded CLI in both
  directories at run time and compares process behavior through both kinds of path.
- `.github/workflows/quality-cli-invocation-guard.yml` — runs that sweep on any change under
  `scripts/quality/**`, `scripts/release-control/**` or to the shared helper.
- `package.json`: `check:cli-invocation-guard`.
- `docs/architecture/ci-gate-registry.json`: the new script classified `pr-gate`. This was not
  foresight — the first CI run of this PR failed on `audit:ci-gate-registry`, which refuses any
  newly added `check:` script that has not been classified. A gate nobody runs looks exactly like
  a tool nobody needs to run, and that registry is where the difference is written down; it did
  its job on this PR.
- `src/__tests__/behaviors/test-ci-coverage-census.test.ts`: the fixture now copies the **import
  closure** of the scripts it runs, instead of a hand-written list of two. Also not foresight —
  the first CI run failed 1 suite and 37 cases with
  `ERR_MODULE_NOT_FOUND: .../scripts/exec/cli-entry.mjs`, because this fixture copies the real
  census script into a temp repository and runs it there, and the guard it now imports was not in
  the list. The list was correct only for as long as neither script grew a dependency; a list
  cannot notice that it is stale, so it was replaced rather than extended by one. Relative
  specifiers only, resolved statically — sound for the modules it reaches, which import node
  builtins and nothing else, and explicitly NOT sound for a module that composes a path at run
  time. If one is ever added, its directory should be copied rather than this widened.

Two gates in the same directories were already correct (`check-named-suite-requiredness.mjs`
and `enum-reachability.mjs`, which resolve both sides). They are unchanged and are swept, which
is what makes the sweep's truth independent of the code it judges: if it could not fail, these
two would have passed it as silently as the seven did.

## QA / Validation

**Red baseline, measured before any edit, on `origin/main` `d9d1fb9ee`, same suite and same
scope as the green run: 7 failing, 0 after.** Real path → through a symlink:

```
check-integration-ci-visibility.mjs             62 bytes, exit 0  ->  0 bytes, exit 0
check-integration-root-quarantine.mjs          192 bytes, exit 0  ->  0 bytes, exit 0
check-intelligence-integration-quarantine.mjs  268 bytes, exit 0  ->  0 bytes, exit 0
check-intelligence-library-quarantine.mjs       61 bytes, exit 0  ->  0 bytes, exit 0
check-source-ava-library-quarantine.mjs         58 bytes, exit 0  ->  0 bytes, exit 0
test-ci-coverage-census.mjs                   2441 bytes, exit 0  ->  0 bytes, exit 0
check-tenant-narrative-term-drift.mjs         1034 bytes, exit 1  ->  0 bytes, exit 0
```

The last row is the one to keep in view: the same gate, the same inputs, and a verdict that
flips from fail to pass because of how the path was spelled.

`node --test scripts/quality/cli-invocation-guard.test.mjs` — **before: 1 of 3 cases failing,
naming 7 gates. After: 3 of 3 passing.**

**The fix was then broken deliberately, twice, and the suite failed both times.**

1. One repaired guard (`check-source-ava-library-quarantine.mjs`) restored to its original
   broken spelling → suite fails, naming that file and only that file. Restored from the
   commit under test, not from `HEAD` of `main`.
2. `isDirectInvocation` inverted to always answer "imported" → suite fails, and the sweep
   drops from 23.6s to 2.1s because every gate short-circuits. That is the case an
   import-shaped assertion about the predicate cannot reach: a guard inverted this way passes
   every such assertion and leaves every CLI dead.

`npx jest src/__tests__/behaviors --no-coverage --ci` — **111 suites / 991 tests, all passing.**
Same totals CI reported when it was failing (111 and 991, of which 1 suite and 37 cases were red
on `ERR_MODULE_NOT_FOUND`), so this is the same scope before and after rather than a smaller one.
The fixture repair was then broken deliberately — `relativeImportClosure` reduced to returning its
seeds, which is the old hand list — and the suite reproduced CI's exact error, so the closure is
load-bearing and not decoration.

Regression, all exit 0 after the change:

```
npm run check:integration-root-quarantine
npm run check:intelligence-integration-quarantine
npm run test:integration:ci-visibility
npm run check:tenant-narrative-term-drift
node scripts/quality/check-named-suite-requiredness.mjs
node scripts/quality/check-intelligence-library-quarantine.mjs
node scripts/quality/check-source-ava-library-quarantine.mjs
node scripts/quality/check-source-integration-quarantine.mjs
node scripts/quality/check-admin-integration-quarantine.mjs
node scripts/quality/check-qa-integration-quarantine.mjs
node scripts/quality/enum-reachability.mjs
node scripts/exec/cli-entry.test.mjs
node scripts/exec/toolchain-manifest.test.mjs
node scripts/exec/queue-provenance.test.mjs
node scripts/exec/append-claim.test.mjs
```

- `npx eslint scripts/quality scripts/release-control` — clean.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, no
  diagnostics. Judged by exit code, not by grepping output.

## Rollout Plan

Merge to `main`. No runtime rollout: no image, no migration, no flag, no environment variable,
no product surface. The repo-owned ACA deploy workflow will build and deploy from `main` as it
does for any merge, and the runtime content of that image is unchanged by this PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this PR.
- Shared runtime mutators: none. This PR runs no Azure command and changes no Container App
  template, revision weight, env var, secret or scale setting.
- Approved image digest: not applicable — no runtime image change is requested or required.
- ACA runtime invariant: unchanged by this PR; the post-merge deploy is verified as routine.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing reachable by a signed-in user changes. Stating
  this explicitly so the absence of a signed-in proof is a recorded judgement rather than an
  omission.

## Rollback Plan

Revert the PR. Each guard is a one-line change with its import; reverting restores the prior
(broken) behavior with no data, schema or runtime consequence. No migration to unwind.

## Audit Evidence

- The red/green/mutation numbers above, each reproducible with
  `npm run check:cli-invocation-guard`.
- CI: the new workflow **Control gates run through a symlink**, plus the existing
  `intelligence-library-suites`, `source-ava-library-suites` and `integration-test-visibility`
  workflows, which invoke four of the repaired gates.
- `scripts/exec/cli-entry.mjs`, the shared helper, and the record for the prior item that
  shipped it.

## Known Gaps

- **The sweep covers `scripts/quality/` and `scripts/release-control/` only.** A repository-wide
  scan finds the same three broken spellings in **65 further files** under `scripts/` and
  `src/scripts/` — chiefly seed, data-build, smoke and audit scripts. Those are out of scope
  here deliberately: they are not build-blocking gates, and a change of that width would not be
  reviewable as one bounded PR. The shape, the measurement method and the shared helper are all
  now in place for whoever takes them.
- `scripts/quality/typecheck.mjs` is discovered by the sweep but exempted from running twice,
  because each invocation runs `tsc` over the repository (~45s). The exemption is not a free
  pass: a case in the suite requires every exempt file to already use the shared helper, so a
  gate with a broken guard cannot be exempted into silence.
- `check-named-suite-requiredness.mjs` and `enum-reachability.mjs` still spell the correct rule
  themselves rather than importing it. They behave correctly today and are swept, so they were
  left alone rather than churned; converging them on the shared helper is a tidy-up, not a fix.
- No claim is made about `main`'s CI having been affected in practice. CI invokes these gates
  from the repository root by relative path, which is the one spelling that works. The exposure
  measured here is an operator or agent invoking them by absolute path from a symlinked
  worktree — which the standing operator task file mandates (`/tmp/exec-<item>-<timestamp>`,
  a symlink to `/private/tmp` on macOS).
