# 2026-06-09-agent-claim-citation-validation — Validate governed agent claims and citations

## Release ID

`2026-06-09-agent-claim-citation-validation`

## Status

`candidate`

## Plain-English Summary

Adds post-response validation for governed Nexus/Sentinel answers. It detects
the major claims an answer made (value, KPI/outcome, system/vendor,
architecture, technology-stack, company-scale, leadership/org, sourcing
recommendation, risk/failure-mode, next-action), maps each to supporting
evidence in the PR-1 context-bundle trace, and flags the unsupported ones —
marking factual claims with no backing as critical. It validates cited corpus
pattern ids against the tenant's grounding namespace (industry scope), not just
global existence: a phantom id (exists nowhere) and a cross-namespace id (valid
elsewhere, wrong industry) are both rejected, and lookups are case-insensitive
so a real lowercase slug cited in upper-case is not falsely marked absent. It
also detects cross-tenant leakage (the answer naming another canonical tenant).
The Sentinel intelligence route now runs this validation on each answer, stamps
the trace's `claim_validation_status` and `tenant_isolation_status`, and emits
the findings on a `validation` event so the UI/API payload can surface them.

## Layer Impact

- `global-control-lane`: new pure validation library `src/lib/agent-claims/`
  plus a non-blocking validation step on the Sentinel intelligence ask route.
  Answer content is unchanged; validation runs after the answer is assembled
  and can never fail the response (wrapped in try/catch).

## Client Applicability

- All clients: Yes — validation applies to every tenant's governed answers.
- Specific clients: n/a
- Internal only: Findings are operations/audit-facing (trace + a structured
  payload event).
- Public/demo only: n/a
- Feature flag: inherits `AGENT_TRACE_ENABLED` for emission; validation itself
  is always computed but only surfaced when findings exist.

## Changes Included

- `src/lib/agent-claims/{types,detect,validate,index}.ts` — claim detection,
  evidence mapping, namespace validation, leakage detection.
- `src/app/api/intelligence/ask/route.ts` — runs validation, stamps trace
  verdicts, emits a `validation` event.
- `src/__tests__/behaviors/agent-claims.test.ts` — 13 cases.

## QA / Validation

- `npx jest src/__tests__/behaviors/agent-claims.test.ts` → 13/13 pass.
- `npx tsc --noEmit` → clean on touched files.
- `npx eslint` on touched files → 0 errors.
- `npm run audit:architecture-rules` and `npm run release:check` → green.
- Phantom detection against the live Azure pattern catalog requires the injected
  `PatternCatalog` (wired in the PR-5 harness on Azure Container Apps); without a
  catalog the route still performs cross-namespace checks from the trace's own
  pattern namespaces and full leakage + claim-support checks.

## Rollout Plan

Merge to `main` after CI is green (depends on PR-1 + PR-3 on `main`). The
Sentinel route change is additive and non-blocking; no migration, no flag flip.
Deploy with the next Azure Container Apps image.

## Rollback Plan

Revert the PR. The validation step is wrapped in try/catch and runs after the
answer is produced, so a rollback has zero answer-path impact. The library has
no other runtime callers.

## Audit Evidence

- PR URL: (filled on open against `abarva-platform/abarva`).
- Test log: 13/13 behavior cases pass.
- Trace verdicts: `claim_validation_status` / `tenant_isolation_status` on
  `public.agent_context_traces`.

## Context Ingestion Evidence

Not applicable. No ingestion, parsing, staging, embedding, or commit. The
library reads an answer string + a context-bundle trace and (optionally) an
injected pattern catalog.

## Known Gaps

- Claim detection is heuristic/text-based (no model); the LLM judge (PR-5)
  refines subjective support. It can over- or under-detect on unusual phrasing.
- Live phantom-id detection needs the injected `PatternCatalog` (PR-5 harness).
- Nexus (Moves) route is not yet wired to surface validation findings on its SSE
  payload (the lib is route-agnostic; Sentinel is wired first).
