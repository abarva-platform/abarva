# 2026-06-14-phs-health-plan-corpus - PHS Health Plan Strategy Corpus

## Release ID

`2026-06-14-phs-health-plan-corpus`

## Status

`candidate`

## Plain-English Summary

Adds a governed starter corpus for Meridian/PHS health-plan strategy work. The corpus covers Kiran's pilot use-case families as strategy patterns, not transactional data: payment integrity, prior authorization modernization, provider quality, call-center/member experience, cost transparency, governed data foundation, and finance close/reporting.

The change creates review-ready corpus pattern inputs and verification/load scripts. It does not publish patterns, create embeddings, index Azure AI Search, or mark anything `agent_ready`.

## Layer Impact

- Client data lane: adds health-plan-specific corpus authoring inputs that can support Meridian/PHS pilot strategy conversations after review and load.
- Global control lane: adds reusable corpus verification and dry-run/load scripts for the canonical `corpus_patterns` tables.

## Client Applicability

- All clients: no automatic runtime change.
- Specific clients: Meridian/PHS pilot corpus authoring baseline.
- Internal only: corpus authoring, verification, and loader scripts.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `src/lib/corpus/seeds/phs-health-plan-patterns.ts`
- `src/scripts/corpus/verify-phs-health-plan-corpus.ts`
- `src/scripts/corpus/load-phs-health-plan-corpus.ts`
- `package.json` scripts:
  - `verify:phs-health-plan-corpus`
  - `corpus:phs-health-plan:dry-run`
  - `corpus:phs-health-plan:load`
- Follow-up loader hardening: casts the source starter id parameter in the version snapshot query so Postgres can infer the JSON object value during ACA apply runs.

## QA / Validation

Validation status before PR:

- Pass: `npm run verify:phs-health-plan-corpus`
- Pass: `npm run corpus:phs-health-plan:dry-run`
- Pass: `npm run verify:meridian-data-pack`
- Pass: `npm run verify:meridian-context-showcase`
- Pass: `npx eslint src/lib/corpus/seeds/phs-health-plan-patterns.ts src/scripts/corpus/verify-phs-health-plan-corpus.ts src/scripts/corpus/load-phs-health-plan-corpus.ts`
- Pending at authoring time: `npx tsc --noEmit --pretty false`
- Pending at authoring time: `npm run release:check -- --base origin/main --head HEAD`
- Pass after merge in CI: Typecheck + reasoning-layer tests.
- Pass after merge in CI: ESLint, context corpus governance gate, release control gate, and hygiene gate.
- Blocked then fixed in live ACA apply: initial apply found a Postgres parameter inference error in the loader version snapshot query; follow-up patch adds the explicit `$2::text` cast.

## Rollout Plan

Merge to `main`. No Azure deployment is required for the dry-run/verifier scripts. To load rows into the private Azure data plane later, run `npm run corpus:phs-health-plan:load` from an approved ACA/VNet operator job so it can reach the private Postgres database. The loader writes draft or in-review corpus rows only; publishing/indexing remains a separate governed action.

## Rollback Plan

Revert the PR to remove the seeds and scripts. If the loader has been explicitly run with `--apply`, retire or delete the affected draft/in-review corpus rows by slug after review; no published rows or embeddings are created by this release.

## Audit Evidence

- PR URL after opening.
- CI validation results.
- Local dry-run output showing seven canonical patterns and no publish/index/promotion action.

## Known Gaps

- Patterns are not published, embedded, indexed, or agent-ready in this slice.
- No PHI, PII, raw claims, member identifiers, raw call transcripts, or patient-level transaction data is included.
