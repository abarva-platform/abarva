# 2026-07-14-candidate-preview-current-id-proof — Candidate Preview Current-ID Proof

## Release ID

`2026-07-14-candidate-preview-current-id-proof`

## Status

`candidate`

## Plain-English Summary

The signed-in candidate-preview crawl was still asking the deployed admin page
for an older SkyHarbor candidate id. The admin page correctly refused that
stale candidate request, which made the post-deploy proof fail even though auth,
route preservation, and the inactive preview banner worked. This release makes
the crawl request the current tenant preview and records the candidate id that
the page actually selects.

## Layer Impact

- Admin control plane: `/admin/candidate-preview` now visibly shows the selected
  inactive candidate version id when an explicit preview request is accepted.
- Proof harness: the post-deploy candidate-preview crawl no longer hardcodes a
  stale candidate id in the route query. It reads the selected candidate id from
  the rendered page and still verifies all non-destructive guardrails.
- Tenant data layer: no production tenant data writes, no Active Tenant Access
  update, no promotion, and no default module candidate reads.

## Client Applicability

- All clients: proof harness and admin route behavior are shared.
- Specific clients: SkyHarbor is the focused signed-in proof tenant for this
  candidate-preview route.
- Internal only: admin control-plane route and release proof.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/admin/candidate-preview/page.tsx`
- `scripts/crawl/candidate-preview-proof.ts`
- Follow-up PR after HOME-RUNTIME-PR2.

## QA / Validation

- Pass: `npx tsx scripts/smoke/p21-post-deploy-crawl.spec.ts`
- Pass: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --skipLibCheck --pretty false`
- Pass: `npm run audit:enterprise-naming`
- Pass: `git diff --check`
- Pending after release record: `npm run release:check`
- Required after merge/deploy: ACA main deploy, runtime invariant, health, and
  focused signed-in post-deploy crawl for candidate preview plus Home.

## Rollout Plan

Merge through the standard GitHub PR path. The repo-owned ACA main deploy
workflow builds and deploys the exact merged SHA. After deploy, run the focused
post-deploy crawl against `https://app.abarva.ai` with SkyHarbor and Meridian
Home surfaces, which also includes the candidate-preview route proof.

## Deployment Authority

- Repo-owned deploy workflow: required
- Shared runtime mutators: none outside the approved workflow
- Approved image digest: assigned by ACA main deploy
- ACA runtime invariant: required after deploy
- Worker image invariant: unchanged
- Feature/env flag update path: none
- Live signed-in proof required: yes

## Rollback Plan

Use the approved ACA rollback path to shift back to the previous healthy
revision if the deployed admin route or crawl harness regresses. Because this
change does not mutate tenant data, no data rollback is required.

## Audit Evidence

- Failed proof prompting this fix: GitHub Actions run `29305726736`
- Failed artifact showed auth/route/banner pass but stale candidate id refusal.
- New PR validation and post-deploy crawl artifact must be attached after merge.

## Known Gaps

This release does not promote any candidate, regenerate data, or make modules
read candidate data by default.
