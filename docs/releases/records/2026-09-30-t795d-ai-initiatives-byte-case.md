# 2026-09-30-t795d-ai-initiatives-byte-case — Replace a migration byte scan with a runtime schema assertion

## Release ID

`2026-09-30-t795d-ai-initiatives-byte-case`

## Status

`candidate`

## Plain-English Summary

The T-795 triage found that case 5 of
`src/lib/setup/__tests__/ai-initiatives.test.ts` ("does not create a common
public setup initiative table") only read the text of one fixed, already-applied
migration file from May 2026. No later change to the code that actually writes
setup AI initiatives could make it fail, so it proved nothing about that code.
This is T-795's update verdict (d).

The case is replaced, not deleted. The new case mocks the Postgres pool with a
recording double. For each of the three private planes it drives the real
`persistSetupAiInitiatives` and `listPersistedSetupAiInitiatives` functions, and
asserts that every data statement:

- targets exactly one table,
- and that table is the calling tenant's own quoted private schema;
- names no other tenant's private schema;
- never mentions `public`.

The six data statements together must also cover the batch, initiative and
audit tables.

**Nothing is wired.** The workflow file, coverage census and dark baseline are
held by a sibling item while this runs. Wiring the `setup` directory is left to
the next wiring run, and this change removes the reason the triage gave for
holding it.

## Layer Impact

**Release lane: `global-control-lane`.** One test file only.

- **Layer 4 (Products):** no product behavior changes. No route, component,
  adapter, migration or canonical object is touched.
- **Platform tooling / CI:** one test file changes. No workflow, census or
  baseline changes.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: yes. Test code only.
- Public/demo only: no
- Feature flag: none

## Changes Included

- `src/lib/setup/__tests__/ai-initiatives.test.ts`: case 5 is rewritten as a
  runtime assertion over the persist and read paths. The now-unused `fs` and
  `path` imports are removed.

## QA / Validation

**Same-scope baseline.** Base `045838562e` passes 6 of 6 cases in this file;
the branch also passes 6 of 6. The case count is unchanged, because one case
was replaced by one case.

**Mutations to product code.** Each mutation was run against both the base
version of the file and the rewritten one. A sha256 check before and after each
edit confirmed that the file really changed, and `git checkout` restored it
after each run.

| Mutation | Base: old byte case | Base: whole file | Branch: new case | Branch: whole file |
|---|---|---|---|---|
| M1: table ref drops the schema qualifier | pass | 1 fail (case 3) | **fail** | 2 fail |
| M2: initiative insert goes to `public.setup_ai_initiatives` | pass | pass | **fail** | 1 fail |
| M3: persist resolves every tenant to one plane | pass | 1 fail (case 6) | **fail** | 2 fail |
| M4: read path selects from an unqualified table | pass | pass | **fail** | 1 fail |
| M5: audit rows written into the initiative table | pass | pass | **fail** | 1 fail |
| M6: read path resolves every tenant to one plane | pass | pass | **fail** | 1 fail |

- The old byte case caught **0 of 6** mutations to product code, and the whole
  base file caught 2 of 6.
- The new case caught **6 of 6**, and the whole branch file caught 6 of 6.

**The direction this loses, reported rather than hidden.** M7 appends
`CREATE TABLE IF NOT EXISTS public.setup_ai_initiatives` to the historical
migration file. The old byte case catches it; the new case does not. That
file is applied history and must not be edited in any case. A *new* migration
that creates a public table would be missed by both versions, so the loss is
limited to an edit that is already forbidden.

**Other checks:**

- `tsc --noEmit` (with `--max-old-space-size=6144`) exited 0, judged by the
  exit code.
- ESLint reported 0 problems on the file.

## Rollout Plan

Merge to `main` through the repo-owned workflow. There is no runtime rollout:
no image, migration, flag, environment variable or traffic change.

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

Revert the pull request. There is nothing to unwind in a running environment.

## Audit Evidence

- The mutation table above, from local runs.
- The T-795 triage verdicts in the operator backlog.

## Known Gaps

- The suite still runs in no CI job. Wiring it is the next wiring run's work.
- The new case proves which schema the application's SQL targets. It does not
  prove the database's grants or row-level security; a pg double cannot.
- No test guards against a future migration that creates a public
  `setup_ai_initiatives` table, and none did before this change.
