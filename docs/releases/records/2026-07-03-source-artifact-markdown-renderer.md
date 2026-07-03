# 2026-07-03-source-artifact-markdown-renderer — Source Artifact Markdown Rendering

## Release ID

`2026-07-03-source-artifact-markdown-renderer`

## Status

`candidate`

## Plain-English Summary

Source artifact detail pages now render generated markdown as readable client-facing content instead of showing raw markdown pipe tables. This fixes the normalized evaluation scorecard and Vendor Response MVE Profile pages where scorecards and vendor comparison tables were visible as unformatted text.

## Layer Impact

- `global-control-lane`: Updates the shared Source artifact detail renderer used by all Source events and clients.
- No `client-data-lane` change: no schema, migration, seed, ingestion, or client data mutation is included.

## Client Applicability

- All clients: Yes, for Source artifact detail pages.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/source/SourceArtifactDrawer.tsx`
  - Adds markdown rendering for headings, bullet lists, inline emphasis/code, and responsive markdown tables.
  - Replaces raw `pre-wrap` body dumps with structured artifact rendering.
  - Cleans the summary preview so raw markdown tables are not flattened into a dense one-line summary.
- `src/components/source/__tests__/SourceArtifactDrawer.test.tsx`
  - Adds regression coverage for Normalized Evaluation Scorecard and Vendor Response MVE Profile style markdown tables.

## QA / Validation

- Pass: `npx jest src/components/source/__tests__/SourceArtifactDrawer.test.tsx --runInBand`
- Pass: `npx eslint --max-warnings=0 src/components/source/SourceArtifactDrawer.tsx src/components/source/__tests__/SourceArtifactDrawer.test.tsx`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run release:check`
- Pass: local static browser render fixture for the two failing artifact bodies produced `2` HTML tables, `0` raw markdown table rows, and `0` pipe characters in visible text.
- Pending: signed-in browser proof for the Source scorecard and MVE artifact pages after deploy.
- Pending: broader Source event workflow QA crawl.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main deploy workflow, wait for healthy revision and 100% traffic shift, then verify the live signed-in Source artifact pages.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: None outside normal web image deploy.
- Approved image digest: To be recorded by the deploy workflow.
- ACA runtime invariant: Verify `ca-abarva-web-lab-eastus` active 100% traffic revision after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this release commit and redeploy `main` through the ACA main lane. Because this is render-only, rollback does not require data migration or cleanup.

## Audit Evidence

- Before proof: `/Users/anand/Downloads/source-end-to-end-qa-20260703T0015Z/before-operator/`
- Local render proof: `/Users/anand/Downloads/source-end-to-end-qa-20260703T0015Z/local-render/`
- Focused Jest and ESLint outputs in Codex run log.
- Post-fix local and live screenshots to be attached before release is marked released.

## Known Gaps

The immediate fix covers Source artifact detail markdown formatting. A broader Source end-to-end workflow QA crawl is still required to grade every screen, gate, upload state, aVa action, and export path.
