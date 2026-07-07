# 2026-06-27-home-render-proof-quality-fix — Home KNOW Visible Answer and Artifact Guard

## Release ID

`2026-06-27-home-render-proof-quality-fix`

## Status

`candidate`

## Plain-English Summary

Tightens the Home KNOW answer path after live prompt/response/render proof showed two product-quality issues: visible consultant scaffolding labels in Claude prose and misleading thin visual artifacts. The change tells Claude to produce label-free short prose and suppresses charts/graphs when the backing data is zero-valued or placeholder-only.

## Layer Impact

- `global-control-lane`: Shared Home/aVa visible-answer behavior for all tenants using Home KNOW.
- `client-data-lane`: No schema, migration, or tenant data mutation. The change only changes how existing dossiers are composed and filtered for Home rendering.

## Client Applicability

- All clients: Yes, Home KNOW answer composition applies globally.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Uses existing Home KNOW runtime behavior; no new flag.

## Changes Included

- `src/lib/home/know/home-consultant-text-synthesis.ts`: bumps prompt version and forbids visible section labels/markdown headings.
- `src/lib/ava-answer/public-answer-scrub.ts`: maps answer-boundary jargon to natural supported-scope wording.
- `src/lib/home/know/compose-dossier-answer.ts`: suppresses zero-only charts and placeholder-only graphs.
- `src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts`: updates visible-language expectation.

## QA / Validation

- Passed: `./node_modules/.bin/jest src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts --runInBand`.
- Full TypeScript attempted with larger heap and failed on pre-existing unrelated missing declarations for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright` in this linked-node_modules checkout.
- Live deployed proof required after merge: prompt snapshot, raw Claude response, and signed-in browser rendering screenshot from `https://app.abarva.ai/home`.

## Rollout Plan

Merge to `main`, build an Azure Container Apps image from the merge SHA, deploy that digest to `ca-abarva-web-lab-eastus`, assign 100% traffic, then rerun signed-in Home prompt/response/render proof.

## Deployment Authority

- Repo-owned deploy workflow: Manual ACA operator path per approved runbook for this urgent validation pass.
- Shared runtime mutators: Only the approved ACA web app update path.
- Approved image digest: To be filled after ACR build.
- ACA runtime invariant: Template image, active revision, and 100% traffic must match the merge SHA digest.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Roll ACA traffic/template back to the previous approved main digest if the live proof regresses Home rendering or answer contract behavior.

## Audit Evidence

- PR URL and merge SHA.
- ACR digest and ACA revision.
- Signed-in prompt/response/render artifacts under `/Users/anand/Downloads/semantic2-crown-proof-*`.

## Known Gaps

This is a narrow quality fix. It does not complete broader Home/Tower/Intelligence dossier depth, tenant data enrichment, or cross-surface answer audits.
