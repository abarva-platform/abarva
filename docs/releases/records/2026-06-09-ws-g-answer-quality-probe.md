# 2026-06-09-ws-g-answer-quality-probe — Live answer-quality probe (WS-G)

## Release ID

`2026-06-09-ws-g-answer-quality-probe`

## Status

`candidate`

## Plain-English Summary

Adds a server-side probe that drives the real Sentinel answer engine
(`askIntelligence`) against a tenant's golden questions and scores each answer
with the governed validation stack — tenant grounding, citation emission, claim
support, derived answerability, and cross-tenant leakage. It runs in-VNet on
Azure Container Apps (DB + ANTHROPIC) and emits NDJSON per question plus a
summary. Every number comes from a real answer; nothing is fabricated. This is
the executable basis for the WS-G live answer-quality proof.

## Layer Impact

- `ops-release-lane` / `global-control-lane`: a new QA script under
  `src/scripts/qa/`. No runtime/answer-path change; it consumes the existing
  answer engine read-only and the merged validation libs (PR-1/3/4, WS-D).

## Client Applicability

- All clients: the probe is tenant-parameterized (default SkyHarbor).
- Internal only: QA/governance tooling.

## Changes Included

- `src/scripts/qa/agent-answer-quality-probe.ts`

## QA / Validation

- `npx tsc --noEmit` / `npx eslint` → clean on the probe.
- `npm run audit:architecture-rules` / `release:check` / `validate:context-corpus`
  → green.
- **Live run:** executed in-VNet via an Azure Container Apps job (image built
  with this probe; secrets referenced from Key Vault). Results captured from the
  job logs — see the WS-G verification note.

## Rollout Plan

Merge to `main`. The probe is invoked as an ACA job (`npx tsx
src/scripts/qa/agent-answer-quality-probe.ts <tenantKey> [limit]`) with the
runtime identity + KV-backed DATABASE_URL / ANTHROPIC_API_KEY.

## Rollback Plan

Revert the PR. Read-only QA script; no data effect.

## Audit Evidence

- PR URL: (filled on open).
- Live ACA job logs (NDJSON per-question results + summary).

## Context Ingestion Evidence

Not applicable. The probe reads/answers; it loads/commits nothing.

## Known Gaps

- The subjective rubric dimensions (judgment/specificity/usefulness) are not
  scored by an injected judge in this probe — it measures the deterministic,
  governed signals (grounding, citations, claim support, leakage, answerability)
  on real answers. An Anthropic judge can be layered on next.
