# Agent Dispatch Operating Model

Slice: OPS1
Owner agents: Builder + Reviewer
Last updated: 2026-04-25
Companion documents:
- `docs/build/BUILD_OPERATING_MODEL.md` (single-lane build discipline)
- `docs/build/PRODUCTION_READINESS_UPDATE_PROTOCOL.md` (manifest update rules)
- `docs/build/AGENT_BATCH_TEMPLATE.md` (per-batch spawn template)
- `docs/build/AGENT_SLICE_REPORT_TEMPLATE.md` (per-lane report template)
- `docs/build/agent-dispatch-queue.json` (current queue)

---

## A. Purpose

This document codifies how AbarVa runs multi-agent build batches safely and repeatably. AbarVa builds in deliberate, auditable slices. Each slice has a name, an ID, an owner agent, an allowed-files list, a forbidden-files list, acceptance criteria, validation commands, and a single local commit. The single-lane discipline in `BUILD_OPERATING_MODEL.md` works for serial work. When the work fan-outs (multiple read models, multiple UI panels, multiple verification runbooks at once) we run multi-lane batches.

This operating model describes how multi-lane batches must be structured so they remain safe.

The five goals of the dispatch operating model are:

1. **Keep agents busy.** Idle agent capacity is wasted. The dispatch queue (File 2) always carries at least 20 ready or in-flight items so that a freshly opened sub-agent has a slice to claim within seconds.
2. **Prevent runaway scope.** Every lane has an explicit `allowedFiles` and `forbiddenFiles` list. A lane that touches anything outside its allowed list aborts and reports back rather than silently expanding the change.
3. **Make hand-offs auditable.** The morning review reads a uniform per-lane report (File 4) so the integrator can decide keep / amend / discard / cherry-pick / push-PR without re-reading the diff.
4. **Avoid false readiness promotion.** Production-readiness manifest updates are conservative by default: a lane never promotes a component above its current status. Only an explicit founder verification can move a component up.
5. **Integrate cleanly to main.** Cherry-pick from many local branches into a single integration branch with deterministic conflict policies for `build-slices.json` and `production-readiness.json`.

This document does not describe runtime monitoring, deployment automation, or observability. Those are deferred (see §N).

This document applies to all multi-lane batches whether they are docs-only, read-model-only, UI-only, or mixed. Each lane follows the same hard rules: one slice per lane, one local commit per lane, no push or merge from a lane worktree.

---

## B. One slice = one worktree = one branch = one local commit

This is a hard rule.

Every slice in a multi-lane batch must have:

- **Exactly one git worktree**, located under `/Users/anand/Projects/nexus-pack-<slug>` where `<slug>` is the lowercased slice id with a short descriptor. Example: `/Users/anand/Projects/nexus-pack-ops1` for slice `OPS1`.
- **Exactly one branch**, named `pack/<slice-id>-<slug>`. Example: `pack/ops1-agent-dispatch-operating-model`. The branch must be created from a clean main HEAD that matches the integrator's main HEAD.
- **Exactly one local commit** at the end of the lane's work. The commit message follows the existing convention: `<type>(<scope>): <imperative summary>`. Lanes do not amend, rebase, or squash commits during their work.
- **Exactly one ID-file alignment.** The slice id appears in (a) the worktree path, (b) the branch name, (c) the slice manifest entry, (d) the commit message scope. A mismatch is a hard fail.

No cross-pollination between lanes. A lane never reads, writes, or even checks out files in another lane's worktree. If lane A needs an output from lane B, that output must already be on main (or on a previous in-flight commit that lane A explicitly cherry-picks during its own setup).

The reason for this hard rule is mechanical: separate worktrees mean separate `node_modules`, separate `.next/` build caches, and most importantly separate `HEAD`s. A lane cannot accidentally check out another lane's branch. A lane cannot accidentally pick up another lane's working changes. A lane that crashes leaves only its own worktree dirty.

The cost of this rule is disk space. For a six-lane batch, the project tree consumes approximately six times its normal size. This is acceptable.

The rule does not apply to read-only inspection. A reviewer or integrator may run `git log` or `git diff` against any branch from the main repository or from any worktree. The rule only restricts mutation.

A lane that finishes its single local commit immediately stops. It does not push, it does not merge, it does not open a PR, and it does not start a second slice. If the operator wants the lane to do another slice, the operator must close the lane and dispatch a fresh agent with a new dispatch entry.

---

## C. No push / merge / PR from lane worktrees

This is a hard rule.

Lane workers commit locally only. They do not run `git push`, `git push -u`, `git push --force`, `git merge`, or `gh pr create`. They do not click any "merge" or "rebase" button.

The reason is concentration of authority. Push and PR are decisions about what hits the integration branch, and only the integrator (typically the founder, or an explicitly designated integration agent) can make those decisions after morning review. A lane has no way to know, on its own, that its commit is ready to ship: the lane has not seen the other lanes' commits, has not run the integration validation, and has not received explicit founder approval.

If a lane attempts to push, the push must be rejected. The recommended enforcement is a local pre-push hook on the lane worktree that exits non-zero, but the simpler enforcement is the social rule restated in every dispatch prompt: **No push / merge / PR from lane worktrees.**

The integrator's flow is described in §E. After morning review, the integrator:

1. Switches the main repo to `main`.
2. Pulls latest.
3. Creates an integration branch named `codex/<batch-name>` (example: `codex/agent-mission-batch`).
4. Cherry-picks the lane commits in dependency order.
5. Resolves manifest conflicts using §G and §H rules.
6. Re-runs validation locally.
7. Pushes the integration branch.
8. Opens one PR for the batch.

The integrator alone owns push and PR. Lanes never do.

A lane that has finished its commit reports back per File 4 and waits. If the integrator decides the slice should be discarded, the lane simply has nothing more to do; the local commit dies with the worktree.

---

## D. Morning review

The integrator runs a morning review against every active worktree before deciding what to ship.

**Per-worktree checklist.** For each worktree, the integrator runs:

- `git -C <worktree> branch --show-current` — confirms the branch matches `pack/<slice-id>-<slug>`.
- `git -C <worktree> status --short` — confirms working tree is clean (no uncommitted, no untracked).
- `git -C <worktree> log -3 --oneline` — confirms exactly one new commit on top of the parent main HEAD.
- `git -C <worktree> show --stat HEAD` — confirms staged file set matches the slice's `allowedFiles`.
- `(cd <worktree> && npx tsc --noEmit --pretty false)` — confirms type-check passes.
- `(cd <worktree> && npm run build)` — confirms next build passes if the slice touches code or affects build.

**Decision matrix per lane.** After the checklist, the integrator picks one of:

- **Keep.** Slice looks correct, validation passes, no unexpected files, manifest update is conservative. Slice is eligible for cherry-pick in §E.
- **Amend.** Slice is mostly correct but missing or wrong on one specific item (typo in note, wrong `lastUpdated`, missing a known no-op file). The integrator may either ask the lane agent to amend (a NEW commit is preferred over `git commit --amend` to keep history honest) or apply the small fix during cherry-pick.
- **Discard.** Slice is wrong in scope (touched files outside allowedFiles, false promotion, fabricated content, broken validation). The lane's commit is not cherry-picked. The integrator opens a fresh dispatch with corrected scope.
- **Cherry-pick.** Same as keep but explicitly committed to the integration branch. This is the default for a clean lane.
- **Push-PR.** Reserved for a single-lane emergency hotfix where the lane and the integration are the same person. Used rarely. Documented in the morning review notes when used.

The morning review writes a one-line decision per lane into the run log. The integrator never lets a lane sit ambiguous: every lane is either keep / amend / discard.

---

## E. Integration branch

The integrator owns one integration branch per batch.

**Cherry-pick path.**

1. `cd /Users/anand/Projects/nexus` (the main repo, not any lane worktree).
2. `git checkout main`
3. `git pull --ff-only`
4. `git checkout -b codex/<batch-name>` — example: `codex/agent-dispatch-ops1-batch`. The integration branch lives under the `codex/` namespace by convention so it does not collide with `pack/` lane branches.
5. For each lane in the batch, in dependency order (see §F):
   - `git cherry-pick <lane-branch-tip-sha>`
   - On clean apply: continue.
   - On `build-slices.json` conflict: apply §G policy and `git add docs/build/build-slices.json && git cherry-pick --continue`.
   - On `production-readiness.json` conflict: apply §H policy and `git add docs/build/production-readiness.json && git cherry-pick --continue`.
   - On any other conflict: stop, abort, file an issue, and ask. Do not "fix forward" (see §L).
6. Re-run integration validation: `npx tsc --noEmit --pretty false`, `npm run build`, `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"`, plus any per-slice jest suites named in the lane reports.
7. `git push -u origin codex/<batch-name>`
8. `gh pr create --title "..." --body "..."` — body summarizes the lanes and references each lane's slice doc.

This flow is intentionally manual. CI integration is deferred (see §N).

The integration branch is short-lived. After the PR merges to main, the integration branch is deleted both locally and on the remote. Lane worktrees may be removed at the integrator's discretion once their commits are durably on main.

---

## F. Cherry-pick order

Cherry-picks must be ordered by dependency. The general rules are:

1. **Read-models before UI.** A UI lane that consumes a read-model must come after the read-model lane. If both are in the same batch, the read-model lane's commit lands on the integration branch first.
2. **Stubs before validators.** A stub or contract lane must come before a validator that asserts the stub's shape. Example: MG2 (model gateway stub) before any validator that checks gateway types.
3. **Validators after baseline.** A validator (`production-readiness-validator.ts`, `dispatch-queue-validator.ts`) must come after every component it inspects. Otherwise the validator may flag missing entries.
4. **Docs runbook last.** A verification runbook (QA1, QA2, QA3, QA4, QA5) must be cherry-picked after every component it walks, because the runbook references those components by section. Cherry-picking the runbook first leads to confusing review state.
5. **Manifest-touching lanes interleave.** Every lane that touches `build-slices.json` or `production-readiness.json` triggers the §G / §H conflict policy on every subsequent manifest-touching lane. Order lanes so the highest-impact manifest changes (e.g. major version bumps, schema additions) come first.

The dependency information for each lane is encoded in the lane's `dependsOn` field in `agent-dispatch-queue.json`. The integrator computes a topological order from `dependsOn`, breaking ties by `priority` (critical → high → medium → low).

If two lanes have the same priority and no dependency between them, alphabetical by slice id is the default tiebreaker.

The integrator records the actual cherry-pick order in the integration branch commit log so a future reviewer can replay the decision.

---

## G. build-slices.json conflict policy

`build-slices.json` is a JSON object with top-level fields `schemaVersion`, `lastUpdated`, `lifecycle`, and `slices`. Every lane that adds a slice appends one entry to the `slices` array and bumps `lastUpdated`.

**Cherry-pick conflict policy.**

1. **Take HEAD's existing entries.** The integration branch's existing `slices` array is the base. All entries already on the integration branch survive.
2. **Append the new entry from the cherry source.** The lane being cherry-picked added exactly one new slice entry. That entry is appended to the end of the integration branch's `slices` array.
3. **Bump `lastUpdated`.** The top-level `lastUpdated` is set to the date of the cherry-pick (today's ISO date). If the lane already wrote today's date and HEAD already has today's date, no further bump is needed.
4. **JSON parse must pass.** Before `git cherry-pick --continue`, run `python3 -c "import json; json.load(open('docs/build/build-slices.json'))"`. If parse fails, the conflict was resolved incorrectly. Stop and re-resolve.
5. **No reordering.** Slices are append-only in the order they were originally authored. Do not sort, dedupe by id (each id should already be unique by construction), or rewrite existing entries.
6. **No silent mutation of other lanes' entries.** A cherry-pick must not modify another lane's slice fields. If the cherry source somehow mutated another slice, that is an authoring bug; revert that change during conflict resolution.

The expected conflict markers look like:

```
<<<<<<< HEAD
    { /* lane B's slice already cherry-picked */ }
  ]
}
=======
    { /* lane A's slice (the source of this cherry-pick) */ }
  ]
}
>>>>>>> <lane-A-sha>
```

Resolution: keep both slice entries inside the array, take HEAD's `lastUpdated` if it equals today's date, otherwise the source's `lastUpdated`.

---

## H. production-readiness.json conflict policy

`production-readiness.json` is the more delicate manifest because it encodes status promotions and blockers. The conflict policy is:

- **Conservative status.** When two lanes both touch the same component's `status` field, keep the LOWER status. Status order, lowest to highest, is: `not_started` → `scaffolded` → `code_complete` → `tested` → `verified` → `pilot_ready` → `full_flow_ready` → `production_ready`. If lane A wrote `code_complete` and lane B wrote `tested`, the resolution keeps `code_complete`. Never auto-promote.
- **No false promotions.** Any promotion (raising a component's status) requires explicit founder verification. The cherry-pick conflict resolver alone cannot promote. If both lanes attempted to promote, treat both promotions as suspect: keep the lower of HEAD's pre-batch status and re-flag the promotion for founder review.
- **Union notes.** When both lanes appended notes to the same component's `notes` array, take the union: HEAD's notes followed by the source's notes, deduplicated by exact string match. Order is preserved within each side; duplicates collapse to the first occurrence.
- **Keep blockers unless explicitly removed with evidence.** When two lanes touch a component's `blockers` array, take the union by blocker `id`. A blocker is removed only when the lane explicitly removes it AND attaches an evidence note (in the lane's slice doc and the cherry source's commit message) explaining the removal. Otherwise both lanes' blockers survive.
- **`nextAction`.** If HEAD untouched the field and incoming changed, take incoming. If both changed, append distinct content (HEAD's text, then a separator, then incoming text), preserving both planned next actions until the founder picks one. If both wrote identical text, keep one.
- **Preserve other-lane notes.** A lane must never stomp another lane's note. The cherry-pick policy enforces this by union, not overwrite.
- **Bump `lastUpdated`.** Top-level `lastUpdated` set to the date of the cherry-pick.
- **Validator must pass after every cherry-pick.** Run `npx jest src/__tests__/integration/admin/production-readiness-validator.test.ts` after every cherry-pick that touched `production-readiness.json`. The PROD2 validator (`validateProductionReadinessManifest`) must return `passed: true`. If it returns `passed: false`, the manifest is in an invalid state. Stop and resolve.

The dimensions, testing gates, and `overallReadinessPercent` are conservative by the same rule: take the lower number, the union of incomplete states, and never auto-promote a gate from `partial` to `passing` without evidence.

---

## I. Stale Claude Code task handling

Background tasks left in the Claude Code UI's Task Panel after a sub-agent exits are usually stale. The Task Panel reflects what was started, not what is still running.

**Verification.** Before assuming work is in progress, confirm a real OS process exists:

```
ps aux | grep -E "next build|tsc|jest" | grep -v grep
```

If the output is empty, no actual work is running. Dismiss the stale UI entries by closing them in the panel; no work is interrupted.

If the output lists real processes, those processes belong to active runs. Identify the worktree by the process's working directory:

```
ps aux | grep -E "next build|tsc|jest" | grep -v grep | awk '{print $2}' | xargs -I {} lsof -p {} 2>/dev/null | grep cwd
```

Do not kill processes belonging to active lanes; that destroys lane work in flight. Only dismiss UI entries whose underlying processes no longer exist.

The dispatch queue (File 2) is the source of truth for what work was assigned. The OS process list is the source of truth for what work is running. The Claude Code UI is a hint, not authoritative.

---

## J. No `git add .`

This is a hard rule.

A lane never runs `git add .`, `git add -A`, or `git add --all`. Those commands stage everything in the working tree, including:

- Files outside the lane's `allowedFiles` (forbidden by §B).
- Build outputs (`.next/`, `dist/`, `*.tsbuildinfo`).
- Editor scratch files (`.swp`, `.DS_Store`).
- Other lanes' partial work that somehow leaked into this worktree (should not happen per §B, but the explicit-path rule is the second line of defense).

A lane stages files by explicit path:

```
git add docs/build/AGENT_DISPATCH_OPERATING_MODEL.md \
        docs/build/agent-dispatch-queue.json \
        docs/build/AGENT_BATCH_TEMPLATE.md \
        docs/build/AGENT_SLICE_REPORT_TEMPLATE.md \
        docs/build/build-slices.json \
        docs/build/production-readiness.json
```

After staging, the pre-commit verification is mandatory:

```
git diff --cached --name-only
```

The output must show only the slice's `allowedFiles` and nothing else. If anything unexpected appears, the lane unstages it (`git reset HEAD <unexpected-path>`) before committing.

If the slice expects exactly N files, the lane MAY also run:

```
test "$(git diff --cached --name-only | wc -l)" -eq <N>
```

This catches the case where a glob expansion in `allowedFiles` accidentally matches more files than expected.

The lane reports back the staged file count in its slice report (File 4). The integrator confirms the count during morning review.

---

## K. No false readiness promotion

This is a hard rule.

PROD2's validator (`src/lib/admin/production-readiness-validator.ts`, function `validateProductionReadinessManifest`) is the gate.

After every cherry-pick that touched `production-readiness.json`, the integrator runs:

```
npx jest src/__tests__/integration/admin/production-readiness-validator.test.ts
```

The validator must return `passed: true` and `violations: []`. If it returns anything else, the manifest is in an invalid state.

The `production_ready` status, specifically, requires:

- Every testing gate (`unit_tests`, `integration_tests`, `route_smoke`, `live_persona_walk`, `no_fabrication_check`, `tenant_isolation_check`, `vercel_build`, `security_governance_review`) is `passing` or equivalent terminal state.
- Every blocker on the component is closed (with evidence note).
- Every dimension is in a tested or terminal state.
- Founder has explicitly approved the promotion via a dated note in `notes`.

A lane never sets a component to `production_ready`. A lane that thinks a component should be `production_ready` writes that recommendation in its slice report (File 4), and the integrator routes it to the founder for explicit approval. Only the founder, by explicit instruction, promotes a component to `production_ready`.

The same rule applies, less strictly, to other promotions. `tested` requires evidence (passing test suite). `verified` requires a recorded persona walk. `pilot_ready` requires founder approval. The conservative rule from §H prevents lanes from accidentally double-promoting a component during cherry-pick.

This is the single most important rule of the entire dispatch model. False promotion silently turns "we have a deterministic seed" into "this is production". That is exactly the failure mode AbarVa cannot ship.

---

## L. Failure handling

When validation fails — type check fails, build fails, jest fails, manifest parse fails, validator returns `passed: false`, conflict resolution returns ambiguous merge — the integrator stops.

The integrator does not "fix forward". A broken slice is aborted, not patched in place. Specifically:

- **Type check fails on a lane's commit.** Discard the commit. Send the lane agent a fresh dispatch with the type error in the report. Do not amend the broken commit on the integration branch.
- **Build fails on the integration branch after a cherry-pick.** `git cherry-pick --abort` (or `git reset --hard <previous-good-sha>` if already committed) and re-investigate. The cherry-pick is rolled back to the last good state.
- **Validator fails.** Roll back to the last good state, identify which lane's manifest change caused the failure, and re-resolve conflicts using §H. If the lane's source commit was wrong (e.g. promoted falsely), discard that lane.
- **Conflict resolution ambiguous.** Stop, report, ask the founder. Do not guess. The §G and §H policies are explicit; if the conflict does not fit either policy, the policy needs an addendum (and that addendum is itself a slice).
- **Jest suite hangs or crashes.** Treat as failure. Kill the process, roll back, investigate the suite that hangs.
- **Background process unexpectedly running.** See §I. Verify before assuming.

The integrator's mantra: when in doubt, abort and ask. A delayed batch is recoverable. A silently broken main is not.

The lane reports any failure in File 4's "Validation results" section, and the integrator records the failure decision in the morning review log.

---

## M. Branch instability mitigation

External tools (IDE git integrations, file system watchers, accidental shell history replay) sometimes switch the main repo's branch unexpectedly. The integration branch can shift under the integrator without warning.

**Mitigation.** Always run, before any stage or commit:

```
git branch --show-current
```

The output must match the expected branch (the integration branch during cherry-pick, the lane branch during lane work). If the output does not match, do not proceed. Stop, identify how the branch switched, and explicitly check out the correct branch.

Lane workers should also run `git branch --show-current` before staging their slice's files. The output must match `pack/<slice-id>-<slug>`. If it does not match, the lane has somehow drifted into another branch — abort, do not stage, and re-create the worktree if necessary.

The cost of running `git branch --show-current` is essentially zero. The cost of a lane committing to the wrong branch is catastrophic: that commit may land on main if the wrong branch is the integration branch. Always check.

The same applies to `git status --short`. A line like `M src/something/that/should/not/be/touched.ts` indicates the worktree is dirty in unexpected ways. Investigate before committing.

---

## N. Future automation path

The current dispatch model is manual. Many of the rules in this document are humans-and-conventions, not enforced by code. Future automation will harden them:

- **GitHub Actions for CI.** Required checks: tsc, build, jest, manifest parse, PROD2 validator, dispatch queue validator, no-banned-phrases lint, no-banned-imports lint. Today these run locally; CI integration is deferred.
- **Vercel deployment hooks.** After a successful main merge, Vercel deploys. A post-deploy webhook should ping a route smoke endpoint and a tenant isolation probe. Today the deploy is manual-verified.
- **Persona crawler.** A scripted crawler that walks all canonical routes for each persona (Founder, Operator, Maestro, CIO, CFO, Steward, Data Owner) and asserts no fabricated content, no banned phrases, no missing seed data. Today this is a documented runbook (QA1–QA4), not an automated check.
- **Security scan.** Static analysis for credential leaks, dependency vulnerabilities, and tenant boundary violations. Today there are tenant isolation probes; a full security scan is deferred.
- **Observability.** Production logs, error tracking, latency monitoring, agent run audit trail. Today the production-readiness manifest does not poll Vercel; observability is intentionally deferred and acknowledged in the manifest.
- **Dispatch queue automation.** A scheduled job that reads `agent-dispatch-queue.json`, identifies the highest-priority `ready` items whose `dependsOn` is satisfied, and sends them to a sub-agent pool. Today the queue is read by a human and lanes are spawned manually.
- **Slice-report linter.** A linter that confirms every commit message matches `<type>(<scope>): <summary>` and that the staged file set matches the slice's `allowedFiles`. Today this is enforced by the human pre-commit `git diff --cached --name-only` check.

These items are deferred deliberately. The current manual model is the right step until the dispatch model itself is stable. Automation that locks in a wrong model is worse than no automation. The order of automation should be: (1) CI for build/test/manifest, (2) PROD2 validator in CI, (3) persona crawler, (4) security scan, (5) observability, (6) dispatch queue automation.

Each automation step gets its own slice when its time comes.

---

## Appendix: glossary

- **Lane.** A single sub-agent assigned to a single slice in a multi-lane batch.
- **Worktree.** A git working tree separate from the main repo, created via `git worktree add`. Each lane gets its own worktree.
- **Slice.** A single coherent change with one ID, one owner, one allowed-files list, one acceptance criteria list, one validation command list, and one local commit.
- **Batch.** A group of slices spawned together, intended to land on main in a single integration PR.
- **Integration branch.** The single branch (`codex/<batch-name>`) where the integrator cherry-picks lane commits before pushing.
- **PROD2 validator.** `validateProductionReadinessManifest`. The gate that confirms `production-readiness.json` is internally consistent.
- **Conservative status.** The §H rule that lower status wins on cherry-pick conflict.
- **Union notes.** The §H rule that notes from both sides survive on cherry-pick conflict.
- **Hard rule.** A rule whose violation aborts the lane or the batch. Listed in §B, §C, §J, §K.

End of OPS1 operating model.
