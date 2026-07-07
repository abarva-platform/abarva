# 2026-06-01-wave-4-portfolio-qa-suite — Wave 4 Portfolio QA Suite

## Release ID

`2026-06-01-wave-4-portfolio-qa-suite`

## Status

`candidate`

## Plain-English Summary

This release adds the QA evidence packet for Wave 4 portfolio sequencing. It verifies that Tower and Sentinel sequencing outputs are client-scoped, readable by a CXO, and do not expose raw internal artifacts like signal IDs or tenant fields.

## Layer Impact

- global-control-lane: Adds tests and evidence for shared portfolio-sequencing behavior across the control plane.
- internal-admin: Adds audit evidence for AbarVa operators reviewing whether Wave 4 is safe to promote.

## Client Applicability

- All clients: QA rules apply to shared sequencing behavior.
- Specific clients: Apex Retail, Meridian Health, and SkyHarbor Air are covered in the fixture matrix.
- Internal only: Evidence docs are internal release artifacts.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds Wave 4 portfolio contract tests.
- Adds Wave 4 answer-quality known-good and known-bad fixtures.
- Adds a Playwright static-render E2E spec for the portfolio sequencing surface.
- Adds `docs/build/WAVE-4-QA-EVIDENCE-2026-05-31.md`.

## QA / Validation

- Pass: `npx jest src/lib/tower/__tests__/wave-4-portfolio-contract.test.ts src/lib/eval/answer-quality/__tests__/wave4-portfolio-fixtures.test.ts --runInBand`
- Pass: `npx playwright test tests/e2e/wave-4/portfolio-sequence-surface.spec.ts --project=chromium`
- Pass: `npx eslint src/lib/tower/__tests__/wave-4-portfolio-contract.test.ts src/lib/eval/answer-quality/__tests__/wave4-portfolio-fixtures.test.ts tests/e2e/wave-4/portfolio-sequence-surface.spec.ts`
- Pass: `npx tsc --noEmit --pretty false`
- Pass: `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to main. This is a QA-only release and has no runtime behavior change. The evidence packet becomes the audit basis for the Wave 4 L6 human go/no-go.

## Rollback Plan

Revert this PR. Because this release only adds tests and docs, rollback does not affect runtime behavior.

## Audit Evidence

- PR URL: pending.
- QA evidence: `docs/build/WAVE-4-QA-EVIDENCE-2026-05-31.md`.
- Main production proof before this QA PR: Reasoning Layer Guard `26774163711` and Post-deploy crawl `26774163735` passed on #2724.

## Known Gaps

- Live Sentinel chat-route wiring is not included in this QA slice; this packet verifies the deterministic broker helper and Tower render path.
