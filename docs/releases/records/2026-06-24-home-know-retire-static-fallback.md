# 2026-06-24-home-know-retire-static-fallback — Home KNOW Retires Static Fallback

## Release ID

`2026-06-24-home-know-retire-static-fallback`

## Status

`candidate`

## Plain-English Summary

This release removes the old static Home v2 runtime path so `/home` cannot accidentally flip back to the standalone HTML/iframe experience. Home now has one runtime path: the React Home KNOW surface, the Home KNOW endpoint, and the deterministic Home KNOW response contract. It also adds a backend answer-quality guard that strips mechanical `Read:`/`Evidence:` style prefixes before responses reach the UI.

## Layer Impact

`global-control-lane`: Removes legacy authenticated Home routes and public assets that could serve the old page.

`global-control-lane`: Removes the obsolete Home surface rollout flag so there is no feature/env switch back to static Home.

`global-control-lane`: Tightens Home KNOW backend response validation and tests so prose cannot regress to mechanical template labels.

## Client Applicability

- All clients: Yes, every tenant using `/home`.
- Specific clients: Apex Retail, First Capital, SkyHarbor, Meridian, Lakeshore receive the same runtime path.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No Home surface selection flag remains.

## Changes Included

- Deletes `/api/home/v2-frame`.
- Deletes `/api/home/v2-data`.
- Deletes `public/home-v2/`.
- Deletes `src/lib/home-v2/data.ts`.
- Removes `home_react_surface` from the feature registry.
- Updates the Home integration test into a no-fallback sentinel.
- Updates the substrate audit to fail if Home v2 runtime files return.
- Updates the Home live gate to call `/api/home/know/ask`.
- Tightens Home KNOW prose validation to strip `Read:`, `Evidence:`, `Implication:`, and `Next move:` prefixes.

## QA / Validation

- PASS: `npx jest src/__tests__/integration/home/home-v2-all-client-binding.test.ts src/lib/home/know/__tests__/home-know-engine.test.ts --runInBand`
  - 28 tests passed.
  - Existing duplicate Jest mock warnings appeared but did not fail the run.
- PASS: `node scripts/audit/agent-substrate-readiness.mjs --json`
  - `critical=0`
  - `legacy_home_v2_runtime_retired` passed.
  - `home_ask_uses_home_know_endpoint` passed.
  - `home_browser_answer_logic_absent` passed.
  - `home_know_prose_template_guard` passed.
- PASS: `npx eslint src/lib/home/know/home-know-engine.ts src/lib/features/registry.ts src/__tests__/integration/home/home-v2-all-client-binding.test.ts scripts/audit/agent-substrate-readiness.mjs scripts/qa/home-live-gate.mjs`
- PASS: `npm run release:check -- --base origin/main --head HEAD`
  - Release Control Gate passed.
  - Deploy Authority Gate passed.
  - Pilot Data Loader Gate passed.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds a new digest-pinned image and shifts 100% traffic after health and runtime invariant checks pass.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: No new mutator introduced.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Required by the main deploy workflow.
- Worker image invariant: Unchanged.
- Feature/env flag update path: None for Home surface selection.
- Live signed-in proof required: Yes, verify `/home` renders the React Home KNOW chat and not `/api/home/v2-frame`.

## Rollback Plan

Rollback by reverting this PR and redeploying only if the React Home KNOW runtime itself fails. Do not restore ACA traffic to a non-main image or manually reintroduce the static Home v2 route.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA deploy evidence: pending after merge.
- Browser proof: pending after deploy.

## Known Gaps

This does not redesign the broader Home conversation quality model. It removes the static fallback and adds a prose-template guard; deeper answer-quality improvements should continue in Home KNOW engine/read-model work.
