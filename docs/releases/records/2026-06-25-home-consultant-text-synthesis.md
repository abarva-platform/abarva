# 2026-06-25-home-consultant-text-synthesis — Home Consultant Text Synthesis

## Release ID

`2026-06-25-home-consultant-text-synthesis`

## Status

`candidate`

## Plain-English Summary

Home/aVa no longer requires Claude to return strict JSON for consultant synthesis. AbarVa still builds the dimension dossier, rollups, artifacts, citations, gaps, and answer boundary deterministically. Claude now writes only the final user-facing consultant prose as plain text. Valid Claude text is selected; deterministic dossier prose remains the fallback for timeout, empty text, safety, grounding, tenant, raw-ID, or unsupported recommendation failures.

## Layer Impact

- `global-control-lane`: Changes the shared Home KNOW answer synthesis path and feature-flagged Claude behavior for opted-in tenants.
- `client-data-lane`: No data mutation. The feature reads existing tenant dossier evidence.

## Client Applicability

- All clients: shared code path and deterministic fallback behavior.
- Specific clients: Claude text synthesis remains tenant-flagged for SkyHarbor and Lakeshore.
- Internal only: proof traces and QA bundles.
- Public/demo only: not applicable.
- Feature flag: `home_know_claude_synthesis`.

## Changes Included

- `src/lib/home/know/home-consultant-text-synthesis.ts`
- `src/lib/home/know/home-know-engine.ts`
- `src/lib/home/know/home-know-contract.ts`
- `src/app/api/home/know/ask/route.ts`
- `src/lib/features/registry.ts`
- `src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts`
- `docs/home-know/HOME_CONSULTANT_TEXT_SYNTHESIS_PROMPT.md`
- `docs/home-know/HOME_CLAUDE_TEXT_OUTPUT_CONTRACT.md`
- `docs/home-know/HOME_JSON_CONTRACT_DEPRECATION.md`
- `docs/home-know/GOLDEN_QUESTION_TEXT_SYNTHESIS_PROOF.md`

## QA / Validation

- `npx jest src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts --runInBand`: pass, 12/12.
- `npx jest src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand`: pass, 27/27.
- `npx jest src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand`: pass, 39/39.
- `npx eslint src/lib/home/know/home-consultant-text-synthesis.ts src/lib/home/know/home-know-engine.ts src/lib/home/know/evaluate-home-consultant-synthesis.ts src/lib/home/know/__tests__/home-consultant-text-synthesis.test.ts src/app/api/home/know/ask/route.ts src/lib/features/registry.ts`: pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --incremental false --skipLibCheck`: not completed locally; interrupted after a long silent run. Production Docker/ACA build remains required before deployment and will exercise the build/type path.
- `npm run release:check`: pass.
- `npm run audit:control-plane-purity:check`: pass.
- Signed-in SkyHarbor and Lakeshore browser proof after ACA deploy: not run yet.

## Rollout Plan

Merge to main after local gates, deploy through the approved Azure Container Apps lane, set the Home Claude env values, and run signed-in SkyHarbor/Lakeshore proof against `https://app.abarva.ai/home`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: Azure Container Apps image deploy and env var update through approved ACA lane.
- Approved image digest: To be recorded after build.
- ACA runtime invariant: Active revision must use the digest-pinned image and receive 100% traffic.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: `HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED=true`, `HOME_KNOW_CLAUDE_OUTPUT_MODE=text`, `HOME_KNOW_CLAUDE_MAX_TOKENS=25000`, `HOME_KNOW_CLAUDE_TIMEOUT_MS=60000`.
- Live signed-in proof required: Yes.

## Rollback Plan

Redeploy the previous known-good ACA image or disable `HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED`. Deterministic Home dossier prose remains available without data migration.

## Audit Evidence

To be added:

- proof bundle under `proof/home-consultant-text-synthesis/`
- signed-in screenshots
- final API payloads
- ACA revision and digest
- health check

## Known Gaps

Live proof is pending until deployment.
