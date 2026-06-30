# 2026-06-30-source-d09-completion-richness-hotfix — Source D09 Completion Richness Hotfix

## Release ID

`2026-06-30-source-d09-completion-richness-hotfix`

## Status

`candidate`

## Plain-English Summary

The D09 RFP Package now receives deterministic completion sections before the
consulting-grade quality review runs. Live proof showed the streaming path was
fixed, but the D09 draft was still rejected because the quality gate expected
an issuance checklist, stronger pricing-control assumptions, legal/commercial
terms, and Appendix A-H vendor response templates with example rows. This
release adds those sections without inventing client evidence: every
client-missing item remains labelled as client-to-complete.

## Layer Impact

- `global-control-lane`: shared Source D09 RFP generation and quality-gate input
  for every client.
- `public-demo`: supports the live Source golden path proof for the RFP Package.

## Client Applicability

- All clients: D09 RFP Package generation.
- Specific clients: None.
- Internal only: None.
- Public/demo only: Immediate proof target is the Source response-control demo.
- Feature flag: Existing D09 generation flags only; no new flag added.

## Changes Included

- `src/lib/source/agent-generation/d09-completion.ts`
- `src/lib/source/agent-generation/__tests__/d09-completion.test.ts`

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/d09-completion.test.ts src/lib/source/agent-generation/__tests__/d09-map-reduce.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand`
- `npx eslint src/lib/source/agent-generation/d09-completion.ts src/lib/source/agent-generation/__tests__/d09-completion.test.ts`
- `npm run release:check`

Live pre-fix proof against revision `ca-abarva-web-lab-eastus--me7a3dce7`
showed D09 no longer failed on streaming, but was blocked by
`quality_gate_failed` for evidence grounding, commercial specificity, and
artifact completeness.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy
workflow, confirm 100% ingress traffic on the new `ca-abarva-web-lab-eastus`
revision, then rerun the signed-in Source D09/D11 proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Azure Container Apps image/revision update only.
- Approved image digest: To be captured after deploy.
- ACA runtime invariant: `app.abarva.ai` must serve the deployed `main` SHA.
- Worker image invariant: No worker image change required.
- Feature/env flag update path: No new env var or feature flag.
- Live signed-in proof required: Yes, Source D09/D11 generation and render/download probes.

## Rollback Plan

Revert this hotfix commit and redeploy the prior `main` image. No schema,
migration, or data-plane changes are included.

## Audit Evidence

- PR URL: to be added after PR creation.
- Pre-candidate proof folder:
  `/Users/anand/Downloads/source-response-control-live-final-2026-06-30T1645Z`
- Post-deploy proof folder: to be added after live verification.

## Known Gaps

Post-deploy live proof is pending for this candidate.
