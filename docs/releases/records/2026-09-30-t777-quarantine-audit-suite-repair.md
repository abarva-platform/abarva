# 2026-09-30-t777-quarantine-audit-suite-repair — Repair the quarantine-audit suite and wire the security test directory

## Release ID

`2026-09-30-t777-quarantine-audit-suite-repair`

## Status

`candidate`

## Plain-English Summary

The security test directory (`src/lib/security/__tests__`, four files) was run
by no continuous-integration job. T-776 held it back because of one file,
`quarantine-audit-supabase.test.ts`, which had never passed.

That file mocked a database client module that the code under test does not
import. The code reads through the Azure data-plane client
(`getAzureWriteFluentClient` in `@/lib/data-plane/postgresCompat`), so the mock
never reached it. Three of the four cases threw on a missing database URL before
any assertion ran. The fourth case read a SQL migration file and checked its
GRANT text.

This change repairs the file. The mock now targets the client the code actually
calls. The cases assert:

- the listing is filtered to the requested tenant;
- lifecycle rows are left out of the listing (`parent_id IS NULL`);
- a read error is raised rather than returned as an empty list;
- release and hard-delete each append exactly one lifecycle row, and never call
  update, delete or upsert on the audit table;
- an unknown row is refused and nothing is written.

The migration-text case is deleted, not sharpened. Table grants are a property
of the database, not of a file. A live-Postgres assertion for them already
exists: `npm run assert:sensitive-upload-audit-immutability`
(`src/scripts/assert-sensitive-upload-audit-immutability.ts`). It attempts
UPDATE and DELETE under authenticated claims and requires both to be blocked.

With the file repaired, the whole directory is wired into the unit-suites job:
4 suites, 25 cases, all green. No product code changes.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling that applies to every
client's build in the same way, with no feature gate.

- **Layer 4 (Products)**: no behaviour change. No route, component, adapter,
  projection or canonical object is touched. The module under test is unchanged.
- **Platform tooling / CI**: one test file repaired, and one job step added. One
  triage record and one control suite are added. The coverage census and the
  dark-directory baseline are updated to match.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. This is CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/security/__tests__/quarantine-audit-supabase.test.ts`: the repaired
  suite, with 7 cases, replacing 4.
- `.github/workflows/unit-suites.yml`: one new step, `Run the T-777 security
  suites`. It names `src/lib/security/__tests__` as a directory, with no
  trailing slash.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  directory's line is removed.
- `docs/architecture/t777-security-suite-repair-triage.json`: the record, with
  4 rows. The repaired suite's row is `sourceTextScanner: false` and is dated
  later than the T-776 row it supersedes. That is how the T-770 refusal control
  resolves classification.
- `src/__tests__/behaviors/t777-security-suite-wiring.test.ts`: the control, 5
  cases, which reads every partition out of the record.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with
  `npm run audit:test-ci-coverage:write`. Covered files 2263 → 2268 (the 4 wired
  files plus the new control), uncovered 301 → 297, untriaged unrun 249 → 245.

## QA / Validation

Overall status: **pass**. Every check below was run locally and passed; CI runner proof is recorded after the pull request's run.

**Same-scope baseline, base `2b750dd78d` compared with this branch:**

- `npx jest src/lib/security/__tests__`: 3 failing of 22 before; 0 failing of 25
  after.
- `npx jest src/__tests__/behaviors`: 157 suites / 1689 tests / 0 failing
  before; 158 / 1694 / 0 after. The difference is exactly the new control.
- `audit:test-ci-coverage:check`, `audit:triage-record-reconciliation`,
  `test:integration:ci-visibility` and `audit:named-suite-requiredness` all exit
  0.
- `tsc --noEmit` (6 GB heap, buildinfo removed first): exit 0. Scoped `eslint`:
  exit 0.

**The repaired mock is what makes the cases run.** With the mock target put
back to the old module, all 7 cases fail against the real subject.

**Subject mutations.** Each edit was confirmed to be a real change before the
run, and each was reverted afterwards.

| Mutation to `quarantine-audit-supabase.ts` | Result |
|---|---|
| Tenant filter removed from the listing | 2 of 7 fail |
| `parent_id IS NULL` exclusion removed | 2 of 7 fail |
| Release (and, separately, hard-delete) also updates the parent row | 1 of 7 fails each time, on the `update` spy assertion rather than a crash |
| Tenant filter pinned to a literal key | 1 of 7 fails |
| List error swallowed as an empty list | 1 of 7 fails |

**Control, red first.** With the base workflow and base baseline: 2 of 5 fail
(the reach case and the dark-baseline case). After the change: 0 of 5.

**Wiring mutations**, run over the new control, the T-770 scanner refusal and
the product-directory ratchet (16 cases in total):

| Mutation | Result |
|---|---|
| The step's command replaced with `echo skipped` | 2 of 16 fail |
| The repaired row re-declared a source-text scanner | 4 of 16 fail, T-770 refusing the reach among them |
| The T-777 record dated before T-776 | 3 of 16 fail, as the older scanner row wins again |

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change. The step
becomes active on the next pull request and on push to `main`.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a, no runtime image change
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, because no product surface changes

## Rollback Plan

Revert the pull request. That restores the step's absence, the baseline line,
the old test file and the previous census together. These files are consistent
only as a set. There is nothing to unwind in a running environment.

## Audit Evidence

- The triage record, with run counts for each file.
- The control suite, plus the two mutation tables above.
- Runner proof from the pull request's unit-suites job log: the new step's
  `PASS` lines for each suite and its case total. This is recorded in the
  backlog after the run, not inferred from the YAML.

## Known Gaps

- `assert:sensitive-upload-audit-immutability` is an operator-run live
  assertion, not a CI step. This change moves the grant check to it but does not
  schedule it.
- Only `list()` in `quarantine-audit-supabase.ts` is on a live path: the
  data-plane module delegates listing to it. Its `release` and `hardDelete` are
  the reference implementation that `quarantine-audit-data-plane.ts` mirrors.
  They are covered here, but they are not what the admin routes call.
