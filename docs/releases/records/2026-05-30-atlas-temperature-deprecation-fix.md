# 2026-05-30 · Atlas — drop deprecated `temperature` param on claude-opus-4-7

## Release ID
`2026-05-30-atlas-temperature-deprecation-fix`

## Status
candidate

## Plain-English Summary
Atlas (the Tower agent) was silently running in deterministic-stub mode for every prompt. The Atlas LLM call site in `src/lib/atlas/llm.ts` passed `temperature: ATLAS_TEMPERATURE` (= 0) into `client.messages.create({ model: 'claude-opus-4-7', … })`. Anthropic deprecated the `temperature` parameter on claude-opus-4-7 and now returns `400 invalid_request_error — temperature is deprecated for this model.` The Atlas orchestrator's catch-all converted that 400 into a fallback response, so every Atlas turn surfaced `x-atlas-mode: fallback` with body `"Model unavailable — deterministic read."` This was the exact symptom flagged by the prior 2026-05-30 Tower CXO report.

This release removes the single deprecated `temperature` argument from the call site. Determinism on opus-4-7 is intrinsic to the model family rather than tunable, so we keep the `ATLAS_TEMPERATURE = 0` export to record intent and to fail the regression guard if anyone re-introduces a literal `temperature:` key into the call site. The companion test (`llm-determinism.test.ts`) was updated to require `max_tokens: ATLAS_MAX_TOKENS` in the call site and forbid any `temperature:` key.

## Layer Impact
- `runtime-app-lane`: Atlas LLM path now reaches the model on every turn instead of throwing and falling back. Initiative-deep composition and IAC-grounded answers actually run through claude-opus-4-7. No schema, contract, or response-shape change.
- `architecture-lane`: none. The call-site signature is the only surface touched; `ATLAS_TEMPERATURE` export is retained for guard semantics.
- `qa-validation-lane`: `src/lib/atlas/llm-determinism.test.ts` updated to assert the call site contains `max_tokens: ATLAS_MAX_TOKENS` and forbids any `temperature:` key — locks the regression in place.
- `data-plane-lane`: none.

## Client Applicability
- All clients: yes — Atlas was effectively non-functional (silent fallback) for every tenant. This restores live model responses across the board. Each tenant's correctness, RLS, and tenant-allowlist guards are unchanged.
- Specific clients: none preferentially.
- Internal only: no.
- Public/demo only: no.

## Changes Included
- `src/lib/atlas/llm.ts` — removed `temperature: ATLAS_TEMPERATURE` from the `client.messages.create(...)` argument. `ATLAS_TEMPERATURE = 0` export kept as the regression-guard anchor.
- `src/lib/atlas/llm-determinism.test.ts` — updated to require `max_tokens: ATLAS_MAX_TOKENS` and forbid any `temperature:` key in the call site.

## QA / Validation
- `npx tsc --noEmit` clean.
- `npx jest src/lib/atlas/llm-determinism.test.ts` — passing.
- End-to-end Atlas + IAC audit (`reports/2026-05-30-atlas-iac-e2e/index.html`): pre-fix, 100% of Atlas LLM turns surfaced `x-atlas-mode: fallback`. Post-fix, 90/90 turns ran in `live` mode.
- Required CI gates (ESLint, Typecheck + reasoning-layer tests, Routes and disclaimers, Production readiness gate, hygiene_gate, Verify canonical tenant allowlist, Atlas eval Tier-1/Tier-2) — green on the PR. Vercel Preview failure is pre-existing and unrelated (precedent: PRs #2570, #2572, #2573, #2575, #2576, #2577, #2581).

## Rollout Plan
- Merge this PR to main with `--admin` once required gates are green.
- Vercel auto-deploys main. Atlas LLM path immediately starts reaching claude-opus-4-7 on every turn — verified via `x-atlas-mode: live` response header.
- No feature flag. No staged rollout. The fix is the call site; either it runs or it doesn't.

## Rollback Plan
- Revert this single commit (`git revert <merge-sha>`). Restores the prior `temperature: ATLAS_TEMPERATURE` call-site argument and the prior test expectation. No schema or data migration to undo. Effect of rollback: Atlas returns to 100% silent fallback mode — only roll back if a worse failure is observed live.

## Audit Evidence
- Root cause caught by the 2026-05-30 Atlas + IAC E2E audit: `reports/2026-05-30-atlas-iac-e2e/index.html`. Pre-fix every turn carried `x-atlas-mode: fallback` and body `"Model unavailable — deterministic read."` Post-fix 90/90 turns ran in `live` mode.
- Prior 2026-05-30 Tower CXO report flagged the same symptom from the user-facing side (deterministic-stub answers across initiative-deep composition).
- Anthropic deprecation: claude-opus-4-7 rejects any `temperature` argument with `400 invalid_request_error — temperature is deprecated for this model.` Determinism is intrinsic on this model family.
- Regression guard: `llm-determinism.test.ts` now scans the `llm.ts` source for a forbidden `temperature:` key in the call site, so re-introducing the literal will fail typecheck-tests in CI.

## Known Gaps
- The `ATLAS_TEMPERATURE = 0` export is retained as an intent marker and regression anchor; it is no longer passed to the SDK. If a future model variant re-introduces tunable temperature, the export and call site both need to be reconsidered.
- The Atlas orchestrator's catch-all that converts SDK 400s into `x-atlas-mode: fallback` is unchanged; it is the right behavior for genuine outages but it also masked this deprecation for longer than it should have. A follow-up could distinguish "model unavailable" (fallback) from "request-shape rejected by SDK" (loud error) — out of scope here.
- Other model-bound deprecation surfaces (`top_p`, etc.) are not audited as part of this fix; only the observed `temperature` rejection is addressed.
