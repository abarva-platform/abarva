# QA13 - Secret Hygiene Test Pattern Update

Slice ID: QA13
Slice name: Secret Hygiene Test Pattern Update
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane E (parallel build pack)
Depends on: PROD3, PROD4

## Purpose

QA13 lands a single, deterministic source of truth for **secret VALUE
hygiene** so that integration tests catch real token leaks (GitHub
PATs, GitHub App tokens, Vercel API tokens, OpenAI / Anthropic keys,
Slack tokens, AWS access keys, JWTs, `KEY="long_opaque"` env-var
assignments) without producing false positives on **honest
documentation strings** that legitimately name an env var
(`SUPABASE_SERVICE_ROLE_KEY`, `GITHUB_STATUS_TOKEN`) or quote a URL
inside a disclaimer (`"no call to api.github.com is performed"`).

The motivation is concrete: hygiene gates that fire on bare env var
names or honest disclaimer URLs are net-negative. They train
contributors to disable the gate, weaken regexes, or remove honest
documentation. QA13 swaps the broad substring ban with a precise
value-shape check, so hygiene becomes **more precise, not weaker**.

QA13 ships:

- `src/lib/qa/secret-hygiene-patterns.ts` — pure deterministic helper
  module exporting `LIKELY_SECRET_VALUE_PATTERNS`,
  `containsLikelySecretValue(text)`,
  `listLikelySecretFindings(text)`, and
  `assertNoLikelySecretValues(text)`. The pattern catalog covers the
  ten canonical value shapes called out above. Every match returned
  by `listLikelySecretFindings` is truncated to an 8-character prefix
  + ellipsis so a leaked secret is never persisted into test logs or
  CI output. The module exports
  `CREATED_FROM_DETERMINISTIC_SECRET_HYGIENE_SEED` for provenance.
- `src/__tests__/integration/qa/secret-hygiene-patterns.test.ts` —
  Jest suite asserting the public surface, the seven positive cases
  (must flag), the seven negative cases (must NOT flag), the
  truncation contract on `listLikelySecretFindings`, the
  `assertNoLikelySecretValues` throw + structured-message contract,
  and the module-hygiene contract (no live runtime / model provider
  / auth / source / supabase imports; no `Date.now`, no
  `Math.random`, no `new Date(...)`, no `fetch(...)`).
- `src/__tests__/integration/admin/production-readiness-live-refresh.test.ts`
  — adopts the new helper for the response-side check, replacing the
  prior per-pattern-regex-bar inline list with a single
  `assertNoLikelySecretValues(response)` call. The source-code-side
  substring check (`GITHUB_TOKEN|VERCEL_TOKEN|SECRET|SERVICE_ROLE`)
  is preserved verbatim because it guards application code against
  literal env-var-name usage, NOT honest documentation in serialized
  manifests.

QA13 is documentation + test pattern only. It does NOT ship a
runtime, a server route, an API contract, an agent change, or any
auth / supabase / model / migration touch.

## What Changed

- New helper module
  [src/lib/qa/secret-hygiene-patterns.ts](../../../src/lib/qa/secret-hygiene-patterns.ts):
  - `LIKELY_SECRET_VALUE_PATTERNS` ReadonlyArray of `{ name, pattern,
    description }` covering: `github_pat_classic`,
    `github_pat_fine_grained`, `github_app_token`, `vercel_api_token`,
    `openai_or_anthropic_key`, `slack_bot_token`, `slack_user_token`,
    `aws_access_key_id`, `jwt`, and
    `env_var_assignment_with_long_opaque`.
  - `containsLikelySecretValue(text)` returns true if any pattern
    matches; false for honest documentation.
  - `listLikelySecretFindings(text)` returns `{ patternName, match,
    index }[]`. The `match` field is truncated to 8 chars + `...` so
    the secret is never persisted in CI logs.
  - `assertNoLikelySecretValues(text)` throws an Error with a
    structured `patternName@index=truncated_match;...` summary.
  - `CREATED_FROM_DETERMINISTIC_SECRET_HYGIENE_SEED =
    'deterministic_secret_hygiene_seed'` provenance constant.
- New test suite
  [src/__tests__/integration/qa/secret-hygiene-patterns.test.ts](../../../src/__tests__/integration/qa/secret-hygiene-patterns.test.ts):
  - Public surface: every documented pattern name is exposed; every
    entry has a non-empty name + description and a `RegExp`.
  - Positive cases (must flag): canonical real-shape PAT, Anthropic
    `sk-ant-`, OpenAI `sk-`, Slack `xoxb-`, JWT, `KEY="ghp_..."`,
    AWS `AKIA...`.
  - Negative cases (must NOT flag): bare `SUPABASE_SERVICE_ROLE_KEY`,
    `api.github.com` URL substring, `GITHUB_STATUS_TOKEN env var
    name detected via process.env`, `liveStatus is configured when
    tokens present`, `<replace-me>`, `lab_only_change_me`,
    `sk-not-a-real-key`.
  - Truncation contract: returned `match` strings end in `...` and
    never contain the full secret; thrown messages also redact.
  - Module hygiene: no model / runtime / auth / supabase imports;
    no `Date.now`, `Math.random`, `new Date(`, or `fetch(` call
    sites.
- Updated test
  [src/__tests__/integration/admin/production-readiness-live-refresh.test.ts](../../../src/__tests__/integration/admin/production-readiness-live-refresh.test.ts)
  adopts `assertNoLikelySecretValues(response)` for the serialized
  API response check while preserving the source-code substring
  guard. The response-side check is now identical for every
  consumer of the helper, eliminating drift across surfaces.
- Build slice manifest update
  [docs/build/build-slices.json](../build-slices.json) appends the
  QA13 entry with status `code_complete`, risk `low`, the allowed
  files list, the standard forbidden-files list, validation
  commands, dependsOn `PROD3` / `PROD4`, and `lastUpdated`
  preserved at `2026-04-26`.
- Production readiness manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  - `validation_qa.notes` appends a row acknowledging that QA13
    lands the deterministic secret hygiene helper and adopts it on
    the PROD3 live-refresh test. UNIONed conservatively; QA1–QA8 /
    PROD3 / PROD4 wording preserved verbatim.
  - `validation_qa.nextAction` appends a follow-up sentence about
    secret hygiene helper adoption (UNION; conservative; never
    overwrites prior wording).
  - The `validation_qa` component status is preserved (still
    `tested`, NOT promoted) because the helper is read-only and CI
    integration of route smoke / persona crawlers / security scan
    remains deferred.
  - No other component is promoted. `overallStatus`,
    `overallReadinessPercent`, and component statuses are unchanged.
  - `lastUpdated` is set to `2026-04-26`.

## What Is Explicitly Out Of Scope

- QA13 does not execute any HTTP request, does not start a server,
  does not open a browser, does not use Playwright / Puppeteer /
  Cypress, and does not call into any model provider or external
  service.
- QA13 does not promote any production-readiness component or gate.
  `validation_qa` remains `tested`.
- QA13 does not modify auth, supabase, migrations, Nexus, Sentinel,
  Atlas, agent runtime, model gateway, or source product code.
- QA13 does not import any model provider (anthropic / openai /
  cohere) and does not add any audit-ledger entry.
- QA13 does not add a CI gate, GitHub Action, or pre-commit hook.
  The helper is consumed by tests only; broader CI adoption is
  deferred to QA14+.

## Why It Is Safe

- File-pure, deterministic helper module + Jest tests + manifest
  notes only. No runtime modification, no migrations, no model
  calls, no live retrieval, no browser automation, no live cloud
  calls.
- The helper is *strictly more precise* than the prior broad
  substring ban: every honest documentation negative case (env var
  names, URL substrings, placeholders) is asserted to remain
  unflagged. The positive cases assert that real-shape token leaks
  are caught.
- `listLikelySecretFindings` truncates every match to 8 characters
  + `...`, so even if a real secret is ever passed to the helper
  during a test run the secret value never enters the test log or
  CI output.
- The manifest update is append-only at the note / nextAction
  level and does not change any component status, dimension, gate
  status, or overall readiness percent.
- The build-slices.json edit is append-only and conforms to the
  same shape as QA1–QA8.

## How To Re-Run

1. Run TypeScript:
   `cd /Users/anand/Projects/nexus-qa13 && npx tsc --noEmit --pretty false`
2. Run the QA13 helper tests:
   `cd /Users/anand/Projects/nexus-qa13 && npx jest src/__tests__/integration/qa/secret-hygiene-patterns.test.ts`
3. Run the PROD3 live-refresh test (now consuming the QA13 helper):
   `cd /Users/anand/Projects/nexus-qa13 && npx jest src/__tests__/integration/admin/production-readiness-live-refresh.test.ts`
4. Re-parse manifest and slice JSON files:
   `cd /Users/anand/Projects/nexus-qa13 && node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`
5. Run the production build (the well-known Next.js worktree
   symlink panic is acceptable to mitigate by clearing `.next/`
   and re-running once):
   `cd /Users/anand/Projects/nexus-qa13 && npm run build`

## Readiness Impact

- Tracker updated: yes.
- Components changed: `validation_qa` (notes append + nextAction
  UNION).
- Readiness/status changes: none. `validation_qa` stays `tested`.
- Blockers added or removed: none. The `qa-ci-gates` blocker is
  preserved verbatim.
- `nextAction` updated: yes (UNION; conservative; never overwrites
  prior QA1–QA8 / PROD3 / PROD4 wording).
- Notes added: one row on `validation_qa` recording the QA13 helper
  landing and the PROD3 live-refresh adoption.
