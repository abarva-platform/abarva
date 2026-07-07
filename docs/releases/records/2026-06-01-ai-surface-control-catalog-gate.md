# 2026-06-01-ai-surface-control-catalog-gate — AI Surface Control Catalog Gate

## Release ID

`2026-06-01-ai-surface-control-catalog-gate`

## Status

`candidate`

## Plain-English Summary

Adds a catalog-backed CI gate for audited AI output and consequential-action surfaces. The first catalog entries cover the structured agent response renderer, shared AgentDock chat rail, AtlasDrawer chat shell, and Programs gate approval modal, with code-token evidence for AI label, citation, confidence, responsibility footer, and human approval controls.

## Layer Impact

`global-control-lane`: CI governance for shared AI liability controls.

## Client Applicability

- All clients: The gate applies to shared control-plane code and CI.
- Specific clients: None.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `docs/security/ai-surface-control-catalog.json`
- `scripts/audit/ai-surface-control-catalog.mjs`
- `.github/workflows/ai-surface-control-catalog.yml`
- `package.json`

## QA / Validation

- PASS: `npm run audit:ai-surface-controls`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
- PASS: `git diff --check`

## Rollout Plan

Merge to `main`. The workflow runs on pull requests and pushes to `main`, preventing cataloged AI surfaces from losing their required control evidence.

## Rollback Plan

Revert the PR to remove the workflow, script, catalog, package script, and release record. No runtime data or schema change is involved.

## Audit Evidence

- PR URL
- CI checks
- Local audit, release check, and diff hygiene output

## Known Gaps

This is the first enforceable catalog slice. Follow-on work must add every remaining AI surface and can strengthen the validator from code-token evidence to browser-level checks where a route can be exercised deterministically.
