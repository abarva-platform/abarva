# 2026-09-27-claim-gate-release-file-exemption — Claim gate: a release is not refused by the file half

## Release ID

`2026-09-27-claim-gate-release-file-exemption`

## Status

`candidate`

## Plain-English Summary

The execution register's claim helper runs a two-part gate before it writes anything. The *item*
half asks whether the item is already held by another run. The *file* half asks whether any path
the record names is already held by another run's live claim, and refuses when one is.

For a claim, the file half is the whole point: two agents editing one file is the collision the
control exists to prevent. For a **release** it is the wrong question. A release asserts the work is
finished and its paths are free, so an overlap can only mean a successor has already taken those
paths — which is the normal, desirable case, and exactly the state the release unblocks. The result
was that a colleague claiming your file after your merge blocked the very record that would have
released it.

The workaround available until now was to append the release with no `files:` list at all. That
works and is worse: the register's ownership reader then sees no paths, so nothing records which
files the item held and freed.

`--action abstain` is already exempt from this refusal for the same reason one rung down — the
moment you most need to record the decision is the moment the gate refuses. A release has exactly
that shape, and now behaves the same way.

The exemption is implemented by **not asking** the file half for a release, rather than by ignoring
its answer or by loosening the overlap rule itself. The question the gate is asked is the question
whose answer is wanted, and there stays one reader of one grammar. The `files:` list still reaches
the appended line, which is the half the workaround silently lost. The **item** half is untouched:
releasing an item another identity holds is still refused.

## Layer Impact

Release lane: **`internal-admin`** — AbarVa-only operations tooling, executed by agents and operators
against the execution register. It ships in no client-facing lane.

No product layer changes. This is execution tooling only (`scripts/exec/`). No product surface, no
canonical model, no source adapter, no client intake, and no runtime code path is touched.

## Client Applicability

- All clients: no
- Specific clients: no
- Internal only: yes — agent/operator execution tooling
- Public/demo only: no
- Feature flag: none

## Changes Included

- `scripts/exec/append-claim.mjs` — one named predicate, `askFileHalf`, decides whether `--files` is
  forwarded to the gate. It is false for `--action release`. The predicate governs both the
  forwarding and the advertised-flag check, so a release no longer requires the installed gate to
  advertise a flag the release does not use. Nothing in `fileOverlap` changes, and no gate output is
  reinterpreted.
- `scripts/exec/append-claim.test.mjs` — a new end-to-end case over a fixture register driving the
  REAL gate: six assertions, three of which fail without the change.

## QA / Validation

Baseline and result measured over the same scope, from a worktree cut clean from `origin/main`
`5fc94c5a47ac7827e7e69c9f5e85d27adf25f74e`:

- `node scripts/exec/append-claim.test.mjs` — **3 failing before, 0 after** (82 passed / 3 failed →
  85 passed / 0 failed). The before number was measured by restoring the `origin/main` module under
  the new suite, not by reasoning about it.
- **The defect was reproduced before it was fixed**, against the real gate on a fixture register
  shaped like the live one: item verdict `already-yours` (not refusing), `REFUSED BY THE FILE
  HALF — 1 of 1 requested path(s)`, nothing appended. After the change the same invocation appends
  and the line carries its `files:` list.
- **Four mutations, each verified to change behaviour and each caught.**
  - Dropping the exemption (`askFileHalf = files !== undefined`) — 2 failed, both the new
    acceptance assertions.
  - Exempting `claim` as well — 6 failed, including four pre-existing T-707 cases and the new
    guardrail, so the exemption is provably scoped to releases and over-exempting is detected.
  - Implementing it over-broadly, as "ignore a refusal when the action is a release" — 2 failed,
    including the new case asserting the item half still refuses another identity's item. This is
    the mutation that distinguishes exempting a half from exempting the gate.
  - Reverting only the advertised-flag half — 1 failed, exactly the one case that pins that
    consequence, so no added assertion is redundant with another.
- **Both guardrails named in the item are asserted in the new case itself**, not only elsewhere: a
  CLAIM naming a held path is still refused and still names the path and the holder (T-707), and a
  release of an item another identity holds is still refused.
- Sibling toolchain contracts, all 14 run: 12 exit 0 (`register-time-authority` 322/0,
  `build-execution-queue` 207/0, `signed-in-proof-reconcile` 127/0, `build-source-board` 99/0,
  `fossil-claims` 91/0, `deploy-proof-resolver` 44/0, `worktree-sweep-hazard` 38/0, `cli-entry`
  34/0, `queue-provenance` 30/0, `worktree-retention` 27/0, `register-citation-check` 22/0,
  `toolchain-manifest` 17/0). `id-collision` and `register-merge-coverage` each fail one case, and
  both read the live operator documents that no CI runner has; neither names a file this change
  touches, and the same two failed identically on the `origin/main` checkout — **2 failing before,
  2 after**.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — exit 0, judged on the
  exit code.
- `npx eslint` over both changed files — exit 0.
- Nothing was weakened, de-required, skipped, quarantined or deleted.

## Rollout Plan

Merge to `main`. No runtime rollout: these files are developer/operator tooling executed by the
`Execution queue toolchain` workflow and by agents on the operator host. No image, no container app,
no migration, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. This release changes no runtime template, image, flag, env var,
  scale or secret.
- Approved image digest: not applicable — no runtime image change is requested or implied.
- ACA runtime invariant: unaffected. The post-merge deploy run is the pipeline's own; this change
  cannot alter the served digest.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no** — no product surface changes, and no signed-in behaviour is
  claimed by this record.

## Rollback Plan

Revert the single commit. The change is two files with no state, no schema and no generated
artifact, so a revert restores the previous behaviour immediately. The register is append-only and
is never rewritten by this code path, so nothing can be left inconsistent; the worst a revert
restores is the refusal this change removes, and the `--files`-less workaround still exists.

## Known Gaps

- **Only the release action is exempted.** A claim behaves exactly as before, which is the intent,
  but it means the wider question — whether the file half should read a *successor's* hold
  differently from a *rival's* — is untouched and belongs to its own item.
- **The queue still does not publish which files a live claim holds**, so an agent still discovers a
  file-half refusal only after picking a row and re-verifying it. That is `C-566`, filed separately
  and not addressed here.
- **Records already appended with the workaround are not repaired.** Release lines written with no
  `files:` list remain in the register with no record of the paths they freed; the register is
  audit history and is not rewritten. Only future releases carry the list.
- **No signed-in proof is owed or claimed.** This release changes no product surface.

## Audit Evidence

- PR for this branch, carrying the before/after failure counts and all four mutation results.
- `Execution queue toolchain` CI job running `scripts/exec/append-claim.test.mjs` on a runner with
  no operator documents — every case is over a temp-directory fixture, so it is not corpus-dependent.
- The register line appended by this run when it releases `C-564`, which is itself an instance of
  the behaviour: it carries a `files:` list.
