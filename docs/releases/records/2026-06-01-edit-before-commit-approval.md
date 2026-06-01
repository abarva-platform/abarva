# 2026-06-01-edit-before-commit-approval — Edit Before Commit Approval Control

## Release ID

`2026-06-01-edit-before-commit-approval`

## Status

`candidate`

## Plain-English Summary

Programs rich deliverable approvals now require a reviewer-visible decision text box before commit. The reviewer can edit the AI-drafted/default decision text, and the approval ledger receives the reviewed text instead of forcing the default title through unchanged.

## Layer Impact

Global control lane. This changes shared Programs approval UI behavior and expands the AI surface control catalog gate so edit-before-commit remains enforced by CI.

## Client Applicability

- All clients: Applies to Programs rich deliverable approval actions wherever the shared component is used.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/deliverables/ApproveActions.tsx` adds an editable decision review field and submits the normalized reviewed value.
- `src/components/deliverables/__tests__/ApproveActions.test.tsx` covers edit-before-commit rendering, normalization, submission, and empty-text blocking.
- `docs/security/ai-surface-control-catalog.json` catalogs the Programs rich deliverable approval action as an edit-before-commit surface.
- `scripts/audit/ai-surface-control-catalog.mjs` accepts `edit-before-commit` as a catalog control kind.

## QA / Validation

- Pass: `npm run audit:ai-surface-controls`
- Pass: `npx jest src/components/deliverables/__tests__/ApproveActions.test.tsx --runInBand`
- Pass: `npx eslint src/components/deliverables/ApproveActions.tsx src/components/deliverables/__tests__/ApproveActions.test.tsx`
- Pass: `./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`. The control becomes active on the next Vercel production deployment for Programs rich deliverable approval surfaces.

## Rollback Plan

Revert the PR. That removes the editable decision field and the related catalog entry, returning the Programs approval action to the previous default-title submission behavior.

## Audit Evidence

- PR URL: pending.
- Local validation output: focused Jest, focused ESLint, TypeScript, AI surface catalog audit, release check, and diff whitespace check passed locally on 2026-06-01.
- CI evidence: pending.

## Known Gaps

This slice covers Programs rich deliverable approval actions. Other consequential commit surfaces still need their own edit-before-commit retrofits and catalog entries.
