# 2026-07-22-source-deal-pack-authority — Source Deal Pack Authority

## Release ID

`2026-07-22-source-deal-pack-authority`

## Status

`candidate`

## Plain-English Summary

Source Deal Pack exports now respect the same artifact authority rules as the Files list, render/export route, and direct downloads. When a File Cabinet client-final artifact exists for the same artifact slot as an older generated artifact-state body, the Deal Pack uses the accepted final as the body of record and labels the substitution with audit history instead of silently rendering the stale draft.

## Layer Impact

- Release lane: `global-control-lane` because this is shared Source export behavior for all tenants, with no client-specific schema or data mutation.
- Product runtime: Updates the tenant-scoped Source Deal Pack API route and HTML assembly path.
- Evidence integrity: Prevents stale generated artifact-state bodies from appearing as current deliverables after a client-final sibling has been accepted.
- Governance/audit: Adds visible Deal Pack authority notes that disclose the authoritative artifact id, version, filename, and superseded artifact-state history.

## Client Applicability

- All clients: Yes, for Source events with File Cabinet artifacts and client-final acceptance history.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/app/api/v1/source/[eventId]/deal-pack/route.ts`
- `src/lib/source/exports/deal-pack/assemble-deal-pack.ts`
- `src/lib/source/exports/deal-pack/stage-sections.ts`
- `src/lib/source/exports/payloads/narrative-docx-payload.ts`
- `src/lib/source/exports/renderers/narrative-docx.ts`
- `src/lib/source/exports/deal-pack/__tests__/deal-pack.test.ts`
- `docs/backlog/source-product-backlog.md`

## QA / Validation

- `npx jest --runTestsByPath src/lib/source/exports/deal-pack/__tests__/deal-pack.test.ts src/lib/source/__tests__/client-final-artifacts.test.ts --runInBand` — passed, 41 tests.
- Focused regression first failed when Deal Pack HTML rendered the stale/generated path, then passed after authority context and safe HTML fallback wiring.
- ESLint, TypeScript, `npm run release:check`, PR checks, ACA deploy proof, runtime invariant, and signed-in live proof are required before this record can move from `candidate` to `released`.

## Rollout Plan

Merge to `main` through a governed PR. The repo-owned ACA main deploy workflow builds and deploys the digest-pinned web image to `app.abarva.ai`. No migration or manual runtime mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR; deploy must be performed by the repo-owned main workflow.
- Approved image digest: Pending main deploy.
- ACA runtime invariant: Required after main deploy.
- Worker image invariant: No worker changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Deal Pack export for an event with mixed final/draft artifacts should show the authoritative final and explicit authority/audit labeling.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow roll forward with the revert commit. No schema rollback is required.

## Audit Evidence

- PR URL: Pending.
- Release checks: Focused Jest passed locally; ESLint, TypeScript, and `npm run release:check` pending.
- ACA deploy run: Pending.
- Runtime invariant report: Pending.
- Signed-in live proof bundle: Pending.

## Known Gaps

Governance label unification and safe repair/regenerate of old persisted drafts remain open as `SOURCE-ARTIFACT-AUTHORITY-001` items #7 and #8 and are intentionally out of scope for this slice.
