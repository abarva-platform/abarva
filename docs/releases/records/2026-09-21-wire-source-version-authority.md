# 2026-09-21-wire-source-version-authority — joining the version contract to its tables

## Release ID

`2026-09-21-wire-source-version-authority`

## Status

`candidate`

## Plain-English Summary

The request and strategy version authority existed in three disconnected
pieces: tables defined in a migration, a complete contract in TypeScript, and a
read path for the event's activation state. Nothing joined the first two.
`planSourceAuthorityVersion` had **no caller outside its own module**, and the
only reference to `source_event_authority_versions` anywhere in `src/` was a
test asserting that the migration file's SQL *text* contained certain strings.

This adds the read half of the missing path, and wires the module's suites into
CI — both halves were dark at once.

| | before | after |
|---|---|---|
| Consumers of the version contract | **0** | 1 (this store) |
| Runtime references to the tables | **0** | 1 |
| `new-workspace` suites run by a workflow | **0 of 8** | **8 of 8** |
| Directories in the census's uncovered set | 200 | **198** |

## What it does

`readSourceAuthorityVersionState(eventId, clientKey, authorityKind)` returns
the current (not superseded) version for an event and kind, together with the
approvals recorded against **that** version, in exactly the shapes
`source-version-authority.ts` already consumes — no adaptation layer.

Only the current version's approvals are returned. A superseded version's
approvals are not authority for the current one; the contract's own
`approvalsForCurrentVersion` filters on this, and returning them here would
leave that filter as the only thing between a stale acceptance and a surface
reporting the request as accepted.

## Why it fails closed, for two different reasons

1. **The migration is still behind the separate apply gate.** In a deployed
   environment these tables may not exist, so a read error returns
   `unavailable` — the same shape `readSourceEventAuthority` already uses, so a
   surface reading both handles one state rather than two.
2. **A row that the table's own CHECK constraints would have refused must never
   be rendered as authority.** The content hash is re-checked against
   `^[a-f0-9]{64}$`, the version number against `> 0`, and role and decision
   against the same three-role and two-decision unions the constraints name.

An unreadable *approval* row fails the whole read rather than being skipped.
Dropping it is the dangerous direction: a `changes_requested` row that failed to
parse would leave the version reading as accepted on the strength of the rows
that happened to parse.

"No version of this kind yet" is a distinct, readable state — an event before
its first Request draft — and is not an error.

## Layer Impact

- `global-control-lane`. One new library module, one new suite, one workflow
  step, and the regenerated census. **No product surface consumes this yet** —
  see Known Gaps. No tenant data, schema, migration, flag, or runtime behaviour
  change; no migration was applied.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/lib/source/new-workspace/authority-version-store.ts` — new read path.
- `src/lib/source/new-workspace/__tests__/authority-version-store.test.ts` — 12 cases.
- `.github/workflows/unit-suites.yml` — one step running all eight suites in the module.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

Measured on base `46fc4ddcb`.

| What | Result |
|---|---|
| New suite | **12 passed** |
| The exact command the workflow runs | **8 suites, 67 tests, 0 failed** |
| All census-consuming guards (23 suites) | **112 passed** |
| `tsc` (exit code) | 0 |
| `eslint` on changed files | clean |
| `release-check` | passed |

### Census set diff, not totals

```
LEFT the uncovered set:
   - src/lib/source/new-workspace
   - src/lib/source/new-workspace/__tests__
JOINED the uncovered set:
   (none)
```

Unrun files 578 → **571**. The arithmetic reconciles exactly: 578, plus the one
test file this change adds, minus the eight now covered.

### Mutation results

| Mutation | Result |
|---|---|
| tenant re-check removed from the version row | **1 case fails** |
| `.is("superseded_at", null)` removed | **1 case fails** |
| unreadable approval row skipped instead of failing the read | **2 cases fail** |

### A type error the suite could not see

The fixture's chainable mock referenced itself inside its own initializer,
leaving it implicitly `any`. `ts-jest` ran it green; `tsc` rejected it with
TS7022. The mock is now built first and chained afterwards. This is the second
time in one day that a green suite hid a type error from `ts-jest`.

## Rollout Plan

Merge to `main`. The new workflow step runs eight suites that are green on
arrival. No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. The version contract returns to having no caller and the
module's suites return to the dark set.

## Audit Evidence

- The census set diff above, showing exactly two directories leaving the
  uncovered set and none joining.
- The exact workflow command run locally: 8 suites, 67 tests, 0 failed.
- The three mutation results.
- `tsc` exit code, before and after the fixture correction.

## Known Gaps

- **No product surface consumes this yet.** Wiring it into the Source New
  workspace changes what a client sees, and until the migration is applied it
  would render `unavailable` in production. That is a surface decision and is
  not taken here.
- **This is the read half only.** Writing versions and recording approvals —
  the path that would actually call `planSourceAuthorityVersion` — is not
  built.
- **The tables are still unapplied.** This code is correct and inert until the
  migration passes its gate.
- **`D-006` remains unsatisfiable** for a separate reason recorded elsewhere:
  its acceptance requires recording the actor and accepted request version for
  *activation*, and no migration defines those columns.
