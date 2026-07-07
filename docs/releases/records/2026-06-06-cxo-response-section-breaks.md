# 2026-06-06-cxo-response-section-breaks — CXO Response Section Breaks

## Release ID

`2026-06-06-cxo-response-section-breaks`

## Status

`candidate`

## Plain-English Summary

Ask Intelligence now enforces readable paragraph breaks before CXO section labels such as Evidence, Decision fork, and Risk / gate. This prevents production answers from appearing as one dense paragraph when the model includes the right labels but compresses whitespace.

## Layer Impact

- `global-control-lane`: Shared Intelligence response rendering discipline changes for all tenants using Ask Intelligence.
- `client-data-lane`: No data-plane or tenant-data changes.

## Client Applicability

- All clients: Yes, any Ask Intelligence response can benefit from the section-break formatter.
- Specific clients: Meridian/PHS is the proof target for this patch.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds deterministic CXO section-break enforcement in `src/lib/intelligence/ask/response-policy.ts`.
- Wires the formatter into the Ask synthesis stream before chunking in `src/lib/intelligence/ask/synthesizer.ts`.
- Adds a regression test proving compressed section labels render as separate paragraphs.

## QA / Validation

- PASS: `npx jest src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts --runInBand` passed 2 suites / 27 tests.
- PASS: `npx eslint src/lib/intelligence/ask/response-policy.ts src/lib/intelligence/ask/synthesizer.ts src/lib/intelligence/ask/response-policy.test.ts src/lib/intelligence/ask/__tests__/ask-guardrails.test.ts` completed cleanly.
- PASS: `git diff --check` completed cleanly.
- NOT-RUN: Production Meridian post-deploy sample will run after merge and deployment.

## Rollout Plan

Merge to main and deploy to Vercel production. No migration or operator action is required.

## Rollback Plan

Revert the PR or redeploy the previous production commit. No data rollback is required.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Production proof target: `/private/tmp/nexus-prod-3167/reports/2026-06-06-meridian-response-style-postdeploy/`.

## Known Gaps

This patch only fixes answer readability when section labels are present. It does not change Meridian profile facts, source data, or the remaining evidence-depth gaps from the 50-question QA.
