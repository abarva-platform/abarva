# 2026-09-23-t748-append-claim-unknown-flag-refusal — an unrecognised CLI flag is refused, not ignored

## Release ID

`2026-09-23-t748-append-claim-unknown-flag-refusal`

## Status

`candidate`

## Plain-English Summary

The execution-tooling CLIs under `scripts/exec/` read their own command-line
arguments by hand. Node ignores an argument it does not recognise, so until this
change every one of those readers accepted any flag it had never heard of,
silently, and carried on with its default behaviour.

That matters most in `append-claim.mjs`, the one path the work-claiming protocol
sanctions precisely so a record cannot be got wrong by hand. `--release` is not
a flag there — the spelling is `--action release` — but it was accepted, and the
tool wrote a line saying work had been *claimed*. Anyone reading that register
sees a live hold on those files for the next three hours, so a second worker is
refused files whose owner believed they had handed them back. Measured on `main`
`7e74fe7a0`, three real mistyped invocations each produced a normal claim line
and exit 0, with no warning of any kind.

This change makes an argument the tool does not read into a refusal: it names
the flag, exits non-zero, and writes nothing — the same fail-closed posture the
surrounding checks already take. The recognition rule lives in one shared,
tested helper so the other readers can adopt it, and a new directory-wide check
records, by running each CLI, which ones still swallow an unknown argument. That
list is an explicit exemption that retires itself: a tool repaired later fails
the check until it is removed from the list.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only operator and CI tooling; no
client, demo or product surface ships in it, and it is not feature-gated because
there is no runtime behaviour to gate.

- **Platform tooling / control lane only.** `scripts/exec/` is operator and CI
  tooling for tracking who is working on what. No product surface, no tenant
  data, no data-plane adapter, no canonical model object, no model prompt.
- **No layer of the enterprise information architecture is touched.** Layers 1-4
  are unchanged; nothing here reads or writes a tenant input, a canonical
  record, or a product projection.

## Client Applicability

- All clients: none — no client-visible behaviour changes.
- Specific clients: none.
- Internal only: yes. Operator tooling and the CI job that tests it.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/cli-entry.mjs` — new exported `unknownFlags(argv, spec)`. Pure;
  it classifies and returns, and the caller decides what a refusal costs. Value
  flags consume the following token, so a value that looks like a flag
  (`--gate-arg --github`) and free text that begins with `--` both behave. A
  `--name=value` spelling is reported, because none of these readers parses `=`.
- `scripts/exec/append-claim.mjs` — declares `FLAG_SPEC` (its own vocabulary,
  exported) and refuses an unrecognised flag as the first act of `main`, before
  any read and long before any write. Exit 2, the code it already uses for a
  usage error. `USAGE` is now exported so a test can pin it to the spec.
- `scripts/exec/append-claim.test.mjs` — seven behavioural cases against the
  real CLI over a fixture register, compared by digest.
- `scripts/exec/cli-entry.test.mjs` — the shared expectation for `unknownFlags`,
  plus a directory-driven census of every CLI in `scripts/exec/` with a
  self-retiring exemption list.
- Documentation record: this file.

No workflow change was needed: `.github/workflows/execution-queue-toolchain.yml`
already runs both suites.

## QA / Validation

Measured in the branch worktree over the same scope, before and after.

| check | before | after |
|---|---|---|
| `node scripts/exec/append-claim.test.mjs` | 55 passed, **6 failed** | **61 passed, 0 failed** |
| `node scripts/exec/cli-entry.test.mjs` | 19 passed, 0 failed (15 new cases did not exist) | **34 passed, 0 failed** |

The six failures before the fix are the three real invocations, each asserted
twice: refused-and-nothing-appended, and the flag named in the refusal. The
register was compared by sha256 digest, not by reading its tail.

Deliberate mutations, each reverted immediately afterwards. Every one was
caught; the two suites catch different things, which is the point of having
both.

| # | mutation | append-claim suite | cli-entry suite |
|---|---|---|---|
| M1 | the refusal is present but never fires | 6 failed | 0 failed |
| M2 | it warns instead of refusing, and still appends | 6 failed | 0 failed |
| M3 | a value flag stops consuming its value | 2 failed | 2 failed |
| M4 | boolean flags fall through as unrecognised | 2 failed | 8 failed |
| M5 | nothing is ever reported | 6 failed | 5 failed |
| M6 | the repair is removed, census view | 6 failed | 2 failed |
| M7 | a repaired CLI is left on the exemption list | — | 1 failed |
| M8 | a still-swallowing CLI is dropped from the list | — | 1 failed |

Other validation:

- Whole `scripts/exec` suite set on the branch: `build-execution-queue` 171/0,
  `build-source-board` 35/0, `register-time-authority` 290/0,
  `queue-provenance` 30/0, `toolchain-manifest` 17/0, `id-collision` 70/0,
  `fossil-claims` 78/0, `append-claim` 61/0, `cli-entry` 34/0.
- `toolchain-manifest.test.mjs` caught a first draft of the census that was
  built from a hand-written list of CLIs and therefore could not see a module
  added after it was written. The census was rewritten to be driven by the
  directory, with the declared invocations demoted to an optimisation for CLIs
  whose no-argument run would be slow or uninteresting. That is the finding
  worth recording: the control that exists to catch a hand-written fixture list
  caught one in the same change that was adding a control.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` —
  exit 0.
- `npx eslint` over the four changed files — exit 0.

## Rollout Plan

Merge to `main` via squash. There is no runtime rollout: nothing here is
imported by the application, shipped in the container image, or reachable from
a route. The repo-owned deploy workflow will build and deploy `main` as usual
because it deploys every merge, not because this change requires it.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged
  and not invoked by hand.
- Shared runtime mutators: none. No `az` command, no revision, no traffic.
- Approved image digest: not applicable — no image contents change.
- ACA runtime invariant: unaffected by this change; whatever the merge-triggered
  deploy produces is proven in the register by the usual per-item line.
- Worker image invariant: unaffected.
- Feature/env flag update path: none.
- Live signed-in proof required: **no.** Nothing here is reachable from a signed
  in session. The proof that matters is the behavioural one above.

## Rollback Plan

Revert the single squash commit. The change is four files in `scripts/exec/`
with no migration, no stored state and no consumer outside that directory, so a
revert restores the previous behaviour exactly — including, deliberately, the
silent acceptance this removed.

Operationally, the failure mode of the new refusal is that a correct invocation
is rejected. The negative controls exist against that: `--action release`,
`--action abstain`, `--gate-arg --github`, a message that begins with `--`, and
the full legitimate invocation are each asserted to still work.

## Audit Evidence

- PR for this branch, and its `execution-queue-toolchain` CI job, which runs
  both suites.
- The before/after and mutation tables above, each reproducible with the
  commands named.
- `scripts/exec/cli-entry.test.mjs` — the census output names, on every run,
  which CLIs in the directory still swallow an unknown argument.

## Known Gaps

- **Eight of the nine CLIs in `scripts/exec/` still accept an unrecognised flag
  silently.** Measured by execution, not assumed: `build-execution-queue.mjs`,
  `build-source-board.mjs`, `fossil-claims.mjs`, `id-collision.mjs`,
  `queue-provenance.mjs`, `register-time-authority.mjs`,
  `toolchain-manifest.mjs`, `worktree-retention.mjs`. Only `append-claim.mjs` is
  repaired here, because it is the one with a measured cost and because eight
  files of mechanical change in one pull request is the large-diff-nobody-reads
  shape this backlog exists against. The residual is not left in prose: it is
  the exemption list in the census, which fails the moment the list and the
  measurement disagree in either direction.
- `register-time-authority.mjs` is among them, and it is the gate
  `append-claim.mjs` spawns. `append-claim.mjs` already defends that one
  boundary separately, by refusing to forward a `--gate-arg` the installed gate
  does not advertise in its own usage text; that defence is unchanged and still
  tested.
- Single-dash flags (`-x`) are not classified. None of these CLIs defines one,
  and treating a bare `-1` as a flag would misread a negative value.
