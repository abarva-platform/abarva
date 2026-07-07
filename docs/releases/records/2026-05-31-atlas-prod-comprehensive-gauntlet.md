# 2026-05-31-atlas-prod-comprehensive-gauntlet — Atlas Production CXO Gauntlet

## Release ID

`2026-05-31-atlas-prod-comprehensive-gauntlet`

## Status

`candidate`

## Plain-English Summary

Expands the production Atlas/Tower smoke harness into a comprehensive CXO gauntlet and hardens the answer surface defects it caught. The harness logs into production as Apex Retail, Meridian Health, and SkyHarbor Air, loads Tower, asks a broad deck of executive questions, validates answers for tenant leaks, fallback mode, raw internal IDs, system/error copy, jargon, and missing next actions, then logs out and writes HTML/JSON evidence.

## Layer Impact

- `global-control-lane`: adds a reusable production QA harness and npm script for Atlas/Tower answer quality and tenant-scope verification.
- `global-control-lane`: hardens customer-facing Atlas/Tower answer shaping for raw record IDs, internal evidence-plumbing terms, missing next actions, and over-broad strategy-refusal routing.
- `internal-admin`: improves AbarVa operator evidence for pilot readiness.

## Client Applicability

- All clients: Atlas/Tower answers get safer and clearer shaping for internal IDs, evidence-language, and next-action completeness.
- Specific clients: the production gauntlet currently covers Apex Retail, Meridian Health, and SkyHarbor Air.
- Internal only: yes, QA harness/reporting only.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/qa/atlas-prod-comprehensive-surface.ts`: expands the production question deck to 56 prompts per tenant and adds CXO answer-quality scoring.
- Follow-up: corrects two harness scoring edges found during the post-deploy rerun: SkyHarbor has no Copilot-specific initiative, so the Copilot deep-dive assertion is tenant-conditional; and transient 5xx Atlas API responses are retried before the turn is marked failed.
- `src/lib/agent/response-shape.ts`: scrubs internal evidence-plumbing terms, prevents ordinary Tower prose from being converted into a fake comparison table, and appends a concrete Tower next action when a response otherwise lacks one.
- `src/lib/agent/output-discipline/response-contract.ts`: strips bare UUID-style record IDs so users do not see internal signal identifiers.
- `src/lib/atlas/classifier.ts`: narrows the strategy-refusal rule so "what should we watch?" board-language context questions route to the live answer path instead of a refusal.
- `src/lib/agent/quality/cxo-answer-quality.ts`: recognizes the visible `- Next:` answer bullet as an actionable next-step cue and treats structured executive lists as scan-friendly rather than wall-of-text failures.
- `package.json`: adds `npm run qa:atlas-prod-comprehensive`.
- `docs/releases/records/2026-05-31-atlas-prod-comprehensive-gauntlet.md`: release record.

## QA / Validation

Candidate validation before PR:

- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npx eslint scripts/qa/atlas-prod-comprehensive-surface.ts src/lib/atlas/classifier.ts src/lib/atlas/classifier.test.ts src/lib/agent/response-shape.ts src/lib/agent/output-discipline/response-contract.ts src/lib/agent/__tests__/response-shape.test.ts src/lib/agent/quality/cxo-answer-quality.ts src/lib/agent/quality/__tests__/cxo-answer-quality.test.ts`
- Pass: `npx jest src/lib/agent/__tests__/response-shape.test.ts src/lib/agent/quality/__tests__/cxo-answer-quality.test.ts src/lib/atlas/classifier.test.ts --runInBand`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Fail before fixes: live production gauntlet completed 168/168 HTTP 200 with 0 fallback, 0 leaks, 0 timeout copy, and clean login/logout for all three tenants, but only 54/168 turns passed the stricter CXO answer-quality score. The failures clustered around missing next actions, internal terms such as `substrate`, raw/symbolic record references, and over-broad strategy-refusal routing.
- Post-fix local projection over the same captured production responses: 129/168 pass before deployment, with remaining findings downgraded to low-severity readability warnings. A fresh live production rerun is required after merge/deploy to confirm deployed behavior.
- Final post-deploy rerun after PR #2680 and harness correction: 168/168 turns passed across Apex Retail, Meridian Health, and SkyHarbor Air. 168/168 returned HTTP 200, 0 fallback, 0 tenant leaks, 0 timeout/system copy, 0 weak implementation/tool copy, 12 four-section answers rendered where 6 were explicitly expected, 3/3 tenant sessions logged in and logged out cleanly. Evidence is captured in `reports/2026-05-31-atlas-prod-comprehensive-surface/`.

## Rollout Plan

Merge to `main`. No database migration or feature flag is required. Operators can run the production gauntlet with:

```bash
npm run qa:atlas-prod-comprehensive
```

## Rollback Plan

Revert the PR. The QA harness has no data-plane side effects. The runtime answer-shaping and classifier changes are optional customer-facing hardening, so rollback restores the prior Atlas/Tower answer behavior without schema or migration impact.

## Audit Evidence

- PR URL and merge SHA once merged.
- CI checks for TypeScript, ESLint, release record, hygiene gate, and Atlas eval.
- Live gauntlet evidence: `reports/2026-05-31-atlas-prod-comprehensive-surface/index.html` and `raw.json`.

## Known Gaps

This PR makes the harness stricter and broader and fixes the first defect cluster it found. A post-deploy live production rerun remains required to replace the pre-fix HOLD report with a final GO/HOLD report from deployed code.
