# 2026-05-29-section-2-1-i9-industry-isolation — Phase 0B Final Close

## Release ID

`2026-05-29-section-2-1-i9-industry-isolation`

## Status

`candidate`

## Plain-English Summary

This release closes the I9 industry-isolation cleanup from the Codex master backlog Section 2.1. Tenant-facing pattern grounding now uses a scoped `corpus_patterns` compatibility wrapper instead of directly reaching the deprecated canonical-pattern index. The fix applies universally across the five canonical tenants.

## Layer Impact

Agent retrieval layer: Sentinel, Programs Nexus ask, Atlas value grounding, and Context Broker pattern retrieval now call a scoped corpus-pattern index that applies tenant industry plus `cross_industry`.

Corpus layer: `searchCorpus(...)` now degrades correctly when Azure AI Search configuration is missing; Postgres `corpus_patterns` results are still returned.

Control/audit lane: ESLint blocks new tenant-facing direct imports of `searchCanonicalPatternIndex(...)`, and a live smoke command exists for five-tenant I9 verification.

## Client Applicability

- All clients: universal industry isolation across tenant-facing pattern grounding.
- Specific clients: Apex Retail, Meridian Health, Northstar Clinical Technologies, First Capital, SkyHarbor Air.
- Internal only: smoke harness and verification report.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/intelligence/canonical/scoped-corpus-pattern-index.ts`
- `src/lib/intelligence/canonical/scoped-corpus-pattern-index.test.ts`
- `src/lib/intelligence/canonical/industry-ai-pattern.ts`
- `src/lib/intelligence/canonical/normalizers.ts`
- `src/lib/corpus/retrieval.ts`
- `src/lib/corpus/retrieval.test.ts`
- `src/lib/knowledge/context-broker/broker.ts`
- `src/lib/knowledge/context-broker/__tests__/broker.test.ts`
- `src/lib/sentinel/canonical-grounding.ts`
- `src/lib/sentinel/orchestrator.ts`
- `src/lib/programs/nexus-free-text.ts`
- `src/lib/atlas/value-grounding.ts`
- `src/app/api/v1/programs/[programId]/nexus/ask/route.ts`
- `src/__tests__/integration/programs-nexus-ask-route.test.ts`
- `src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts`
- `scripts/smoke/i9-industry-isolation-smoke.ts`
- `package.json`
- `eslint.config.mjs`
- `verification/phase-0/I9_INDUSTRY_ISOLATION_CLOSEOUT.md`

## QA / Validation

- PASS: focused Jest, 6 suites / 54 tests.
- PASS: focused ESLint on changed runtime, test, and config files.
- PASS: live five-tenant I9 smoke via public session-pooler path; zero leaked pattern industries.
- PASS: `searchCorpus(...)` unit regression confirms Postgres corpus results survive Azure AI Search unavailability.
- BLOCKED: full `npx tsc --noEmit --pretty false` remains blocked by pre-existing optional dependency resolution for `@azure/*`, `pptxgenjs`, and `@resvg/resvg-js`.

## Rollout Plan

Merge after CI is green. Vercel production deploy follows the normal Git integration. After deploy, rerun `npm run smoke:i9-industry-isolation` from an environment with production DB reachability and retain the output with the release record.

## Rollback Plan

Revert this PR to restore prior direct canonical-index calls. If reverted, Section 2.1 reopens because the Context Broker follow-up gap and tenant-facing direct canonical-index imports return.

## Audit Evidence

- `verification/phase-0/I9_INDUSTRY_ISOLATION_CLOSEOUT.md`
- Focused Jest output: 6 suites / 54 tests passing.
- Focused ESLint output: clean.
- Live smoke output: five canonical tenants, zero leaked pattern industries.

## Known Gaps

The live smoke returned `no_match` for all five tenants through the reachable `corpus_patterns` path. This is not an I9 leakage failure, but Section 2.2 must quantify and explain corpus population/retrieval depth before Packet 35 Phase 2 authoring begins.
