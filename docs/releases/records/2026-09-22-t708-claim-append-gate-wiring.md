# 2026-09-22-t708-claim-append-gate-wiring — Wire the pre-claim ownership gate into the claim step

## Release ID

`2026-09-22-t708-claim-append-gate-wiring`

## Status

`candidate`

## Plain-English Summary

The execution register is an append-only log in which each automated run records the work item it
is taking. A check already existed that answers whether a run is allowed to take a given item — it
reads the register, works out whether another run already holds that item, and exits with an error
when the answer is no. It was written, tested and demonstrated, and it was correct.

Nothing ever called it. Running it was left to whichever agent was about to write a claim, which
means an agent that did not run it wrote its claim anyway, and the register looked exactly the same
either way. From outside, a control nobody invokes and a control that does not exist are the same
thing. That is the failure mode this directory's tooling exists against: a check that cannot fail
is not a check.

This change adds the missing caller. `scripts/exec/append-claim.mjs` is now the sanctioned way to
append a claim, and its entire contract is that the existing check decides: when the check refuses,
**nothing is written to the file**. It adds no rules of its own — the verdict is taken from the
check's exit status, so any rule added to the check governs the claim step from the day it lands.

Three behaviours are deliberate, because each is a way a wired control quietly stops being one.
It fails closed: a check it cannot find, cannot start, or whose exit status it does not recognise
refuses the claim rather than letting it through. It refuses to ask for a check it cannot prove
ran: an unrecognised command-line flag is silently ignored by the runtime, so requesting a check an
older version of the gate does not implement would otherwise look like a clean pass. And it reads
the clock at the moment it writes, rather than reusing a value read earlier in the run, which an
earlier record in this series established as a measurable source of drift.

No product surface, route, component, schema or tenant data is touched. This is operator tooling.

## Layer Impact

- **Layer 1 (client intake):** none.
- **Layer 2 (source adapters):** none.
- **Layer 3 (canonical model):** none.
- **Layer 4 (products):** none. Nothing under `src/` imports `scripts/exec/*`, so no product surface
  can reach this code.

**Release lane: `internal-admin`.** This is AbarVa-only operational tooling — the claim step that
automated execution runs use when taking work from the register. No client-facing behaviour,
control-plane behaviour, public route or feature-gated capability is involved, so it is neither
`global-control-lane` nor `client-data-lane` nor `public-demo` nor `experimental`.

Platform/tooling only: one new Node script, one new behavioural suite, one CI step, and the README
that governs the directory.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: **yes** — execution tooling used by automated runs and operators.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/exec/append-claim.mjs` — new. The claim-append wiring around the existing pre-claim gate.
- `scripts/exec/append-claim.test.mjs` — new. Behavioural contract, run over fixture registers in a
  temp directory; no case reads an operator file.
- `.github/workflows/execution-queue-toolchain.yml` — adds one step running that suite.
- `scripts/exec/README.md` — documents the helper as the claim step and lists the suite under Verify.
- `docs/releases/records/2026-09-22-t708-claim-append-gate-wiring.md` — this record.

No change to `scripts/exec/register-time-authority.mjs` or its suite: the gate is invoked as a child
process, which is both the correct dependency direction and the reason this change does not collide
with the file-overlap work in flight against that same file.

## QA / Validation

Measured over the same scope — the four suites in `scripts/exec/` — on a worktree cut from
`origin/main` at `2d4b56dd4`.

- **Red first.** The suite was written before the implementation and run against a tree with no
  helper: **6 passed, 13 failed**. The six passes were not evidence of anything: a missing script
  exits non-zero, which happens to satisfy every case asserting a refusal. Recorded because it is
  exactly the sort of accidental green this item is about.
- **Green.** With the helper in place: **26 passed, 0 failed**.
- **Mutation proof — sixteen mutations, sixteen caught.** Each breaks one guard and the suite is
  re-run: gate refusal ignored (3 failures); missing gate waved through (1); unrecognised forwarded
  flag (2); empty `--message` accepted (3); `--dry-run` writes anyway (1); stamp pinned to a
  constant (3); record written as prose the register cannot attribute (3); item id dropped from the
  record (3); gate usage-error read as permission (1); unknown gate exit code fails open (1); a gate
  advertising no `--preclaim` trusted anyway (1); `--strict` dropped before reaching the gate (1);
  `--files` skipping the advertised-flag check (1); `--files` never forwarded (2); empty `--files`
  accepted (1); append replaced by a whole-file rewrite (9).
- **Two mutations survived their first fixture, and the fixtures were repaired rather than the
  mutations dropped.** The missing-gate case originally asserted only that "something refused", and
  a second guard caught it, so deleting the path check changed nothing observable — the case now
  separates an absent gate from a present-but-wrong one. The empty-`--files` case passed against the
  installed gate through the wrong branch entirely (that gate does not advertise `--files`, so the
  flag was refused as unadvertised before emptiness was ever examined); it now runs against a stub
  that advertises the flag, so it reaches the check it was written for.
- **Proved on the real register, read-only.** The helper was pointed at the live operator register
  and asked to claim an item genuinely held by another run. It exited 1 naming the holder, and the
  file's SHA-256 and byte count were identical before and after
  (`eeb2fd70f7d4ceb48d33618b0921a4603327aabb3da8480351749c883bed47e2`, 1286480 bytes). This is the
  acceptance: not that the gate returns the right verdict — that was already proven — but that the
  refusal stopped the write.
- **Sibling suites unchanged over the same scope:** `register-time-authority.test.mjs` 53/0,
  `build-source-board.test.mjs` 21/0, `build-execution-queue.test.mjs` 133/0.
- `npx eslint scripts/exec/append-claim.mjs scripts/exec/append-claim.test.mjs` — exit 0.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, zero
  diagnostics (exit code judged, not grepped).
- `node scripts/release-check.mjs --base origin/main --head HEAD` — see the PR.

## Rollout Plan

Merge to `main` by squash merge through the repo-owned pull request path. There is no runtime
rollout: the file is a developer/operator script, it is not imported by any application code, and
no image, flag, environment variable or migration changes. The deploy workflow will build and ship
`main` as it does for any merge; this change contributes nothing to the running image's behaviour.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unchanged by this release.
- Shared runtime mutators: none. No `az containerapp` command is run by or for this change.
- Approved image digest: not applicable — no runtime behaviour changes.
- ACA runtime invariant: unchanged; the post-merge template/traffic digest check still applies to
  the carrier deploy and will be recorded against it.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: **no**, and the reason is structural rather than scheduling —
  nothing under `src/` imports `scripts/exec/*`, so there is no rendered surface a signed-in session
  could observe differing.

## Rollback Plan

Revert the single squash commit. The helper is additive: the previous claim step (an agent writing
a line by hand) still works, so a revert degrades to the prior behaviour rather than breaking a
path. No migration, no data change, nothing to replay.

## Audit Evidence

- The pull request and its CI run, including the new `Run the claim-append gate wiring contract`
  step in `Execution queue toolchain`.
- The red-first, green and sixteen-mutation figures above, each reproducible with
  `node scripts/exec/append-claim.test.mjs`.
- The real-register refusal: helper exit 1, register digest unchanged, quoted in full above.

## Known Gaps

- **The helper is the sanctioned claim step; it is not yet the only physically possible one.** An
  operator or agent can still append a line to the register by hand, because the register is a plain
  text file on an operator's machine and nothing in this repository can prevent that. This change
  makes the checked path the documented one and gives it a CI-enforced contract; making it the only
  path would mean owning the register itself, which is out of scope here and is a decision for its
  owners rather than something to assume.
- The operator-side artifacts that instruct agents to claim work — the scheduled-task skill and the
  execution prompt — live outside this repository and are updated separately. Until those name the
  helper, an agent following the older wording will still hand-write a line.
- `--files` forwarding is proven in both directions against stubs, but the gate installed on `main`
  at the time of writing does not implement a file-overlap check, so on `main` today a `--files`
  request is refused rather than honoured. That is the intended behaviour for a check that cannot
  run, and it flips to honoured without any change here once such a gate is installed.
