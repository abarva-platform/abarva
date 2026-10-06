# 2026-09-01-home-operating-model — The Operating Model chapter answers its own question

## Release ID

`2026-09-01-home-operating-model`

## Status

`candidate`

## Plain-English Summary

The chapter that asks how the enterprise is organised described how complete its own record was,
and printed a headcount of zero against every level of the organisation.

The organisation family carries no headcount and no budget-authority field. Both were read anyway,
summed to zero, and drawn as columns — so every level showed `0` people and the total showed `0`.
Two true facts, that the field is read and that every value is absent, combining into a false one.

What the record does carry is a parent on nearly every unit. That is the shape of the organisation,
and it is now the chapter's answer.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged. No intake, adapter, canonical-model or schema change; no migration.
- **Layer 4 / products:** the Home chapter `how_we_operate`, and one context item in the served
  narrative packet.

## Client Applicability

- All clients. Behaviour follows the record: a tenant whose organisation record carries headcount
  draws that column exactly as before, and a tenant whose record has no parent links gets no
  structure table rather than an empty one.
- Feature flag: none.

## Changes Included

- `page-tables.ts` — `organizationTables` draws a measure only where a unit declares it;
  `reportingLines` counts the structure from declared parent links; `organizationFindings` gains
  three rules.
- `ecl-projection-bundle.ts` — the assessment id restored to the context item that names the record
  the packet was built from.
- `__tests__/operating-model.test.ts` (new) — 14 cases.

### A measure the record does not carry is not summed

A measure is drawn only where some unit declares it, and the ones dropped are named under the
table: _an absent measure summed across levels would print as zero._ Nothing is imputed and no
column is silently missing.

### The structure is counted, not characterised

Reporting lines come from the parent each unit names. That is arithmetic on declared links. The
record carries no span-of-control field, so the note says the figures are not declared spans —
counting parent links and calling the result a span of control are different acts.

The depth walk carries the path it took. A record can name a unit somewhere in its own ancestry, and
a walk that trusts the links never returns; a hung render is indistinguishable from an outage.

### Three conditions the rules could not previously reach

- **No unit owns any system.** The old rule started at one, so the loudest reading of the column —
  nobody owns anything — produced no finding at all. It now reports.
- **Authority named but never sized.** Levels can be counted and compared; what sits under them
  cannot. The record says so rather than leaving a reader to notice a missing column.
- **A reporting line that does not resolve** reports as an exposure: the chain above that unit
  cannot be walked, so a finding there escalates to nobody the record can name. Where every line
  resolves, that reports as established, with the depth walked.

### A separate fix, found on the way

A context item fed to the model had lost the assessment id naming the record it was built from,
leaving two tenants' packets reading identically in the model's context — and a caveat that cannot
be traced to a record is a caveat about nothing. The id is restored. That test was red on `main`.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__ src/lib/home/preview/__tests__` — **315/315**,
  including one case that was failing on `main` before this branch
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- PASS rendered against the real 38-unit organisation record: both measure columns drop with the
  reason stated, the structure resolves 3 levels deep, 37 of 38 units parented, 0 dangling
- **Mutation-tested twice:** drawing every measure regardless of declaration fails 3 cases;
  removing the cycle guard from the depth walk overflows the stack
- Sized against the record before building: 38 units, 38 decision rights, 38 owned data domains,
  0 owned systems, and no headcount, budget-authority, span-of-control or succession-risk field at
  all

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. The chapter returns to its previous tables, including the zero-headcount column.
No data or schema state to unwind.

## Audit Evidence

- The two mutation-test results, and the render against the real organisation record.
- Every table figure and every finding is a pure function over rows already in the bundle, each
  carrying the file, grain and rule behind it.

## Known Gaps

- "Where authority sits" is two columns on the current record, because the record sizes nothing.
  The table is honest but thin, and it will stay thin until the intake collects a measure.
- Nothing joins a unit to a system, because no unit declares one. Findings about systems still
  cannot reach a named owner from this record alone; the chapter now says so instead of implying
  otherwise.
- The organisation record for one tenant names a unit belonging to another tenant's business. That
  is an intake question, not a rendering one, and is raised separately rather than patched here.
