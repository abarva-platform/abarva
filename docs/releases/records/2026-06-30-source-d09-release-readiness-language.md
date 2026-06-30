# 2026-06-30-source-d09-release-readiness-language — Source D09 Release-Readiness Language

## Release ID

`2026-06-30-source-d09-release-readiness-language`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source D09 RFP Pack authoring contract so the model and deterministic completion appendix no longer invite bracketed client fill-in markers, owner placeholders, or due-date placeholders. Missing sourcing evidence is still treated as a real client action item; the change is that D09 now names accountable roles and gate-relative target dates instead of producing release-hostile placeholder text that the quality gate correctly rejects.

## Layer Impact

- `global-control-lane`: Updates shared Source RFP Pack generation prompts and deterministic D09 completion sections for all clients using Source artifact generation.
- No schema, RLS, tenant data, migration, or private data-plane change.

## Client Applicability

- All clients: Source D09 RFP Pack generation behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`
- `src/lib/source/agent-generation/d09-completion.ts`
- `src/lib/source/agent-generation/d09-map-reduce.ts`
- `src/lib/source/agent-generation/__tests__/d09-completion.test.ts`
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/d09-completion.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand` — passed, 11 tests.
- `npx eslint src/lib/source/agent-generation/d09-completion.ts src/lib/source/agent-generation/d09-map-reduce.ts src/lib/source/agent-generation/prompt-registry.ts src/lib/source/agent-generation/__tests__/d09-completion.test.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts` — passed.
- Prompt hygiene grep confirmed no bracketed client fill-in markers remain in model-facing Source D09 prompt/completion code.

## Rollout Plan

Merge to `main` and deploy through the repo-owned Azure Container Apps main deploy workflow. After deployment, rerun the signed-in SkyHarbor Source D09 proof against event `e64177a2-e75b-4604-8584-fa60386225ae`.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy.
- Shared runtime mutators: none outside the normal deploy workflow.
- Approved image digest: assigned by ACA deploy workflow after merge.
- ACA runtime invariant: `ca-abarva-web-lab-eastus` receives 100% traffic only after healthy revision.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, SkyHarbor Source event D09 generation and export proof.

## Rollback Plan

Revert this Source prompt/completion change and redeploy the prior healthy ACA revision. No data rollback is required because no schema or client data is changed.

## Audit Evidence

- Prior live failure proof: `/Users/anand/Downloads/source-skyharbor-ams-postfix-proof-2026-06-30T215558789Z/summary.json`
- Prior quality-gate failure: D09 remained at 7/10 due to bracketed client-name placeholder language and missing evidence closure.
- Follow-up proof will be added to the final Source P0 Slice 3 evidence ZIP after deployment.

## Known Gaps

This release does not fabricate missing sourcing evidence. The SkyHarbor demo event still needs the remaining RFP evidence files loaded through the approved Source upload path before D09 can legitimately clear as vendor-release ready.
