# 2026-09-30-t782-initiative-deep-tenant-probe — Replace a tenant byte scan with behavioural probes and wire Atlas initiative-deep

## Release ID

`2026-09-30-t782-initiative-deep-tenant-probe`

## Status

`candidate`

## Plain-English Summary

The Atlas initiative deep-view module builds one initiative's full picture (KPIs,
gates, signals, Tower metrics, business case, portfolio position) and must never
return another tenant's data. Its tests were run by no continuous-integration
job. The previous triage (T-781) held them back for one case: it read nine
source files and asserted that six quoted spellings of tenant keys did not
appear in their bytes. A key written any other way passed it with behaviour
unchanged, and a comment naming a key failed it with no behaviour at all.

That case is deleted and replaced by behavioural probes in the same file:

- **Per-carrier tenant fence (12 cases).** Every tenant-keyed read the view
  makes is seeded for two tenants, with a marker per carrier: the engagement
  lookup behind passed and upcoming gates, the engagement-scoped and portfolio
  signal reads, Tower tool usage, and Tower DORA metrics. For each caller, each
  carrier must hold the caller's marker and not the other tenant's. The fixture
  includes hostile rows that only a fence can exclude: an engagement in each
  tenant tagged with the other tenant's initiative id and listed first, and a
  signal in each tenant pointing at the other tenant's engagement.
- **Industry read (1 case).** The client row read for the industry code must be
  the caller's own.
- **Tenant-key invariance (36 cases).** For every key in the tenant registry's
  canonical and legacy lists, read from code rather than typed, the same data
  under that key and under a neutral key must produce identical views. This
  fails whether a key is special-cased or used as a literal filter, however it
  is spelled.

The five existing behavioural cases are unchanged. The directory (3 files, 65
cases, all green) is now wired into a job that runs on every pull request. This
change protects future work; it does not repair a break.

## Layer Impact

**Release lane: `global-control-lane`.** Shared CI tooling; applies to every
client's build equally and sits behind no feature gate.

- **Layer 4 (Products):** no product behaviour changes. No route, component,
  adapter, projection or canonical object is touched. One test file in the
  judged directory is edited: that edit is this item.
- **Platform tooling / CI:** one job step, one triage record, one control suite,
  and an amendment to the T-781 control so a later record that wires a held row
  supersedes the hold. The coverage census and dark-directory baseline are
  updated to match.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/atlas/initiative-deep/__tests__/tenant-scoping.test.ts`: byte-scan
  case and its `node:fs` import removed; 49 behavioural cases added.
- `.github/workflows/unit-suites.yml`: one step, `Run the T-782 atlas
  initiative-deep suites`, naming the directory without a trailing slash.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  directory's line removed (123 -> 122 lines).
- `docs/architecture/t782-initiative-deep-triage.json`: the record. Three rows,
  each executed; supersedes the T-781 hold.
- `src/__tests__/behaviors/t782-initiative-deep-wiring.test.ts`: the control, 6
  cases, reading every partition out of the record.
- `src/__tests__/behaviors/t781-stale-suite-wiring.test.ts`: honours a later
  triage record that wires a held row (the rule T-779's control already uses).
  A wholly superseded directory must be reached and out of the dark baseline;
  rows nobody superseded are held exactly as before.
- `docs/architecture/test-ci-coverage-census.json`: regenerated.

## QA / Validation

**Each file run on its own** (`npx jest --runTestsByPath`): 4, 7 and 54 cases,
all green.

**Mutations against product code**, each applied to one file, run, and
restored. The same set was run against the pre-change suite from `origin/main`.

| Mutation | New suite | Pre-change suite |
|---|---|---|
| M1 drop tenant fence on Tower tool usage | caught | missed |
| M2 drop tenant fence on Tower DORA metrics | caught | missed |
| M3 drop tenant fence on the engagement lookup (gates) | caught | missed |
| M4 drop tenant fence on the engagement-scoped signal read | caught | missed |
| M5 drop tenant fence on the portfolio signal backfill | caught | missed |
| M6 hard-code the client-row filter to one tenant id | caught | missed |
| M7 special-case one tenant key with a quoted literal | caught | caught |
| M8 add a literal-key filter to the signal backfill | caught | caught |
| M9 drop tenant fence on the portfolio-position read | caught | caught |
| M10 drop tenant fence on the initiative row | caught | caught |
| M7b as M7, key spelled as a concatenation | caught | **missed** |

New suite: 11 of 11. Pre-change suite: 4 of 11. The first draft of the new
fixture caught 8 of 10: M3 and M4 survived because no cross-tenant row existed
that only those fences excluded. The hostile rows were added for that reason.

**Control, red first.** Before wiring, the new control failed on reach and on
the dark baseline. Mutations against it, each 1 of 6 failing: step removed,
baseline line restored, a `node:fs` import added to a wired suite, an unjudged
file added to the directory, and the composer's import made type-only. The
amended T-781 control goes red when the new step is removed (the superseded
directory is then unreached), and it went red before the amendment when the
scanner case was rewritten, as T-781 intended.

**Same-scope baseline** (`npx jest src/__tests__/behaviors`): 162 suites / 1724
tests / 0 failing on the base as reported by T-781 at merge, and 163 / 1730 / 0
on this branch; the delta is exactly the new control.

- `npm run coverage:behavior-gate`: exit 0, lines 90.12, functions 69.42,
  identical to the base. The control imports no product module.
- `npm run audit:named-suite-requiredness`: OK.
- Census: covered 2296 -> 2301, uncovered 275 -> 272, uncovered directories
  126 -> 125. Total test files 2571 -> 2573: one is the new control, and one is
  drift already on `main` (the census run on a clean `origin/main` tree counts
  2572 against the committed 2571).
- `tsc --noEmit` exited 0, judged by exit code; eslint on changed files exit 0.

## Rollout Plan

Merge to `main` through the repo-owned workflow. No runtime rollout: no image,
migration, flag, environment variable or traffic change. The step becomes active
on the next pull request.

## Deployment Authority

Not required. This release cannot affect Azure Container Apps, runtime images,
flags, environment variables, worker jobs, traffic or DNS.

- Repo-owned deploy workflow: not invoked by this change
- Shared runtime mutators: none
- Approved image digest: n/a (no runtime image change)
- ACA runtime invariant: unaffected
- Worker image invariant: unaffected
- Feature/env flag update path: n/a
- Live signed-in proof required: **no**, because no product surface changes

## Rollback Plan

Revert the pull request. That restores the byte case, removes the step, and
restores the baseline line, the T-781 control and the previous census together.
They are consistent only as a set. Nothing to unwind in a running environment.

## Audit Evidence

- The triage record, with per-file run counts and the mutation list.
- The control suite and the mutation table above.
- Runner proof from the pull request's unit-suites job log, recorded in the
  backlog after the run, not inferred from the YAML.

## Known Gaps

- `src/lib/atlas/initiative-deep/joins/__tests__` is a separate dark directory
  and is not judged here.
- Gate approvals and upcoming phases are read by engagement id only. Their fence
  is the tenant-fenced engagement lookup, which M3 now proves; a row in those
  tables keyed to another tenant's engagement id is not independently fenced.
