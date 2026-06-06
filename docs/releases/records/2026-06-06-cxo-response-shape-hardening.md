# 2026-06-06-cxo-response-shape-hardening — CXO Response Shape Hardening

## Release ID

`2026-06-06-cxo-response-shape-hardening`

## Status

`candidate`

## Plain-English Summary

Sentinel Intelligence answers now preserve paragraph breaks when tenant evidence is present and the synthesis prompt explicitly asks for scan-friendly CXO answers on substantial questions. The change addresses the Meridian/PHS live QA finding that answers were tenant-safe and evidence-backed, but too often rendered as one dense block instead of short recommendation, evidence, decision-fork, and gate sections.

## Layer Impact

- `global-control-lane`: shared Intelligence Ask response behavior changes for all clients.
- `client-data-lane`: no tenant data writes, reloads, migrations, or schema changes. The change only affects how loaded evidence is synthesized and formatted.

## Client Applicability

- All clients: yes, all `/api/intelligence/ask` clients receive paragraph-preservation and the response-shape prompt.
- Specific clients: Meridian/PHS drove the QA finding.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Preserves paragraph breaks in `applyPartialEvidencePolicy` by collapsing horizontal whitespace without flattening newlines.
- Adds a CXO response-shape contract to the Sentinel Intelligence synthesis prompt.
- Adds regression coverage that tenant partial-evidence rewriting keeps blank-line section breaks.

## QA / Validation

- `pass`: `npx jest src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand` — 1 suite, 20 tests passed.
- `pass`: `npx eslint src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts`.
- `pass`: `npm run release:check -- --base origin/main --head HEAD`.
- `pass`: `git diff --check`.
- `not run`: optional post-merge Meridian hard-question rerun to compare dense-block flags.

## Rollout Plan

Merge to main and deploy to Vercel production. The change is active immediately for Intelligence Ask responses.

## Rollback Plan

Revert the PR or roll back the Vercel deployment. There are no schema or data changes.

## Audit Evidence

- Meridian live QA driver: `/private/tmp/nexus-prod-3167/reports/2026-06-06-meridian-hard-question-live-qa/EXECUTIVE_SUMMARY.md`
- PR URL: pending.
- CI run: pending.
- Deployment URL: pending.

## Known Gaps

This improves response shape and paragraph preservation. It does not reload the Meridian profile to Sacramento / 30+ hospitals, and it does not add new provider/plan KPI dictionaries or funding-authority context rows.
