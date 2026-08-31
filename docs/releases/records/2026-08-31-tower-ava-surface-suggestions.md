# Tower — aVa suggests what the visible surface can answer

## Release ID

`2026-08-31-tower-ava-surface-suggestions`

## Status

`candidate`

## Plain-English Summary

aVa's answers became surface-aware before its prompts did. Opening it on Tools / Rollouts produced
an answer drawn from the rollout table — and four suggested questions about claimable value,
finance-validated value, owner actions and portfolio posture, none of which the visible table can
answer.

The prompts are what a reader clicks. A generic prompt on a specific surface sends them somewhere
the page did not.

Suggestions now follow the surface, reading the same `pageContext` the answer path already
maintains, so a prompt can never describe a different surface from the one an answer would use.
Counts inside them are derived from the loaded view rather than written into the text: on a tenant
with eight rollouts below target the prompt says eight, and on a tenant with none it asks a
different question instead of naming a population that does not exist.

A rollout counts as below target only when both readings are present. A rollout with no target
cannot be short of one, and including it would inflate the number the prompt states.

## Also repaired: two guards that had been failing on `main`

Both were written earlier in this sweep, were correct then, and were made false by later work:

- The tenant-GUC guard pinned `set_config('app.tenant_key', $1, false)`. The reader now passes
  `true`, which scopes the key to the transaction rather than the session. That is the safer
  form — with connection pooling a session-scoped key persists on the connection and the next
  request to reuse it inherits the previous tenant's key. The guard was pinning the unsafe
  spelling and now pins the safe one, with the reason recorded.
- The schema-reference guard detected a migration with
  `create table if not exists ecl_projection.<name>`, unquoted. Generated SQL quotes its
  identifiers, so it reported that no migration existed while the baseline sat in the same
  directory. It now matches either form.

The second is the same quoting assumption that produced a wrong reading of the baseline's coverage
earlier the same day. Matching generated SQL on an unquoted identifier fails silently and in the
reassuring direction.

## Layer Impact

Lane: `global-control-lane`. Product surface only — one component's suggestion list and two test
guards. No reader, loader, schema or data change.

## Client Applicability

**All clients.** Prompts change per surface; answers are unchanged. A tenant whose surface has no
population to ask about receives the portfolio-wide prompts rather than an empty question.

## Changes Included

- `src/components/tower/command-center/TowerCommandCenterAvaShell.tsx` — `surfaceSuggestions`,
  wired to `pageContext`.
- `src/lib/tower/__tests__/case-attribute-widening.test.ts` — five new guards, two repaired.

## QA / Validation

**Status: PASS.**

| Check | Result |
| --- | --- |
| `case-attribute-widening` | PASS — 88/88 |
| Tower suites | **Improved** — 18 failing against 20 on `origin/main`, freshly derived; the only difference is this suite no longer failing |
| `tsc --noEmit` · `eslint` | PASS — clean |
| Live behaviour confirmed before the change | Answer on Tools / Rollouts opened with "I am using the Tools / Rollouts context"; suggestions on the same screen were the four portfolio-wide ones |

## Rollout Plan

Ships with the next `main` deploy. No flag, no env change, no data build.

## Deployment Authority

`.github/workflows/aca-main-deploy.yml` on merge, digest-pinned.

## Rollback Plan

Revert. Suggestions return to the portfolio-wide list; answers are untouched either way.

## Known Gaps

- **Prompts are mapped per surface, not generated.** A new sub-tab gets the portfolio-wide
  fallback until it is added here. That is the safe direction — an unmapped surface offers a
  question the product can answer rather than one it cannot.
- The opener sentence is still tenant-scoped rather than surface-scoped. It names what aVa can
  explain across Tower, which stays true on every tab, so it was left alone.
- Only counts feeding the prompts are derived. The prompt wording is fixed text per surface.

## Audit Evidence

Observed live on `/tower?tab=tools&view=rollouts` before the change: aVa answered
"I am using the Tools / Rollouts context. Tool rows are adoption evidence, not value proof," produced
a thirteen-row rollout table with a derived gap-to-target column, and offered
"What value is claimable today, and what is blocked?" at the head of its suggestion list.
