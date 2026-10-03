# 2026-09-30-t779-stale-suite-triage — Triage the ninth stale-suite draw and wire the two directories it can

## Release ID

`2026-09-30-t779-stale-suite-triage`

## Status

`candidate`

## Plain-English Summary

Eighteen test files in five directories existed and were run by no
continuous-integration job. They are the top five directories of the
repository's own ranking of untriaged, unrun test work.

Every one of the eighteen was run on its own before any verdict was written.
Seventeen pass; one fails. Each file now has a written verdict in
`docs/architecture/t779-stale-suite-triage.json`.

Two of the five directories are wired into a job that runs on every pull
request: Source reasoning and the workspace explorer. That is 8 suites and 47
cases, all green, none of them reading a repository file, and both testing code
that a live product path imports (the Source artifact generate route; the Moves
and Source workspace pages and the setup files route). This change protects
future work; it does not repair a break.

The other three directories stay unwired, and each hold is checked by the new
control rather than only narrated:

- **Source vendor proposals.** One case expects a proposal fact to pass the
  governed context gate, and the gate refuses its tenant key. The policy module
  builds its tenant check on the short one of two exported canonical tenant-key
  lists. That is backlog item 51's open decision, and it is the same cause that
  already holds one `src/lib/programs` directory dark. The control asks the live
  gate whether it still refuses that key. When the decision lands, the control
  goes red and says the hold has lost its reason.
- **Agent answer** and **context broker.** All six files are green, but each
  directory holds one suite that renders a component listed in
  `docs/architecture/unreachable-components.json` (`AvaAsk`,
  `FourModeDemoSurface`). Wiring the whole directory would count coverage over
  code no route reaches, which is the T-775 defect. The control reads that
  register rather than trusting the record. Wiring the reachable files by name
  is filed as T-780.

A triage does not edit the files it judges.

## Layer Impact

**Release lane: `global-control-lane`.** This is shared CI tooling that applies
to every client's build equally, behind no feature gate.

- **Layer 4 (Products):** no product behavior changes. No route, component,
  adapter, projection or canonical object is touched, and no judged test file
  is modified.
- **Platform tooling / CI:** one job step, one triage record and one control
  suite are added. The coverage census and the dark-directory baseline are
  updated to match what the repository now does.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. CI coverage only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/unit-suites.yml`: one step, `Run the T-779 Source
  reasoning and workspace-explorer suites`. It names
  `src/lib/source/reasoning/__tests__` and `src/lib/workspace-explorer/__tests__`
  as directories without a trailing slash.
- `src/__tests__/behaviors/product-directory-ci-coverage.baseline.json`: the
  two directories' lines are removed.
- `docs/architecture/t779-stale-suite-triage.json`: the record. It has 18 rows,
  each executed, with verdict, counts, file-read judgement and rationale, plus
  the three held directories with their owners.
- `src/__tests__/behaviors/t779-stale-suite-wiring.test.ts`: the control, 8
  cases, reading every partition out of the record.
- `docs/architecture/test-ci-coverage-census.json`: regenerated with
  `npm run audit:test-ci-coverage:write`. The committed census on the base was
  already stale by one sibling suite. A fresh base run gives 2568 files / 2275
  covered. The branch gives 2569 / 2284, which is the 8 wired files plus the
  new control. Directories uncovered went 131 → 129, and ranked untriaged unrun
  files went 172 → 154 (all eighteen drawn files now carry a verdict).

## QA / Validation

**Each drawn file was run on its own** (`npx jest --runTestsByPath`): 17 green,
1 red (`governed-vendor-proposal-facts.test.ts`, 1 of 4). The red case was
probed on the base: the fixture's key and three other registry-declared keys are
all refused by `isCanonicalClientKey`.

**Importer and reachability check.** Both wired subjects have non-test
importers reached from app entries, and the control asserts that stays true.
The two unreachable renders were found in `unreachable-components.json`, per
T-775.

**Control, red first.** Before the wiring existed, 2 of 8 cases failed (reach,
and dark baseline). After the wiring, 0 of 8 fail.

**Same-scope baseline, base vs this branch:**

- `npx jest src/__tests__/behaviors`: 159 suites / 1697 tests / 0 failing
  before, and 160 / 1705 / 0 after. The delta is exactly the new control (8 cases).
- The wired step's own command: 8 suites / 47 tests / 0 failing.
- `npm run coverage:behavior-gate`: exit 0 on both. Lines went 90.15 → 90.12 against a floor of 90, and functions 69.51 → 69.42 against 60. The control imports one policy module to recompute the red hold, and that import is the whole cost. Headroom is now 0.12 lines, and the next author should consult it before adding a suite here.

**Mutations.** Each was checked to be a real edit (`git diff --numstat`) and
restored afterwards. Mutations M1 to M5 were run over the new control plus the
product-directory ratchet (12 cases); M6 to M8 over the control alone.

| Mutation | Result |
|---|---|
| M1: the step removed | 2 of 12 fail: reach, and the ratchet names a new dark directory |
| M2: trailing slash on one wired directory | 2 of 12 fail: reach, and the ratchet |
| M3: one wired directory put back on the dark baseline | 2 of 12 fail: baseline case, and the ratchet's set equality |
| M4: `AvaAsk.tsx` removed from the unreachable register | 1 of 12 fails: the hold-reason case |
| M5: held `context-broker` directory added to the step | 2 of 12 fail: held-out case, and the ratchet |
| M6: the red row re-marked green in the record | 1 of 8 fails: the hold-reason case |
| M7: the policy gate made to accept the red case's tenant key | 1 of 8 fails: the hold-reason case (and the held suite goes 4 of 4 green) |
| M8: the red row's recorded tenant key deleted | 1 of 8 fails: the hold-reason case |

M7 is the one that matters. The first version of the hold case accepted the
record's own `green: false` as the reason, which M6 showed is the record
vouching for itself. It now asks the live gate instead.

`tsc --noEmit` exited 0, judged by exit code.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change. The step
becomes active on the next pull request.

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

Revert the pull request. That restores the step's absence, the two baseline
lines and the previous census together, and they are consistent only as a set.
There is nothing to unwind in a running environment.

## Audit Evidence

- The triage record, with per-file run counts.
- The control suite and the mutation table above.
- Runner proof from the pull request's unit-suites job log (the step's
  per-suite `PASS` lines and case total), recorded in the backlog after the
  run rather than inferred from the YAML.

## Known Gaps

- `src/lib/source/vendor-proposals/__tests__` (4 files, 3 green) stays dark
  until item 51 is decided.
- `src/components/agent-answer/__tests__` and
  `src/components/context-broker/__tests__` stay dark. Their four reachable
  files wait on T-780 (wiring by named file), and their two unreachable renders
  wait on T-775's retire-or-mount decision.
