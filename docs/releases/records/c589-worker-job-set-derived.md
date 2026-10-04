# 2026-10-04-c589-worker-job-set-derived — Derive the enforced worker-job set from the deploy script

## Release ID

`2026-10-04-c589-worker-job-set-derived`

## Status

`candidate`

## Plain-English Summary

The deploy proof for our Azure Container Apps runtime says it checks "all required worker job
images". Which jobs those are was written down twice, in two files that had no connection to each
other. One file, `scripts/deploy/update-worker-jobs.sh`, decides which worker jobs the deploy
actually re-images. The other, `scripts/deploy/check-aca-runtime-invariant.mjs`, carried its own
hand-typed array deciding which worker jobs the proof actually checks. Neither deploy workflow
passes the override flag, so that second array was the whole of the enforcement.

The two lists agreed — because someone had kept them agreeing, not because anything made them
agree. Add a job to the deploy script and the proof would keep reporting PASSED over the old set.
That is the failure mode worth naming: an invariant whose stated scope is wider than what it
enforces reads PASSED in exactly the direction that matters, and the divergence waits to be
discovered by hand instead of failing a check.

After this change there is one list, and it lives in the file the deploy reads. The proof derives
its enforced set from that file's own `WORKER_JOB_NAMES` default, and refuses outright if it cannot
read it — there is deliberately no fallback list, because falling back to a list of our own is the
original defect restated in a form that looks like agreement.

This is the executable half of backlog item C-589. The other half of that item — whether a
particular private operator job is *meant* to track the web image, and so belongs in the enforced
set at all — is an operations scope decision, is explicitly not attempted here, and is unaffected
either way: this change makes the set follow whatever that decision turns out to be.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only deploy-proof and CI tooling.

- **Products (layer 4):** no impact. No product surface, route, component or read path is touched.
- **Canonical model (layer 3):** no impact. No schema, no migration, no tenant data, no projection.
- **Source adapters (layer 2) / client intake (layer 1):** no impact.
- **Platform / release control:** the ACA runtime-invariant proof now derives its worker-job scope
  instead of restating it, and a new blocking CI step proves that derivation on every pull request.
  Deploy behaviour itself is unchanged: `update-worker-jobs.sh` is byte-identical, so the set of
  jobs the deploy re-images is exactly what it was.

## Client Applicability

- All clients: not applicable — no client-visible behaviour changes.
- Specific clients: none.
- Internal only: yes. Deploy proof and CI only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/deploy/worker-job-names.mjs` — new. Parses the `WORKER_JOB_NAMES` default out of the
  deploy script and refuses rather than falling back: no assignment, an empty default, more than
  one live assignment, a missing file, or a token the shell would still expand each raise.
- `scripts/deploy/check-aca-runtime-invariant.mjs` — the hand-typed `DEFAULTS.workerJobNames` array
  is removed. The enforced set is now derived from the deploy script; an explicit
  `--worker-job-names` or `WORKER_JOB_NAMES` still overrides and is labelled `explicit`. Adds
  `--worker-job-source` and a read-only `--print-worker-jobs` mode that resolves the set and exits
  before any `az` or `curl` call. The proof bundle now records `workerJobNamesOrigin` and
  `workerJobSource`, so a reader of a past run can tell which set was enforced.
- `scripts/deploy/worker-job-names.test.mjs` — new, 13 cases.
- `package.json` — new script `check:aca-worker-job-set-derived`.
- `.github/workflows/release-control.yml` — runs that script as a step of
  `Release record and impact note`.

No ACA job, image, traffic weight, environment variable or secret was mutated at any point in this
work, and no migration or tenant data is involved.

## QA / Validation

All commands run in an isolated worktree on `origin/main` `0d7b02c6f7`.

**Clean baseline over the same scope.** `scripts/deploy/` held no test file before this change, so
the baseline for the scope is **0 failing before, 0 failing after**. The new suite is the first
executable coverage this directory has.

**Red first, for the right reason.** With the test file written and no implementation, the suite
failed at import (`worker-job-names.mjs` not found) — 0 of 13 passing. With the parser implemented
but the checker not yet wired, 9 passed and 3 failed: cases 9, 10 and 12, the three that run the
real checker binary. With the checker wired, 13 of 13 pass.

**Necessity proved by mutation, not by reading today's state.** The item is explicit that today's
digests agree by accident, so no mutation below reads live Azure; each one changes a *fixture*
deploy script or the code, and each kills a named case. Restored and re-confirmed green after each.

| # | Mutation | Cases it kills |
|---|---|---|
| M1 | parser returns a literal array instead of parsing | 2, 3, 9 |
| M2 | an absent assignment falls back to a hand-typed list | 4 |
| M3 | the assignment pattern is de-anchored, so a commented example counts as a second one | 7 |
| M4 | several live assignments: silently take the first | 8 |
| M5 | the checker enforces its own hand-typed array again | 9 |
| M6 | an empty default is accepted | 5 |
| M7 | the origin label always reports `derived` | 10 |
| M8 | a token the shell would still expand is accepted as a job name | 13 |

**The wired gate runs and can fail.** `npm run check:aca-worker-job-set-derived` exits 0 on this
branch. With the live deploy script's `WORKER_JOB_NAMES` assignment commented out it exits 1,
naming the file it could not read; restoring the line returns it to exit 0 and
`update-worker-jobs.sh` is byte-identical afterwards. That sequence — 0, then 1, then 0 — is the
evidence that this is a control rather than a marker: a step that cannot fail proves nothing, which
is the defect the surrounding backlog exists against.

**Two corrections on this work's own first draft, recorded rather than quietly fixed**, because an
assertion no mutation can kill is not evidence.

1. The parser first carried an explicit comment-skip, and case 7 was written against it. Deleting
   the skip did **not** turn case 7 red: the `^` anchor in the assignment pattern had already
   rejected every comment line, so the skip was unreachable and the case was pinning something
   other than what it claimed. Established by measurement — the anchored pattern does not match the
   commented line and the unanchored one does. The skip is removed, a comment in its place says why,
   and case 7 now names the anchor, which mutation M3 does kill.
2. Mutation M8 survived the first draft. The unresolved-expansion guard was real but no fixture
   reached it. Case 13 was added for it, and M8 now kills that case.

**Other validation.** `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
exit 0, no diagnostics. `npx eslint` on the three changed scripts — exit 0.
`node scripts/release-check.mjs --base origin/main --head HEAD` — see Audit Evidence.

**End-to-end against live Azure, read-only.** The full checker was then run in its ordinary mode
with Azure reachable and output directed outside the repository — `exit 0`, "ACA runtime invariant
passed", `workerJobNamesOrigin: derived`, and `workerJobSource` naming the deploy script. The web
half and both derived worker jobs resolved to one digest, `sha256:cdc60ad9…a2fbb`, against the sole
100%-traffic revision `ca-abarva-web-lab-eastus--mde09c6b8`. No `az` call in that path mutates
anything — `containerapp show`, `revision show`, `acr manifest show-metadata` and a health GET —
and `git status` was clean afterwards. This is the derived set enforcing the real invariant, not a
resolution stopping short of it.

Note that this live reading is a *later* runtime state than the one the C-589 finding recorded: a
further deploy has landed since, which is exactly why today's agreement is not evidence and why
every necessity case above runs against a fixture instead.

**Not verified, named as not verified.** The derivation has not yet run inside the repo-owned deploy
workflow, because the only way to observe that is to merge and let the workflow run. The script's
behaviour is proved here; its invocation by that workflow on a real deploy is owed.

## Rollout Plan

Merge to `main` via squash. The new CI step begins running on the next pull request. The derived
set takes effect in the deploy proof the next time the repo-owned ACA deploy workflow or the drift
monitor runs `check-aca-runtime-invariant.mjs`. No image build, no migration, no flag, no manual
runbook step is required, and nothing about this change alters which jobs a deploy re-images.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az containerapp` mutation was run, and this change adds no new
  mutator. `update-worker-jobs.sh` — the one sanctioned worker-job mutator — is byte-identical.
- Approved image digest: not applicable; no image is built or promoted by this release.
- ACA runtime invariant: unchanged in substance for the web half. The worker half now derives its
  job set from `scripts/deploy/update-worker-jobs.sh` rather than from a second hand-typed list, so
  the enforced scope cannot drift wider than the deploy's own enforcement without CI failing.
- Worker image invariant: the enforced set is whatever `WORKER_JOB_NAMES` names. On this commit that
  resolves to `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` — the same two the
  removed array named, which is why no enforcement behaviour changes today. What changes is that the
  next edit to that list is picked up instead of ignored.
- ACR build and registry policy: unaffected. This release builds and pushes no image, runs no
  `az acr build`, and prunes nothing. Shared web images are still built only by
  `.github/workflows/aca-main-deploy.yml` with the Buildx GitHub Actions cache against the Premium
  registry `acrabarvalab001`, exactly as before; this change adds no new build path and touches no
  registry retention.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** This release contains a deploy-proof script, its test and a
  release record. There is no product surface in the change to sign in and inspect, so no signed-in
  acceptance is owed and none is claimed.

## Rollback Plan

Revert the squash commit. The change is four files plus a test and this record, with no migration,
no data write and no runtime state, so a revert restores the previous behaviour completely — the
checker returns to its hand-typed array and the CI step disappears. No rollback window or ordering
constraint applies.

## Audit Evidence

- Pull request and its CI run, including the `Release record and impact note` required check, which
  is where the new step runs.
- `node --test scripts/deploy/worker-job-names.test.mjs` — 13 passed, 0 failed.
- `npm run check:aca-worker-job-set-derived` — exit 0; exit 1 with the deploy script's assignment
  removed; exit 0 again on restore.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.
- The proof bundle written by a future deploy run: `runtime-invariant-proof.json` now carries
  `workerJobNamesOrigin` and `workerJobSource`, so which set was enforced on a given run is
  readable after the fact rather than inferred.

## Known Gaps

- **The scope decision in C-589 is untouched and still open.** Whether the private operator job is
  meant to track the web image — and therefore belongs in `WORKER_JOB_NAMES` — is an operations
  decision, is explicitly outside this release, and is not guessed here. This change is correct
  whichever way it goes: it makes the proof follow the deploy script, so answering the question by
  editing that script is enough to make the proof follow suit.
- Until that question is answered, the wording "all required worker job images" in `AGENTS.md`
  still describes a scope wider than the two jobs the deploy governs. This release makes the
  enforced set derived and auditable; it does not rewrite that sentence, because which way to
  rewrite it is the gated half.
- The repo-owned deploy workflow has not yet invoked the derivation on a real deploy. The script
  itself has been run end to end with Azure reachable and passed; what is owed is the workflow-run
  observation, not the script's behaviour. Stated as owed, not as done.
