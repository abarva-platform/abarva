# QA14 — Solution / Workshop Verification Runbook (SOL10–SOL14 + MW7)

Slice ID: QA14
Slice name: Solution / Workshop Verification Runbook
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane G (Wave2 parallel build pack)
Depends on: QA3, SOL8

## Purpose

QA14 lands the founder-facing verification runbook for the
**solution canvas implementation** layer — SOL10 (Canvas UI Shell),
SOL11 (Architecture Draft Read Model), SOL12 (Workshop-to-
Architecture Refinement), SOL13 (Architecture Deliverable Renderer),
SOL14 (Canvas Versioning Layer) — plus the MW7 Workshop Deliverable
Refinement Loop that closes the workshop ↔ deliverable cycle.

It is the fourth runbook in the QA family:

- QA1 covers the agentic spine.
- QA3 covers the solution intelligence library (SOL3–SOL9).
- QA14 covers the canvas implementation slices (SOL10–SOL14) and
  MW7.

The runbook is documentation only. It does NOT ship code, runtime,
migrations, agents, model calls, browser automation, persona
crawlers, or live cloud calls. It is meant to be **walked manually**
after the relevant SOL10–SOL14 / MW7 slices reach `code_complete`.

QA14 ships:

- `docs/build/SOLUTION_WORKSHOP_VERIFICATION_RUNBOOK.md` — 484-line
  founder-facing runbook (the QA2 contents that previously lived
  here are superseded by §A and §I of the
  `SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md`; the file now
  carries the QA14 SOL10–SOL14 + MW7 contents). Sixteen sections:
  §A purpose, §B branch hygiene, §C validation commands, §D SOL10,
  §E SOL11, §F SOL12, §G SOL13, §H SOL14, §I MW7, §J live route
  walk, §K no-fabrication audits, §L design canon, §M production
  readiness checks, §N cherry-pick canonical order, §O morning
  review decision, §P branch / worktree hygiene appendix.
- `docs/build/slices/QA14_SOLUTION_WORKSHOP_VERIFICATION.md` — this
  slice contract.
- `docs/build/build-slices.json` — appended QA14 entry with status
  `code_complete`, lastUpdated `2026-04-26`.
- `docs/build/production-readiness.json` — UNION-update on
  `validation_qa` notes + nextAction; conservative; lastUpdated
  `2026-04-26`. No status promotion.

## What Changed

- Replaced the prior QA2 SOL1 / SOL2 / MW2 / PF2 contents at
  `docs/build/SOLUTION_WORKSHOP_VERIFICATION_RUNBOOK.md` with the
  new QA14 SOL10–SOL14 + MW7 runbook. The QA2 content is preserved
  in spirit by `docs/build/SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md`
  §A and §I, which already references SOL1 / SOL2 / SOL8 / SOL9 and
  the planned canvas implementation slices.
- Added the QA14 slice contract at
  `docs/build/slices/QA14_SOLUTION_WORKSHOP_VERIFICATION.md`.
- Appended a QA14 entry to `docs/build/build-slices.json` with
  this slice's allowedFiles, forbiddenFiles, validationCommands,
  dependsOn, status `code_complete`, risk `low`, ownerAgent
  `Lane G (Wave2 parallel build pack)`, and lastUpdated `2026-04-26`.
- UNION-updated `docs/build/production-readiness.json`: appended
  one note on `validation_qa` acknowledging that QA14 lands as the
  fourth runbook covering SOL10–SOL14 + MW7; conservatively
  appended a single sentence to `validation_qa.nextAction` without
  overwriting prior QA1–QA13 / PROD1–PROD5 / OPS1–OPS8 / WAVE1
  wording; preserved component statuses; bumped top-level
  `lastUpdated` to `2026-04-26`.

## What Is Explicitly Out Of Scope

- QA14 does NOT execute any HTTP request, does NOT start a server,
  does NOT open a browser, does NOT use Playwright / Puppeteer /
  Cypress, and does NOT call into any model provider or external
  service.
- QA14 does NOT promote any production-readiness component or gate.
  `validation_qa` remains `tested`; SOL10–SOL14 / MW7 remain at
  their current statuses (typically `not_started` until each
  implementation slice lands).
- QA14 does NOT modify auth, supabase, migrations, Nexus, Sentinel,
  Atlas, agent runtime, model gateway, source product code, the
  PDEL inventory, or any UI component.
- QA14 does NOT add a CI gate, GitHub Action, persona crawler, or
  pre-commit hook. The runbook is consumed by the founder during
  manual review only.
- QA14 does NOT execute the verification it documents. The runbook
  describes what to check; it does not run the checks itself.

## Why It Is Safe

- Documentation only. No application code, no runtime modification,
  no migrations, no model calls, no live retrieval, no browser
  automation, no live cloud calls.
- The manifest update is append-only at the note / nextAction level
  and does not change any component status, dimension, gate status,
  or overall readiness percent.
- The build-slices.json edit is append-only and conforms to the
  same shape as QA1–QA13.
- The runbook explicitly marks SOL10–SOL14 / MW7 rows as
  *(when wired)* — verifiers must skip them honestly until the
  corresponding implementation slice lands, never silently pass
  rows for absent artifacts.

## How To Re-Run

1. Run TypeScript:
   `cd /Users/anand/Projects/nexus-wave2-qa14 && npx tsc --noEmit --pretty false`
2. Re-parse manifest and slice JSON files:
   `cd /Users/anand/Projects/nexus-wave2-qa14 && node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`
3. Run the production build (the well-known Next.js worktree
   symlink panic is acceptable to mitigate by clearing `.next/`
   and re-running once):
   `cd /Users/anand/Projects/nexus-wave2-qa14 && npm run build`
4. Walk the runbook manually following §B → §C → §D–§I → §J → §K → §L → §M → §O.

## Readiness Impact

- Tracker updated: yes.
- Components changed: `validation_qa` (notes append + nextAction
  UNION). No other component touched.
- Readiness/status changes: none. `validation_qa` stays `tested`.
  `solution_intelligence` is not promoted from this docs-only
  runbook.
- Blockers added or removed: none. The `qa-ci-gates` blocker (if
  present) is preserved verbatim.
- `nextAction` updated: yes (UNION; conservative; never overwrites
  prior QA1–QA13 / PROD1–PROD5 / OPS1–OPS8 / WAVE1 wording).
- Notes added: one row on `validation_qa` recording the QA14
  runbook landing as the fourth founder-facing runbook covering
  SOL10–SOL14 + MW7.
