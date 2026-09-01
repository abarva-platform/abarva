# 2026-09-01-home-decision-queue — Answer "what needs me" with a queue, not tables about one

## Release ID

`2026-09-01-home-decision-queue`

## Status

`candidate`

## Plain-English Summary

The chapter that asks what leadership should take up next answered it with tables about attention.
A table per family makes a reader assemble the queue themselves; the queue is the answer.

Three families now feed one ranked list: a risk the record rates high whose control it also calls
open, a programme the record itself declares at risk or delayed, and a contract sitting inside its
own notice window that will not renew itself.

## Layer Impact

Release lane: `global-control-lane`.

- **Layers 1-3:** unchanged.
- **Layer 4 / products:** one new section on the chapter that asks for it.

## Client Applicability

- All clients. Each predicate contributes only where its family is served and its fields declared.
- Feature flag: none.

## Changes Included

- `DecisionQueue.tsx` (new) — `buildDecisionQueue` as a pure function plus the section.
- `ChapterPage.tsx`, `HomeV4App.tsx` — rendered on the attention chapter, ahead of its tables: the
  queue is the answer and the tables are the working.
- Two new suites — 8 cases on the logic, 1 on the served path.

### Every row is a declared field

Nothing is scored, weighted or inferred. A ranked list is a claim about priority, and this one has
to be the record's claim rather than ours:

- **A risk** enters on severity _and_ control state, both declared on the same row.
- **A programme** enters on its own `status` — `at_risk` or `execution_delayed` — never on a reading
  of its progress.
- **A contract** enters on a notice window measured against **the record's own as-of date**, never
  today's. A queue whose contents change with the day it is opened is not reproducible, and that is
  mutation-tested.

### A short queue is stated, not implied

Predicates that were checked and found nothing are named under the list. Without that, a two-item
queue reads as "two problems" when it may mean "one family is not served and another declares no
severity". The line says so: _a short queue is a statement about the record, not a statement that
all is well._

### What it deliberately does not do

The design gives each item **the decision it forces**. The record carries no such field, so the row
states what the record says and stops. Writing the decision is authored copy about a client's
situation and belongs to a person.

## QA / Validation

- PASS `npx jest src/components/home/v4/__tests__` — **224/224**
- PASS `tsc --noEmit` · `npx eslint` 0 errors · `npx next build` compiled
- **Mutation-tested:** measuring the notice window against the current date instead of the record's
  fails the reproducibility case
- Sized against the real intake before building: 1 rated risk, 8 declared-struggling programmes,
  0 contracts in notice — nine rows, and the zero is informative

## Rollout Plan

Merge and deploy through the repo-owned workflow. No migration, no data-plane mutation.

## Deployment Authority

- Repo-owned deploy workflow: standard
- Shared runtime mutators: none
- ACA runtime invariant: verified as part of the deploy
- Live signed-in proof required: yes

## Rollback Plan

Revert the commit. The chapter keeps its tables and loses the list above them; nothing else reads
the new component and no stored data records it.

## Audit Evidence

- Mutation-test result, and the pre-build sizing against the intake.

## Known Gaps

- The queue reads three families. Two more the design names cannot contribute: outcome measures
  declare no unmet-baseline condition in this record, and the AI family carries no
  finance-validation field at all. Both were checked before building rather than assumed.
- The decision each item forces is not written, as above.
