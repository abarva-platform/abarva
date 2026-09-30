# 2026-09-30-t776-stale-suite-triage — Triage the eighth stale-suite draw and wire the three directories it can

## Release ID

`2026-09-30-t776-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

Twenty test files in five directories existed and were run by no
continuous-integration job. They are the top five directories of the
repository's own ranking of untriaged, unrun test work, as it stands after the
ranking learned to skip files that already carry a verdict (T-773).

Every one of the twenty was run on its own before any verdict was written.
Nineteen pass; one fails. Each file now has a written verdict in
`docs/architecture/t776-stale-suite-triage.json`.

Three of the five directories are wired into a job that runs on every pull
request: agent output discipline, agent voice doctrine, and Source expert
judgment. That is 12 suites and 236 cases, all green, none of them reading a
repository file, and every one of them testing code that a live product path
imports (the agent chat route and the Source CXO report route). This change
protects future work; it does not repair a break.

The other two directories stay unwired, and the reason is executable rather
than narrated:

- **Intelligence advisory** — four files, all green, but one case proves the
  stream path calls its finalizer by finding the call written in the
  component's source. A comment with the same text would satisfy it. That one
  case is declared as a source-text scanner, which puts the directory behind
  the existing refusal control. Rewriting it as a rendered case is filed as
  T-778.
- **Security** — one file fails 3 of 4 because it mocks a client module that
  its subject does not import (the subject reads through the Azure data-plane
  client), so the mock never reaches the code and each case throws on a
  missing database URL. The test and the module arrived in the same commit, so
  this suite has never passed. The same file also checks a migration's grants
  by reading its SQL. Repair is filed as T-777. A triage does not edit the
  files it judges.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling that applies to every
client's build equally, behind no feature gate.

- **Layer 4 (Products)** — no product behavior changes. No route, component,
  adapter, projection or canonical object is touched. No judged test file is
  modified.
- **Platform tooling / CI** — one job step added; one triage record and one
  control suite added; the coverage census and the dark-directory baseline are
  updated to match what the repository now does.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes — CI coverage only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml` — one step, `Run the T-776 agent
  output-discipline, voice-doctrine and Source expert-judgment suites`, naming
  `src/lib/agent/output-discipline`, `src/lib/agent/voice-doctrine/__tests__`
  and `src/lib/source/expert-judgment/__tests__` as directories without a
  trailing slash.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json` — the
  three directories' lines are removed.
- `docs/architecture/t776-stale-suite-triage.json` — the record: 20 rows, each
  executed, with verdict, counts, file-read judgement and rationale; the two
  held directories with their successor items.
- `src/__tests__/behaviors/t776-stale-suite-wiring.test.ts` — the control, 7
  cases, reading every partition out of the record.
- `docs/architecture/test-ci-coverage-census.json` — regenerated with
  `npm run audit:test-ci-coverage:write`. The committed census was current on
  the base. Covered 2250 → 2263 (the 12 wired files plus the new control),
  uncovered 313 → 301, directories uncovered 136 → 133, ranked untriaged unrun
  files 192 → 172 (all twenty drawn files now carry a verdict).

## QA / Validation

**Each drawn file run on its own** (`npx jest --runTestsByPath`) on base
`9f17c47d6f`: 19 green, 1 red (`quarantine-audit-supabase.test.ts`, 1 of 4).

**Importer check.** Every wired directory's subject is reached from an app
entry: output discipline and voice doctrine from `src/app/api/chat/agent/route.ts`
(and `response-contract` via `response-shape.ts` to `/strategic-moves/new`);
expert judgment from `/api/v1/source/[eventId]/cxo-report` via the CXO narrative
report, and via the Source answer engine. The control asserts a non-test
importer still exists, so the reason to spend CI on these cannot silently
lapse.

**Control, red first.** Before the wiring existed: 2 failing of 7 (reach, and
dark baseline). After: 0 of 7.

**Same-scope baseline, base `9f17c47d6f` vs this branch:**

- `npx jest src/__tests__/behaviors`: 156 suites / 1682 tests / 0 failing
  before; 157 / 1689 / 0 after. The delta is exactly the new control.
- The wired step's own command: 12 suites / 236 tests / 0 failing.
- `audit:test-ci-coverage:check`, `audit:triage-record-reconciliation`,
  `test:integration:ci-visibility`, `audit:named-suite-requiredness`,
  `audit:ci-gate-registry`: all exit 0.

**Mutations**, run over the new control plus the `T-770` scanner refusal and
the product-directory ratchet (18 cases). Each was checked to be a real edit
first; each restored after.

| Mutation | Result |
|---|---|
| M1 — the step's command replaced with `echo skipped` | 2 of 18 fail: reach, and the ratchet names a new dark directory |
| M2 — one wired directory put back on the dark baseline | 2 of 18 fail: baseline case, and the ratchet's set equality |
| M3 — one wired row re-declared a source-text scanner | 3 of 18 fail: `T-770` refuses the reach twice, and the wired-row case |
| M4 — the held intelligence-advisory directory added to the step | 3 of 18 fail: `T-770` refuses the declared scanner, and the ratchet |

`tsc --noEmit` exit 0 (buildinfo removed first). Scoped `eslint` exit 0.

## Rollout Plan

Merge to `main` through the repo-owned workflow. No runtime rollout: no image,
migration, flag, environment variable or traffic change. The step becomes
active on the next pull request and on push to `main`.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a — no runtime image change
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no** — no product surface changes

## Rollback Plan

Revert the pull request. That restores the step's absence, the three baseline
lines and the previous census together; they are consistent only as a set.
Nothing to unwind in a running environment.

## Audit Evidence

- The triage record, with per-file run counts.
- The control suite and the mutation table above.
- Runner proof from the pull request's unit-suites job log — the step's
  per-suite `PASS` lines and case total — recorded in the backlog after the
  run, not inferred from the YAML.

## Known Gaps

- `src/components/intelligence-advisory/__tests__` (4 files, 19 cases, all
  green) stays dark until T-778 replaces its one byte case.
- `src/lib/security/__tests__` (4 files, 3 green) stays dark until T-777
  repairs the stale mock and relocates the migration-grant check.
