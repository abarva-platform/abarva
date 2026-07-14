# 2026-07-14-moves-context-orchestration-pr1 — Moves Phase-Aware Context Orchestration

## Release ID

`2026-07-14-moves-context-orchestration-pr1`

## Status

`candidate`

## Plain-English Summary

Moves Context Extract now understands what each phase needs before drafting. Instead of doing a narrow keyword pull, Approve & Build asks the governed Module Context Serving Contract for phase-aligned tenant context, detects Agent Assist / Contact Center AI moves, scans a broader set of business, process, systems, data, platform, org, metric, risk, vendor, relationship, and evidence-source domains, and keeps data-layer context separate from Move-approved evidence.

Attached Evidence remains Move-scoped uploaded/approved evidence only. Suggested Data-Layer Context is visible for review, gaps are actionable, and upload requests explain what the client should provide for the current Move or submit to Admin as a Context Layer reuse candidate.

## Layer Impact

- `global-control-lane`: shared Moves context extract behavior for all clients.
- Module Context Serving Contract: extends requested domain names to include AI automation use cases, operational process evidence, org ownership, workforce roles, and infrastructure/platform context.
- Moves Module Memory: continues to own Move-scoped uploaded evidence and attached generation evidence.
- File Cabinet artifacts: context extract markdown and metadata now include source layers scanned, domains requested, archetype detected, upload requests, and context-layer reuse status.

## Client Applicability

- All clients: yes, for future Move Context Extract creation.
- Specific clients: Meridian Health is the intended signed-in Agent Assist proof target.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/move-context-extract.ts`
- `src/lib/programs/__tests__/move-context-extract.test.ts`
- `src/lib/enterprise-data/contracts/module-context-apis.ts`
- `src/lib/enterprise-data/module-context-serving/module-context-serving.ts`
- `src/lib/programs/evidence-ingestion.ts`
- `src/app/api/v1/deliverables/generate-phase/route.ts`
- `scripts/audit/moves-context-extract.mjs`

## QA / Validation

- Pass: `npm run test:moves-context-extract -- --runInBand`
- Pass: `npm run audit:moves-context-extract`
- Pass: `npm run audit:module-context-serving`
- Pass: `npm run audit:active-candidate-separation`
- Pass: `npm run audit:tenant-isolation:moves`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`, allow the repo-owned ACA main deploy workflow to build and deploy the exact merged SHA, then run a signed-in Meridian disposable Move proof for an Agent Assist / Contact Center AI use case.

## Deployment Authority

- Repo-owned deploy workflow: required for shared `app.abarva.ai` runtime.
- Shared runtime mutators: none in this PR.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Meridian Agent Assist context extract creation/review.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA workflow. No data-layer promotion, Active Tenant Access update, candidate promotion, or schema migration is included.

## Audit Evidence

- PR URL: pending.
- Local validation: completed; see QA / Validation.
- Signed-in proof bundle: pending post-deploy.

## Known Gaps

- Does not promote uploaded evidence into the reusable Context Layer. It records the Move-side status/path only.
- Does not implement full Admin validation/promotion for submitted Context Intake Candidates.
- Does not make candidate data default.
- Does not claim realized value or Tower outcomes.
