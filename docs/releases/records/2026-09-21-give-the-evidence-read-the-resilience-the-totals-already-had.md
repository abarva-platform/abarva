# 2026-09-21-give-the-evidence-read-the-resilience-the-totals-already-had

## Release ID

`2026-09-21-give-the-evidence-read-the-resilience-the-totals-already-had`

## Status

`candidate`

## Plain-English Summary

The Source workspace makes **two reads of the same API**: the portfolio totals,
and the impact payload behind the evidence, depth and action rows. A fix for
transient portfolio failures gave the first read retry. **The second read never
got it**, and carried no timeout either.

So a transient fault the totals recovered from took the whole evidence layer
down with it, and a stalled read left "Evidence depth updating" on screen
indefinitely with zero rows beneath it. That is the reported signed-in symptom:
totals present, evidence never arriving.

| | before | after |
|---|---|---|
| Portfolio read retries a 5xx | yes | yes |
| **Impact read retries a 5xx** | **no** | **yes** |
| Impact read bounded by a timeout | **no** | yes, 20s with abort |
| Badge state after a portfolio failure | **stays `loading`** | terminal |

## The badge had three states and two exits

`ImpactLoadState` is `loading | ready | error`, and nothing could move it out of
`loading` except the impact promise settling. Two paths left it stuck:

1. **A stalled read.** `fetch` carries no timeout, so a request that never
   settles never resolves and never rejects. The badge spins forever.
2. **A failed portfolio read.** The outer `.catch` set `error` but never gave
   the badge a terminal value — a third missing exit, latent because the error
   page currently short-circuits the render.

A spinner that cannot time out reports a failure as progress. That is why this
was not noticed earlier: the surface had no way to say the evidence read had
failed.

## What this does and does not do

**It does not restore the data.** If the impact query is genuinely slow or
failing upstream, this change makes that visible and retryable rather than
hiding it behind a spinner. The badge will say "Evidence depth retry needed"
instead of "updating", and the read will have retried twice before saying so.

**It is not signed-in proof.** The symptom was observed in the live signed-in
environment; this is a code-level fix with component-level tests. Whether the
live surface now populates has to be confirmed in that environment by someone
who can sign in, and is not claimed here.

## Layer Impact

- `global-control-lane`. One client component and one new suite. No tenant
  data, schema, projection, migration, flag, or server behaviour: the change is
  entirely in how a browser read is retried and bounded.

## Client Applicability

- All clients: no · Specific clients: none · Internal only: no — this is a
  product surface, but the change is failure handling, not content
- Public/demo only: no · Feature flag: none

## Changes Included

- `src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx` — impact read
  gains the portfolio read's retry, an abort-backed timeout, and a terminal
  badge state on portfolio failure.
- `src/app/(maestro)/source/workspace/__tests__/workspace-impact-read-resilience.test.tsx`
  — 3 cases.

## QA / Validation

Measured on base `362b249e2`.

| What | Result |
|---|---|
| New suite | **3 passed** |
| Workspace suites (37) | 301 passed, 5 failed |
| The same 5 failures on unmodified `origin/main` | **identical — pre-existing** |
| `tsc` (exit code) | 0 |
| `eslint` | clean |
| `release-check` | passed |

The two red suites — `WorkspaceExecutiveShell.performance` and
`WorkspaceClient.ecl-browser` — were measured on the unmodified base and fail
the same way there: 5 failed / 56 passed in both runs. They are left red and
untouched.

### Mutation results

| Mutation | Result |
|---|---|
| timeout's `controller.abort()` removed | **1 case fails** — the stalled read sits in `loading` |
| impact retry removed | **1 case fails** — a 503 is no longer survived |

The retry case also asserts the call count, so a version that reached `ready`
on the first attempt could not pass it.

## Rollout Plan

Merge to `main`. No image build, migration, flag, or data change. The next
signed-in pass on the workspace will show either populated evidence or an
explicit "retry needed" — both are better than the current silent spinner.

## Deployment Authority

- Repo-owned deploy workflow: not exercised beyond the ordinary main deploy
- Shared runtime mutators: none · Approved image digest: not applicable
- ACA runtime invariant: not applicable · Worker image invariant: not applicable
- Feature/env flag update path: none
- **Live signed-in proof required: yes**, and it is owed. See above.

## Rollback Plan

Revert the PR. The impact read returns to one unbounded attempt and the badge
to a state machine with an unreachable exit.

## Audit Evidence

- The two fetch helpers side by side, showing retry on one and not the other.
- Baseline comparison of the two red suites with and without the change.
- Both mutation results.

## Known Gaps

- **The underlying slowness or failure is not diagnosed.** This change surfaces
  it; it does not explain it. If "retry needed" appears in the signed-in
  environment, the impact endpoint itself is the next thing to look at.
- **20 seconds is a chosen number, not a measured one.** No latency
  distribution for that endpoint was available to set it from.
- **Two workspace suites remain red** and were red before this change.
