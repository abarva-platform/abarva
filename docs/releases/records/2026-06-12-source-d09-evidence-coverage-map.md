# 2026-06-12-source-d09-evidence-coverage-map — Bind Uploaded Evidence To Source D09 RFP Coverage

## Release ID

`2026-06-12-source-d09-evidence-coverage-map`

## Status

`candidate`

## Plain-English Summary

Source D09 RFP generation now receives a clean evidence coverage map that links the uploaded SkyHarbor evidence-room files to the RFP sections and canonical evidence requirements they satisfy. This prevents the RFP authoring prompt from treating uploaded pricing assumptions, evaluation weights, risk/security posture, blackout calendar, vendor response expectations, and run-vs-change baseline as missing or "Not Requested" just because they were uploaded before their later Source stage.

## Layer Impact

- `global-control-lane`: Updates Source document-generation prompt construction for D09 RFP packages. No data schema, DNS, Vercel, Supabase, or account-shutdown behavior changes.
- `client-data-lane`: Uses existing uploaded evidence and parsed artifact metadata only; does not mutate or reload client data.

## Client Applicability

- All clients: Any Source event generating a D09 RFP package receives the improved evidence coverage map.
- Specific clients: SkyHarbor is the live proof tenant for the Source self-healing crawl.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/source/agent-generation/prompt-registry.ts`: Adds a D09 RFP evidence coverage map for uploaded evidence-room files, section usage, source-register guidance, risk register expectations, and gap closure register expectations.
- `src/lib/source/agent-generation/__tests__/prompt-registry.test.ts`: Adds regression coverage for pricing, evaluation, legal/response instructions, risk/security, blackout, and run-vs-change bindings.

## QA / Validation

- `npx jest src/lib/source/agent-generation/__tests__/prompt-registry.test.ts --runInBand` passed.
- `npx eslint src/lib/source/agent-generation/prompt-registry.ts src/lib/source/agent-generation/__tests__/prompt-registry.test.ts` passed.
- `git diff --check` passed.
- `npm run release:check -- --base origin/main --head HEAD` must pass before merge.

## Rollout Plan

Merge to main, build a new Azure Container Apps image, deploy it to `ca-abarva-web-lab-eastus`, shift traffic after the new revision is Healthy/Running, smoke `/api/health` and `/`, then rerun the SkyHarbor Source self-healing crawl against `https://app.abarva.ai`.

## Rollback Plan

Revert this PR or shift Azure Container Apps traffic back to the prior healthy revision. No migrations or data changes are involved.

## Audit Evidence

- PR and CI checks for this release candidate.
- Live Source crawl report under `reports/source-golden-event/` after deployment.
- Azure Container Apps revision/image digest used for the re-run.

## Known Gaps

This slice does not loosen the Gate B validator and does not change file parsing. If D09 still fails after the evidence coverage map, the next fix should address remaining content quality defects shown by the reviewer rather than suppressing the review.
