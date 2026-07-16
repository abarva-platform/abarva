# 2026-07-16-home-knowledge-cxo-rendering-polish — Home Knowledge CXO Rendering Polish

## Release ID

`2026-07-16-home-knowledge-cxo-rendering-polish`

## Status

`candidate`

## Plain-English Summary

Home Knowledge now renders the stored, Claude-derived enterprise narrative as a CXO briefing instead of a long paragraph or diagnostic directory. The update widens the usable canvas, structures the overview into executive cards, moves the proof visual to the top of Proof, removes duplicate module footer links, changes visible product-language copy from AbarVa to Nexus, and replaces the Use Cases tab with the top five candidate business use cases plus what can be framed now and what evidence is still needed.

Follow-up browser proof caught two renderer closure gaps after the first deploy: stored Proof visual copy could still surface old product naming, and an upstream long summary sentence could still dominate the Overview lead. This release record also covers the narrow closure patch that normalizes all Home-surface visible stored strings to Nexus and clamps CXO briefing sentences for executive readability.

## Layer Impact

- `global-control-lane`: Changes the shared Home Knowledge rendering surface for all tenants using the Home Summary Snapshot / Knowledge surface. It does not change data ingestion, candidate promotion, Active Tenant Access, model calls, or module runtime behavior.
- `public-demo`: Improves the Meridian / Healthcare Demo CXO storytelling path by making the page easier to use in an executive walkthrough.

## Client Applicability

- All clients: Any tenant rendered through the Home Knowledge surface receives the wider layout, CXO card treatment, clearer Proof ordering, and hidden technical module-footer cleanup.
- Specific clients: Meridian / Healthcare Demo motivated the proof and should be rechecked first.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None introduced by this release.

## Changes Included

- `src/components/home/HomeSurface.tsx`
  - Wider Home Knowledge canvas and CXO brief layout.
  - Overview narrative split into lead, operating context, AI constraint, strategic implication, evidence boundary, and priority cards.
  - CXO lead/card/priority text is compacted so stored Claude-derived prose cannot render as a single long paragraph.
  - Use Cases tab converted to top-five candidate use cases derived from tenant context.
  - Proof tab begins with the Nexus knowledge-layer visual and keeps raw proof artifacts lower on the page.
  - Duplicate module footer links removed.
  - Visible AbarVa product copy changed to Nexus where the page describes the product capability.
  - Home-surface visible stored strings are normalized to Nexus at sanitize/render time so stored Claude-derived text does not leak old product naming.
- `src/components/home/HomeVisualBlockRenderer.tsx`
  - Structured Claude visual block text is normalized at render time so approved stored visual text cannot display old product naming on the Nexus Knowledge surface.
- `src/components/home/__tests__/HomeSurface.test.tsx`
  - Updated assertions for the new CXO rendering behavior.

## QA / Validation

- Pass: `npx eslint src/components/home/HomeSurface.tsx src/components/home/HomeVisualBlockRenderer.tsx src/components/home/__tests__/HomeSurface.test.tsx`
- Pass: `npx jest src/components/home/__tests__/HomeSurface.test.tsx --runInBand`
- Pass: `git diff --check`
- Pass: First deployed signed-in browser proof reached Meridian / Healthcare Demo and verified Use Cases, Evidence Gaps, and Context Confidence. It intentionally remained not-live-proven because Proof still surfaced old product naming and Overview still tripped a long-paragraph risk check.
- Blocked: Local signed-in browser proof. `next dev --webpack --port 3902` started successfully, but the saved Meridian Clerk storage state redirected to `/sign-in` on the local host-mapped route. Treat deployed `https://app.abarva.ai` signed-in proof as the required browser evidence.
- Not run yet: Signed-in browser proof on deployed `app.abarva.ai` for Meridian / Healthcare Demo after the closure patch merges and ACA deploys.

Known local test note: Jest emits pre-existing duplicate manual mock warnings for markdown/GFM packages, but the targeted HomeSurface suite passes 12/12.

## Rollout Plan

Merge through a pull request to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the digest-pinned image. After the deploy is healthy and receives 100% traffic, run a signed-in Meridian / Healthcare Demo Home Knowledge proof across Overview, Evidence Gaps, Use Cases, Proof, and Context Confidence.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this PR.
- Approved image digest: Assigned by the repo-owned ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy before claiming live proof.
- Worker image invariant: No worker image changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Meridian / Healthcare Demo Home Knowledge route after ACA deploy.

## Rollback Plan

Revert the PR and let the repo-owned ACA main deploy workflow publish the rollback image. No database, ingestion, candidate, or Active Tenant Access rollback is required because this is a renderer-only change.

## Audit Evidence

- Pull request URL: Pending.
- Validation output: Local command output for eslint, targeted Jest, `git diff --check`, and `npm run release:check`.
- Runtime evidence: Pending post-merge ACA revision, digest invariant, health check, and signed-in screenshots.

## Known Gaps

- This release changes Home Knowledge rendering, not the upstream Claude narrative generation quality gate.
- This release does not make Home summaries live-Claude generated at request time; it displays approved stored content from the governed snapshot.
- This release includes render-time guardrails because the stored deterministic layer is Claude-derived upstream and may still contain legacy product wording or overly long executive prose.
- This release does not promote candidate data or change module consumption defaults.
