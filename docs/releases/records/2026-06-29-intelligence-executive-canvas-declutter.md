# 2026-06-29-intelligence-executive-canvas-declutter — Quiet Intelligence executive canvas

## Release ID

`2026-06-29-intelligence-executive-canvas-declutter`

## Status

`candidate`

## Plain-English Summary

The Intelligence right canvas no longer opens with internal corpus/debug-style cards, confidence chips, source-signal counts, or action labels before the user asks a question. It starts as a quiet executive advisor surface and only shows Claude-owned Answer, Decision, Visual, Context, and Proof tabs after an answer exists.

The Visual tab keeps Claude's table/chart content intact without adding redundant tenant-evidence labels. Industry and benchmark context remain labeled so a buyer can tell company evidence apart from outside context.

## Layer Impact

- `global-control-lane`: updates shared Intelligence v2 canvas rendering for all tenants using the current Intelligence page.
- Agent display contract: keeps Claude-owned tab content and moves the right canvas closer to display-only rendering.
- No database, tenant data, ingestion, auth, or worker changes.

## Client Applicability

- All clients: yes, for tenants using the Intelligence v2 surface.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/intelligence-v2/IntelligenceV2Surface.tsx`: removes pre-answer corpus/debug panels, hides the tab row until an answer exists, and preserves grouped Claude-owned tabs after answer.
- `src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx`: updates focused coverage for direct tab rendering and cleaner Visual-tab labels.
- `src/lib/intelligence/tabbed-response.ts`: restores the visible-main-answer helper used to strip tab markers without rewriting Claude's content.
- `docs/releases/records/2026-06-29-intelligence-executive-canvas-declutter.md`: records this replay on the current main release line.

## QA / Validation

- Pass: `npx jest src/components/intelligence-v2/__tests__/IntelligenceV2Surface.test.tsx src/components/agent/__tests__/AgentDock.test.tsx src/lib/intelligence/__tests__/tabbed-response.test.ts src/lib/agent/__tests__/decision-canvas-tabs.test.ts src/lib/agent/__tests__/display-text.test.ts --runInBand` (3 suites, 53 tests).
- Pass: `npm run release:check`.
- Pass: `git diff --check HEAD~1..HEAD`.

## Rollout Plan

Merge or build from the exact candidate SHA through ACR, deploy the image to `ca-abarva-web-lab-eastus`, wait for the new ACA revision to become healthy, and shift 100% traffic to that revision.

## Deployment Authority

- Repo-owned deploy workflow: preferred for routine shared runtime promotion; this urgent correction may use the documented ACA runbook path with exact SHA/image evidence.
- Shared runtime mutators: `az acr build`, `az containerapp update`, and `az containerapp ingress traffic set`.
- Approved image digest: pending ACR build.
- ACA runtime invariant: verify active revision, image digest, and 100% traffic after deployment.
- Worker image invariant: not applicable; no worker image change.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes, signed-in `/intelligence` browser proof for Lakeshore or SkyHarbor.

## Rollback Plan

Revert this release commit and redeploy the previous known-good ACA image, or shift traffic back to the prior healthy revision if Azure still retains it.

## Audit Evidence

- Focused Jest and release-control output from this candidate.
- ACA revision, image digest, and traffic allocation after deployment.
- Signed-in browser screenshot for `/intelligence` proving the pre-answer canvas no longer shows the old labels.

## Known Gaps

None known for the pre-answer declutter scope. This does not redesign post-answer visuals beyond preserving Claude-owned grouped tabs and labels.
