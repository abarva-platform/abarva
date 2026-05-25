# 2026-05-25-sentinel-tenant-pin-fix — Sentinel Tenant Isolation Prompt Fix

## Release ID

`2026-05-25-sentinel-tenant-pin-fix`

## Status

`candidate`

## Plain-English Summary

This release removes a hardcoded Apex Retail tenant pin from Sentinel prompt construction. Before this fix, reusable Sentinel instructions could tell the model that Apex Retail was the active tenant or bias non-Apex conversations toward Apex/retail examples. Meridian and First Capital users now receive tenant-neutral isolation instructions that keep answers inside the authenticated tenant unless the user explicitly asks for a cross-tenant comparison.

## Layer Impact

- `agent-quality-lane`: Replaces Apex-favoring Sentinel and Source doctrine examples with tenant-neutral examples and adds a smoke test to prevent regression.
- `app-control-lane`: Changes the generic agent route fallback from `Apex Retail Group` to `Unknown active tenant` so missing tenant resolution no longer fails open to Apex.

## Client Applicability

- All clients: Sentinel tenant-isolation behavior applies to every authenticated tenant.
- Specific clients: Fix was requested because Meridian could receive Apex facts.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `src/lib/intelligence/ask/synthesizer.ts` removes the Apex-only tenant-isolation sentence and replaces it with tenant-neutral isolation rules.
- `src/lib/agent/voice-doctrine/sentinel.ts` removes reusable Apex-biased Source/Sentinel examples and company-profile language.
- `src/app/api/chat/agent/route.ts` removes the Apex fail-open tenant fallback and derives the Source seed account label from surface context.
- `scripts/smoke/sentinel-tenant-pin.spec.ts` asserts the old Apex pin and fail-open fallback cannot return.
- `package.json` adds `npm run smoke:sentinel-tenant-pin`.
- `src/lib/agent/voice-doctrine/__tests__/sentinel.test.ts` updates expected doctrine language to the tenant-neutral contract.

## QA / Validation

- pass: `npm run smoke:sentinel-tenant-pin`
- pass: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/agent/voice-doctrine/sentinel.ts src/app/api/chat/agent/route.ts scripts/smoke/sentinel-tenant-pin.spec.ts src/lib/agent/voice-doctrine/__tests__/sentinel.test.ts`
- pass: `npx jest src/lib/agent/voice-doctrine/__tests__/sentinel.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand`
- pass: `git diff --check`

## Rollout Plan

Merge PR #2342 to `main`. Vercel production deployment follows the existing Git integration. After production deploy completes, run the Meridian full-module stress test against the fixed deployment.

## Rollback Plan

Revert PR #2342. Rollback restores the prior prompt text and generic agent fallback only; there is no database migration or tenant data mutation.

## Audit Evidence

- PR #2342: `https://github.com/anandsundaram-hash/abarva/pull/2342`
- Local smoke, ESLint, focused Jest, and `git diff --check` outputs from the branch.
- Follow-up Meridian stress-test report will be generated under `audit-artifacts/full-module-stress-meridian-*`.

## Known Gaps

This release fixes prompt construction. It does not itself run the full-module stress test or repair any defects the stress test may find.
