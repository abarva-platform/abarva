# Agent Batch Template

Slice: companion to OPS1
Owner agents: Builder + Reviewer
Last updated: 2026-04-25
Purpose: a fill-in-the-blank template that a future operator copies to spawn a new multi-lane batch. Pairs with `AGENT_DISPATCH_OPERATING_MODEL.md` (rules), `agent-dispatch-queue.json` (queue), and `AGENT_SLICE_REPORT_TEMPLATE.md` (per-lane report).

---

## How to use this template

1. Copy this file to a working scratch location (do not mutate this template directly).
2. Replace every `<PLACEHOLDER_LIKE_THIS>` token with a concrete value. Each placeholder is annotated below the line where it first appears.
3. Run the preflight checklist (§B) before spawning any lanes.
4. Spawn one sub-agent per lane using the per-lane spec (§F) as its dispatch prompt.
5. Wait for all lanes to commit locally. Run morning review (§G).
6. Hand the keep / amend / cherry-pick lanes to the integrator per `AGENT_DISPATCH_OPERATING_MODEL.md` §E.

This template assumes the operator has read `AGENT_DISPATCH_OPERATING_MODEL.md` end-to-end. The hard rules (§B, §C, §J, §K) are not restated here.

---

## A. Batch header

```
Goal: <ONE_SENTENCE_GOAL>
Theme: <THEME_NAME>
Base branch: <BASE_BRANCH>
Hard rules:
  - One slice per worktree per lane.
  - One local commit per lane.
  - No push / merge / PR from any lane.
  - No `git add .` — explicit paths only.
  - Conservative status; no false promotions.
```

Placeholders:
- `<ONE_SENTENCE_GOAL>` — what this whole batch achieves. Example: "Land AG10/AG11 mission queue read model and UI panel together with TOOL2 tool registry MVP."
- `<THEME_NAME>` — short noun phrase for the batch. Example: "agent-mission-batch".
- `<BASE_BRANCH>` — the branch every lane forks from. Almost always `main`.

---

## B. Preflight checklist

Run, in order, from the integrator's main repo (not from any lane worktree):

```
git -C /Users/anand/Projects/nexus branch --show-current
# Must print: main

git -C /Users/anand/Projects/nexus pull --ff-only
# Must succeed cleanly. If diverged, stop and resolve before spawning lanes.

git -C /Users/anand/Projects/nexus log --oneline -1
# Capture the SHA. Every lane forks from this exact SHA.
# SHA: <BASE_SHA>

git -C /Users/anand/Projects/nexus status --short
# Must be empty. No untracked, no modified.

ls /Users/anand/Projects | grep nexus-pack-
# Lists existing pack worktrees. Confirm none collide with the slugs you intend to spawn.

ps aux | grep -E "next build|tsc|jest" | grep -v grep
# Confirm no stale processes from previous runs are holding worktrees.
```

Placeholders:
- `<BASE_SHA>` — captured from `git log --oneline -1`. Recorded so each lane can verify its starting point.

If any preflight step fails, do not spawn lanes. Resolve first.

---

## C. Safety branch creation

Before starting integration cherry-picks, create a safety branch on the main repo so the integrator can recover from a bad cherry-pick chain:

```
git -C /Users/anand/Projects/nexus checkout main
git -C /Users/anand/Projects/nexus pull --ff-only
git -C /Users/anand/Projects/nexus tag pre-batch-<THEME_NAME>-<DATE>
# Example: pre-batch-agent-mission-batch-2026-04-25
```

Placeholders:
- `<DATE>` — ISO date of the batch start.

The tag is local-only and short-lived. Delete it after the batch's PR merges and main is verified.

---

## D. Worktree creation table

For each lane in the batch, run:

```
git -C /Users/anand/Projects/nexus worktree add \
    /Users/anand/Projects/nexus-pack-<SLICE_SLUG> \
    -b pack/<SLICE_ID>-<SLICE_SLUG> <BASE_SHA>
cd /Users/anand/Projects/nexus-pack-<SLICE_SLUG>
npm install
```

Fill the table:

| Lane id | Slice id | Slug | Worktree path | Branch | Owner agent role | Depends on |
|--------:|---------:|-----:|--------------:|-------:|-----------------:|-----------:|
| A | `<SLICE_ID_A>` | `<SLUG_A>` | `/Users/anand/Projects/nexus-pack-<SLUG_A>` | `pack/<SLICE_ID_A>-<SLUG_A>` | `<ROLE_A>` | `<DEPENDS_A>` |
| B | `<SLICE_ID_B>` | `<SLUG_B>` | `/Users/anand/Projects/nexus-pack-<SLUG_B>` | `pack/<SLICE_ID_B>-<SLUG_B>` | `<ROLE_B>` | `<DEPENDS_B>` |
| C | `<SLICE_ID_C>` | `<SLUG_C>` | `/Users/anand/Projects/nexus-pack-<SLUG_C>` | `pack/<SLICE_ID_C>-<SLUG_C>` | `<ROLE_C>` | `<DEPENDS_C>` |

Placeholders:
- `<SLICE_ID_*>` — uppercased slice id (e.g. `AG12`).
- `<SLUG_*>` — lowercase short descriptor (e.g. `mission-surface-wiring`).
- `<ROLE_*>` — owner agent (Builder, Reviewer, etc.).
- `<DEPENDS_*>` — comma-separated prior slice ids that must already be on main; empty if none.

Add or remove rows as the batch requires. Keep the table sorted by topological dependency order.

---

## E. Integrator-side file inventory

Before spawning any lane, write down which files this batch is allowed to touch in total. The integrator uses this list to detect cross-lane violations during morning review.

```
Total batch allowed-files set (union across lanes):
  - <PATH_1>
  - <PATH_2>
  - <PATH_3>
  - docs/build/build-slices.json
  - docs/build/production-readiness.json
```

Placeholders:
- `<PATH_*>` — every file path any lane in the batch is allowed to touch.

The two manifests (`build-slices.json`, `production-readiness.json`) are always in the union since every lane appends to them.

If two lanes both list the same source file in their `allowedFiles`, that is a high-risk overlap. Flag it during preflight and either:
- Re-scope one lane so the file goes to a single owner, or
- Sequence the two lanes (one after the other) so they never run in parallel.

---

## F. Per-lane spec template

Copy this block once per lane. Fill placeholders. The full block becomes the dispatch prompt sent to the lane's sub-agent.

```
You are Lane <LANE_LETTER> in a <N>-lane parallel build pack for AbarVa. Work entirely inside <WORKTREE_PATH> (isolated git worktree on branch <BRANCH>, HEAD <BASE_SHA> matching main, working tree clean, node_modules installed). DO NOT touch any other directory.

## Hard rules
- DOCS + JSON ONLY. (Or: ONE FILE UNDER src/lib/<scope>/, the rest docs+json.)
- No push/merge/PR/`git add .`. Stage only allowed files; verify with `git diff --cached --name-only`.
- No model/API calls. No "Coming soon" / "TBD" / "Lorem ipsum".

## Goal — <SLICE_ID> <SLICE_NAME>

### Before you begin (confirm)
- `git branch --show-current` prints `<BRANCH>`.
- `git log --oneline -1` prints a sha matching <BASE_SHA>.
- `git status --short` is empty.
- `pwd` prints <WORKTREE_PATH>.

### What to create / modify

1. <FILE_OR_FILE_GROUP_1>
   <DESCRIPTION_1>
2. <FILE_OR_FILE_GROUP_2>
   <DESCRIPTION_2>
3. <FILE_OR_FILE_GROUP_3>
   <DESCRIPTION_3>

### Helpers / tests
- <TEST_FILE_PATH>: <TEST_DESCRIPTION>
- Test count target: <TEST_COUNT>

### Slice doc
- `docs/build/slices/<SLICE_ID>_<SLICE_NAME_UPPER>.md`: <SLICE_DOC_DESCRIPTION>

### Manifest update — build-slices.json
- Append one new slice entry to the `slices` array.
- Bump top-level `lastUpdated` to today's ISO date.
- New entry fields:
  - `id`: "<SLICE_ID>"
  - `name`: "<SLICE_NAME>"
  - `category`: "<CATEGORY>"
  - `status`: "<STATUS>"
  - `risk`: "<RISK>"
  - `ownerAgent`: "<OWNER_AGENT>"
  - `dependsOn`: <DEPENDS_ARRAY>
  - `allowedFiles`: <ALLOWED_FILES_ARRAY>
  - `forbiddenFiles`: <FORBIDDEN_FILES_ARRAY>
  - `acceptanceCriteria`: <CRITERIA_ARRAY>
  - `validationCommands`: <VALIDATION_COMMANDS_ARRAY>
  - `notes`: "<NOTES_STRING>"

### Manifest update — production-readiness.json
- Locate component(s): <COMPONENT_IDS>
- Append note(s) describing what this slice landed.
- Update `nextAction` only if the lane changes the planned next action.
- DO NOT promote any component status. Conservative status rule applies.
- Bump top-level `lastUpdated` to today's ISO date.

### Allowed files (exact list)
- <PATH_1>
- <PATH_2>
- <PATH_3>
- docs/build/build-slices.json
- docs/build/production-readiness.json

### Forbidden files (standard list)
- src/lib/source/**
- src/lib/auth/**
- supabase/**
- package.json
- package-lock.json
- CYCLE_STATE.md
- docs/abarva-source/**

### Validation (run before commit)
```
cd <WORKTREE_PATH>
npx tsc --noEmit --pretty false
<TEST_COMMAND>
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

All four must pass.

### Commit
```
git add <PATH_1> <PATH_2> <PATH_3> \
        docs/build/build-slices.json \
        docs/build/production-readiness.json
git diff --cached --name-only   # exactly <STAGED_COUNT>
git commit -m "<COMMIT_TYPE>(<COMMIT_SCOPE>): <COMMIT_SUMMARY>"
```

### Do not push
- Do not run `git push`, `git push -u`, or any push command.
- Do not run `gh pr create`.
- Do not run `git merge`.
- Do not amend previous commits.
- Report back per `AGENT_SLICE_REPORT_TEMPLATE.md` and stop.
```

Placeholders for the per-lane spec:
- `<LANE_LETTER>` — A, B, C, ...
- `<N>` — total lane count.
- `<WORKTREE_PATH>` — full absolute path to the lane's worktree.
- `<BRANCH>` — the lane's branch name `pack/<SLICE_ID>-<SLUG>`.
- `<BASE_SHA>` — the SHA captured in §B.
- `<SLICE_ID>` — uppercase slice id.
- `<SLICE_NAME>` — human-readable slice name.
- `<FILE_OR_FILE_GROUP_*>` — the actual files the slice creates or modifies.
- `<DESCRIPTION_*>` — what the lane should write into that file.
- `<TEST_FILE_PATH>` — single jest test path the lane authors.
- `<TEST_DESCRIPTION>` — what the test asserts.
- `<TEST_COUNT>` — expected `it()` count for the suite.
- `<SLICE_NAME_UPPER>` — uppercase underscore version for the slice doc filename.
- `<SLICE_DOC_DESCRIPTION>` — what the slice doc must contain.
- `<CATEGORY>` — manifest category (A, J, QA, OPS, etc.).
- `<STATUS>` — `ready`, `in_progress`, `code_complete`, etc.
- `<RISK>` — `low`, `medium`, `high`.
- `<OWNER_AGENT>` — owner agent role.
- `<DEPENDS_ARRAY>` — JSON array of prior slice ids.
- `<ALLOWED_FILES_ARRAY>` — JSON array of allowed file paths.
- `<FORBIDDEN_FILES_ARRAY>` — JSON array of forbidden file paths.
- `<CRITERIA_ARRAY>` — JSON array of acceptance bullets.
- `<VALIDATION_COMMANDS_ARRAY>` — JSON array of validation shell commands.
- `<NOTES_STRING>` — multi-sentence notes describing the slice.
- `<COMPONENT_IDS>` — comma-separated production-readiness component ids the slice touches.
- `<PATH_*>` — file paths in the allowed list.
- `<TEST_COMMAND>` — the jest command the lane runs.
- `<STAGED_COUNT>` — exact number of files the lane stages (number of paths in §F's allowed list).
- `<COMMIT_TYPE>` — `feat`, `docs`, `test`, `chore`, etc.
- `<COMMIT_SCOPE>` — short scope, often the slice id or the area.
- `<COMMIT_SUMMARY>` — imperative one-line commit summary.

---

## G. Morning review template

After all lanes have committed locally and reported back, the integrator runs morning review.

For each lane, fill:

```
Lane: <LANE_LETTER>
Slice: <SLICE_ID> <SLICE_NAME>
Worktree: <WORKTREE_PATH>
Branch: <BRANCH>
Reported by: <AGENT_OR_HUMAN>

Branch hygiene:
  git branch --show-current ............ <PASS_OR_FAIL>
  git status --short (must be empty) ... <PASS_OR_FAIL>
  git log -3 --oneline ................. <PASS_OR_FAIL>
  git show --stat HEAD ................. <STAGED_FILE_COUNT> files, expected <EXPECTED_COUNT>
  git diff --cached --name-only ........ <PASS_OR_FAIL>

Validation:
  npx tsc --noEmit --pretty false ...... <PASS_OR_FAIL>
  npm run build ........................ <PASS_OR_FAIL>
  jest <SUITE_PATH> .................... <TEST_COUNT> passing
  python3 manifest parse ............... <PASS_OR_FAIL>
  PROD2 validator ...................... <PASS_OR_FAIL>

Manifest review:
  build-slices.json append only ........ <YES_OR_NO>
  production-readiness.json:
    components touched ................. <COMPONENT_IDS>
    status changes ..................... <NONE_OR_LIST>
    blockers added/removed ............. <NONE_OR_LIST>
    nextAction updated ................. <YES_OR_NO>
    no false promotion ................. <YES_OR_NO>

No-fabrication check:
  no banned phrases .................... <YES_OR_NO>
  no model/API calls ................... <YES_OR_NO>
  honest disclaimers in place .......... <YES_OR_NO>

Decision: <KEEP / AMEND / DISCARD / CHERRY-PICK / PUSH-PR>
Notes: <FREE_TEXT>
```

After all lanes are filled, the integrator orders the keep / cherry-pick lanes by dependency (per `AGENT_DISPATCH_OPERATING_MODEL.md` §F) and proceeds to integration (§E).

---

## H. Cherry-pick worksheet

Track each cherry-pick as it happens:

```
Integration branch: codex/<THEME_NAME>
Cherry-pick order:

  1. <SLICE_ID_1> from <LANE_BRANCH_1>
     SHA: <SHA_1>
     Conflict on build-slices.json? <YES_OR_NO>
     Conflict on production-readiness.json? <YES_OR_NO>
     Validator passed: <YES_OR_NO>

  2. <SLICE_ID_2> from <LANE_BRANCH_2>
     SHA: <SHA_2>
     Conflict on build-slices.json? <YES_OR_NO>
     Conflict on production-readiness.json? <YES_OR_NO>
     Validator passed: <YES_OR_NO>

  3. <SLICE_ID_3> from <LANE_BRANCH_3>
     ...
```

Final integration validation:

```
cd /Users/anand/Projects/nexus
git checkout codex/<THEME_NAME>
npx tsc --noEmit --pretty false
npm run build
npx jest <ALL_TOUCHED_SUITES>
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
npx jest src/__tests__/integration/admin/production-readiness-validator.test.ts
```

If all pass:

```
git push -u origin codex/<THEME_NAME>
gh pr create --title "<PR_TITLE>" --body "<PR_BODY>"
```

Placeholders:
- `<PR_TITLE>` — short, under 70 chars.
- `<PR_BODY>` — multi-line markdown body summarizing the lanes.

---

## I. Cleanup

After the PR merges to main and the founder confirms green:

```
git -C /Users/anand/Projects/nexus checkout main
git -C /Users/anand/Projects/nexus pull --ff-only
git -C /Users/anand/Projects/nexus tag -d pre-batch-<THEME_NAME>-<DATE>
git -C /Users/anand/Projects/nexus branch -d codex/<THEME_NAME>
git -C /Users/anand/Projects/nexus push origin --delete codex/<THEME_NAME>

# For each lane worktree (only after the lane's commit is durably on main):
git -C /Users/anand/Projects/nexus worktree remove /Users/anand/Projects/nexus-pack-<SLUG>
git -C /Users/anand/Projects/nexus branch -D pack/<SLICE_ID>-<SLUG>
```

Cleanup is per-batch. Do not delete a worktree whose commit has not yet landed on main.

---

## J. Failure rollback template

If integration fails partway through, the safety tag from §C lets the integrator recover:

```
cd /Users/anand/Projects/nexus
git checkout main
git reset --hard pre-batch-<THEME_NAME>-<DATE>
# Note: this is destructive. Confirm before running. Lane worktrees are unaffected;
# the lane commits still exist locally on their pack/* branches and can be cherry-picked
# again after the rollback.
```

Document the failure in the morning review notes. Identify which lane(s) caused the rollback. Decide whether to re-spawn corrected lanes or to declare the batch dead.

---

End of batch template.
