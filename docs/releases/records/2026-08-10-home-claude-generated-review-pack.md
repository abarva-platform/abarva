# 2026-08-10-home-claude-generated-review-pack — Home Claude Generated Review Pack

## Release ID

`2026-08-10-home-claude-generated-review-pack`

## Status

`candidate`

## Plain-English Summary

Home now has Claude generation and audit tooling for a review-only architecture diagram pack plus
review-only CXO story blocks and visual specs. Home also exposes the generated architecture SVGs in
a fenced `Claude Review` tab so reviewers can inspect the Claude outputs in the Home canvas. The
generated SVGs, raw Claude responses, failed attempt, snapshots, and candidate story outputs are
retained for audit, but publication into the normal Home tabs remains blocked pending deterministic
semantic validation and human approval.

## Layer Impact

Layer 4 — Products, `global-control-lane`: updates the Home review-generation tooling, restores
native Context and Architecture tabs, and renders Claude-generated review SVGs only inside a
fenced `Claude Review` surface. It prevents those assets from rendering as approved Home runtime
content.

Review artifact layer: updates SkyHarbor Home review reports. This does not mutate canonical tenant
records, database tables, loaders, adapters, approved content, or runtime data-plane jobs.

## Client Applicability

- All clients: receive the stronger Claude architecture diagram generation and validation tooling.
- Specific clients: SkyHarbor receives generated review artifacts only.
- Internal only: raw Claude responses and review reports are for audit/review.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `docs/home-know/HOME_DIAGRAM_SEMANTIC_SPEC_V2.md`
- `reports/home-claude-architecture-generation/`
- `reports/multi-tenant-cxo-story-generation/skyharbor-air/`
- `src/app/api/home/architecture-review/[diagramId]/route.ts`
- `src/lib/home/claude-architecture-review-svg-assets.ts`
- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.module.css`
- `src/components/home/enterprise-landscape-v2/HomeEnterpriseLandscapeV2.tsx`
- `src/components/home/enterprise-landscape-v2/homeEnterpriseLandscapeV2Model.ts`
- `src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx`
- `scripts/knowledge/generate-home-architecture-diagram-pack.mjs`
- `scripts/knowledge/validate-home-architecture-diagram-pack.mjs`
- `scripts/knowledge/generate-cxo-story-blocks.mjs`

## QA / Validation

- PASS — `node scripts/knowledge/validate-home-architecture-diagram-pack.mjs --manifest reports/home-claude-architecture-generation/claude-architecture-diagram-pack.review.json --require-claude`
- PASS — SkyHarbor CXO story generation structural review: 20 story blocks, 12 visual specs, structural prompt-compliance score 4.65
- PASS — XML well-formedness check for all generated SVG assets
- PASS — stored SVG to retained raw Claude output fidelity
- PASS — generated SVG snapshot/contact-sheet render via Sharp
- PASS — Home renders the generated architecture outputs in a review-only `Claude Review` tab via
  an allowlisted API route
- PASS — the allowlisted route serves bundled server assets instead of runtime report-file reads,
  and tests compare every bundled SVG byte-for-byte against the retained Claude report SVG
- PASS — `Claude Review` tab is placed adjacent to `Architecture` so the generated architecture
  review surface is discoverable in the visible tab sequence
- BLOCKED — semantic validation not run
- BLOCKED — human publication approval not granted
- PASS — `npm run home:architecture-diagram-pack:test`
- PASS — targeted ESLint for Home enterprise landscape files
- PASS — `npx jest src/components/home/enterprise-landscape-v2/__tests__/HomeEnterpriseLandscapeV2.test.tsx --runInBand`
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npm run build -- --webpack`
- PASS — `npm run release:check`

## Rollout Plan

Review the generated artifacts first in the Home `Claude Review` tab and the retained report pack.
If the tooling correction is approved, merge through pull request to `main`. This does not publish
Claude-generated Home content into the normal executive tabs. Runtime publication of any generated
architecture/story asset requires `HomeDiagramSemanticSpecV2`, semantic validation, deterministic
rendering, and human approval in a later release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none outside the approved deploy workflow
- Approved image digest: assigned by the deploy workflow after merge
- ACA runtime invariant: required only if this candidate is merged for deployment
- Worker image invariant: not applicable
- Feature/env flag update path: not applicable
- Live signed-in proof required: Home route preserves native Context and Architecture tabs and
  renders Claude SVG exhibits only under the `Claude Review` tab with review-only status language

## Rollback Plan

Revert the pull request or deploy the previous approved web image through the repo-owned ACA
workflow. No schema rollback, data cleanup, or tenant-data restoration is required.

## Audit Evidence

Use the raw Claude response files, review manifest, review-only SVG assets, XML validation output,
SVG-to-raw fidelity checks, review snapshots, story-block candidate reports, pull request, and CI
checks.

## Known Gaps

Generated content is ready for human review only. It is blocked from runtime publication until
semantic validation and human approval are implemented and passed.
