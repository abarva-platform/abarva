# Operating Model Verification Runbook

Slice ID: QA5 (dispatch)
Slice name: Operating Model Verification Runbook
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-28
Author: Autonomous batch (pack/evid3-qa5-wave)
Type: Documentation only — no application code, no runtime
modification, no migrations, no model calls, no live cloud calls.

This runbook is the founder-facing checklist for verifying that
**the AbarVa agent dispatch operating model** — as codified by
OPS1 (`AGENT_DISPATCH_OPERATING_MODEL.md`) and its companion
`BUILD_OPERATING_MODEL.md` — is running honestly before any
batch-session result is pushed or merged.

QA5 is the fifth companion to QA1 (Agentic Spine), QA2 (Solution
Workshop), QA3 (Solution Intelligence), and QA4 (Agent Mission
Persona) verification runbooks. It differs from the others in that
it verifies **process** rather than product features: queue
integrity, manifest consistency, slice boundary adherence, and
readiness promotion gate hygiene.

The runbook is meant to be **walked after any multi-agent batch
session completes** and before the integrator runs `git cherry-pick`
or opens a PR. It can also serve as a morning review pre-flight for
solo overnight execution.

Each section has one expected outcome per row. Do not skip rows.

---

## §A · Purpose and scope

| # | Item | Notes |
|---|------|-------|
| A1 | This runbook covers dispatch queue integrity, slice boundary adherence, manifest conflict policy, readiness promotion hygiene, branch hygiene, and the morning review decision matrix | Out of scope: runtime behavior, UI rendering, live model calls, persona browser walks, deployment pipeline |
| A2 | Companion documents are readable and parse cleanly | `AGENT_DISPATCH_OPERATING_MODEL.md`, `BUILD_OPERATING_MODEL.md`, `agent-dispatch-queue.json`, `build-slices.json`, `production-readiness.json` |
| A3 | QA5 is documentation-only; it does not modify any file outside its allowedFiles | Allowed: this runbook, `build-slices.json`, `production-readiness.json` |
| A4 | This runbook does not claim any component as `production_ready` | All component statuses are preserved; no promotion |

---

## §B · Queue integrity

Walk the dispatch queue (`docs/build/agent-dispatch-queue.json`) after a batch session.

**Parse check:**

```bash
node -e "JSON.parse(require('fs').readFileSync('docs/build/agent-dispatch-queue.json','utf8')); console.log('ok')"
```

Expected: prints `ok`, exits 0. Any JSON parse error is a hard stop.

| # | Check | Expected outcome |
|---|-------|------------------|
| B1 | Queue parses as valid JSON | Exit 0, no parse error |
| B2 | `schemaVersion` is present | Field exists with an integer value |
| B3 | `lastUpdated` is present and non-empty | Field exists; update if items were changed |
| B4 | Every item has a non-empty `id` | No blank or duplicate IDs |
| B5 | Every item has `status` in `{proposed, ready, in_progress, code_complete, verified, merged}` | No unknown status strings |
| B6 | Every `in_progress` item was actively assigned to a lane in this session | If a lane was not dispatched, the item should be `ready`, not `in_progress` |
| B7 | Items finished in this batch are promoted to `code_complete` or higher | Do not leave merged items as `in_progress` |
| B8 | `dependsOn` lists reference valid item IDs that are `code_complete` or higher | No item is `ready` while a hard dependency is still `proposed` or `ready` |
| B9 | `conflictRisk` is set for every item | Missing `conflictRisk` is a gap; default to `low` only after manual check |
| B10 | No item has been silently removed without a corresponding merge confirmation | Count items before and after; decreases require a merge record |

---

## §C · Slice boundary adherence

After each lane commits, verify the lane did not touch files outside its `allowedFiles`.

**Command:**

```bash
git show --stat HEAD --name-only | grep -v "^commit\|^Author\|^Date\|^ \|^$" | sort
```

For each lane's commit, the output must be a strict subset of that lane's `allowedFiles`.

| # | Check | Expected outcome |
|---|-------|------------------|
| C1 | `git show --stat HEAD` lists only allowedFiles entries | Any extra file is a boundary violation — discard the commit |
| C2 | No file from `forbiddenFiles` appears in the diff | If one does, discard the commit immediately |
| C3 | `src/lib/auth/**`, `supabase/**`, `package.json`, `package-lock.json` never appear in any lane commit | Hard forbidden across all lane types |
| C4 | For docs-only lanes: no `src/**` file appears | QA and OPS lanes produce only markdown and JSON |
| C5 | `git status --short` in the lane worktree shows only the committed files, no untracked sensitive files | Check for `.env`, `*.pem`, `*.key`, credentials |
| C6 | `git diff --cached --name-only` before the commit matches the lane's allowedFiles | Staged set must equal allowedFiles, not a superset |

---

## §D · Manifest consistency — build-slices.json

After each cherry-pick onto the integration branch, verify `build-slices.json` is internally consistent.

**Parse check:**

```bash
python3 -c "import json; data=json.load(open('docs/build/build-slices.json')); print('slices:', len(data['slices']))"
```

**Conflict resolution rules (§G of the operating model):**

- Take HEAD's existing entries intact.
- Append the new entry from the cherry-pick source.
- Do not reorder, do not silently mutate other lanes' entries.
- Bump `lastUpdated`.

| # | Check | Expected outcome |
|---|-------|------------------|
| D1 | File parses as JSON with no errors | Exit 0 |
| D2 | `slices` array has grown by exactly the number of cherry-picked slices | Count before and after; no accidental deduplication |
| D3 | Previously `code_complete` slices remain `code_complete`; no silent demotion | Read a sample of 5 existing entries against the pre-cherry-pick state |
| D4 | The newly appended slice entry has the same `allowedFiles`, `forbiddenFiles`, `validationCommands`, and `dependsOn` as the dispatch queue item | They should match; divergence is a documentation drift issue |
| D5 | No existing slice's `status`, `acceptanceCriteria`, or `notes` has been mutated | Diff: `git diff HEAD~1 docs/build/build-slices.json | grep '^[-+]'` |
| D6 | `lastUpdated` reflects the batch date (today's date) | Staleness indicates the manifest was not updated |

---

## §E · Manifest consistency — production-readiness.json

After each cherry-pick onto the integration branch, verify `production-readiness.json` is internally consistent.

**Parse check:**

```bash
python3 -c "import json; m=json.load(open('docs/build/production-readiness.json')); print('components:', len(m.get('components', [])))"
```

**Conflict resolution rules (§H of the operating model):**

- Status: conservative wins — the lower status is preserved.
- Notes: union (deduplicate by string content).
- Blockers: union by `id`; remove only with explicit evidence.
- `nextAction`: take incoming when HEAD was untouched; append distinct content when both changed.
- `lastUpdated`: bump to today.
- Run `PROD2 validateProductionReadinessManifest` after every cherry-pick.

| # | Check | Expected outcome |
|---|-------|------------------|
| E1 | File parses as JSON with no errors | Exit 0 |
| E2 | 15 canonical components are present in canonical order | Count: `python3 -c "import json; print(len(json.load(open('docs/build/production-readiness.json'))['components']))"` |
| E3 | No component has been promoted to `production_ready` by a lane | Only explicit founder verification triggers promotion |
| E4 | No component's `status` has decreased without a corresponding blocker record | Demotions require an explicit blocker `id` |
| E5 | Notes appended by this batch appear in the relevant components | Grep for batch slice IDs in the notes arrays |
| E6 | No `Coming soon`, `TBD`, or `Lorem ipsum` appears in any `notes` or `nextAction` field | Banned placeholder strings are a fabrication signal |
| E7 | `overallReadinessPercent` is within the expected band (currently 20–25) | Out-of-band values indicate a silent promotion or miscalculation |
| E8 | `lastUpdated` reflects the batch date | Staleness indicates the manifest was not updated |
| E9 | `validation_qa.notes` has been appended with a note for each QA slice landed in this batch | QA lanes must self-report |

---

## §F · TypeScript and build validation

Run these validation commands after all cherry-picks land on the integration branch.

```bash
npx tsc --noEmit --pretty false 2>&1 | head -30
npm run build 2>&1 | tail -30
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json')); print('manifests ok')"
```

| # | Check | Expected outcome |
|---|-------|------------------|
| F1 | `npx tsc --noEmit` exits 0 | Any type error stops the integration |
| F2 | `npm run build` exits 0 | Build failure stops the integration |
| F3 | Both manifest files parse as valid JSON | `manifests ok` printed |
| F4 | No new `TS1501` errors (regex `s` flag, requires ES2018) | Hygiene tests may fail with this error if a test file uses `/gs` |
| F5 | No new `TS2339` errors on read model fields | Read models must only access fields that exist on their types |
| F6 | Integration test suites for all batch slices pass | `npx jest --testPathPatterns="<slice-test-file>"` for each slice |

---

## §G · No-fabrication checks

Walk these checks before pushing or opening a PR.

| # | Check | Expected outcome |
|---|-------|------------------|
| G1 | No fake dollar amounts in read-model source (`grep -r '\$\s\{0,1\}[0-9]' src/lib/`) | No matches; dollar sign with digits is a fabrication signal in a read model |
| G2 | No `E-[0-9]{3,4}` citation IDs in any newly added source file | Production-shaped citations must not appear in deterministic seeds |
| G3 | No `evid-seed-` prefixed IDs referenced outside test or seed contexts | Seed IDs are test-only; they must not appear in production routes |
| G4 | No `Coming soon`, `TBD`, or `Lorem ipsum` in any `src/lib/` file | Banned placeholder strings |
| G5 | Every new read model exports `deterministicSeed: true` | Confirms the module makes no live calls |
| G6 | No `fetch(`, `Date.now(`, `Math.random(`, or `new Date(` in any newly added read-model source | Module hygiene — the standard stripped-source check must pass |
| G7 | Honest disclaimers are present in every `view.honestDisclaimer` field | Must acknowledge deterministic / seed / no-live-data status |
| G8 | No named-vendor endorsements in seed data or read models | Vendor names are allowed in documentation and archetype lists, not as endorsed choices |

---

## §H · Branch hygiene

Verify the integration branch is clean before pushing.

```bash
git branch --show-current
git status --short
git log --oneline origin/main..HEAD
git show --stat HEAD
```

| # | Check | Expected outcome |
|---|-------|------------------|
| H1 | `git branch --show-current` shows the integration branch name | Never push from a lane branch or from `main` directly |
| H2 | `git status --short` is empty | No uncommitted changes, no untracked sensitive files |
| H3 | `git log --oneline origin/main..HEAD` lists exactly the cherry-picked commits | No accidental extra commits |
| H4 | Each commit in the log corresponds to exactly one slice | One slice = one commit |
| H5 | Commit messages follow the `<type>(<scope>): <summary>` convention | Scope should match slice ID or shortened slug |
| H6 | No commit message contains `WIP`, `temp`, `fixup`, or `amend` | These signal an incomplete lane |
| H7 | `git show --stat HEAD` for each commit lists only the allowedFiles for that slice | Boundary violation = discard the commit |

---

## §I · Morning review decision matrix

After walking §B–§H, apply this matrix for each lane commit.

| Outcome | Decision | Action |
|---------|----------|--------|
| All checks pass; tests green; no boundary violations; no false promotions | **Keep** | Cherry-pick onto integration branch; include in PR |
| Minor issue (stale manifest date, missing note, wrong `lastUpdated`) | **Amend** | Fix the specific field; re-run §D–§F; do not re-commit the entire slice |
| Boundary violation (file outside allowedFiles) | **Discard** | `git reset --hard` the lane commit; do not cherry-pick; log the failure |
| Build or type error introduced | **Discard** | Do not cherry-pick; investigate root cause; re-dispatch if valid |
| False readiness promotion | **Discard** | Immediately discard; this is a hard rule violation |
| Hygiene failure (G1–G7) | **Discard** | Do not cherry-pick; re-dispatch with corrected source |
| Only documentation updates; all checks pass | **Keep** | Cherry-pick; note as docs-only in PR body |

**Default = wait.** If any check is ambiguous, do not push. Tag the ambiguity in the PR body or CYCLE_STATE.md for founder review.

Push only with explicit founder go-ahead or standing Cycle 3+ auto-merge authority for CI-green PRs.

---

## §J · Cherry-pick worksheet

Use this template when integrating a batch onto main.

```bash
# 1. Start from clean main
git checkout main && git pull origin main

# 2. Create integration branch
git checkout -b codex/<batch-name>-integration

# 3. Cherry-pick in dependency order (read models before UI, stubs before validators, docs last)
#    Example for EVID3 + QA5:
git cherry-pick <evid3-lane-sha>
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json')); print('manifests ok')"
npx tsc --noEmit --pretty false
git cherry-pick <qa5-lane-sha>
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json')); print('manifests ok')"
npx tsc --noEmit --pretty false
npm run build

# 4. If a manifest conflict appears during cherry-pick:
#    - Accept both versions of build-slices.json (append do not overwrite)
#    - Apply conservative policy for production-readiness.json (lower status wins)
#    - Re-run: python3 -c "import json; json.load(open('...')); print('ok')"

# 5. Push and open PR only after §B–§H all pass
git push origin codex/<batch-name>-integration
gh pr create ...
```

**Dependency order for this batch (EVID3 + QA5):**

1. EVID3 — evidence-ledger-tenant-stub (read model; no UI deps)
2. QA5 — operating model verification runbook (docs only; depends on OPS1 which is code_complete)

---

## §K · Deferred items and known limitations

| Item | Status | Notes |
|------|--------|-------|
| Automated queue integrity CI check | Deferred | Would run on every push; currently manual |
| Production-readiness manifest diff gate in CI | Deferred | Would block false promotions at PR time automatically |
| Per-lane boundary violation pre-commit hook | Deferred | Would catch allowedFiles violations before commit |
| Agent-side `git diff --cached --name-only` self-check | Partial | Agents are instructed to check; not enforced by tooling |
| Stale `in_progress` item cleanup automation | Deferred | Currently manual; add a queue health check cron |

---

## §L · Quick reference — pass / fail signals

**Green (safe to push):**
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0
- `node -e "JSON.parse(...)"` exits 0 for both manifests
- All integration test suites for batch slices pass
- `git status --short` is empty on integration branch
- No component promoted to `production_ready`
- No `Coming soon` / `TBD` / `Lorem ipsum` / `E-###` in newly added source

**Red (stop immediately):**
- Any `tsc` error
- Any `build` failure
- Any JSON parse error on either manifest
- Any `git show --stat HEAD` file outside allowedFiles
- Any file from `src/lib/auth/**`, `supabase/**`, `package.json` in a lane commit
- Any component promoted without founder confirmation
- Any `Math.random(` / `Date.now(` / `new Date(` / `fetch(` in a new read-model source file
