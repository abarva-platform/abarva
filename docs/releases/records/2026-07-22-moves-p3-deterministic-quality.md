# MOVES-P3-QUALITY-003 — Deterministic P3 Quality Alignment

## Release ID

`2026-07-22-moves-p3-deterministic-quality`

## Status

`candidate`

## Plain-English Summary

Aligns the P3 generation and quality paths so governed open inputs are not falsely rejected as unsupported claims, internal implementation vocabulary is removed from client-facing artifacts, and Solution Design retains its own five workflow exhibits instead of being replaced by the Target Architecture renderer.

## Layer Impact

- `global-control-lane`: shared Moves deliverable generation, sanitization, rendering, and pre-persistence quality validation.
- No data-model, tenant-data, evidence-readiness, gate-approval, or context-layer behavior changes.

## Client Applicability

- All clients: yes, through the existing shared P3 generation path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: existing generation and quality-contract flags remain unchanged.

## Changes Included

- Keep the generation repair and quality validator in lockstep for the governed `(open input — see Open Inputs Required)` marker.
- Preserve formal Source Register appendix headings while replacing narrative Source Register references, raw enterprise-context family names, client-completion machinery, and bare phase shorthand.
- Use the premium architecture renderer only for `target_state_architecture`.
- Keep `solution_design` on the generic governed renderer that emits its required experience, agent, exception, control, and data-flow exhibits.
- Prevent unrendered architecture models from receiving visual-quality credit.
- Add focused regression coverage for all three contracts.

## QA / Validation

- `npx jest src/lib/deliverables/orchestrator/__tests__/orchestrator.test.ts src/lib/deliverables/orchestrator/__tests__/section-generation.test.ts src/lib/deliverables/__tests__/client-facing-artifact-sanitize.test.ts src/lib/deliverables/orchestrator/__tests__/persistence-quality.test.ts --runInBand` — pass, 49 tests.
- Post-merge GitHub checks, ACA deployment, runtime invariant verification, and signed-in disposable First Capital P3 generation proof are required before release status changes.

## Rollout Plan

Merge through a squash PR to `main`. The repo-owned ACA main deploy workflow builds and deploys the exact merge SHA. After the web and worker image invariant is verified, rerun all four P3 artifacts against the disposable First Capital proof Move and capture artifact states plus quality findings.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: repo-owned workflow only.
- Approved image digest: pending deployment.
- ACA runtime invariant: pending deployment.
- Worker image invariant: pending deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, disposable First Capital proof Move only.

## Rollback Plan

Revert the squash merge through a PR and let the repo-owned ACA main deploy workflow restore the prior digest. No schema or data rollback is required.

## Audit Evidence

- PR URL: pending.
- GitHub checks: pending.
- ACA revision/digest/traffic proof: pending.
- Signed-in P3 proof bundle: pending.

## Known Gaps

- This release aligns deterministic contracts; it does not guarantee every Claude generation passes the content-quality bar. Any remaining evidence or narrative-quality blocker must remain visible and be handled as a separate finding.
- No phase approval or real client Move mutation is included in the proof.
