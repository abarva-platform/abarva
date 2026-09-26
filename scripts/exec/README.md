# Execution Board Toolchain

This directory owns the code that derives the Source execution board and claimable queue. The repository reviews and tests the generators; it does not own private operator state.

## Boundaries

- Repo-owned: `build-source-board.mjs`, `build-execution-queue.mjs`, their behavioral suite, and `source-stage-map.json`.
- Operator-owned: the execution board, backlog, append-only claims log, and scope document supplied through `--operator-root` or `SOURCE_EXECUTION_HOME`.
- Generated, never committed: `source-board.html`, `source-board-summary.json`, `EXECUTION_QUEUE.md`, and `id-collision-history.json`.

The structure map contains no status. The board generator rejects status-like keys, and the queue refuses a summary when any stamped source has changed.

## Run

From the repository root:

```bash
SOURCE_EXECUTION_HOME="$HOME/Downloads" \
  node scripts/exec/build-source-board.mjs --json

SOURCE_EXECUTION_HOME="$HOME/Downloads" \
  node scripts/exec/build-execution-queue.mjs
```

## Superseded copies in the operator root

Before this toolchain moved here, `build-source-board.mjs`, `build-execution-queue.mjs`
and `source-stage-map.json` lived in the operator directory. Those files were not deleted
by the move and **they still run**.

That is a quiet hazard, and it has already cost time:

- The local generator has **drifted** from this one. Running it produces a different board
  from the same inputs, with no warning that a stale reader produced it.
- The structure map is now repo-owned. Adding an id to the copy in the operator root is a
  **silent no-op** — the generator never reads that file, so the item stays invisible to the
  queue and the agent that mapped it has no way to tell. An id added there is not mapped.

So: run the copies in this directory, and map ids in `scripts/exec/source-stage-map.json`,
which means mapping is now a pull request rather than a local edit. Delete or rename the
copies in the operator root when convenient; nothing here depends on them.

That last sentence was, for a day, the whole of the defence — and it is an
instruction, which is the shape this directory exists against. What closes it is
below.

## Which generator wrote the queue you took your item from

`build-execution-queue.mjs` writes the sha256 of its **own file**, read at run
time, into the queue it generates:

```text
<!-- queue-provenance v1 sha256=<64 hex> script=<the generator that wrote it> -->
```

A superseded copy cannot produce that stamp without being byte-identical to the
repo-owned generator, and then it is not superseded. **Hash, not path**, for
T-711's reason: the same generator legitimately runs from a worktree, from a
fixture directory a suite copied it into, and from a CI checkout, and a path
comparison would refuse all three.

```bash
node scripts/exec/queue-provenance.mjs --register ~/Downloads/EXECUTION_CLAIMS.md
node scripts/exec/queue-provenance.mjs --queue <file> --json
```

Exit `0` only for `repo_owned`. Every other verdict — `superseded`, `unstamped`,
`absent`, `unreadable`, `generator_missing` — fails closed, **including the ones
that mean "could not tell"**, because a guard whose unknown case passes is
opt-in and the first file to reach it is by definition the one that predates it.
Every refusal prints the one-line regenerate command, because a control this
cheap to satisfy should not send anyone looking it up.

**This one is wired, not merely available.** `append-claim.mjs` runs it before
the ownership gate and refuses a claim whose queue does not match — T-706 and
T-711 both shipped correct controls that nothing invoked, and from outside the
register that is the same as not having them.

**Only a claim is gated.** A release and an abstention take nothing, and the
moment a queue is stale is the moment a holder most needs to hand work back;
refusing that would strand a live claim behind a regeneration and push the
correction into a hand-written line. Same asymmetry as an abstention past a
refused pre-claim gate.

Why it exists, measured rather than argued (item T-720). On 2026-09-23 the live
queue had been written by the superseded pair. On byte-identical inputs that pair
offered **61** claimable rows where this one offers **1**, reported *"None held.
Every claim in the log is released or expired"* while **three** claims were live,
and counted **110** rows whose only remaining work needs an operator as
claimable. The regenerate block it printed names the generators by bare
filename, which resolves back to the superseded copies — so following the
artifact's own instructions reproduces the fault. A run that did exactly that
re-verified three long-closed items in lane order before noticing, and they were
the same three ids T-711 had already recorded as its evidence.

An explicit `--operator-root <dir>` takes precedence over the environment variable. Use `--map <file>` only for a controlled alternate structure map, such as the synthetic CI fixture.

## Appending a claim — run the helper, do not hand-write the line

`register-time-authority.mjs --preclaim` (item T-706) answers whether a run may
claim an item, and exits non-zero when it may not. For its first day it was
**available and invoked by nobody**: the claim step was an agent choosing to run
a control. From outside the register that is indistinguishable from not having
the control, and it is the same shape as the gate that proved a control existed
by finding its name in a file.

So the claim step is now the helper, and it is the only sanctioned way to append:

```bash
node scripts/exec/append-claim.mjs \
  --file ~/Downloads/EXECUTION_CLAIMS.md \
  --item T-708 --identity '<base-agent>#<run-id>' \
  --branch exec/t-708-claim-append-gate \
  --files 'scripts/exec/append-claim.mjs,scripts/exec/append-claim.test.mjs' \
  --message 'what is being taken and why'
```

The gate decides and **a refusal means nothing is written** — not a warning, not
a line with a caveat. The helper adds no rules of its own: the verdict is the
gate's exit status, so a rule that lands in the gate governs the claim step the
day it merges.

Three behaviours are worth knowing before you reach for `--force` (there isn't
one):

- **It fails closed.** A gate it cannot find, cannot spawn, or whose exit code
  it does not interpret refuses the claim. Appending because the check errored
  is, from the register's side, the same as never running it.
- **It refuses a check it cannot prove ran.** Node ignores flags it does not
  recognise, so asking a gate for a check it does not implement is a silent
  pass. Any forwarded argument — `--files`, anything under `--gate-arg` — must
  appear in the installed gate's own usage text, or the claim stops. This is how
  `--files` behaves correctly both before and after the file-overlap half lands.
- **The stamp is read at the instant of writing** (T-457), after the gate has
  run, never earlier in the run where it becomes an estimate.

`--dry-run` prints the record without writing it. Exit codes: `0` appended,
`1` the gate refused, `2` usage — including an unadvertised flag, an empty
`--message` or an empty `--files` — and `3` the gate could not be run.

Nothing here restamps or rewrites an existing line. The register is audit
history; a correction is another line.

New claim records should use the canonical, non-bulleted form:

```text
YYYY-MM-DDTHH:MMZ <agent> item <id> <branch> — claimed
```

The queue remains backward-compatible with the established timestamped `item`, `CLAIM`, and `CLAIMED` forms already present in the append-only claim log. Text above the `## Claim log` marker is never authoritative.

## Worktree retention — check before you create one, not after ENOSPC

"Remove it when the item is merged" has been in the operator task file since
18 Sep. Two runs of that same task did not follow it. At `2026-09-23T03:57Z` a
run could not start at all: 580 MiB free of 926 GiB and `git worktree add`
dying `ENOSPC` mid-checkout, with **798** registered worktrees on disk and
`git worktree prune` removing **none** of them, because every one still exists.
A rule nothing can fail is the shape this directory exists against, so the rule
now has a control.

```bash
node scripts/exec/worktree-retention.mjs --claims ~/Downloads/EXECUTION_CLAIMS.md
node scripts/exec/worktree-retention.mjs --check --free-floor-gib 10
node scripts/exec/worktree-retention.mjs --emit-removals /tmp/removals.sh
```

**It never removes anything**, and that is deliberate rather than cautious.
Removing another agent's checkout is the destructive version of the collision
the claim protocol exists to prevent, so the burden is on proof and the
asymmetry is explicit:

> a worktree wrongly called `keep` costs one item's disk.
> a worktree wrongly called `removable` costs someone's uncommitted work.

`removable` therefore needs **three independent proofs**, and anything short of
all three is `unknown`, never `removable`:

1. **the branch is merged by PR `mergedAt`** — not by ancestry. A squash merge
   is not an ancestor of the branch it closed, so `merge-base --is-ancestor`
   would call every squash-merged branch unmerged and leave the disk full.
2. **`git status --porcelain` is empty.** Read with `--no-optional-locks`, so
   measuring a checkout never takes the index lock of the run working in it.
3. **no live claim names the branch or the path.** A claim states its branch in
   prose and lists source files, never its checkout — so this reads the whole
   line, not the `files:` list. A claim stamped *ahead* of the clock still
   holds: T-457 measured six such lines in one day, they are real claims with a
   wrong stamp, and skipping them would free exactly the checkouts in use.

`--check` exits `1` when free space is below the floor, `0` above it, and `2`
when free space cannot be read — failing closed, since a control that cannot
measure its subject must not report success. The floor alone decides it: a disk
that cannot hold the next checkout is the hazard, and `removable: 0` below the
floor is the case that needs a person, not the case that needs silence.

**Where the wiring stops, stated rather than implied.** CI runs the behavioural
suite; it cannot run `--check`, because a GitHub runner's free space and
worktree list are not the operator's, and a gate asserting on a subject it
cannot see is the unfailable kind. So `--check` is an operator control in the
shape of `--preclaim`: available, and only as good as its being invoked.

## Is this directory swept by something else? Ask before `git worktree add`

The retention control above answers "may I remove this worktree". This answers
the question underneath it, which nobody had asked: **is the directory the
protocol sends every agent to being swept by something that never heard of the
claim protocol?**

At `2026-09-26T00:19Z` a full checkout created per the operator task file's own
first instruction vanished mid-session between two commands about 90 seconds
apart, taking uncommitted work with it; the next command died `uv_cwd ENOENT`. A
second, independent run of the same task lost a worktree in the same window.
Nothing in the register, the pulse file or the task instructions said who sweeps,
on what trigger, or with what age bound.

```bash
node scripts/exec/worktree-sweep-hazard.mjs --check-root /tmp/exec-x
node scripts/exec/worktree-sweep-hazard.mjs --check-root "$PWD" --json
```

`0` no declared sweeper reaches it, `1` swept, `2` unknown or misused. Run it on
the path you are about to pass to `git worktree add`, not after.

**It reads the host's declarations; it does not hold an opinion about `/tmp`.**
A gate that said "/tmp is unsafe" in prose would be the shape this directory
exists against — it could not notice the rule changing, it could not be wrong in
a way anyone sees, and it would say nothing at all about a root nobody had
thought of. So it parses launchd job definitions and the scripts they run, and
on a macOS host today that reading finds, unprompted:

```
SWEPT /private/tmp/exec-item
  com.apple.tmp_cleaner
  /System/Library/LaunchDaemons/com.apple.tmp_cleaner.plist
  StartCalendarInterval Hour 0   ->  /usr/libexec/tmp_cleaner
  declares /tmp, age bound 3 day(s), on atime AND mtime AND ctime
```

That job consults no branch, no index and no claim. It is a genuine, scheduled
hazard to any worktree that outlives an item by three days, and it is **not**
the actor that removed the checkout at 00:19Z — see the release record for what
the evidence does and does not settle.

Three inversions it refuses, each held down by a case:

1. **`not_swept` is not `safe`.** It means no *declared* sweeper reaches the
   root, and it reports how many jobs on the host declare nothing this can read
   — 421 of them on the machine above — rather than rounding that to zero.
2. **An unreadable host is `unknown`, never `not_swept`.** Refusing costs one
   rerun; a false `not_swept` costs the work.
3. **The age bound is WHEN, not WHETHER.** Every worktree is younger than the
   bound at the moment it is created, and an item that runs long carries it past
   the bound with no second warning. A verdict that consulted the candidate's
   own age would report safe at exactly the moment an agent asks.

Eight mutations, eight caught — and two of them survived their first fixture,
which is the part worth keeping:

| mutation | first fixture | why it passed anyway |
|---|---|---|
| `containsPath` → bare `startsWith` | `/tmpfoo/exec-x` vs a `/tmp` sweeper | after symlink resolution the sweeper's root is `/private/tmp` and `/tmpfoo` resolves to itself, so **no prefix relationship held in either form** — the negative control never reached the boundary. The case now builds two real sibling directories and asserts the textual prefix holds *before* reading the verdict. |
| shebang bound dropped | any | it changed no verdict, because a Mach-O binary contains no shell assignment. It is a blast-radius bound, not a correctness guard, and it had nothing asserting it. Case 20 now pins what it buys: a program that is not a script declares nothing **even when its bytes carry the declaration text**. |

## Was I run, or imported? One predicate, not four

Every script here is a module with a CLI attached, so each must answer that
question. Four of them answered it four different ways and only one was right:

| script | guard | verdict |
|---|---|---|
| `append-claim.mjs` | `fs.realpathSync` both sides | correct |
| `queue-provenance.mjs` | `path.resolve` both sides | **broken** |
| `worktree-retention.mjs` | `import.meta.url === \`file://${process.argv[1]}\`` | **broken** |
| `register-time-authority.mjs` | `argv[1].endsWith("<name>.mjs")` | loose |

`path.resolve` normalises a path; it does **not** follow symlinks. On macOS
`/tmp` is a symlink to `/private/tmp`, and `import.meta.url` is always the
realpath while `process.argv[1]` is the path as typed. So both broken guards
answered "imported", did nothing, and **exited 0** whenever the script was
invoked through `/tmp` — and the operator task file instructs agents to work in
`/tmp/exec-<item>-<timestamp>`, which makes the broken path the likely one.

Measured on 2026-09-23, both through a `/tmp` path:

```
node <dir>/queue-provenance.mjs --register <register>          -> no output, exit 0
node <dir>/worktree-retention.mjs --check --free-floor-gib 9999 -> no output, exit 0
```

The second is the one that matters. That control's whole contract is to exit `1`
below the free-space floor, and it had shipped earlier the same day *because* a
run died `ENOSPC`. A control that exits 0 having done nothing is the shape this
directory exists against, reached from the quietest direction available.

So `cli-entry.mjs` holds one predicate for all of them:

```js
import { isDirectInvocation } from "./cli-entry.mjs";
if (isDirectInvocation(import.meta.url)) main(process.argv.slice(2));
```

It resolves both sides with `fs.realpathSync` and compares **files**, never
composed strings — which also recovers a path containing a space, lost by the
`file://${argv[1]}` form because `import.meta.url` percent-encodes it.

**Its unknown case answers "imported", which inverts this directory's fail-closed
rule on purpose.** Everywhere else an unknown refuses, because refusing costs one
rerun. This is not a gate: it decides whether to *execute* a CLI, and answering
"run" on an unknown would make `import` execute it. `append-claim.mjs` imports
`queue-provenance.mjs` on every claim.

`register-time-authority.mjs` is left as it is. Its suffix match runs correctly
under a symlink, so it is loose rather than broken — it would also run for any
file whose name ends the same way — and it is recorded here rather than changed.
A fifth script should use the predicate rather than invent a fifth answer.

## Verify

```bash
node scripts/exec/build-execution-queue.test.mjs
node scripts/exec/build-source-board.test.mjs
node scripts/exec/register-time-authority.test.mjs
node scripts/exec/append-claim.test.mjs
node scripts/exec/worktree-retention.test.mjs
node scripts/exec/queue-provenance.test.mjs
node scripts/exec/cli-entry.test.mjs
node scripts/exec/toolchain-manifest.test.mjs
node scripts/exec/id-collision.test.mjs
node scripts/exec/fossil-claims.test.mjs
```

The suites run the generators as child processes against synthetic operator documents. CI never reads a local execution backlog.

`build-source-board.test.mjs` owns the board's claim-record boundary. The claim
log is written in three grammars — `<stamp> | <agent> | ...` at minute
precision, the same at seconds precision, and the pipe-less
`<stamp> <agent> item <id> <branch> — claimed` form documented above. A line the
board does not recognise as a record start is appended to the record above it,
which is right for a wrapped continuation and wrong for all three grammars it
used to miss. Both directions are covered, because a boundary that starts a new
record on every line truncates the register just as badly as one that starts too
few.

## Is this id already taken?

```bash
node scripts/exec/id-collision.mjs --operator-root "$HOME/Downloads"
node scripts/exec/id-collision.mjs --operator-root "$HOME/Downloads" --id T-729 --json
```

Two overlapping runs of the same scheduled task both reach for "the next free
number" and both get it. It happened three times in one day, and every time it
was found by a human reading the file or by an unrelated gate refusing an
unrelated append. This reports, for every id the backlog introduces more than
once, both line numbers and both subjects — and, reading the register too,
whether anyone is holding such an id **right now**.

**A detector, not an allocator, and the split is the point.** Allocating ids
safely across runs that overlap is a coordination problem. Noticing that one id
carries two findings is a file read, and the file is already on disk when it
happens.

**It is not a CI gate, deliberately.** Its subject is an operator document that
lives outside this repository, and a control taking its truth from a file the
pull request never saw cannot fail. Only its own behavioural suite runs in CI.
Invoke it the way you invoke `--preclaim`: before you write.

Note what it is NOT a replacement for. `build-source-board.mjs` reports
collisions too, in a different unit and for a different purpose — it decides
whether a mapped id is too ambiguous to promote a stage. It is also blind to
every filing written in the `id | finding | lane | status` convention, and to
every filing under a level-two heading, which between them account for the
three collisions this item was filed about. The two readers share the id
grammar and the claim-record boundary on purpose; if either ever changes, it
changes in both.

**Resolution, when it reports something:** the earlier filing keeps the id and
the later one moves, renumbered by whoever claims it. That is what the register
already did once, by hand.

## The queue says 0 claimable — is the suppression bucket telling the truth?

```bash
node scripts/exec/fossil-claims.mjs --operator-root "$HOME/Downloads"
node scripts/exec/fossil-claims.mjs --operator-root "$HOME/Downloads" --json
```

`build-execution-queue.mjs` calls a claim *work in flight* when its newest line
names a branch or a pull request, and that signal **never expires**. The TTL
cannot replace it — item 24 measured the hold distribution and found it bimodal,
median 21 minutes against a p90 of 362, so no multiple of the TTL separates a
slow claim from an abandoned one. The rendered queue therefore hands the reader
the rest of the job in prose: check the branch and the pull request each claim
names, and retire the dead ones.

Nobody did. Run for all fourteen live candidates on 2026-09-23, **none of them
was in flight**:

| verdict | n | what it means | next move |
|---|---|---|---|
| `fossil` | 4 | branch gone from `origin`, its pull requests all settled | append a release line; do not re-take |
| `abandoned` | 9 | branch gone, and **no pull request ever existed** | no release line — re-verify the item on `main`, then re-take it if undone |
| `alive` | 0 | branch still on `origin`, or a PR still open | leave it alone |
| `unknown` | 1 | the claim names no branch, or a probe did not complete | a human looks |

Four had merged 37 hours earlier. Six of the nine abandoned ones have no
implementation on `main` by path or by symbol, so the bucket had been hiding
genuinely unclaimed work for four days — one item of it in the Claude lane.

**`fossil` and `abandoned` must never collapse into one verdict.** A fossil
verdict authorises a line saying the work is done. Three of the nine abandoned
claims name work that *did* land, from some other branch; three name work that
never landed at all. Saying "finished" about either group without looking would
launder undone work into a closed item, in the silent direction.

**Everything that is not a completed observation is `unknown`, and `unknown`
counts as stale.** No branch named, `git` unreachable, no GitHub credential —
all answer `unknown`, never `fossil`. Exit is 1 whenever any candidate is not
`alive`, because each of those means the bucket's label is wrong.

**It does not touch the generator.** Letting the board read the repository was
the other candidate remedy, and it would make rendering the queue require a
network and a credential. This is a separate CLI, in the shape of
`register-time-authority.mjs --preclaim`: the board stays hermetic, the lookup
becomes executable. The verdict is advisory — it prints the `append-claim.mjs`
invocation for a fossil and refuses to print one for anything else. Appending
the line is still a decision someone takes.
