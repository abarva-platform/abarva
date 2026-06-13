# 2026-06-12-claude-document-generation-audit — Claude Document Generation Audit

## Release ID

`2026-06-12-claude-document-generation-audit`

## Status

`candidate`

## Plain-English Summary

Audited the current Claude/Anthropic usage paths across AbarVa with special focus on Moves and Source document generation. The audit identifies where serious deliverables already have strong building blocks, where model/token settings are still scattered, where lower-budget chat paths must not be reused for board-grade artifacts, and which PR slices should centralize the architecture.

## Layer Impact

- `global-control-lane`: Documentation-only architecture audit for shared AI/document-generation standards. No runtime behavior changes.
- `internal-admin`: Gives engineering/operators a current map for planning the document-generation remediation sequence.

## Client Applicability

- All clients: Future document-generation remediation affects all clients once implemented.
- Specific clients: None changed in this audit PR.
- Internal only: This audit is internal engineering/governance evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Added `docs/build/CLAUDE_DOCUMENT_GENERATION_AUDIT_2026-06.md`.
- No source code, migrations, runtime routes, deployment settings, or data-plane logic changed.

## QA / Validation

- PASS — `git diff --check origin/main...HEAD`
- PASS — `npm run release:check -- --base origin/main --head HEAD`
- NOT RUN — ESLint/typecheck; this PR is documentation-only and changes no runtime TypeScript.

## Rollout Plan

Merge to `main`. No Azure Container Apps deploy or database migration is required because this is documentation-only.

## Rollback Plan

Revert the documentation commit if the audit needs to be withdrawn or superseded.

## Audit Evidence

- PR diff containing the audit document and this release record.
- Search evidence from runtime Claude call sites in `src/app` and `src/lib`.

## Known Gaps

- This PR does not implement the centralized document-generation policy, multipass adoption, renderer upgrades, or File Cabinet enforcement. Those are intentionally split into follow-up PRs after this audit.
