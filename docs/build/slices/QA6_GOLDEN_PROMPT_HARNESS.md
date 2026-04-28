# QA6 - Golden Prompt Harness Contract + Seed Library

Slice ID: QA6
Slice name: Golden Prompt Harness Contract + Seed Library
Status: code_complete
Authored: 2026-04-25
Primary agent: Lane F (parallel build pack)
Depends on: (none — companion to QA1, QA2, QA3, QA4, QA5)

## Purpose

QA6 lands the contract for a future founder-facing golden prompt
harness plus a deterministic prompt seed library. The harness is
the acceptance gate for verifying that Nexus, Sentinel, Atlas, and
Steward agents behave honestly across every product surface before
release, demo, or production promotion.

QA6 is documentation + JSON + a lightweight integration test only.
It does not invoke any model, does not boot any server, does not
execute any prompt, and does not hit the network. Execution is
deferred to a later slice.

QA6 sits alongside the existing QA infrastructure:

- QA1 — Agentic Spine Verification Runbook
- QA2 — Solution Workshop Verification Runbook
- QA3 — Solution Intelligence Verification Runbook
- QA4 — Agent Mission Persona Verification Runbook
- QA5 — Route Smoke Inventory (Static, Deterministic)
- QA6 — Golden Prompt Harness Contract + Seed Library (this slice)

## What Changed

- New contract document
  [docs/build/GOLDEN_PROMPT_HARNESS_CONTRACT.md](../GOLDEN_PROMPT_HARNESS_CONTRACT.md)
  - 16 sections (§A through §P) covering purpose, prompt schema,
    pass/fail structure, no-fabrication checks, citation behavior,
    missing-input behavior, readiness wiring, validation modes,
    run cadence, run isolation, future automation, seed library
    shape, out-of-scope notes, why-it-is-safe, how-to-re-run, and
    readiness impact.

- New seed library
  [docs/build/golden-prompts.seed.json](../golden-prompts.seed.json)
  - 43 prompts spread across all 10 product surfaces:
    - `programs` (5)
    - `program_workshop` (4)
    - `deliverables` (4)
    - `intelligence` (5)
    - `tower` (5)
    - `admin` (3)
    - `source` (3)
    - `solution_intelligence` (4)
    - `evidence` (4)
    - `agent_missions` (6)
  - All four agents covered as `expectedAgent` with at least 5
    prompts each (`nexus` 18, `sentinel` 10, `atlas` 6,
    `steward` 5); `system` is the fifth bucket for platform-level
    refusal envelopes (4 prompts).
  - All four `validationMode` values represented: `static_match`
    (13), `structured_match` (18), `behavior_assertion` (10),
    `manual_persona_review` (2).
  - 15 prompts explicitly probe sparse-context handling (the
    prompt body or `expectedBehavior` mentions "sparse",
    "missing", or "without"), well above the §L minimum of 6.
  - No fabricated dollar amounts in any string field
    (regex `/\$[0-9]/`).
  - No fake `E-\d+` citation tokens.
  - No banned placeholder phrases ("Coming soon" / "TBD" /
    "Lorem ipsum").
  - Top-level shape `{ schemaVersion: 1, lastUpdated, prompts }`.

- New integration test
  [src/__tests__/integration/qa/golden-prompts-seed.test.ts](../../../src/__tests__/integration/qa/golden-prompts-seed.test.ts)
  - Loads the seed JSON via `fs.readFileSync` and
    `JSON.parse` — no agent runtime, no network.
  - Asserts JSON parses with the canonical shape
    (`schemaVersion`, `lastUpdated`, `prompts`).
  - Asserts ≥ 40 prompts.
  - Asserts every prompt has every required field with non-empty
    values.
  - Asserts all 10 surfaces are represented and meet their per-
    surface minimums.
  - Asserts all four expected agents appear with ≥ 5 prompts each.
  - Asserts all four validation modes appear at least once.
  - Asserts ≥ 6 prompts whose `prompt` or `expectedBehavior`
    matches the regex `/\b(sparse|missing|without)\b/i`.
  - Asserts no fabricated dollar amounts (`/\$[0-9]/`) in any
    string field of any prompt.
  - Asserts no fake `E-\d+` citation tokens in any string field
    of any prompt.
  - Asserts no banned phrases ("Coming soon", "TBD",
    "Lorem ipsum") anywhere in the JSON.
  - Asserts every prompt id is unique.
  - Asserts every prompt id matches the canonical
    `gp-<surface>-<NNN>` pattern.

- Build slice manifest update
  [docs/build/build-slices.json](../build-slices.json) appends the
  QA6 entry with status `code_complete`, risk `low`,
  `dependsOn: []`, the six-file allowlist, the standard forbidden-
  files list for QA documentation slices, and bumps `lastUpdated`.

- Production readiness manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  - `validation_qa.notes` appends a line acknowledging that QA6
    adds the golden prompt harness contract and 43-prompt seed
    library, with execution still deferred.
  - The `validation_qa` component status is preserved (still
    `tested`, NOT promoted) because no harness is wired yet.
  - No component is promoted. `overallStatus`,
    `overallReadinessPercent`, and component statuses are
    unchanged.
  - `lastUpdated` is bumped to the slice authorship date.

## Coverage Reconciliation

The QA6 seed deliberately over-covers minimums to absorb future
prompt churn without violating thresholds:

| axis | minimum | actual |
|---|---|---|
| total prompts | 40 | 43 |
| surfaces (programs) | 5 | 5 |
| surfaces (program_workshop) | 4 | 4 |
| surfaces (deliverables) | 4 | 4 |
| surfaces (intelligence) | 4 | 5 |
| surfaces (tower) | 4 | 5 |
| surfaces (admin) | 3 | 3 |
| surfaces (source) | 3 | 3 |
| surfaces (solution_intelligence) | 4 | 4 |
| surfaces (evidence) | 4 | 4 |
| surfaces (agent_missions) | 5 | 6 |
| agents (nexus) | 5 | 18 |
| agents (sentinel) | 5 | 10 |
| agents (atlas) | 5 | 6 |
| agents (steward) | 5 | 5 |
| validation_modes | 4 distinct | 4 distinct |
| sparse-context probes | 6 | 15 |

## What Is Explicitly Out Of Scope

- QA6 does not invoke any model. Anthropic, OpenAI, and any
  Model Gateway are out of scope.
- QA6 does not boot any server.
- QA6 does not open a browser, does not use Playwright,
  Puppeteer, or Cypress.
- QA6 does not promote any production-readiness component or
  gate. `validation_qa` remains `tested`. The contract update is
  append-only at the note level.
- QA6 does not modify auth, supabase, migrations, Nexus,
  Sentinel, Atlas, agent runtime, evidence ledger, or product
  code.
- QA6 does not write the future CI gate, the persona crawler, or
  the route-smoke integration.
- QA6 does not write any audit-ledger entry.

## Why It Is Safe

- The contract document is plain Markdown.
- The seed file is plain JSON containing only deterministic
  prompt records. No fabricated dollars, no fake citation tokens,
  no banned placeholder phrases.
- The integration test parses the JSON file from disk and asserts
  shape and coverage; it does not exercise any agent runtime, any
  HTTP fetcher, or any model provider.
- The build-slices and production-readiness manifest updates are
  append-only at the note level. No component is promoted; no
  gate status is changed; `overallReadinessPercent` is left
  untouched.

## How To Re-Run

1. Validate the seed JSON parses:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/golden-prompts.seed.json','utf8')); console.log('golden prompts json ok')"`
2. Run TypeScript:
   `npx tsc --noEmit --pretty false`
3. Run the QA6 jest suite:
   `npx jest src/__tests__/integration/qa/golden-prompts-seed.test.ts`
4. Run the production build:
   `npm run build`
5. Re-parse manifest and slice JSON files:
   `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"`

## Readiness Impact

- Tracker updated: yes (note only).
- Components changed: `validation_qa`.
- Readiness / status changes: none. `validation_qa` stays
  `tested`. No gate is promoted.
- Blockers added or removed: none.
- `nextAction` updated: no.
- Notes added: one line on `validation_qa` recording the QA6
  contract and seed landing, with execution still deferred.

## Future Work (Deferred)

- Wire actual harness execution: load the seed, dispatch each
  prompt against an in-process agent runtime, collect
  `GoldenPromptResult` records, write a `GoldenPromptResultSet`
  artifact.
- Integrate the result set with `production-readiness.json` per
  §G of the contract: emit `golden_prompt_pass_rate` per
  `readinessComponent`, append blockers below threshold.
- Wire the harness into CI: nightly run + per-PR spot-check.
- Compose with QA5 route smoke inventory: a route smoke failure
  that maps to a prompt's `surface` should immediately surface
  the corresponding QA6 prompt for triage.
- Compose with QA4 persona walks: refactor each persona walk
  step into a single golden prompt; persona crawler then drives
  the harness.
