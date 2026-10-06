# 2026-09-27-c548-register-silent-unread-settlement — Settle the unread signed-in-proof sentences, per row

## Release ID

`2026-09-27-c548-register-silent-unread-settlement`

## Status

`candidate`

## Plain-English Summary

Every release record in this repository states whether a signed-in check of the deployed change was
run. A separate operator-side register also records, line by line, what each run actually observed.
An earlier change (item C-545) found that when a register line mentions a release but states no
verdict, the comparison between the two accounts was reported as *agreement* — a false clean. That
change gave the silence its own reported state and split it into lines that mention no proof at all
and lines that carry a sentence about a proof which no reader could resolve.

This change reads those unresolved sentences — 25 of them on the current corpus — one at a time and
says which of three things each one is: it reports a run, it reports a debt, or it reports neither.
Eleven report a **completed signed-in run against a record whose own account says the run had not
happened**, so eleven durable records in this public repository were asserting a debt that had
already been discharged, and in two cases were hiding a signed-in run that **failed**. Those eleven
records now carry an appended reconciliation section that states the run, cites the register line
that reports it, and says plainly that the section is a reconciliation rather than a first-hand
observation. No existing text was rewritten and no timestamp was restamped.

Nothing about the product changes. No route, component, prompt, query or tenant record is touched.

## Layer Impact

Release lane: `internal-admin`. The change is confined to AbarVa-internal audit artifacts and the
execution toolchain's own test suite; no client-facing surface ships in it.

- **Layer 4 (Products):** none. No product surface, route, component, agent prompt or data path is
  modified.
- **Release governance / audit artifacts:** eleven existing release records gain an appended
  reconciliation section; one operator tool's behavioural suite gains 24 cases.

## Client Applicability

- All clients: no change.
- Specific clients: none.
- Internal only: yes — release records and the execution toolchain's test suite.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/signed-in-proof-reconcile.test.mjs` — 24 new cases: two per reconciled record (the
  record's own account reads `ran`; the record cites the register line that reports it), plus two
  negative controls. One pre-existing clause was updated, not dropped, with the reason recorded at
  the site.
- Eleven records under `docs/releases/records/` — appended `## Signed-in proof reconciliation (item
  C-548)` sections. No line in any of them was edited or removed.

No source file under `src/` is touched.

## QA / Validation

**Scope baseline, same suite, same command** (`node scripts/exec/signed-in-proof-reconcile.test.mjs`):

| point | result |
|---|---|
| clean `origin/main` `60bc9c7702`, before any edit | **89 passed, 0 failed** |
| new cases added, records NOT yet amended (red first) | **90 passed, 23 failed** |
| records amended | **113 passed, 0 failed** |

The 23 red cases are the 22 per-record assertions plus the negated-template control, which cannot
run until the template it negates exists. The `unmentioned` control passed in the red run, which is
the point of including it: it is the row that must NOT move.

**Mutation proof — four mutations, four caught, each restored and re-verified at 113/0:**

| mutation | result |
|---|---|
| delete one record's appended section entirely | 111 passed, **2 failed** — that record only |
| negate the template's verb in one record (`no signed-in replay was run`) | 112 passed, **1 failed** |
| append the same section to the record deliberately excluded from the set | 112 passed, **1 failed** |
| remove the `(was\|were) (run\|performed\|…)` alternative from the reader's completed-run pattern | 110 passed, **3 failed** |

The fourth mutation catches only three because the template's own `Ran:` prefix is matched by a
second alternative in the same pattern, so the amendment is read by two independent routes. That is
recorded rather than tuned away — it means the reconciliation survives a narrowing of one marker.

**What was NOT done, deliberately.** No marker in `signed-in-proof-reconcile.mjs` was loosened,
widened or otherwise changed; the module is byte-identical to `origin/main`. Item C-529 records that
loosening a marker converts a refusal into a wrong answer, and a marker wide enough to resolve these
sentences would also read the negations it was narrowed to refuse.

- Node 24 TypeScript (`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`),
  judged by exit code: see PR body.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: see PR body.

## Rollout Plan

Squash merge after applicable CI. Only `.github/workflows/aca-main-deploy.yml` may update the shared
ACA runtime. No migration, data build, flag or environment change. Nothing in this change is
reachable from a request path, so a deploy carries it only as inert repository content.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none.
- Approved image digest: recorded from the successful workflow run and verified independently.
- ACA runtime invariant: digest-pinned web template equal to the healthy 100%-traffic revision.
- Worker image invariant: unchanged by this release; not claimed.
- Feature/env flag update path: none.
- Live signed-in proof required: **No.** Nothing here renders, routes, queries or prompts. The
  eleven amended records assert signed-in runs that other lines already record; this change carries
  those assertions into the durable record and re-executes none of them.

## Rollback Plan

Revert the single squash commit. The amended sections are additive and self-contained, so reverting
restores each record byte-for-byte. No data, schema or runtime state is involved.

## Audit Evidence

- The 24 new cases and their per-record failure output, red and green.
- The four mutation runs above.
- Each amended record's appended section, which names the register stamp and identity it reconciles
  against, so an auditor can go to the line rather than take this record's word for it.

## Known Gaps

- **The register's silence is not fixed by this change, and must not be read as fixed.** Every one
  of the 25 rows is still reported `register-silent / unread` by the reconciler, because the
  register line still states no verdict. What changed is that the durable record no longer disagrees
  with it. The updated pre-existing case asserts exactly this, so a future change that hides the
  silence goes red.
- **Five of the 25 report neither a run nor a debt**, because their deciding line names the pull
  request only in passing — as a stack base, a file-collision explanation, or an explicit exclusion
  — and says nothing about that release's proof. They are settled as *reports neither* and are not
  amended. That the reader treats a passing mention as the deciding line for a record is a distinct
  defect; it is recorded in the private backlog under item C-548 and is not repaired here.
- **Two of the eleven report a run that did not pass.** They are recorded as `ran` with the outcome
  stated, because a failed run is a run, and the outcome is the part that was missing.
- This reconciliation is only as good as the register lines it cites. It does not re-execute any
  proof, and it says so in every amended record.
