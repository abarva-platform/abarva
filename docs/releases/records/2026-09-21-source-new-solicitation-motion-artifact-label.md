# 2026-09-21-source-new-solicitation-motion-artifact-label — Source New states the accepted solicitation motion on the package itself

## Release ID

`2026-09-21-source-new-solicitation-motion-artifact-label`

## Status

`candidate`

## Plain-English Summary

A sourcing event can run as a request for information or as a request for proposal. Which one it
is, is a decision a named person records; until they do, the product is supposed to say neither.
The phase rail and the file-folder rail were corrected for that some weeks ago and now read
`Market package` until a motion is accepted, and `RFI` or `RFP` once one is.

One panel further in, they were not. When an operator clicks through Files into the package
document itself, the detail panel printed the artifact's recorded type. That type is stage
vocabulary — `rfp_package` is the value the file cabinet actually stores — and it says nothing about
which motion the event is running. So an event whose accepted motion was RFI showed a folder
labelled `RFI` holding a document described as `rfp package`. The surface contradicted itself, and
the word the operator read came from a key nobody had accepted.

This change makes the detail panel say what was accepted. A recorded type that leads with a
solicitation key is rendered with the event's accepted motion — `RFI package`, `RFP package` — or
with neutral wording, `Market package`, while no motion has been accepted. A type that carries no
solicitation key is left exactly as recorded: withholding a motion nobody accepted is the point;
rewording a fact that was recorded is not.

The suite that covers the file cabinet existed and was named by no workflow, so none of this ran in
CI. It is now wired into the AI surface control catalog workflow beside the workspace suite.

## Layer Impact

Release lane: `global-control-lane`. Shared app behavior for all clients, not feature-gated.

- **Products (layer 4 — Source).** Display only, on the Source New Files panel. One label is
  resolved from authority the surface already receives instead of from a stored key.
- **Canonical model (layer 3).** Unchanged. No column, type, migration or persisted value is
  touched, and no motion is inferred or written.
- **Client intake (layer 1) and source adapters (layer 2).** Unchanged.

## Client Applicability

- All clients: yes — the Source New event workspace renders this panel for every tenant.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. The behavior is unconditional and degrades to the neutral wording.

## Changes Included

- `src/components/source/new-workspace/SourceNewFiles.tsx` — new `artifactTypeLabel`; the `Type`
  detail row resolves through it instead of printing the raw key.
- `src/components/source/new-workspace/SourceNewFiles.test.tsx` — six behavior cases.
- `src/components/source/new-workspace/SourceNewWorkspace.test.tsx` — three click-through cases that
  open the package through the rendered workspace.
- `.github/workflows/ai-surface-control-catalog.yml` — names the file-cabinet suite so it runs.

No migration, no route, no script, no data-plane change.

## QA / Validation

**Red first, then the fix, then the fix broken on purpose.**

Directory scope `src/components/source/new-workspace`, both sides measured at the same base
`8b9d898f7a193b02daee7405a1474c0b599e8492` in separate worktrees:

| | suites | tests | failing |
|---|---|---|---|
| clean base | 3 | 62 | 0 |
| this branch | 3 | 71 | 0 |

The nine added tests are the whole difference.

Red first: with the tests written and the component untouched, **6 failed / 56 passed**. The failure
text is the defect itself — `Received: <dd>rfp package</dd>` on an event whose accepted motion is
`rfi`. (Two of the nine assert what must *not* change and correctly pass on both sides; a ninth
covers a multi-token key added after the first red run.)

Mutation round — five deliberate breaks of the shipped rule, **five caught**:

| mutation | result |
|---|---|
| print the raw recorded key again | 8 failed |
| drop the neutral fallback and assume `RFP` | 2 failed |
| strip only the first solicitation token | 1 failed |
| apply the rule only inside the market-package folder | 1 failed |
| ignore the accepted motion and always read neutral | 6 failed |

**One earlier escape, recorded rather than dropped.** A first draft of the rule took the artifact's
folder as well as its type, and the mutation that removed the folder check changed nothing under
test — the branch was unreachable, because no tested fixture had a solicitation key outside that
folder. The rule was reworked to key on the solicitation token alone, which removed the redundant
branch, and a test was added for a package copy filed under `Other stages`. That is the fourth
mutation in the table above, and it now fails.

Other gates: `tsc --noEmit` exit 0 with the build info deleted, zero diagnostics, exit code judged
rather than grepped. `eslint` on the changed directory exit 0. `release-check` result recorded in
the PR.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds and deploys on merge. No migration,
no flag, no manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded in the PR after the deploy run completes.
- ACA runtime invariant: to be proven from the deploy run's own artifact after merge.
- Worker image invariant: unchanged by this release; asserted by the same run.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — the corrected label renders on the Source New Files panel of
  a signed-in event. An agent must not attempt it, so it is owed.

## Rollback Plan

Revert the PR and redeploy through the same workflow. No data is written, so nothing needs
unwinding. Reverting restores the raw key in the detail panel and removes the CI step.

## Audit Evidence

- PR and its check run.
- The `Exercise the Source New file cabinet, including solicitation labels` step in the AI surface
  control catalog workflow run.
- Deploy run and its runtime-invariant artifact, recorded in the PR after merge.

## Known Gaps

- **Signed-in acceptance is owed, not performed.**
- **Persisting the motion is still out of scope.** This release states the motion the event already
  carries; it does not add the `motion` column, and an event with no accepted motion still reads
  neutral everywhere. That half needs a schema decision and is untouched here.
- The rule reads a leading solicitation token. A recorded type that carries the token somewhere
  other than the front is left as recorded; no such type exists in the cabinet today.
