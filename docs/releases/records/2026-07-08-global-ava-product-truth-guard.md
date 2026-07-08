# 2026-07-08-global-ava-product-truth-guard — Global aVa Product Truth + Scope Guard (increment 1)

## Release ID

`2026-07-08-global-ava-product-truth-guard`

## Status

`candidate`

## Plain-English Summary

Now that Moves aVa chat is confirmed live-grounded in the active Move (see `2026-07-08-moves-ava-chat-programid-fix`), the next risk is a *grounded but overconfident* agent: correctly anchored to the right Move/tenant, but still capable of claiming a not-built capability is live, claiming AbarVa replaces or certifies against a named research firm/consultancy (Gartner, Forrester, Big Four), or stating a tenant-specific number that was never supplied. This release adds the first increment of a Global aVa Product Truth + Scope Guard, covering every agent (Nexus/Sentinel/Atlas/Steward) on every surface (Moves/Source/Tower/Home/Intelligence/Setup) through the single shared chat endpoint (`/api/chat/agent/route.ts` — confirmed the only chat backend for all five surfaces).

New module `src/lib/agent/product-truth/`:

- **Product Capability Registry** (`capability-registry.ts`) — a curated, machine-readable subset of `docs/architecture/specialist-catalog.md`'s `not_built`/`partial` entries plus the tenant-gated pilot flags from `src/lib/features/registry.ts` and the public "what AbarVa is NOT" facts from the platform page. Each entry carries a maturity (`shipped`/`partial`/`pilot_tenant_only`/`not_built`), trigger phrases, and honest claim guidance.
- **Surface Scope Registry** (`surface-scope.ts`) — thin registry of what each surface owns vs. must redirect elsewhere (complements the per-agent voice doctrines, which already own tone/word-cap/persona; this owns only the product-truth dimension).
- **Capability-overreach guard** (`capability-claim-guard.ts`) — flags text that frames a not-live/not-built/wrong-tenant capability as definitively live.
- **Third-party replacement guard** (`third-party-replacement-guard.ts`) — flags claims that AbarVa replaces/certifies against/outperforms a named research firm or major consultancy (Gartner, Forrester, McKinsey, Bain, BCG, Deloitte, Accenture, PwC, EY, KPMG).
- **Tenant evidence-claim guard** (`tenant-evidence-claim-guard.ts`) — generalizes the `traceable_to_grounding` pattern already proven in Source's answer-quality-gate: any dollar amount or percentage stated must appear in the grounding text supplied this turn, or it's flagged as unsupported.
- **Suggested-question safety audit** (`suggested-question-audit.ts`) — confirmed suggested questions are static, curated lists (not LLM-generated) across the codebase, so this is an *offline* audit rather than a live filter: a regression test runs it against the real `PHASE_CONFIGS` static list in `StrategicMovePhaseClient.tsx` (now exported for this purpose) and will fail CI if a future edit adds a hallucination-trap question.
- **Composed gate** (`product-truth-gate.ts`) — combines all three live guards; violations-only, no auto-repair (matches the existing voice-doctrine and answer-quality-gate pattern in this codebase — the caller decides what to do with violations).
- **Always-on system-prompt block** (`system-prompt-block.ts`) — injected unconditionally into every chat request's system prompt, alongside the existing global `AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK` (same wiring pattern, same unconditional scope: every agent, every surface, no flag).

## Layer Impact

- **global-control-lane**: new pure library module (no DB access, no side effects) plus a 6-line additive wiring change in the shared chat route (one import, one system-prompt-block entry in the existing block list). One small, safe client change: exported an existing `const` (`PHASE_CONFIGS`) so the suggested-question audit can regression-test the real static content instead of a hand-copied duplicate.
- No schema, migration, or new route.

## Client Applicability

- All clients: Yes — the system-prompt block is unconditional, unflagged, and applies to every tenant on every agent/surface immediately, matching how the existing `AI_DECISION_SUPPORT_SYSTEM_PROMPT_BLOCK` already works.
- Specific clients: N/A.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — this is preventive instruction text, not a new capability; there's nothing to gate.

## Changes Included

- `src/lib/agent/product-truth/` (new): `types.ts`, `capability-registry.ts`, `surface-scope.ts`, `capability-claim-guard.ts`, `third-party-replacement-guard.ts`, `tenant-evidence-claim-guard.ts`, `suggested-question-audit.ts`, `product-truth-gate.ts`, `system-prompt-block.ts`, `index.ts`, and `__tests__/` (5 suites, 25 tests).
- `src/app/api/chat/agent/route.ts` — additive import + one unconditional system-prompt-block entry.
- `src/components/strategic-moves/StrategicMovePhaseClient.tsx` — exported the existing `PHASE_CONFIGS` const (no behavior change) so the suggested-question audit can test the real static list.

## QA / Validation

- `npx jest src/lib/agent/product-truth --runInBand` — 5 suites / 25 tests passed, including a regression test that runs the safety audit against the real `PHASE_CONFIGS.suggestedPrompts` for every Moves phase (currently clean).
- `NODE_OPTIONS='--max-old-space-size=6144' ./node_modules/.bin/tsc --noEmit --pretty false --incremental false` — 0 errors, full repo.
- `npx eslint` on all touched files — 0 errors (1 pre-existing, unrelated unused-var warning in route.ts, confirmed present before this change in earlier releases today).
- Broader regression sweep `npx jest src/lib/agent src/components/strategic-moves src/app/api/chat/agent/__tests__ src/lib/programs/ava-chat --runInBand` — same 12 pre-existing failed suites / 15 pre-existing failed tests as the last confirmed baseline (`2026-07-08-moves-ava-chat-programid-fix`), 927 passed (up from 902 — the +25 new tests), zero new regressions.
- Live signed-in browser proof: scoped for this increment to a sanity check that the additional system-prompt text doesn't degrade the already-proven Moves grounding (see Known Gaps for the broader live-proof scope not yet covered).

## Rollout Plan

Standard Code-lane PR → squash-merge to `main` → `aca-main-deploy.yml` auto-builds and deploys. No flag, no migration — the system-prompt block takes effect for every chat request immediately on the new revision.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` (unchanged).
- Shared runtime mutators: None — deploy only via the repo-owned workflow on merge.
- Approved image digest: whatever `aca-main-deploy.yml` produces for this merge commit (verify via the workflow's own runtime-invariant check, same pattern as every release today).
- ACA runtime invariant: to be confirmed post-deploy.
- Worker image invariant: N/A — no worker-job code touched.
- Feature/env flag update path: N/A — unflagged, unconditional instruction text.
- Live signed-in proof required: Yes — sanity-check Moves chat still grounds correctly with the new block added (regression, not a new capability to prove).

## Rollback Plan

Revert the commit, merge, redeploy. No data migration, no flag to unwind. The new block is pure text appended to the system prompt — reverting removes it cleanly with no other surface affected.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4606 (merged as `6f3e676e7cc0a13c83f7d36d27e59c07cb80dcc6`)
- CI run (all 21 checks passed): https://github.com/abarva-platform/abarva/pull/4606/checks
- Deploy run (success, runtime invariant verified — digest `sha256:e4f09978e075023ad8ad5f4ce0c8a1ae1c32a03598c92cbb2766a8976c4bed1d`): run `28977943627`
- Live sanity-check: `proof/global-ava-product-truth-guard-sanity-2026-07-08/README.md` — confirmed the new global system-prompt block did not regress the already-proven Moves grounding fix (fresh conversation on `RETAIL-LEGAL-2026`/P2 still correctly referenced P2 evidence/gate state and this Move's actual subject; no console errors).

## Known Gaps

- **This is increment 1 of a larger initiative.** Covered: capability-overreach, third-party-replacement, and tenant-evidence-claim guards as pure, tested functions, plus an always-on system-prompt instruction. **Not yet covered, called out explicitly:**
  - The composed `product-truth-gate.ts` (post-hoc detection) is built and unit-tested but **not yet wired to run on the actual generated response** inside the chat route — today it's available for a caller to invoke, matching the same "built but not live-wired" pattern the Moves aVa quality gate had before its own follow-up. Wiring it as a non-blocking telemetry check (matching Intelligence's `outputValidator` pattern) is the natural next increment.
  - **The "100 difficult questions" baseline/rerun the user proposed has not been run as a live LLM exercise.** The 25-test suite plus the real-static-content regression audit are the pure-function baseline; running an actual adversarial question set against live Claude responses (before/after this guard) is a live QA campaign, not something simulated in this release. Recommended as the next concrete follow-up to prove the guard closes real holes, not just passes its own unit tests.
  - **Cross-surface live proof not yet run.** This release wires the block for all agents/surfaces via the single shared route, but live signed-in verification has only been sanity-checked on Moves (where a signed-in session was already available this session). Intelligence, Source, Tower, and Home have not been separately live-checked.
  - **Capability registry is a curated subset, not a full mirror** of `specialist-catalog.md`'s ~67 entries — it currently covers the highest-risk `not_built`/`pilot_tenant_only` items found in this pass. Expanding it as new overclaim risks are found is ongoing maintenance, not a one-time completion.
