# 2026-06-05-lakeshore-cxo-hard-question-contract — Lakeshore CXO Hard-Question QA Contract

## Release ID

`2026-06-05-lakeshore-cxo-hard-question-contract`

## Status

`candidate`

## Plain-English Summary

This hardens the Lakeshore 100-question CXO QA harness so hard strategic answers are evaluated against the same executive answer shape expected in live demos: a direct recommendation, evidence-backed reasons, explicit decision owner, concrete next action, and evidence gap. The harness still captures OpenAI-only agent answers and writes JSONL plus an HTML report, but the pass/watch/fail policy is now deterministic and auditable instead of relying solely on free-text judge verdicts. It also restores the normal Clerk sign-in surface as the default production login path while keeping the old demo-code flow behind an explicit test mode.

## Layer Impact

Release lane: `global-control-lane`, `internal-admin`, and `public-demo`.

- `internal-admin`: Improves the internal QA evidence packet used to prove Lakeshore demo readiness and agent depth.
- `global-control-lane`: Changes the default sign-in surface from the legacy demo-code panel to Clerk's hosted sign-in component for all users.
- `public-demo`: Supports demo preparation with a board-grade hard-question report and keeps the legacy demo-code sign-in available only through an explicit `?mode=demo-code` test path.

## Client Applicability

- All clients: The sign-in surface defaults to normal Clerk sign-in for every user.
- Specific clients: Lakeshore Holdings.
- Internal only: QA harness and generated evidence workflow.
- Public/demo only: Demo proof artifact generation and legacy demo-code sign-in mode.
- Feature flag: None.

## Changes Included

- `scripts/lakeshore/cxo-hard-question-qa.mjs`
  - Requires the `My read`, `Why`, `Decision owner`, `What I would do next`, and `Evidence gap` shape.
  - Adds deterministic structural checks for missing answer shape and missing evidence gap.
  - Normalizes verdicts so severe controlled issues fail, controlled issues watch, and clean scored answers pass.
- `scripts/lakeshore/build-buyer-proof-page.mjs`
  - Builds a buyer-facing HTML proof page from captured QA responses and live production screenshots.
  - Shows three side-by-side examples: AbarVa answer, evidence cited, and decision artifact/action.
  - Labels live-loader-backed, loaded-context, design-package, seeded/demo, and live-production screenshot truth.
- `src/app/sign-in/[[...sign-in]]/page.tsx` and `src/components/auth/SignInShell.tsx`
  - Render Clerk's normal sign-in component by default.
  - Preserve the legacy demo-code flow only when `/sign-in?mode=demo-code` is used.

## QA / Validation

- `node --check scripts/lakeshore/cxo-hard-question-qa.mjs`
- `node --check scripts/lakeshore/build-buyer-proof-page.mjs`
- `npx jest src/__tests__/integration/sign-in-shell.test.tsx --runInBand`
- Five-question smoke run with `OPENAI_MODEL=gpt-4o-mini`: `5 pass / 0 watch / 0 fail`.
- Full 100-question Lakeshore hard-question run with `OPENAI_MODEL=gpt-4o-mini`: `88 pass / 12 watch / 0 fail`, average `4.08 / 5`.
- Buyer proof page generated from the final 100-question run plus the live production screenshot crawl: 3 examples, 3 copied PNG assets, `report.html`, and `proof.json`.

## Rollout Plan

Merge to `main` and deploy through the normal Vercel production path. The QA harness is script-only, but the sign-in default is a runtime UI change.

## Rollback Plan

Revert the harness and sign-in shell changes. Generated reports are local/audit artifacts and can be regenerated from the previous harness if needed.

## Audit Evidence

- Smoke output folder: `reports/2026-06-05-lakeshore-cxo-hard-question-qa-contract-smoke3/`
- Full hard-question report folder: `reports/2026-06-05-lakeshore-cxo-hard-question-qa-final4/lakeshore-cxo-hard-question-qa-2026-06-05T20-16-23-176Z-d0215cec/`
- Buyer-facing proof page: `reports/2026-06-05-lakeshore-buyer-proof/abarva-vs-raw-llm-proof/report.html`
- Buyer proof assets: `reports/2026-06-05-lakeshore-buyer-proof/abarva-vs-raw-llm-proof/assets/`
- Sign-in regression test: `src/__tests__/integration/sign-in-shell.test.tsx`

## Known Gaps

The harness is OpenAI-only by design for this run. Sunday dry-run provider parity with Anthropic Claude remains a separate demo exercise. Identity-to-persona switching is still not fully implemented; this release fixes the default sign-in surface but does not add a multi-profile chooser.
