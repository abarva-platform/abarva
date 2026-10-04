# 2026-10-04-c593-ai-cost-daily-snapshot-pr — stop a scheduled job demanding a capability the repository denies

## Release ID

`2026-10-04-c593-ai-cost-daily-snapshot-pr`

## Status

`candidate`

## Plain-English Summary

One scheduled job — the daily AI-spend digest — has been failing every single
time it runs, and the reason was its very last line.

The job does three useful things: it pulls the cost and usage report, emails the
digest, and commits a dated snapshot of the numbers to its own branch. All three
worked. Then it asked GitHub Actions to open a pull request for that branch, and
this repository does not permit Actions to open pull requests. GitHub refused,
the step exited non-zero, and the whole run went red — after the email had
already gone out and the snapshot had already been pushed.

Measured on 2026-10-04 against the Actions API, that happened on **73 of 73**
scheduled runs: the job's entire scheduled history since 2026-07-23, never once
green. It left behind 73 orphan snapshot branches and not one pull request.

This change stops demanding the capability. The job still tries to open the pull
request. If GitHub refuses it for that specific reason, the job now prints a
warning and a step summary naming the branch, a compare link that opens the pull
request by hand, and the one repository setting that would let the job do it
unattended — and the run goes green, because nothing was lost. Any **other**
failure of that command still fails the run exactly as before.

The decision of which failure is which is the whole risk, so it lives in a small
module with its own test suite rather than in a line of shell: if it called every
failure "the refusal", a genuine break would be green forever; if it called the
refusal a break, the job would stay red forever, which is where it has been since
July.

## Layer Impact

**Release lane: `internal-admin`.** This is AbarVa-only operations capability —
an internal cost-reporting schedule and the repository's own CI — and it ships
to no client surface. It is deliberately not `global-control-lane`: nothing in
the shared app or control plane changes behavior for any client.

- **Layer 4 (Products)** — none. No product surface, route, component, read model
  or tenant-visible behavior changes.
- **Platform tooling / CI** — the only layer touched. One scheduled workflow's
  final step, one new CI helper module with its suite, and one new step in the
  job that produces the required `Run hygiene_gate.sh` check so that suite can
  actually fail a merge.

No canonical object, metric, fact, dataset or adapter is read or written.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — an internal operations schedule and the repository's
  own CI
- Public/demo only: no
- Feature flag: none

## Changes Included

- `.github/workflows/ai-cost-daily.yml` — the `Open snapshot PR` step now
  classifies the outcome of `gh pr create` instead of letting one refusal fail
  the run; header comment corrected to describe what the job actually does.
- `scripts/ci/snapshot-pr.mjs` — new. `classifyPrCreateFailure` decides
  `created` / `forbidden-by-repo` / `error`; the CLI warns and exits 0 only on
  the refusal, re-emits the original error and exits non-zero otherwise, and
  **refuses to classify at all** (exit 2) when a non-zero outcome's output could
  not be read.
- `scripts/ci/snapshot-pr.test.mjs` — new, 9 cases.
- `.github/workflows/hygiene-gate.yml` — a globbed sweep of
  `scripts/ci/*.test.mjs` inside the job that produces the required
  `Run hygiene_gate.sh` context.

## QA / Validation

Baseline is the same scope before and after, not an absolute count.

**The suite, red first.** With `snapshot-pr.mjs` absent:
`node --test scripts/ci/snapshot-pr.test.mjs` → **0 passed / 1 failed**.
With the module: **9 passed / 0 failed**.

**Three mutations, each run on its own** so that one case's failure is
attributable to one guard:

| mutation | result |
|---|---|
| `classifyPrCreateFailure` returns `forbidden-by-repo` for every failure | 6 passed / **3 failed** |
| the refusal pattern replaced with one that can never match | 6 passed / **3 failed** |
| an unreadable `--stderr-file` becomes `exit 0` instead of `exit 2` | 8 passed / **1 failed** |

Restored: 9 passed / 0 failed.

**Other checks, all on this branch:**

- `npx eslint scripts/ci/snapshot-pr.mjs scripts/ci/snapshot-pr.test.mjs` — exit 0.
- `node scripts/audit/ci-gate-registry-check.mjs` — exit 0. No `audit:` /
  `validate:` / `check:` npm script was added, so nothing new needs classifying.
- `npx jest --runTestsByPath src/__tests__/behaviors/exec-toolchain-requiredness.test.ts src/__tests__/behaviors/named-suite-requiredness.test.ts src/__tests__/behaviors/test-ci-coverage-census.test.ts`
  — **3 suites / 74 tests passed**, the suites that police whether a named suite
  runs where a red can block a merge.
- Both edited workflows parse as YAML.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  judged by exit code, not by grepping for `error TS`.

**The diagnosis itself was established by execution, not by reading the row:**

- `GET /repos/.../actions/workflows/ai-cost-daily.yml/runs?event=schedule&per_page=100`
  → `total_count` 73, every conclusion `failure`, oldest in the same page
  `run_number` 2 at 2026-07-23T12:24:34Z. One page holds all 73, so this is the
  complete scheduled history and not a streak truncated by a read window.
- Run `37131951342`, step 7 `Open snapshot PR`, final lines: the snapshot commit
  (`2 files changed, 3706 insertions`), a successful `git push` of a new branch,
  then `pull request create failed: GraphQL: GitHub Actions is not permitted to
  create or approve pull requests (createPullRequest)`.
- `GET /repos/.../actions/permissions/workflow` →
  `"can_approve_pull_request_reviews": false`.
- `GET /repos/.../git/matching-refs/heads/automation/ai-cost-daily-snapshot-` →
  **73** refs, `2026-07-23` through `2026-10-03`.
- A title search for the snapshot pull request returns `[]` — none has ever been
  opened.

## Rollout Plan

Merge to `main`. There is no runtime rollout: nothing here is built into the web
image or read by a running container. The hygiene-gate step takes effect on the
next pull request; the workflow change takes effect on the next scheduled run of
the digest at 11:00 UTC.

## Deployment Authority

- Repo-owned deploy workflow: not involved — no image, revision, traffic, flag,
  env var or worker job changes.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: unaffected by this change; the standing invariant check
  still applies to whatever deploy run follows this merge.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no** — there is no client-visible surface in
  this change. Nothing here may be described as `live-proven`, and nothing here
  needs to be.

## Rollback Plan

Revert the commit. No migration, no data write, no runtime state. Reverting
returns the digest job to failing on its last step, which is the condition this
change ends.

## Audit Evidence

- The run that carries the diagnosis: Actions run `37131951342`
  (`ai-cost-daily`, 2026-10-03), step 7.
- The counts above, each re-readable from the Actions and Git refs APIs with the
  requests quoted in **QA / Validation**.
- The blocking proof for the new suite is the `Run hygiene_gate.sh` check on this
  pull request, whose log carries the line `--- scripts/ci/snapshot-pr.test.mjs`.
- Backlog item `C-593`, and the claim and release lines for it in the execution
  register.

## Known Gaps

1. **The repair is not yet proven by a scheduled run.** `C-593` requires the
   proof be the next scheduled run reaching `success`, quoted from the Actions
   API — not a dispatch with different inputs. That run is at 11:00 UTC on
   2026-10-05 and the proof is **owed**, not held. Until it is quoted, this is
   `merged`, not closed.
2. **73 orphan `automation/ai-cost-daily-snapshot-*` branches remain on origin**,
   and this change does not delete them or stop a new one per day. Deleting
   refs is out of scope for a repair whose subject is one step's exit code. It
   could not be filed as its own item either: the queue reports the `C-500`–`C-599`
   and `T-500`–`T-599` bands **exhausted — 0 of 100 free**, so a new C- or T-lane
   id cannot be taken without a range decision. Recorded here and against `C-593`
   instead of filed.
3. **`C-593` covers five workflows and this change settles one.** The other four
   are untouched and the item stays open. One of them was diagnosed in passing
   and the finding is the opposite of the item's framing:
   `canonical-tenant-drift` is **not** a broken job. Its evidence artifact
   (`11275406781`, run `37126246426`) shows the live verifiers printing
   `verify-canonical-tenants: expected 2 canonical client rows, found 0` and
   `verify-tenant-key-canonical: FOUND 43 persisted alias group(s)` — a healthy
   control reporting a true finding about the control database. Retiring it
   would delete working tenant-isolation coverage. Its repair is a data-plane
   seed/canonicalization through an ACA job, which is lane D and already filed.
4. **The streak-policy exception was deliberately not touched.**
   `docs/ci/scheduled-workflow-streak-policy.json` does not exist on `main`; it
   arrives in a separate open pull request, where `ai-cost-daily.yml` is declared
   a dated exception. `C-593` is explicit that a **repair** is caught by the
   streak control itself once the workflow recovers, and only a **retirement**
   must remove the entry by hand. No ceiling was raised and no expiry extended.
