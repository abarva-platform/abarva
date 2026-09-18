# 2026-09-18-cio-backoffice-source-fail-closed - Retire unwired Ask packet

## Release ID

`2026-09-18-cio-backoffice-source-fail-closed`

## Status

`candidate`

## Plain-English Summary

A specialized Ask packet still read a removed file-backed dataset. The live handler no longer selected that source, but conditional canvas fallbacks and a proof script could still invoke its canned decision content. This candidate removes the packet, its deleted-data reader, the dependent proof script and tests, and every source-ID canvas branch. Relevant questions continue through generic Ask and its current governed retrieval path.

## Layer Impact

Layer 4 product code and obsolete local proof tooling only. No intake, adapter, canonical object, or projection data changes. Release lane: `global-control-lane`.

## Client Applicability

- All clients: Generic Ask behavior remains available.
- Specific clients: None receive a new source or hard refusal.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts` and `src/app/api/intelligence/ask/route.ts`: remove the retired source-ID canvas fallbacks; retain the independent current fallback.
- Retire the unwired source module, deleted-data packet reader, dependent proof script, and their obsolete tests.
- `src/lib/intelligence/ask/__tests__/cio-backoffice-retirement.test.ts`: verify generic handler source selection and reject a native exhibit even when the retired source ID is supplied.

## QA / Validation

- New behavior test failed in both assertions before retirement and passed after it. The handler reaches source selection without the old source, and a forged old source ID does not yield a native exhibit.
- A targeted mutation returning a canned exhibit for that ID failed the exhibit test; the mutation was removed.
- Focused handler and companion-canvas suite: 17 passed on the candidate base. The independent current-readiness behavior remains covered by its own suite; this candidate does not assert a native exhibit when current curated records are unavailable. On the candidate base, a wider adjacent run had 19 passed and 1 failure in an unchanged CTO source test expecting outdated capitalization of a loaded item.
- Scoped ESLint, `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`, and `npm run release:check`: passed.
- Signed-in runtime proof: not run; this candidate is not deployed.

## Rollout Plan

After review and a separately authorized PR and merge, deploy only through the repository-owned ACA main workflow. Confirm the approved digest and signed-in Ask behavior before marking live.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Not applicable before deployment.
- ACA runtime invariant: Required after deployment.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the affected Ask flow after deployment.

## Rollback Plan

Use the last approved runtime digest if this deletion causes a regression, then restore code through review only with a valid governed source. No data rollback is involved.

## Audit Evidence

Clean worktree diff, behavioral red/green and mutation runs, focused tests, scoped lint, TypeScript, and release gate results from this candidate.

## Known Gaps

Generic Ask still depends on its existing grounding and output guards. This retirement does not add a deterministic anti-fabrication gate for domain-specific recommendations; unsupported precision remains a residual answer-quality risk until a governed source or stronger generic claim gate is proven.
