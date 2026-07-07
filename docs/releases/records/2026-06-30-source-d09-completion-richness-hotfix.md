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

Follow-up live proof on revision `ca-abarva-web-lab-eastus--m546f1ab6` showed
the first quality rewrite could still drop deterministic completion material
before the second quality review. This candidate also re-applies the D09
completion after rewrite and extends the deterministic package with Appendix I
evaluation scorecard and Appendix J BAFO / clarification instructions.

Follow-up live proof on SkyHarbor event
`e64177a2-e75b-4604-8584-fa60386225ae` showed the generated D09 could still be
rejected after 14.6 minutes because deterministic completion sections injected
hardcoded bracketed placeholders (`[CLIENT TO SET]` / `[CLIENT TO CONFIRM]`)
even when supporting evidence was uploaded. This update makes the deterministic
D09 completion appendix evidence-aware: loaded evidence is represented as
available pending validation, milestone and BAFO dates use explicit T+ planning
anchors, and the evaluation scorecard uses the approved 20/20/15/15/15/10/5
weight model rather than blank placeholders.

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
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts`
- `src/__tests__/integration/source/source-access-control-static.test.ts`

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/d09-completion.test.ts src/lib/source/agent-generation/__tests__/d09-map-reduce.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand`
- `npx jest src/__tests__/integration/source/source-access-control-static.test.ts src/lib/source/agent-generation/__tests__/d09-completion.test.ts src/lib/source/agent-generation/__tests__/d09-map-reduce.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand`
- `npx eslint src/lib/source/agent-generation/d09-completion.ts src/lib/source/agent-generation/__tests__/d09-completion.test.ts`
- `npm run release:check`

Additional validation for this update:

- `npx jest src/lib/source/agent-generation/__tests__/d09-completion.test.ts --runInBand`
- `npx eslint src/lib/source/agent-generation/d09-completion.ts src/lib/source/agent-generation/__tests__/d09-completion.test.ts`

Live pre-fix proof against revision `ca-abarva-web-lab-eastus--me7a3dce7`
showed D09 no longer failed on streaming, but was blocked by
`quality_gate_failed` for evidence grounding, commercial specificity, and
artifact completeness.

Live proof against revision `ca-abarva-web-lab-eastus--m546f1ab6` showed the
rewrite path was still blocked by `quality_gate_failed` because the second
review saw missing Appendices C/D/F/H and BAFO/evaluation closure instructions.

Live proof against revision `ca-abarva-web-lab-eastus--m04d8c329` showed D09
still failed the quality gate because deterministic completion placeholders
remained in §8A, §9A, §11B, Appendix B/E/I/J despite uploaded evidence. The
new regression test asserts that fully evidenced D09 completion emits no
bracketed client-to-complete placeholders.

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
- Rewrite-survival failure proof folder:
  `/Users/anand/Downloads/source-response-control-live-final-2026-06-30T171738856Z`
- Post-deploy proof folder: to be added after live verification.
- Current failure proof folder:
  `/Users/anand/Downloads/source-skyharbor-ams-load-proof-2026-06-30T210807122Z/continued-generation`

## Known Gaps

Post-deploy live proof is pending for this candidate.
