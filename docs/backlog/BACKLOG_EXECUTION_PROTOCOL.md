# Backlog Execution Protocol

## Every work order must include

- Working directory/repo context
- Model budget
- PR lifecycle and merge policy
- Production readiness tracker rule
- Design compliance gate for UI
- Allowed files
- Forbidden files
- Validation commands
- Final report requirements

## Required final report fields

1. PRs created and merged
2. Branches created
3. Files changed
4. Validation results
5. Production readiness impact
6. Readiness tracker changes or why not applicable
7. Design compliance notes for UI
8. What was intentionally excluded
9. Remaining blockers
10. Next recommended build
11. Elapsed time and agent count

## Tracker rule

State/readiness tracker slices should run last unless the slice specifically owns state. Avoid updating `CYCLE_STATE.md` in every branch.

## Manifest rule

For JSON/manifest-heavy work, preserve escaped formatting and avoid noisy diffs.
