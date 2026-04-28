# AbarVa Build Operating Model

Last updated: 2026-04-24

This document defines how AbarVa build work should move through Codex, Claude, and founder review without uncontrolled edits, hidden scope drift, or ambiguous "done" claims.

## One-Man-Army Operating Model

AbarVa is currently operating like a one-person founder/build organization supported by AI agents. That means process is not bureaucracy; process is memory, safety, and leverage.

The founder should not have to remember every open risk, file boundary, validation command, or dependency. Each execution slice must carry its own operating packet:

- What is being changed.
- Why it matters.
- Which files are allowed.
- Which files are forbidden.
- What acceptance means.
- Which validations prove it.
- What remains after the slice.

The build should move in narrow, reviewable slices. A slice is the unit of execution, review, validation, commit, and founder approval.

## Slice Lifecycle

Canonical lifecycle:

```text
ready -> in_progress -> code_complete -> verified -> merged
```

Definitions:

- `ready`: The slice is defined well enough to execute. It has dependencies, allowed files, forbidden files, acceptance criteria, and validation commands.
- `in_progress`: An agent or human is actively changing files for the slice.
- `code_complete`: The implementation work for the slice is complete and local validation has run, but founder/product validation may not be complete.
- `verified`: The slice has passed the required validation commands and any required persona/browser/manual walkthrough.
- `merged`: The slice is in the target branch and no longer lives only in a local or PR branch.

## Code Complete Is Not Verified

`code_complete` means "the code has been written and local checks may pass."

`verified` means "the behavior has been proven against the acceptance criteria."

Examples:

- A route compiles. That is code complete.
- A founder can open the route, confirm it renders correctly, and see no console/build errors. That is verified.
- A tenant guard exists in code. That is code complete.
- A Meridian user hitting an Apex URL gets a 403 in a live walkthrough. That is verified.
- An agent refuses to fabricate in one prompt. That is code complete for a response path.
- A golden prompt harness confirms the refusal behavior across the expected persona set. That is verified.

Every report must keep these states separate.

## Non-Negotiable Rules

### No overlapping parallel agents

Do not run parallel agents against overlapping file scopes.

Safe parallelism:

- Agent A edits `docs/build/*` while Agent B reads, but does not edit, `src/lib/source/*`.
- Agent A implements a component while Agent B writes tests in a non-overlapping test folder, if the write sets are disjoint.

Unsafe parallelism:

- Two agents editing the same component tree.
- One agent refactoring types while another implements consumers of those types.
- One agent changing auth while another changes tenant routes depending on auth behavior.

### No migrations without explicit approval

Do not add or modify Supabase migrations unless the founder explicitly approves that slice.

For any migration slice, the PR packet must include:

- Migration file path.
- Rollback plan.
- Data-loss risk.
- Local/dry-run validation command.
- Production deployment note.

### No model calls in tests without explicit approval

Tests must be deterministic by default.

Do not call Claude, OpenAI, Pinecone, or any paid/external model service in tests unless explicitly approved. Use fixtures, mocks, captured responses, or local deterministic builders.

### No Source UI expansion before runtime foundation

AbarVa Source UI work is paused unless the slice explicitly says otherwise.

Runtime foundation comes first:

- Context Bundle contracts.
- Context scoring/classifier.
- Source context validation fixtures.
- Nexus context adapter.
- Honest-disclosure response contract.

Do not add event canvas, scorecard UI, artifact drawer, value ledger UI, vendor flow, upload/parsing, chat UI, or RFP generation unless a reviewed Source slice allows it.

### No `git add .`

Never run `git add .` in this repository.

The worktree often contains unrelated founder docs, planning files, and in-flight artifacts. Stage only the slice files named in the task or manifest.

Preferred staging pattern:

```bash
git add -- path/to/allowed/file path/to/allowed/folder
git diff --cached --name-only
git diff --cached --stat
```

### Every slice needs a manifest packet

Each slice must define:

- Allowed files.
- Forbidden files.
- Acceptance criteria.
- Validation commands.
- Dependencies.
- Risk.
- Owner/agent recommendation.
- Notes.

Machine-readable slice data lives in:

```text
docs/build/build-slices.json
```

## Recommended Agent Roles

Use roles as operating modes, not permanent people.

### Planner

Responsibilities:

- Reads `CYCLE_STATE.md`, the slice manifest, and relevant docs.
- Confirms dependencies and file boundaries.
- Produces the execution plan.
- Identifies escalation points before edits begin.

Should not:

- Modify product code unless explicitly reassigned as Builder.

### Builder

Responsibilities:

- Implements only the approved slice.
- Touches only allowed files.
- Avoids unrelated cleanup.
- Keeps changes small and reviewable.

Should not:

- Expand scope because adjacent code looks weak.
- Modify auth/runtime/migrations unless the slice allows it.

### Reviewer

Responsibilities:

- Reviews the diff against acceptance criteria and guardrails.
- Flags behavioral regressions, security issues, design drift, and missing tests.
- Confirms forbidden files were not touched.

Should not:

- Rewrite the slice without clear approval.

### Test Runner

Responsibilities:

- Runs the validation commands exactly.
- Records pass/fail output.
- Calls out skipped validations and why.

Should not:

- Treat "not run" as pass.

### Progress Scribe

Responsibilities:

- Updates status after PR merge, CI failure, blocker, or 30 minutes of active work.
- Maintains a per-slice status table.
- Keeps `code_complete`, `verified`, and `merged` separate.

Should not:

- Collapse status into aggregate percentages that hide blockers.

## Recommended Git Worktree Strategy

Use one branch/worktree per slice or tightly related slice cluster.

Recommended pattern:

```text
main
slice/S0-repo-guardrails
slice/S1-context-bundle-contracts
slice/S3-source-context-validation-fixtures
```

Rules:

- Keep each branch focused on one slice.
- Do not stack PRs unless dependencies require it.
- If stacking is required, write the merge order explicitly.
- Before staging, run `git status --short --branch`.
- After staging, run `git diff --cached --name-only`.
- Never revert unrelated user files.

Suggested branch naming:

```text
slice/<slice-id>-<short-name>
```

Examples:

```text
slice/S0-repo-guardrails
slice/S4-nexus-context-adapter
slice/S7-tenant-isolation-probes
```

## Required Final Report Format From Codex

Every execution response should include:

```text
Status:
- Slice:
- Result:
- Commit:

Files changed:
- ...

Validation:
- command: pass/fail/not run
- command: pass/fail/not run

Guardrails:
- Allowed files only: yes/no
- Forbidden files touched: yes/no
- Migrations added: yes/no
- Model calls made: yes/no
- Source UI expanded: yes/no

Remaining:
- ...

Next recommended action:
- ...
```

If a command fails, include:

- Exact command.
- Failure summary.
- Whether failure is caused by this slice or pre-existing repo state.
- Recommended fix.

If work is partial, say `partial`, not `done`.

## Founder Verification Checklist

Before approving a slice, the founder should be able to answer:

- Did the slice stay inside its allowed file scope?
- Did it avoid forbidden files?
- Did it pass required validation?
- Is the behavior verified, or only code complete?
- Are remaining blockers clearly listed?
- Is the next action obvious?

## Current Operating Priority

The next high-leverage build sequence is:

1. S0 - Repo guardrails and PR packet.
2. S1 - Context Bundle contracts.
3. S2 - Context scoring/classifier.
4. S3 - Source context validation fixtures.
5. S4 - Nexus context adapter.
6. S5 - Honest disclosure response contract.

Do not let surface polish outrun runtime foundation.
