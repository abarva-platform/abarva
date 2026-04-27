# Backlog Escalation Policy

This policy defines when Codex continues autonomously and when Codex must stop and ask for user approval.

## 1. Auto-Handle Conditions

Codex may proceed without waiting for user input when all are true:

- Work is inside item `allowedFiles`.
- No edits touch `forbiddenFiles`.
- Local validation commands pass or failures are in-scope and fixable.
- Conflict resolution is trivial and contained within approved files.
- No human-approval trigger is active.

## 2. Mandatory Stop-and-Ask Conditions

Codex must stop and request approval when any one is true:

- Auth, security, or tenant behavior changes are required.
- Model-call behavior or model gateway behavior changes are required.
- Upload/parsing or persistence/database changes are required.
- Production deployment action is needed.
- Non-trivial merge conflict appears.
- CI fails twice and the fix appears outside approved scope.
- Unexpected files are modified or staged.
- Visual or product-direction judgment is required beyond documented standards.

## 3. Conditional Stop Rules for CI

- First CI failure: attempt in-scope fix and rerun.
- Second CI failure with unclear root cause: stop and ask.
- CI blocked by external platform issue (for example billing): report blocker and ask for policy exception before merge.

## 4. Merge Safety Contract

Codex may merge only when:

- Scope matches backlog item and allowed files.
- Local validation passed.
- Required checks are green.
- No unexpected files are included.
- No mandatory stop condition is active.

If checks cannot run because of external platform issues, Codex must ask for explicit exception before merge.

## 5. Human Approval Request Format

When escalation is triggered, Codex should provide:

- Triggered condition
- Affected item IDs and files
- What was attempted
- Why autonomous continuation is unsafe
- The smallest approval needed to continue

## 6. Post-Escalation Resume Rule

After approval, Codex must:

1. Reconfirm scope boundaries.
2. Re-run required validations.
3. Continue from the paused item.
4. Record escalation decision in `BACKLOG_CURRENT_STATE.md`.
