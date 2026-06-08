# 2026-06-08-meridian-answer-contract — Healthcare CXO answer contract for Meridian/PHS synthesis

## Release ID

`2026-06-08-meridian-answer-contract`

## Status

`candidate`

## Plain-English Summary

When a Meridian Health (or any Healthcare-vertical / PHS) user asks Sentinel an
Intelligence question, the answer should read like a senior healthcare AI
transformation partner — specific, evidence-aware, and decision-grade — not
generic AI-strategy prose. This change injects a "healthcare CXO answer
contract" into the synthesis system prompt for Healthcare-vertical tenants only.
The contract instructs the model to produce a concise executive answer with a
decision spine (My read / Why it matters / Evidence basis / Decision fork / What
I'd do next / Value-risk / Evidence gaps / Human approval), to be fluent in
healthcare reality (Epic/EHR, payer-provider economics, Stars/HEDIS/risk
adjustment, MLR pressure, RCM/prior-auth, ambient AI/CDI, CDAO operating model,
clinical governance), to infer the asking role and tailor, and to never
fabricate clinical metrics, Epic module names, vendors, or denial/MLR/Stars
numbers. It also requires human-in-the-loop for any implied clinical action and
forbids patient medical advice.

This is a PROMPT/synthesis-layer change only. No UI, retrievers, routes, or
`sources` event were touched. Non-healthcare tenants (retail / financial
services / airline) are byte-for-byte unaffected — the contract returns an empty
string for them and drops out of the prompt.

## Layer Impact

- `global-control-lane`: shared synthesis prompt for the Sentinel/Nexus
  Intelligence Ask agent. The new contract block is conditionally composed into
  the system prompt; it is feature-gated by tenant vertical rather than by a
  runtime flag. No client data-plane, schema, or RLS change.

## Client Applicability

- All clients: No (gated by vertical).
- Specific clients: Healthcare-vertical tenants only — Meridian Health
  (`meridian` / `meridian-health` alias) and any future Healthcare-vertical
  ClientKey resolved via `getClientOption(...).vertical === 'Healthcare'`.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None — gating is by resolved tenant vertical
  (`isHealthcareAnswerContractTenant`).

## Changes Included

- New: `src/lib/intelligence/synthesis/healthcareAnswerContract.ts` — the
  contract text + `buildHealthcareAnswerContract(clientKey)` /
  `isHealthcareAnswerContractTenant(clientKey)` helpers.
- Edit: `src/lib/intelligence/ask/synthesizer.ts` — import the helper and inject
  the (possibly empty) contract block into `contextBlocks`, just below the
  authoritative tenant-identity pin and the agent-context contract block. The
  existing truthiness filter drops the block for non-healthcare tenants.
- New test: `src/lib/intelligence/synthesis/__tests__/healthcareAnswerContract.test.ts`.
- New: this release record.

## QA / Validation

- Focused unit test —
  `npx jest src/lib/intelligence/synthesis/__tests__/healthcareAnswerContract.test.ts --no-coverage`
  → PASS (9/9). Asserts the contract is present for Meridian / `meridian-health`
  and absent (empty string, no marker) for Apex retail and First Capital /
  arcturus, and that the no-fabrication + human-in-the-loop + no-medical-advice
  language is present.
- ESLint —
  `npx eslint src/lib/intelligence/synthesis/healthcareAnswerContract.ts src/lib/intelligence/synthesis/__tests__/healthcareAnswerContract.test.ts src/lib/intelligence/ask/synthesizer.ts`
  → PASS (0 problems).
- TypeScript —
  `node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.json | grep -E "healthcareAnswerContract|ask/synthesizer"`
  → 0 errors in the changed files (pre-existing repo-wide @azure-rest/@axe-core
  artifacts ignored per AGENTS.md).
- Release check — `npm run release:check -- --base origin/main --head HEAD` → PASS.

## Rollout Plan

Merge to main and deploy via the normal global-control-lane path (Vercel/Azure
control-plane deploy). No migration, no flag flip, no data-plane change. The
contract takes effect on the next Intelligence Ask synthesis call from a
Healthcare-vertical tenant.

## Rollback Plan

Revert the commit. The change is a self-contained prompt module plus one import
and one array entry in the synthesizer; reverting removes the contract entirely
and restores prior synthesis behavior for all tenants. No migration rollback
constraints.

## Audit Evidence

- PR URL: (to be filled on PR open — branch `cursor/meridian-answer-contract`).
- CI: `release:check`, jest, eslint, tsc runs recorded above.
- Diff: `src/lib/intelligence/synthesis/healthcareAnswerContract.ts`,
  `src/lib/intelligence/ask/synthesizer.ts`, and the new test.
- The AI egress is audited as before via `getAuditedAnthropicClient` in
  `synthesizeStream` (workflow `intelligence-ask-synthesis`); the contract text
  is part of the audited prompt.

## Context Ingestion Evidence

Not applicable. No Admin Data Loads, loaders, Azure Blob ingestion, worker
queues, document parsing, embeddings, or retrieval paths were changed. This is a
synthesis-prompt-only change; retrieval and the `sources` event are owned by a
separate agent and untouched here.

## Known Gaps

- The contract is guidance injected into the prompt; it does not deterministically
  guarantee the model emits every spine section. Output quality is validated by
  prompt presence here, not by a live model eval. A live signed-in answer-QA
  pass against a Meridian session (CIO/CDAO/CFO/CMO prompts) is recommended
  before pilot but was not run in this change (Anthropic API + Clerk + Azure
  credentials required; out of scope for a prompt-layer PR).
- Gating uses the resolved client vertical. A health-system tenant onboarded
  without `vertical === 'Healthcare'` in `client-config` would not receive the
  contract; adding such a tenant must set the vertical correctly.
- The `CONCISE_SYSTEM_PROMPT` path (explicit "be concise" asks) still composes
  the contract via the shared `contextBlocks`, so the healthcare contract applies
  there too; the concise role prompt's hard <120-word budget governs length.
- No change to the post-response tenant-isolation / leak guards, which continue
  to protect against cross-tenant bleed.
