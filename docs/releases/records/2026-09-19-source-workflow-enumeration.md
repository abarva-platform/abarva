# 2026-09-19-source-workflow-enumeration — Hold the second integration workflow to the same path enumeration as the first

## Release ID

`2026-09-19-source-workflow-enumeration`

## Status

`candidate`

## Plain-English Summary

Two workflows run integration suites by naming a directory on a jest command
line. A jest path argument is a regular expression matched against the whole
path, not a directory handle, so naming a directory also selects any sibling
file or directory whose name starts with the same characters. That mechanic has
already cost this repository time twice: eight suites that ran on every pull
request while a separate gate reported they had no CI owner, and a directory
that could not be wired by name at all because it would have dragged a red
sibling in with it.

A behavioural case was written to keep the first workflow's selections and the
gate's view of them in agreement. The second workflow — the one that runs the
Source integration directory — was held to none of it, because every case
iterates the first workflow's list.

This change extends that file with one case covering the second workflow. No
workflow, script, exclusion list or product file changes; the state of the
repository today is unchanged and now asserted.

**The item that asked for this was wrong about one fact, and the correction is
the interesting part.** It said nothing under the integration root is prefixed by
that directory's name today, so the hazard was hypothetical. There is one, it
was found when the directory was first wired, and it was resolved correctly — by
naming that file in the exclusion list so it does not run, with a note recording
why. The defect is not that the collision is unhandled. It is that the handling
is held in place by nothing: delete one line from a JSON file and a red suite
silently rejoins the Source lane, from a path pattern nobody would think to read.

## Layer Impact

- **Layer 4 (Products):** none. No product surface, route or read path changes.
- **Layer 3 (Canonical model):** none.
- **Layers 1–2 (Intake, adapters):** none.
- **CI / test tooling:** one behavioural case added to an existing file.

Release lane: `global-control-lane`. Shared CI behaviour for all clients, with no
feature gate and no client-scoped data, schema or runtime effect.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes — CI and test scope only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/__tests__/behaviors/integration-directory-ci-coverage.test.ts` — one new
  case plus the three constants it reads. Nothing existing is modified.

The new case admits the two states a colliding root **file** may be in, and
refuses the third:

| State | Verdict | Why |
|---|---|---|
| Excluded by the workflow's own ignore arguments | allowed | it does not run, so it needs no CI owner |
| Registered with the visibility gate | allowed | it runs and the gate knows who owns it |
| Selected by the pattern, invisible to the gate | **refused** | it runs on every pull request while the gate reports it unowned — the state eight suites sat in for weeks |

A colliding **directory** is refused outright. A stray file runs once and is
enumerated; a stray directory silently adopts every suite written in it
afterwards.

The exclusion list is not copied into the case. It is produced by executing the
same generator script the workflow's own command executes, and the resulting
regular expressions are matched against real paths — so a rewritten generator is
exercised here rather than described.

## QA / Validation

**Baseline, measured on a clean checkout of `3b4106a4e` before any edit.**
`src/__tests__/behaviors/integration-directory-ci-coverage.test.ts`: **0 failed /
7 passed of 7**.

**After:** **0 failed / 8 passed of 8.** The count rises by one because one case
is new, not because anything was changed or removed.

**The state the new case pins, measured rather than asserted**, on the same
commit and through the gate's own resolver:

- the colliding root file is reported **not registered** by
  `isIntegrationTestRegistered`, and is **excluded** by the generated ignore
  arguments — consistent, because it neither runs nor claims an owner;
- the coverage census reports the same file as **covered**, because the census
  resolves the jest path pattern but does not subtract the ignore arguments the
  command passes. That disagreement is real, is filed as a new backlog item, and
  is deliberately not fixed here — the census resolver is a different file under
  a different item.

**Four deliberate mutations, four caught**, each applied to the real execution
path and reverted, with a clean control run before and after:

| # | Mutation | Failing cases |
|---|---|---|
| 1 | Delete the colliding file's entry from the exclusion list | 1 |
| 2 | Add a sibling directory the wired name prefixes | 2 |
| 3 | Add a colliding root suite that no exclusion and no gate covers | 1 |
| 4 | Put a trailing slash on the wired path in the workflow | 2 |

Mutation 1 is the one this case exists for: it is a single-line edit to a JSON
file, it looks like tidying an obsolete entry, and before this change nothing in
the repository would have failed. Mutation 4 is the form that looks more correct
than the real command and makes the visibility gate stop seeing the path.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` **exit
0**, judged by exit code rather than by grepping its output. `npx eslint` on the
changed file **exit 0**.

## Rollout Plan

Merge to `main`. The case runs wherever the behaviours suite already runs. No
image build, no migration, no flag and no data-plane action is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged.
- Shared runtime mutators: none. This change mutates no Azure resource.
- Approved image digest: not applicable — no runtime image change.
- ACA runtime invariant: to be verified after merge as routine practice, not
  because this change can affect it.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — CI and test scope; no route, component,
  prompt, schema, tenant data or auth path changed.

## Rollback Plan

Revert the commit. One test case disappears; nothing else is affected. No
migration, no deployed artifact, no persisted state.

## Audit Evidence

- The pull request and its check run.
- The before/after numbers above, reproducible with
  `npx jest --runTestsByPath src/__tests__/behaviors/integration-directory-ci-coverage.test.ts`
  at `3b4106a4e` and at the merge commit.
- The four mutations above, each reproducible as a one-line edit.

## Known Gaps

1. **The two workflows are held to one enumeration, not to one rule.** The first
   workflow's collisions are enumerated in their own cases and the second's in
   this one, because only the second carries an exclusion list and the two
   therefore admit different states. Unifying them into a single table driven by
   a list of workflows would be a larger rewrite of a file three items have
   already touched this week, and it would restate rather than add coverage.
2. **The gate still matches by ancestor directory while jest matches by regular
   expression.** Whether the gate should adopt prefix semantics is a control
   change and is deliberately untouched here; it remains open as its own item
   with both directions stated.
3. **The census over-counts a file this workflow excludes**, as recorded under QA
   above. Filed rather than fixed.
