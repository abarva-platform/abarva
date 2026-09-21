# 2026-09-20-correct-a-stale-query-order-expectation — one of two red cases, and why only one is fixed

## Release ID

`2026-09-20-correct-a-stale-query-order-expectation`

## Status

`candidate`

## Plain-English Summary

The Intelligence enterprise-context read model suite had two failing cases.
They look alike and are not: **one went stale, the other has never passed.**
Only the stale one is corrected here.

Both were invisible because no workflow reaches that directory.

## The one that is fixed

A case pins the exact sequence of database queries the read model issues. The
Intelligence executive briefing surface (`6ebe6d4a9`) added a
`context_insights` read, and the expected sequence was never extended with it,
so the case has been red since that feature shipped.

The query is deliberate — a feature commit added it — so the expectation is
what is wrong, and it is corrected by appending the query in the position it
actually occupies, last.

**The assertion is not loosened.** It still pins the full sequence exactly,
which was mutation-proved: inserting one bogus entry into the expected list
fails the case.

| | |
|---|---|
| before | 2 failed / 25 passed |
| after | **1 failed / 26 passed** |
| mutation: add a bogus entry | **fails** — the order is still exact |

## The one that is NOT fixed, and why

The other case asserts a card reads `2 systems/services loaded` for a fixture
holding one `cmdb_application` and one `configuration_item`. The read model
counts only three CMDB types and has never counted `configuration_item`, so it
reports one.

The tempting reading is that this also went stale. It did not. Checked at
`8fe274ed8` — the commit titled *"Count documented context record aliases in
Intelligence"*, which updated the read model and this test **in the same
change** — the grouping was already exactly those three types and the string
`configuration_item` appears nowhere in the file.

**So the commit that introduced this assertion shipped code that never
satisfied it.** The test has never passed. It went in red and stayed red
because the directory is unwired.

That makes it a specification question, not a maintenance one: the commit's
own title says aliases should be counted, and the implementation contains no
alias handling at all. Deciding whether a configuration item *is* a
system/service on that card changes what the product tells a client, so it
needs the owner of that surface rather than an inference from a commit
message. It is left red and documented.

## Layer Impact

- `global-control-lane`. One expectation in one test file. No product surface,
  tenant data, schema, projection, migration, flag, code path, or runtime
  behaviour.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: yes
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts` — the
  expected query sequence extended by the query the read model actually
  issues, with the commit that added it named in a comment.

## QA / Validation

Measured on base `1dbee2e27`.

| What | Result |
|---|---|
| The suite | 2 failed → **1 failed**, 27 cases |
| Mutation: bogus entry in the expected order | **fails** |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

## Rollout Plan

Merge to `main`. The directory is not reached by any workflow, so no CI check
changes state. No image build, migration, flag, or runtime change.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none · Live signed-in proof required: no

## Rollback Plan

Revert the PR. The case returns to failing on a query the read model genuinely
issues.

## Audit Evidence

- The received sequence showing `context_insights:rows` appended last.
- The read model at `8fe274ed8`, showing the alias grouping never existed.
- The mutation result.

## Known Gaps

- **The suite is still red**, deliberately, on the case that has never passed.
- **Wiring this directory would fail on arrival** while that case stands, so
  the coverage gap that hid both of these remains open.
- **An exact query-order assertion is brittle by design.** It will go stale
  again the next time a read is added, and nothing warns before it does —
  which is how this one survived a feature commit unnoticed.
