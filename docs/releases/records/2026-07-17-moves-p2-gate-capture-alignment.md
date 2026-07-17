# 2026-07-17-moves-p2-gate-capture-alignment — Moves P2 Gate Capture Alignment

## Release ID

`2026-07-17-moves-p2-gate-capture-alignment`

## Status

`candidate`

## Plain-English Summary

A signed-in Meridian smoke exposed that P2 could save visible current-state capture, queue generated deliverables, and still fail approval because two hard checks only recognized legacy discovery notes and narrow stakeholder wording. This release aligns the P2 gate evaluator with the current phase-capture contract so completed P2 current-state findings, baselines, process handoffs, data-governance notes, evidence confidence, and recommendation text can satisfy the P2 discovery-notes and stakeholder hard checks.

## Layer Impact

- `global-control-lane`: Updates shared Moves gate-evaluation behavior for the P2 → P3 transition. No tenant data, candidate data, or source/data-layer runtime behavior changes.

## Client Applicability

- All clients: Yes. The P2 gate evaluator is shared Moves control-plane behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Updates `src/lib/programs/governance.ts` so `discovery_notes_ingested` can pass from completed P2 phase-capture evidence that includes current-state findings, baseline metrics, root causes, handoffs, data quality/governance, evidence confidence, or recommendation text.
- Updates `src/lib/programs/governance.ts` so `discovery_stakeholders_named` recognizes the current P2 phase-capture vocabulary for owners, ownership, operations, architecture, compliance, privacy, security, supervisors, stewards, handoffs, queues, and roles.
- Adds a regression test proving completed P2 phase-capture rows satisfy the P2 discovery-notes and stakeholder hard checks.

## QA / Validation

- Pass: `npx jest src/lib/programs/__tests__/governance-evaluate-gates.test.ts --runInBand`
- Pass: `npx eslint src/lib/programs/governance.ts src/lib/programs/__tests__/governance-evaluate-gates.test.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
- Pass: `git diff --check`
- Pending: `npm run release:check` after this record is added.
- Pending: Live signed-in Moves P0-P5 smoke after ACA deployment.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deploy workflow build and deploy the digest-pinned image, then rerun the signed-in Meridian disposable Move smoke that originally failed at P2.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Pending deploy.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. This would restore the prior stricter P2 gate behavior and may reintroduce the live-smoke P2 approval block.

## Audit Evidence

- PR URL: Pending.
- Merge SHA: Pending.
- ACA revision: Pending.
- Live proof bundle: Pending.
- Discovery smoke failure bundle: `/Users/anand/Projects/nexus/proof/moves-p5-terminal-live-20260717/2026-07-17T01-21-58-341Z`

## Known Gaps

This release does not change candidate/data-layer behavior, Home context extraction, Tower realized-value claims, or durable worker artifact rendering. It only aligns the P2 gate evaluator with visible P2 phase capture.
