# 2026-09-27-stage-readiness-evidence-pack — Stage Readiness Workbook Depth And Sample Evidence Pack

## Release ID

`2026-09-27-stage-readiness-evidence-pack`

## Status

`candidate`

## Plain-English Summary

Moves stage-readiness workbooks now collect interview-depth evidence instead of one shallow row per evidence area. Missing evidence areas generate prompts for current process reality, baseline metrics, systems and data, exceptions and controls, and accountable owner decisions. Covered evidence areas generate validation prompts so stale or incomplete prefilled evidence is not treated as silently complete.

Foundation/demo tenants also receive a read-only download for a synthetic sample evidence pack. The pack is a ZIP for transport only; its contents are individual Markdown, CSV, and JSON files marked as synthetic sample evidence. The pack does not write to the evidence vault and does not satisfy any governed evidence gate by itself.

## Layer Impact

- Release lane: `global-control-lane`.
- Client intake: Improves the human evidence-capture worksheet used to collect reviewed inputs before next-phase context is accepted.
- Products: Adds a Moves UI download link for sample upload files where synthetic demo packs are allowed.
- Source adapters / canonical model: No schema, migration, or canonical object change.

## Client Applicability

- All clients: Workbook question depth changes apply wherever the stage-readiness workbook is generated.
- Specific clients: None.
- Internal only: None.
- Public/demo only: Synthetic sample evidence pack download is limited to foundation/demo tenants by server-side tenant classification.
- Feature flag: None.

## Changes Included

- Expands deterministic stage-readiness workbook questions from one prompt per evidence family into interview-depth prompt sets.
- Adds visible workbook context and suggested evidence guidance per generated row.
- Adds a read-only `GET /api/v1/programs/:programId/stage-readiness-evidence-pack` route for foundation/demo tenants.
- Adds Moves phase UI affordance for downloading sample upload files when the route is available.
- Adds focused tests for resolver depth, XLSX rendering, parser compatibility, synthetic pack contents, API tenant guard, and UI link rendering.

## QA / Validation

- Pass — `npx jest src/lib/programs/stage-readiness-workbooks/__tests__/resolver.test.ts src/lib/programs/stage-readiness-workbooks/__tests__/xlsx.test.ts src/lib/programs/stage-readiness-workbooks/__tests__/parser.test.ts src/lib/programs/stage-readiness-workbooks/__tests__/synthetic-evidence-pack.test.ts --runInBand`
- Pass — `npx jest --runTestsByPath 'src/app/api/v1/programs/[programId]/stage-readiness-evidence-pack/__tests__/route.test.ts' src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx --runInBand`
- Pass — `npx eslint src/lib/programs/stage-readiness-workbooks 'src/app/api/v1/programs/[programId]/stage-readiness-evidence-pack' src/components/strategic-moves/MovesPhaseStandaloneClient.tsx src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx 'src/app/(maestro)/strategic-moves/[moveId]/phase/[phaseNum]/page.tsx'`
- Pass — `npm run typecheck`
- Pass — `npm run release:check -- --base origin/main --head HEAD`
- Pass — `npm run audit:tenancy-fence-coverage:check`

## Rollout Plan

Merge to main through the protected PR path. The change becomes active on the next repo-owned Azure Container Apps main deployment. No data migration, manual data job, or feature flag update is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production runtime rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Required after deploy before claiming runtime-live status.
- Worker image invariant: Required only if the deployment updates worker images through the standard workflow.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, verify workbook download depth and sample-file download availability in an allowed demo/foundation workspace after deployment.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. This removes the sample evidence-pack route and returns workbooks to the previous question shape. No database rollback is required.

## Audit Evidence

- PR URL: to be added when opened.
- CI run: to be added when available.
- Deployment run: to be added when deployed.
- Local validation commands listed above.

## Known Gaps

The synthetic evidence pack is a starter pack for demo and interview workflows only. It is not accepted as governed evidence until individual files are reviewed, uploaded, parsed, and accepted through the existing evidence and workbook review paths.
