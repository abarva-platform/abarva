# 2026-05-30-phase5-partial-evidence-policy — Ask Partial-Evidence Policy

## Release ID

`2026-05-30-phase5-partial-evidence-policy`

## Status

`candidate`

## Plain-English Summary

Sentinel Ask now treats partial tenant evidence more usefully. When SkyHarbor or another tenant has loaded sources that answer part of a question, Sentinel should lead with the facts it can prove and name the one remaining field to confirm instead of sounding like the entire context is unavailable.

## Layer Impact

- `global-control-lane`: Updates the shared Ask synthesis policy for authenticated Intelligence/Sentinel turns. The change is limited to answer wording after evidence retrieval succeeds; it does not change retrieval, scoring, verifier logic, database schema, RLS, or deployment scripts.
- `release-governance-lane`: Records Phase 5 partial-evidence scope, QA, rollout, rollback, and the remaining production verifier dependency.

## Client Applicability

- All clients: Yes, for authenticated Ask/Sentinel responses with tenant, surface, or graph sources.
- Specific clients: SkyHarbor benefits directly for AWS EDP / IBM modernization verifier prompts.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a partial-evidence response-policy normalization that only activates when tenant evidence is present.
- Wires the normalization after full-response Ask synthesis sanitization, before streaming chunks to the UI.
- Strengthens the Ask system prompt with explicit partial-evidence wording for EDP and similar questions.
- Adds focused tests for the CTO-Q20-style AWS EDP true-up missing sub-field case and for no-source no-fabrication behavior.

## QA / Validation

- PASS: `npm ci --ignore-scripts`.
- PASS: `npx jest src/lib/intelligence/ask/response-policy.test.ts --runInBand`.
- PASS: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts src/lib/intelligence/ask/response-policy.test.ts --runInBand`.
- PASS: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/synthesizer.ts`.
- PASS: `npm run release:check -- --base origin/main --head HEAD`.
- PASS: `git diff --check`.
- Environment note: validation ran under local Node `v25.9.0`; repo guidance requests Node 24.x.
- Not run in this slice: production SkyHarbor verifier reruns; parent owns the final verifier gate.

## Rollout Plan

Merge to `main` after PR checks pass and let the normal Vercel production deploy pick up the app change. No environment variable, migration, seed, RLS, or manual deploy-script change is required.

## Rollback Plan

Revert the application commit to remove the Ask partial-evidence post-synthesis policy and prompt addition. There is no data rollback, migration rollback, or RLS rollback.

## Audit Evidence

- Policy implementation: `src/lib/intelligence/ask/response-policy.ts`.
- Synthesizer hook and prompt instruction: `src/lib/intelligence/ask/synthesizer.ts`.
- Regression coverage: `src/lib/intelligence/ask/response-policy.test.ts`.
- Source verifier artifact inspected: `/tmp/phase4-verifier-official-1/raw-events/CTO-Q20.json`.
- PR URL: pending.

## Known Gaps

Final acceptance still needs the parent-owned SkyHarbor production verifier rerun on the deployed main build: three consecutive runs at >=23/25 and unavailableAdmissionRate <10%.
