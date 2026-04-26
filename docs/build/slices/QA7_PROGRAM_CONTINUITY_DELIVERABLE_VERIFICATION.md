# QA7 - Program Continuity + Deliverable Verification Runbook

Slice ID: QA7
Slice name: Program Continuity + Deliverable Verification Runbook
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane H (parallel build pack)
Depends on: PW1, PDEL5

## Purpose

QA7 lands the founder-facing checklist for verifying that the
**program continuity** and **deliverable** surfaces — the workshop
mode shell (PW1), the deliverable artifact canvas renderer (PDEL5),
and any of the deferred MW5 / MW6 / PROG7 / PDEL6 / PDEL7 / PDEL8
slices that may have landed in the same overnight batch — hold the
continuity contract honestly before push or PR.

QA7 is the seventh founder-facing verification runbook, after
QA1 (Agentic Spine), QA2 (Solution / Workshop), QA3 (Solution
Intelligence), QA4 (Agent Mission / Persona), QA5 (Route Smoke
Inventory), and QA6 (Golden Prompt Harness Contract + Seed). It is
deterministic — does not exercise live retrieval or model calls —
and operates strictly in the documentation lane.

QA7 does NOT execute any smoke run, persona crawler, or browser
automation. It does NOT promote any production-readiness
component. `validation_qa` remains `tested`. The runbook only
appends notes / nextAction wording acknowledging that QA7 has
landed.

## What Changed

- New runbook
  [docs/build/PROGRAM_CONTINUITY_DELIVERABLE_VERIFICATION_RUNBOOK.md](../PROGRAM_CONTINUITY_DELIVERABLE_VERIFICATION_RUNBOOK.md):
  - §A Purpose and scope · names PW1 / PDEL5 as required surfaces
    and MW5 / MW6 / PROG7 / PDEL6 / PDEL7 / PDEL8 as
    deferred / conditional surfaces.
  - §B Branch hygiene · worktree-per-slice rule, lane-agents-
    commit-only rule, integration-agent-merges rule.
  - §C Required validation commands · `npx tsc --noEmit
    --pretty false`, `npm run build`, JSON-validity check, plus
    per-slice jest paths (PW1, PDEL5, MW4, MW5, MW6, PROG7, PDEL6,
    PDEL7, PDEL8, PROD2). Conditional jest paths are skipped when
    the matching test file does not exist (the slice has not yet
    landed).
  - §D Persona walks · founder / platform operator,
    Client Maestro programs index, Client Maestro program detail
    (continuity), Client Maestro program detail (deliverables),
    Steward admin.
  - §E Route coverage table · `/tenant/apex-retail/programs`,
    `/tenant/apex-retail/programs/[programSlug]`,
    `/platform/admin/production-readiness`.
  - §F Program continuity verification · workshop mode shell
    visible (PW1), meeting-notes update proposals deterministic
    (MW5 if installed), SME recommendations visible (MW6 if
    installed), resume state present (PROG7 if installed), no
    fake decisions, no fake timestamps.
  - §G Deliverable verification · artifact canvas visible
    (PDEL5), deliverable viewer visible (PDEL7 if installed),
    version state visible (PDEL6 if installed), evidence trace
    visible (PDEL8 if installed), all future actions disabled
    (edit / regenerate / download / approve), no fabricated
    approvals / dollars / `E-###` citations / version strings /
    live model claims.
  - §H No-fabrication checks · no fake citations, no fake
    approvals, no fake dollar amounts, no live model claim
    (gateway is contract-only via MG2).
  - §I Production-readiness tracker verification · 15 canonical
    components, 3 indicators + 20 areas, `overallReadinessPercent`
    ∈ [20, 25], PROD2 returns `passed: true`, no false
    `production_ready` promotions on the QA7-relevant components
    (`programs`, `program_workshop_mode`, `deliverables_artifacts`,
    `data_evidence_knowledge_fabric`, `production_deployment`,
    `validation_qa`).
  - §J Morning review · PR merge rules · keep / amend / discard /
    cherry-pick / push-or-PR decision matrix; integration agent
    owns the cherry-pick and the PR; lane agents commit only;
    founder owns the merge decision; merge requires PROD2
    `passed: true` on the merged manifest.
  - §K Branch hygiene appendix · canonical cherry-pick path
    (PW1 → MW4 → MW5 → MW6 → PROG7 → PDEL5 → PDEL6 → PDEL7 →
    PDEL8 → QA7), worktree hygiene reminders, exact four-line
    QA7 staged set.

- Build slice manifest update
  [docs/build/build-slices.json](../build-slices.json) appends the
  QA7 entry with status `code_complete`, risk `low`,
  `dependsOn: ['PW1', 'PDEL5']`, the four-file allowlist, the
  standard forbidden-files list, and bumps `lastUpdated` to
  `2026-04-26`.

- Production readiness manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  - `validation_qa.notes` appends a row acknowledging that QA7
    adds the program continuity + deliverable verification
    runbook covering PW1 / PDEL5 (and MW5 / MW6 / PROG7 / PDEL6 /
    PDEL7 / PDEL8 if installed). UNIONed conservatively;
    QA1 / QA2 / QA3 / QA4 / QA5 / QA6 wording preserved verbatim.
  - `validation_qa.nextAction` appends a follow-up sentence about
    program continuity and deliverable verification (UNION;
    conservative; never overwrites prior wording).
  - The `validation_qa` component status is preserved (still
    `tested`, NOT promoted) because runbook execution remains
    deferred (no browser, no automation).
  - No other component is promoted. `overallStatus`,
    `overallReadinessPercent`, and component statuses are
    unchanged.
  - `lastUpdated` is bumped to `2026-04-26`.

## What Is Explicitly Out Of Scope

- QA7 does not execute any HTTP request, does not start a server,
  does not open a browser, and does not use Playwright, Puppeteer,
  or Cypress.
- QA7 does not promote any production-readiness component or gate.
  `validation_qa` remains `tested`.
- QA7 does not author or modify the underlying continuity /
  deliverable surfaces (PW1, PDEL5, MW4, MW5, MW6, PROG7, PDEL6,
  PDEL7, PDEL8). Those are owned by their own lanes.
- QA7 does not modify auth, supabase, migrations, Nexus, Sentinel,
  Atlas, agent runtime, model gateway, or source product code.
- QA7 does not import any model provider, does not call the Model
  Gateway, and does not write any audit-ledger entry.
- QA7 does not push, merge, or open a PR. Lane agents commit only;
  the integration agent owns the cherry-pick step; the founder
  owns the merge decision.

## Why It Is Safe

- Documentation only. No application code, no runtime
  modification, no migrations, no model calls, no live retrieval,
  no browser automation.
- The runbook explicitly calls out conditional execution: any of
  MW5 / MW6 / PROG7 / PDEL6 / PDEL7 / PDEL8 may be missing in a
  given batch; the runbook records "deferred" rather than
  failing.
- The manifest update is append-only at the note / nextAction
  level and does not change any component status, dimension, gate
  status, or overall readiness percent.
- The build-slices.json edit is append-only and conforms to the
  same shape as QA1–QA6.

## How To Re-Run

1. Run TypeScript:
   `cd /Users/anand/Projects/nexus-loop-qa7 && npx tsc --noEmit --pretty false`
2. Run the production build:
   `cd /Users/anand/Projects/nexus-loop-qa7 && npm run build`
3. Re-parse manifest and slice JSON files:
   `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"`

## Readiness Impact

- Tracker updated: yes.
- Components changed: `validation_qa` (notes append + nextAction
  UNION).
- Readiness/status changes: none. `validation_qa` stays `tested`.
- Blockers added or removed: none.
- `nextAction` updated: yes (UNION; conservative; never overwrites
  prior QA1–QA6 wording).
- Notes added: one row on `validation_qa` recording the QA7
  runbook landing and that execution is still deferred.
