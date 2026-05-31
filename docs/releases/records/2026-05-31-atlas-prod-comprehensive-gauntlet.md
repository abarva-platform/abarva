# 2026-05-31-atlas-prod-comprehensive-gauntlet — Atlas Production CXO Gauntlet

## Release ID

`2026-05-31-atlas-prod-comprehensive-gauntlet`

## Status

`candidate`

## Plain-English Summary

Expands the production Atlas/Tower smoke harness into a comprehensive CXO gauntlet. The harness logs into production as Apex Retail, Meridian Health, and SkyHarbor Air, loads Tower, asks a broad deck of executive questions, validates answers for tenant leaks, fallback mode, raw internal IDs, system/error copy, jargon, and missing next actions, then logs out and writes HTML/JSON evidence.

## Layer Impact

- `global-control-lane`: adds a reusable production QA harness and npm script for Atlas/Tower answer quality and tenant-scope verification.
- `internal-admin`: improves AbarVa operator evidence for pilot readiness; no customer-facing runtime route changes.

## Client Applicability

- All clients: no runtime behavior change.
- Specific clients: the production gauntlet currently covers Apex Retail, Meridian Health, and SkyHarbor Air.
- Internal only: yes, QA harness/reporting only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/qa/atlas-prod-comprehensive-surface.ts`: expands the production question deck to 56 prompts per tenant and adds CXO answer-quality scoring.
- `src/lib/agent/response-shape.ts`: scrubs internal evidence-plumbing terms and prevents ordinary Tower prose from being converted into a fake comparison table.
- `src/lib/agent/quality/cxo-answer-quality.ts`: recognizes the visible `- Next:` answer bullet as an actionable next-step cue.
- `package.json`: adds `npm run qa:atlas-prod-comprehensive`.
- `docs/releases/records/2026-05-31-atlas-prod-comprehensive-gauntlet.md`: release record.

## QA / Validation

Candidate validation before PR:

- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npx eslint scripts/qa/atlas-prod-comprehensive-surface.ts src/lib/agent/response-shape.ts src/lib/agent/__tests__/response-shape.test.ts src/lib/agent/quality/cxo-answer-quality.ts src/lib/agent/quality/__tests__/cxo-answer-quality.test.ts`
- Pass: `npx jest src/lib/agent/__tests__/response-shape.test.ts src/lib/agent/quality/__tests__/cxo-answer-quality.test.ts --runInBand`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Fail: initial live production gauntlet completed 168/168 HTTP 200 with 0 fallback and 0 leaks, but only 43/168 turns passed the stricter CXO answer-quality score. Runtime response-shaping fixes were added after this finding; rerun pending.

## Rollout Plan

Merge to `main`. No database migration or feature flag is required. Operators can run the production gauntlet with:

```bash
npm run qa:atlas-prod-comprehensive
```

## Rollback Plan

Revert the PR. Because this is a QA harness and package script only, rollback has no runtime or data-plane side effects.

## Audit Evidence

- PR URL and merge SHA once merged.
- CI checks for TypeScript, ESLint, release record, hygiene gate, and Atlas eval.
- Live gauntlet evidence: `reports/2026-05-31-atlas-prod-comprehensive-surface/index.html` and `raw.json`.

## Known Gaps

This PR makes the harness stricter and broader. Any failures found by the live 168-turn gauntlet should be fixed in follow-up runtime PRs and linked back to the generated HTML report.
