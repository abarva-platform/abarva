# Moves P3 Artifact-Specific Quality

## Release ID

`2026-07-22-moves-p3-artifact-specific-quality`

## Status

`candidate`

## Plain-English Summary

A live First Capital commercial-lending P3 generation smoke proved the corrected domain blueprint was active, but also exposed that all four P3 deliverables inherited the Target Architecture assignment. That mismatch produced missing-exhibit failures and an Operating Model draft far beyond its intended length. This release gives Solution Design, Operating Model, and Sourcing Strategy their own purpose, required exhibits, structure, and length discipline while preserving the existing evidence and quality gates.

## Layer Impact

- `global-control-lane`: shared Moves deliverable prompt assembly only.
- No schema, migration, tenant data, context-layer, retrieval, feature-flag, or UI change.
- No quality gate is relaxed or bypassed.

## Client Applicability

- All clients: yes, every tenant generating P3 Moves deliverables.
- Specific clients: none receive a private behavior fork.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none; rollback is by image/revert.
- Live proof scope: First Capital sandbox Move `4bf889aa-d4ee-4c1d-936b-51574614d191` only.

## Changes Included

- Dispatch P3 assignments by deliverable key instead of assigning the Target Architecture brief to every phase-3 artifact.
- Give Solution Design the required experience, agent workflow, exception, control, and data-flow exhibits.
- Give Operating Model the required RACI, decision-rights, cadence, and escalation exhibits with a 3,000-word stop.
- Give Sourcing Strategy the required build/buy/partner/hybrid options matrix and decision box with a 3,000-word stop.
- Require every sentence containing a client number, date, dollar amount, or percentage to carry a same-sentence citation or explicit assumption/missing-evidence label.

## QA / Validation

- PASS: `npx jest src/lib/deliverables/__tests__/visual-and-prompt.test.ts --runInBand` (21 tests).
- PASS: ESLint on changed source and test files.
- PASS: `git diff --check`.
- BLOCKED outside this slice: full TypeScript validation reports missing Home-only dependencies `@xyflow/react` and `@dagrejs/dagre`; no changed Moves file is named.
- Pending: `npm run release:check`.
- Pre-fix signed-in live proof: corrected blueprint `financial_services_commercial_lending_agent_assist`; 4/4 P3 artifacts queued; Operating Model succeeded but generated 17,856 words; Target Architecture and Sourcing Strategy each blocked on one unsupported claim; Solution Design blocked on missing exhibits.
- Proof bundle: `/private/tmp/nexus-moves-p3-domain-quality-fix/proof/5397-p3-postfix-generation-live-browser`.
- Post-deploy proof required before `live-proven`: rerun the same four P3 deliverables with the First Capital agent storage state and compare status, evidence count, exhibits, and document length.

## Rollout Plan

Merge through a PR to `main`. The repo-owned ACA main deploy workflow must build the exact merge SHA and update the web app plus deliverable worker jobs to the same digest. After the runtime invariant passes, rerun the signed-in First Capital sandbox P3 generation batch.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: ACA web app and deliverable worker jobs.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: web template image and 100% traffic revision must match the approved digest.
- Worker image invariant: `job-abarva-deliv-worker` and `job-abarva-deliv-worker-event` must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, First Capital sandbox P3 rerun through the agent persona.

## Rollback Plan

Revert this PR and redeploy the prior approved digest. Previously generated artifacts remain versioned and are not overwritten. The prior shared P3 assignment behavior returns without changing evidence or tenant data.

## Audit Evidence

- PR: https://github.com/abarva-platform/abarva/pull/5409
- Merge SHA: pending
- ACA revision/digest/traffic: pending
- Signed-in post-deploy proof: pending

## Known Gaps

- Full TypeScript validation is blocked by unrelated missing Home dependencies `@xyflow/react` and `@dagrejs/dagre`.
- Post-deploy signed-in regeneration is required before the release can be called live-proven.
