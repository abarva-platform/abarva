# 2026-07-02-home-cxo-proof-hardening — Home CXO Proof Hardening

## Release ID

`2026-07-02-home-cxo-proof-hardening`

## Status

`candidate`

## Plain-English Summary

The production Home CXO 60-question proof passed 58 of 60 questions after the Source commercial-boundary fix. The two remaining misses were narrower answer-quality issues: one answer exposed backend-ish wording (`raw asset list`), and one advisory blocker answer routed to Tower and Moves but did not name Intelligence for options and tradeoffs. This release tightens the Home V6 executive answer contract so those misses are handled as platform rules.

## Layer Impact

- `global-control-lane`: Updates the shared Home V6 executive answer prompt, visible-language validator, and lossless language normalization for all tenants using Home V6 executive synthesis.
- `public-demo`: Improves signed-in demo readiness by keeping Home answers in CXO-safe business language and by routing blocker/tradeoff questions to the right product surface.

## Client Applicability

- All clients: Yes, for Home V6 executive answer synthesis.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home V6 executive synthesis flags continue to control whether model synthesis is active.

## Changes Included

- `src/lib/home/know/home-v6-executive-synthesis.ts`: blocks standalone `raw` as visible technical language, translates `raw asset list` and `source-owner record` into executive-safe wording, and instructs blocker/tradeoff/scale-hold answers to name Intelligence for advisory options and tradeoffs.
- `src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`: adds regressions for the two Airline Demo misses from the production 60-question proof.
- `docs/releases/records/2026-07-02-home-cxo-proof-hardening.md`: this release record.

## QA / Validation

- `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand` passed.
- `npx jest src/lib/home/know/__tests__/v6-home-know-response.test.ts --runInBand` passed.
- `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts` passed.
- `npm run release:check` pending for this candidate.

## Rollout Plan

Merge to `main`, build the exact SHA through the repo-owned Azure Container Apps deployment lane, assign 100% traffic to the healthy ACA revision, then rerun the two failed Airline Demo production questions. If they pass, rerun the bounded Home V6 CXO Narrative + Cross-Dimension 60 proof.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow / Azure Container Apps release path.
- Shared runtime mutators: None beyond the Home application image.
- Approved image digest: To be captured after ACA deploy.
- ACA runtime invariant: `app.abarva.ai` must serve the merged SHA on the active `ca-abarva-web-lab-eastus` revision.
- Worker image invariant: Not affected.
- Feature/env flag update path: No new flags.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this release commit and redeploy the previous known-good ACA image. No schema, tenant data, ingestion, or worker migration is included.

## Audit Evidence

- Pre-fix production proof: `/tmp/home-v6-cxo-cross-dimension-60-prod-bounded-1783000351/home-v6-cxo-cross-dimension-60-report.json`, result 58/60.
- PR URL: To be added after PR creation.
- ACA revision and image digest: To be captured after deployment.
- Signed-in proof output: To be captured after deployment.

## Known Gaps

The full Home V6 CXO 60-question proof must be rerun after this candidate is deployed. This release does not redesign the Home right-side context browser canvas.

