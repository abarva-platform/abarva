# 2026-07-23-home-knowledge-visible-trace-hygiene — Home Knowledge Visible Trace Hygiene

## Release ID

`2026-07-23-home-knowledge-visible-trace-hygiene`

## Status

`candidate`

## Plain-English Summary

Signed-in Home proof showed that the old relationship-count phrases were gone after the pack upsert refresh, but the page still exposed raw evidence trace IDs and low-level source mechanics such as row language. This release keeps Claude as the author of client-visible prose, tightens the prompt and quality gate so future packs avoid those phrases, and changes the renderer so hidden trace IDs stay hidden.

## Layer Impact

- `global-control-lane`: shared Home / Knowledge generation and rendering behavior changes for every tenant using approved Home Knowledge packs.
- Home pack generator: prompt and client-visible quality scanner now reject raw object IDs, `candidate-grade`, `source rows`, `loaded rows`, and `active rows`.
- Home renderer: evidence trace metadata remains available as product traceability but is no longer displayed as raw IDs to executives.

## Client Applicability

- All clients: yes, any tenant using the Home Knowledge Pack v3 read path receives the safer prompt/quality rules and renderer behavior.
- Specific clients: Meridian and FS Demo are the first required signed-in proof tenants.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag.

## Changes Included

- `scripts/knowledge/build-home-knowledge-pack-v2.mjs`
- `src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- Release record: `docs/releases/records/2026-07-23-home-knowledge-visible-trace-hygiene.md`

## QA / Validation

- Pass: `node --check scripts/knowledge/build-home-knowledge-pack-v2.mjs`
- Pass: `npx eslint scripts/knowledge/build-home-knowledge-pack-v2.mjs src/components/home/HomeKnowledgeDesignContractSurface.tsx`
- Pending: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false`
- Pending: `npm run release:check`
- Pending after deploy: governed Home pack rerun for Meridian and FS Demo.
- Pending after deploy: signed-in browser proof for Meridian and FS Demo.

## Rollout Plan

Merge through PR to `main`, deploy through the repo-owned ACA main workflow, verify the ACA runtime invariant, rerun Home Knowledge Pack v3 generation for Meridian and FS Demo first through the governed private operator job, then rerun all-tenant content verification and signed-in browser proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Azure Container Apps web image and private operator job image only through the approved workflow/operator wrapper.
- Approved image digest: pending deploy.
- ACA runtime invariant: pending deploy.
- Worker image invariant: pending deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Meridian and FS Demo.

## Rollback Plan

Revert the PR and redeploy through ACA. Existing approved packs remain in Postgres; if a generated pack is unacceptable, rerun the last known-good pack generation job or re-approve the previous pack version through the governed operator path.

## Audit Evidence

- Previous failing browser proof: `/tmp/home-knowledge-v3-upsert-refresh-browser-proof-20260723/browser-proof-summary.json`
- PR: pending.
- Deploy evidence: pending.
- Browser screenshots: pending.

## Known Gaps

This is not the full 1:1 visual redesign against `/Users/anand/Downloads/Home Enterprise Brief (offline).html`; it is a correctness and visible-trace hygiene fix needed before that visual pass should be accepted.
