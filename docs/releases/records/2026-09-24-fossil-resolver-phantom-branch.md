# 2026-09-24-fossil-resolver-phantom-branch — a repository path read as a branch name

## Release ID

`2026-09-24-fossil-resolver-phantom-branch`

## Status

`candidate`

## Plain-English Summary

The execution toolchain includes a resolver that answers, for a work claim nobody has
touched in a while, whether the branch it named is gone and its pull requests are settled.
It extracts the branch name from the claim's own text. When the claim does not declare a
branch in its own field, the extractor falls back to looking for a token that starts with
one of three prefixes — `codex/`, `claude/` or `exec/`.

The execution tooling itself lives in a directory named `exec`. So a claim that merely
*listed the files it intended to edit* — paths like `scripts/exec/<something>.mjs` — handed
the extractor the tail of each path, `exec/<something>.mjs`, and it took that for a branch
name. The function's own documentation asserted this could not happen, on the grounds that
nothing in it matches a bare `a/b` shape; the assertion was true only for paths whose first
segment is not one of those three prefixes, and the repository's own tooling directory is.

Two consequences, both in the quiet direction:

- The work-queue generator imports this extractor to decide that an item is "in flight".
  A claim that declared **no branch at all** could therefore be treated as active work and
  suppressed from the claimable queue indefinitely. That hides work rather than duplicating
  it, which is the failure direction that is hardest to notice.
- The resolver probes the first extracted name. Finding no such branch on the remote and no
  pull request from it, it reported the claim `abandoned` — a verdict the resolver defines as
  a *completed observation* — with a reason quoting a source file as "gone from origin".
  `abandoned` is the verdict that authorises withdrawing a claim's in-flight signal, so it can
  free an item another agent is holding. The resolver's own contract says anything that is not
  a completed observation must be `unknown`, and reading a filename is not one.

The repair is a left boundary on the fallback's pattern, so the prefix has to begin a token
rather than sit anywhere inside a longer path. A word boundary was not enough: it sits
happily between `scripts/` and `exec/`.

This change also adds the proof the originating item asked for by name and which nothing had
delivered: a replay of the four real historical claims that motivated the resolver, read from
the live operator register rather than from invented fixtures.

## Layer Impact

Release lane: **`internal-admin`**. This is AbarVa-only operator tooling; no client, no
product surface and no data plane is in scope.

- **Layer 4 (products):** none. Nothing under `src/` imports `scripts/exec/*`; no route,
  component, prompt, read model or tenant record is touched.
- **Control/tooling (not a data-operating-model layer):** the execution-queue generator and
  the fossil-claim resolver share this one extractor, so both readers change together. That
  sharing is deliberate in the module and is why the fix is in the extractor rather than in
  either caller.

## Client Applicability

- All clients: no
- Specific clients: none
- Internal only: **yes** — operator execution tooling only
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/fossil-claims.mjs` — a left boundary on the in-flight-token fallback, and a
  correction to the doc comment whose stated rule was false.
- `scripts/exec/fossil-claims.test.mjs` — seven new behavioural cases: the path shape the old
  pattern could not distinguish from a branch, both directions of the resolver's response to
  it, two guardrails an over-broad repair would break, and a four-case replay of the real
  historical claims against the live register.

No migration, no route, no workflow, no dependency, no generated artifact is committed.
`build-execution-queue.mjs` is deliberately **not** edited: its own bytes are the
queue-provenance stamp, and moving that hash would make every concurrently running agent's
generated queue stop matching the generator beside it and refuse their claims.

## QA / Validation

Clean baseline taken on `origin/main` `264f69622` before any edit, over the same scope.

| suite | before | after |
|---|---|---|
| `scripts/exec/fossil-claims.test.mjs` | 80 passed, 0 failed | **91 passed, 0 failed** |
| `scripts/exec/build-execution-queue.test.mjs` | 177 passed, 0 failed | 177 passed, 0 failed |
| `scripts/exec/register-time-authority.test.mjs` | 290 passed, 0 failed | 290 passed, 0 failed |
| `scripts/exec/append-claim.test.mjs` | 61 passed, 0 failed | 61 passed, 0 failed |
| `build-source-board`, `queue-provenance`, `cli-entry`, `id-collision`, `register-citation-check`, `toolchain-manifest`, `worktree-retention` | 0 failed | 0 failed |

**Red first.** The three new cases that carry the fix failed on unfixed code: `88 passed, 3
failed`. The failure output is the defect verbatim — the extractor returning two source-file
paths as branches, the resolver returning `abandoned` about one of them, and the resolver
printing a ready-to-run command that would have withdrawn that claim's in-flight signal.

**Five mutations, five caught. Each was verified to change the function's answer before the
suite was run, so that none of them is a no-op reading as a coverage gap.**

| mutation | observed behaviour change | result |
|---|---|---|
| left boundary reverted to a word boundary | path tail returned as a branch again | 3 failed |
| boundary over-tightened to line start | the ordinary prose fallback returns nothing | 3 failed |
| the `exec` prefix dropped from the alternation | a genuine `exec/…` branch no longer found | 1 failed |
| `classify` returns `abandoned` instead of `unknown` for a missing branch | fail-closed contract inverted | 7 failed |
| the subject grammar re-required the stamp at line start | one real claim stops resolving | 4 failed, **three of them in the new live replay** |

The last one matters beyond its count: the replay of real register lines caught a regression
in a grammar that every invented fixture in the suite would have passed, which is the reason
the originating item named real ids rather than fixture ones.

**Effect on the live rendered queue: none, and it was measured rather than assumed.** The
generator was run twice over one frozen copy of the operator register and backlog — once with
the fix and once with it reverted — and the two rendered queues are byte-identical apart from
their generation timestamp. Same claimable count, same in-flight bucket, same suppressed-
candidate line. Over that register the fix drops 73 occurrences of 9 distinct tokens, every
one a file under `scripts/exec/`, and adds **zero** tokens; 33 claim records lose a phantom
branch and each has an independent reason to sit where it sits. So this is a latent defect
repaired before it cost anything, and the honest summary is that nothing moved today.

Gates: `npx tsc --noEmit --pretty false` with `tsconfig.tsbuildinfo` removed → **exit 0, 0
errors**. Scoped `npx eslint` on both changed files → exit 0. Note for the record that
`scripts/exec/*.mjs` is outside the typecheck's own include set — proven with
`tsc --listFilesOnly`, which reports 0 files from that directory — so the typecheck confirms
the repository is clean and cannot, by construction, observe this diff. The behavioural
suites are the authority for it.

## Rollout Plan

Merge to `main`. No runtime rollout: these are operator CLI scripts and a test file, run by
hand and in the execution-queue toolchain CI job. Nothing under `src/` imports them, so no
image, revision, flag or environment variable changes.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified. It will run
  on merge as it does for any commit to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: not applicable — no runtime image behaviour changes.
- ACA runtime invariant: to be confirmed from the merge-keyed deploy run's own
  `runtime-invariant-proof.json` plus an independent read-only Azure read, and recorded in the
  claim register.
- Worker image invariant: unchanged by this diff.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing here is reachable from a product route or
  imported by the application, so a signed-in lane would be a proof of something this change
  does not touch.

## Rollback Plan

Revert the single commit. There is no state to unwind: no migration, no generated artifact
committed, no runtime configuration. The extractor's previous behaviour returns immediately,
including its defect.

## Audit Evidence

- The pull request for this record, its checks, and the squash SHA.
- The red-first output and the five mutation runs, quoted in the PR body.
- The two byte-identical rendered queues from the frozen-register A/B, and the token-delta
  measurement behind them.
- The execution-queue toolchain CI job, which runs the changed suite on a runner.

## Known Gaps

- **The extractor's own ambiguity is not resolved, deliberately.** A token that genuinely
  begins with a branch prefix and ends in a file extension — `codex/x.mjs` — is still read as
  a branch, and a case now pins that on purpose. It is indistinguishable from a branch of that
  name, and guessing by file extension would be the over-broad repair the mutation table
  above rejects.
- **`resolve` still probes only the first extracted branch.** 28 claim records on the live
  register name more than one; after this fix every one of them names its own declared branch
  first, so the selection is correct today by the register's text order rather than by rule. A
  claim that narrated another agent's branch *before* declaring its own would still be judged
  on somebody else's work. Measured on the live register: 0 records currently do that. Not
  filed as its own item — the `T-500`–`T-599` band this agent files from is exhausted at 0 of
  100 free, an open recommendation to extend the range already exists, and this record is
  therefore where the finding lives.
- The two shared grammars remain duplicated between the generator and this resolver, which is
  a separately filed item and is not touched here for the queue-provenance reason stated above.
