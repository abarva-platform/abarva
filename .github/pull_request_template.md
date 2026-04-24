# PR Review Packet

## 1. Slice ID

<!-- Example: S0 - Repo guardrails and PR packet -->

## 2. Goal

<!-- What this PR is meant to accomplish in one concise paragraph. -->

## 3. Files Changed

<!-- List the meaningful files/folders changed. -->

## 4. Files Intentionally Not Touched

<!-- List important forbidden or adjacent files that were deliberately left alone. -->

## 5. Guardrails Followed

- [ ] No `git add .`
- [ ] No unrelated cleanup
- [ ] No migrations without explicit approval
- [ ] No auth changes unless explicitly approved
- [ ] No model calls in tests unless explicitly approved
- [ ] No Source UI expansion before runtime foundation unless explicitly approved
- [ ] No legacy `/programs`, `/preview`, or `/demo` expansion unless explicitly approved

## 6. Validation Commands Run

<!-- Include exact commands and pass/fail/not-run status. -->

```text
npx tsc --noEmit --pretty false
npm run build
```

## 7. Screenshots / Routes If Applicable

<!-- Include route paths, screenshot IDs, or state "not applicable". -->

## 8. Risks / Known Gaps

<!-- What remains risky, partial, or not verified? -->

## 9. Rollback Notes

<!-- How should this PR be reverted safely if needed? Include migration rollback only if migrations were explicitly approved. -->

## 10. Founder Verification Checklist

- [ ] Scope matches the approved slice.
- [ ] Allowed files only.
- [ ] Forbidden files untouched.
- [ ] Code Complete and Verified are not conflated.
- [ ] Required validation passed or gaps are explicitly documented.
- [ ] Remaining blockers and next action are clear.
