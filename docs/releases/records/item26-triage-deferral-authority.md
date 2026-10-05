# 2026-10-05-item26-triage-deferral-authority — a triage deferral must name an authority that resolves

## Release ID

`2026-10-05-item26-triage-deferral-authority`

## Status

`candidate`

## Plain-English Summary

The repository keeps machine-readable triage records under `docs/architecture/*triage*.json`. Each
row names a test file and a verdict. Seven of those verdict words mean "work is owed on this file",
and the test-coverage census uses them to **hold** that file out of the pool it draws stale-suite
work from, so nobody is handed a file somebody else already judged.

Six of the seven say what is owed — wire it, repair it, rewrite it. One does not:
`already_verdicted_elsewhere` says *somebody else already decided this*. The whole weight of the
hold rests on that claim being true, and nothing in the repository checked it.

Measured on this change's base commit: **39 rows defer this way, holding 36 of the census's 112 held
files**, while the census's `drawableUntriagedUnrunTestFiles` reads `0`. So an automated run that
reaches the stale-suite step of its work ladder is told there is no stale-suite work left, by a
count these rows are the second-largest contributor to.

All 39 resolve today — that was checked file by file for this change, and it is the reason this is a
new control rather than a repair. But it was luck. A referent could be renamed, re-verdicted, or
point at another deferral, and the file would stay held with no verdict anywhere at the end of the
chain and nothing able to say so. This change adds a narrow gate so the next such row fails a check
instead of quietly shrinking the draw.

## Layer Impact

Release lane: `internal-admin`. This is AbarVa-only CI and bookkeeping tooling.

- **Client intake (layer 1):** no impact.
- **Source adapters (layer 2):** no impact.
- **Canonical model (layer 3):** no impact. No tenant data, projection, migration or read model is
  touched.
- **Products (layer 4):** no impact. No product surface, route, component, prompt or read path
  changes. No `src/` file is modified at all.

## Client Applicability

- All clients: no behavioural change.
- Specific clients: none.
- Internal only: yes — one CI gate.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/quality/triage-deferral-authority-check.mjs` — new. Audits every triage row whose verdict
  is `already_verdicted_elsewhere` and whose subject is still in the tree, and refuses five shapes of
  unresolvable authority: a row naming none at all; an `alreadyVerdictedIn` naming a record not in
  the tree; a target record holding no row for that path; a `verdictThere` disagreeing with what the
  target record actually says; and a target row that defers in turn, which is a chain with no verdict
  at the end. Exports `declaredAuthority` and `auditDeferralAuthority`.
- `scripts/quality/triage-deferral-authority-check.test.mjs` — new. 14 cases over throwaway fixture
  roots, plus one case over the real repository.
- `package.json` — adds `check:triage-deferral-authority`, which runs the suite and then the audit,
  placed beside its sibling `check:triage-verdict-discharge`.
- `.github/workflows/release-control.yml` — one step inside the `release-control` job, which produces
  the **required** `Release record and impact note` check. The gate therefore blocks a merge rather
  than merely being available.
- `docs/architecture/ci-gate-registry.json` — one entry, `kind: pr-gate`, recording what the gate
  refuses, which half of the problem it does *not* reach, and why. Four added lines; nothing
  reformatted.

### Two authority shapes, and the one this repository cannot resolve

Both shapes in the records are legitimate and the gate treats them differently, on purpose:

- **Record-shaped** — `alreadyVerdictedIn` + `verdictThere` (+ `owningItemThere`), 10 rows. Fully
  resolved here: the record must exist, hold a row for the *same* path, agree with `verdictThere`,
  and not itself be a deferral.
- **Item-shaped** — `ownerItem` alone, 29 rows, 25 of them on `T-775`. The referent is a backlog
  item, and the backlog is operator-owned and outside this repository (`scripts/exec/README.md`
  draws that boundary). Whether that item is still open is **not decidable from the repo**, so the
  gate requires the field to be present and non-blank and reports
  `authorityResolvedInRepo: false`. It does not imply it verified something it cannot reach.

### Kept disjoint from the sibling gate, by construction

`check:triage-verdict-discharge` (item 26, PR #8993) owns the case where a row's own **subject** is
gone. This gate owns the case where a row's **authority** is gone. A row whose subject is absent is
skipped here outright, so neither gate reports the other's rows as its own. The two sets happen not
to intersect on this base — 0 of the 39 deferrals has an absent subject — and that is exactly the
accident the explicit scope exists to stop a later reader relying on. Case (j) of the suite pins it.

## QA / Validation

Baseline and after, same scope — the new suite plus the gates this change touches. No absolute
repository-wide failure count is quoted.

- **The suite before the implementation existed:** `node --test
  scripts/quality/triage-deferral-authority-check.test.mjs` → module resolution failure, `fail 1`,
  `pass 0`. Written first.
- **After the implementation:** `tests 14 · pass 14 · fail 0`.
- **One of those 14 initially failed for a reason in the test, not the code** — case (g) asserted
  `resolved.length === 0` for a two-record chain fixture, but the chain's far end is a deferral in
  its own right and resolves on its own `ownerItem`. The assertion was corrected to the measured
  behaviour (1 chained violation and 1 pass over the same path) and now pins it, rather than the
  implementation being bent to the assertion.
- **The real repository:** `node scripts/quality/triage-deferral-authority-check.mjs` → exit `0`,
  `39 row(s) defer, 10 to a record that carries the named verdict, 29 to an owner item this
  repository cannot resolve`.
- **`npm run check:triage-deferral-authority`** → suite then audit, both green.

### Breaking the fix deliberately — seven mutations, one per refusal branch

Each mutation was applied to the implementation alone, over the same 14-case suite, and the baseline
was restored and re-run green afterwards (`pass 14 · fail 0`). **No mutation survived.**

| # | Mutation | Killed | By |
|---|---|---|---|
| 1 | a null authority is pushed to `resolved` instead of `unauthorised` | 2 of 14 | (a), (c) |
| 2 | a missing target record is treated as resolved | 1 of 14 | (d) |
| 3 | a target record holding no row for the path is treated as resolved | 1 of 14 | (e) |
| 4 | `verdictThere` is never compared with the target | 1 of 14 | (f) |
| 5 | a chained target is accepted as a verdict | 1 of 14 | (g) |
| 6 | absent-subject rows are no longer skipped (disjointness lost) | 1 of 14 | (j) |
| 7 | a blank string is accepted as an authority | 1 of 14 | (c) |

Each branch is killed by the cases that own it and by no others, so the suite distinguishes the five
refusals from each other rather than asserting them in aggregate.

### Gate wiring, proved rather than asserted

- **Before the registry entry:** `node scripts/audit/ci-gate-registry-check.mjs` → `CI gate registry
  failed. - check:triage-deferral-authority: not in the gate registry`. The new script reds the
  registry gate until classified, which is that gate working.
- **After the entry:** exit `0`.
- `npx eslint scripts/quality/triage-deferral-authority-check.mjs
  scripts/quality/triage-deferral-authority-check.test.mjs` → exit `0`, no findings.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` → **exit `0`**, no
  output. Judged by exit code, not by grepping for `error TS`: a bare `npx tsc --noEmit` exits `134`
  on this host, a V8 out-of-memory crash that emits no diagnostics and would read as a false clean.
- `node scripts/release-check.mjs --base origin/main --head HEAD` → recorded in the PR.

## Rollout Plan

Merge to `main` by squash. CI only — there is no runtime component. The repo-owned
`aca-main-deploy` workflow will build and deploy an image from the merge SHA as it does for every
commit to `main`; this change contributes nothing that image serves.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, unmodified.
- Shared runtime mutators: none. No `az` command, no revision weight, no Container App template, no
  env var, no secret, no worker job.
- Approved image digest: not applicable — this change alters no runtime image contents.
- ACA runtime invariant: to be read after the post-merge deploy, read-only.
- Worker image invariant: untouched. This change does not alter the enforced worker-job set.
- Feature/env flag update path: none.
- Live signed-in proof required: **no, and none is claimed.** No product file, route, component,
  prompt or tenant-visible behaviour changes, so there is nothing to sign in and inspect. `deployed`
  is this change's ceiling by design rather than by blockage.

## Rollback Plan

Revert the squash commit. No migration, no data change, no flag, no runtime state. Reverting
restores the previous gate set exactly. No triage record is edited by this change, so no row's text
has to be restored.

## Audit Evidence

- The PR and its CI run, specifically the `Release record and impact note` job's step
  `Prove no triage deferral holds a file on an authority that is gone` — the quotable line must come
  from that blocking run, not from a local invocation.
- `node scripts/quality/triage-deferral-authority-check.mjs --json` — the 39 deferral rows, each
  classified, and the empty violation buckets.
- `node scripts/quality/test-ci-coverage-census.mjs --json` — `triageVerdicts.heldByVerdict`
  (`already_verdicted_elsewhere: 36`) and `drawableUntriagedUnrunTestFiles: 0`, the two numbers that
  make this hold consequential.
- `docs/releases/records/item26-t509-verdict-discharge.md` — the sibling gate this one is kept
  disjoint from.

## Known Gaps

- **The item-shaped half is not resolved, and the gate says so.** 29 of 39 rows defer to a backlog
  item (25 to `T-775`). This repository cannot tell whether that item is open, closed or
  nonexistent, because the backlog is operator-owned. If `T-775` closes, those 25 files stay held
  and the draw stays short — the gate will not catch it. Closing that needs either the backlog's own
  reader to run this check, or the owner item's state mirrored into the repo; both are decisions
  beyond this change and neither is taken here.
- **The gate does not ask whether the far end's verdict is itself still true.** It asserts the
  referent exists, covers the same path, and is not another deferral. A record-shaped referent whose
  own `wire_into_ci` was satisfied long ago would still pass. Extending that far would make this a
  verdict-currency gate rather than an authority gate.
- **`already_verdicted_elsewhere` keeps holding files out of the draw.** That behaviour is the
  census's and is unchanged here; this change only makes the hold's basis checkable. Whether a
  deferral should hold at all is not reopened.
- **42 `wire_into_ci` rows remain held and unrun**, per `triageVerdicts.heldByVerdict`. Owner-gated
  work, untouched, and outside this gate's scope — those rows' subjects all exist and their verdicts
  describe work rather than defer it.
- **Two rows for the same path inside one record would collapse.** The audit indexes each record as
  `path -> row`, so a record holding two rows for one path keeps only the last. Measured on this
  base: **0 records do** — checked across every `docs/architecture/*triage*.json`. The failure mode
  if one ever did is a false positive (a chain reported where a real verdict also exists), which
  someone investigates, rather than a false pass. Refusing the ambiguity outright would be the
  fail-closed treatment and is the obvious extension; it is not taken here because the count is zero
  and widening the gate mid-flight would invalidate the mutation table above. Recorded rather than
  left to be discovered.
- **No new backlog id was filed for this.** Claude Code's `T-500`–`T-599` and `C-500`–`C-599` bands
  are both measured exhausted (0 of 100 free) by the queue generator's own count, so the id-band rule
  offers no number to take. It is filed under standing item 26, which is the established precedent
  for this control family — the sibling gate above was filed the same way.
