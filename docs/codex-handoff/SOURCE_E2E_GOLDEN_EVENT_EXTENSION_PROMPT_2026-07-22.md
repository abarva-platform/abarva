# Source end-to-end test — extend the golden event to cover SOURCE-SHELL-003/004/005/006-007 — Codex prompt (2026-07-22)

## Why this exists

This session shipped four real, live Source features with only unit/component-level test
coverage: `SOURCE-SHELL-003` (per-event Approvals ledger), `SOURCE-SHELL-004` (artifact
acceptances — a separate "accept as authoritative" action from the stage gate),
`SOURCE-SHELL-005` (real per-vendor lever coverage on the Responses stage), and
`SOURCE-SHELL-006`/`007` (a stage-view fallback bug fix spanning all 11 stages). None of them
have ever been exercised end-to-end through the real UI/API across a realistic, complex,
multi-stage event. The user asked for exactly that: an e2e test of a "sample event of
complexity."

Before writing this prompt, the actual state of this repo's e2e infrastructure was verified on
disk — not assumed. Two important corrections to what a naive prompt would get wrong:

1. **There is no way to fabricate a complex multi-stage event instantly.** No seed script or DB
   shortcut exists that creates a _new_ event already sitting at stage 5-6 with real prior-stage
   data — every real event must be walked forward through the same governed gate contract a
   real user hits, whether via UI clicks or the governed APIs. The practical path to "complex
   sample event" is **reusing the one that already exists**, not building a new one.
2. **A prior "self-healing crawl" attempt for a _different_ Source scenario (SkyHarbor IT
   outsourcing) was never actually completed** — its own `RESULTS.csv`
   (`docs/testing/source-e2e-it-outsourcing/RESULTS.csv`) has every `your_result` (live-run)
   column empty, and its own release record
   (`docs/releases/records/2026-06-12-source-e2e-self-healing-gates.md`) says the live crawl
   was "intentionally pending" and never happened. Its spec
   (`tests/e2e/source/skyharbor-it-outsourcing-self-healing-crawl.spec.ts`) only covers 4 of 11
   stages and predates all four features above. **Do not treat it as a passing baseline or
   extend it** — it's a different asset for a different (also-incomplete) purpose. This prompt
   is about the _other_ spec, `golden-event-apex-ams.spec.ts`.

## Ground truth — verified on disk, do not assume otherwise

1. **The golden event already exists, is real, and is already complex**: event code `SRC-004`,
   slug `apex-retail-ams-outsourcing-2026`, persisted UUID
   `969440b7-a5e7-4b4c-9ff5-61b53894a994`, tenant `apexretail` (Apex Retail), value ≈ $35M.
   Per `tests/e2e/source/golden-event-apex-ams.spec.ts`'s own docstring, it is "parked mid-event
   (BAFO, May 15 deadline)" — stage 7 of 11 (`bafo`), with real prior-stage data behind it
   (strategy memo, scope, RFP, vendor responses, evaluation, pricing). Re-confirm this file's
   exact line numbers and current docstring wording yourself before relying on it — it may have
   moved since this prompt was written.
2. **The existing spec is stale and known-incomplete**, not a passing bar to protect: its own
   header comment says "Crawl 2026-06-04: 2/11 green, 9 skipped (gaps documented inline)," and
   the file has not been substantively touched since (only a trivial 1-line unrelated edit on
   July 19). A repo-wide grep for `ArtifactAcceptancePanel`, the accept route, the phrase
   `source_event_approvals`, `buildResponseCoverageInsight`, and `VendorCoverageView` across
   `tests/e2e/` returns zero hits — none of the four target features are exercised anywhere in
   this suite today.
3. **The e2e auth/evidence harness is real and reusable**: `tests/e2e/source/_auth.ts` does
   real Clerk sign-in per persona (8 personas, storageState cached under `.auth/*.json`) — the
   relevant one for this event is `apex-vp-sourcing`, with `cio@apex-retail.example.com` as the
   approver persona. `tests/e2e/source/_audit-harness.ts` is a Playwright fixture that emits
   per-test evidence (screenshots, console, HAR, `audit.json`) under
   `reports/source-golden-event/<run-stamp>/` — use it, don't build a new evidence mechanism.
4. **`POST /api/v1/source/[eventId]/test-reset` is a real, repo-owned, already-sanctioned reset
   path for this exact event** — it is hard-restricted (`eventId !== GOLDEN_EVENT_SLUG &&
event_code !== 'SRC-004'` → 403) so it cannot touch any other event, and it resets SRC-004
   back to the Strategy stage. It is 404'd in production (dev/test-server only). This is the
   correct way to get a clean run, not a DB bypass to avoid.
5. **`PATCH /api/v1/source/[eventId]/stage` is a real, governed stage-advance API**, not a
   shortcut that skips the gate contract — it still calls `evaluateSourceGateAdvanceContract()`
   against the event's real persisted `criteria`/`artifacts`/`evidence` rows and requires a
   `reason`. It's the practical way to drive stage-by-stage progression from a test script
   faster than pure UI automation while staying state-machine-legitimate — prefer it over
   scripting dozens of raw UI clicks for stages that aren't the ones under test, and prefer real
   UI actions (clicking "Accept as authoritative," filling the approvals ledger form, etc.) for
   the stages where the four target features actually render.
6. **This suite is not CI-gated today** — no `.github/workflows` entry runs `tests/e2e/source`.
   It is operator/agent-run only, per `AGENTS.md`'s own stated E2E requirements (real Clerk +
   Azure/Postgres credentials, `npx playwright install chromium`, a running dev server). Do not
   invent a CI gate for this in the same pass unless separately asked — scope this to the test
   suite itself and its evidence output.
7. **The four target features, exact locations** (re-verify current line numbers before
   editing):
   - Approvals ledger: `src/lib/source/approval-ledger.ts` / `approval-ledger-model.ts`,
     rendered in `ApprovalsWorkspace` in `SourceAnalyticsCanvas.tsx`.
   - Artifact acceptances: `POST /api/v1/source/[eventId]/artifacts/[artifactCode]/accept`,
     rendered via `src/components/source/canvas/analytics/ArtifactAcceptancePanel.tsx` on each
     File Cabinet card. Requires `approvalRationale` (non-empty); `artifactState`/`artifactRole`
     are computed server-side, not client-supplied.
   - Vendor coverage: `buildResponseCoverageInsight`/`VendorCoverageView`, rendered in the
     Responses stage's step body when `factTemplateCode === 'RESPONSE_COVERAGE_V1'`.
   - Stage-view fallback: `sampleStageViewFor()` in `SourceAnalyticsCanvas.tsx` — verify all 11
     stages render stage-matched content (not another stage's content) when live data is
     absent; this only matters for stages the golden event hasn't reached yet (currently
     `executive_decision`, `selection`, `transition`, `value`, since it's parked at `bafo`).

## Scope for this task

**In scope:**

1. Extend `tests/e2e/source/golden-event-apex-ams.spec.ts` (don't create a parallel spec file
   for the same event — this file already owns SRC-004 coverage) with real test cases for the
   four features above, reusing the existing `_auth.ts`/`_audit-harness.ts` machinery exactly
   as the existing tests in this file already do.
2. Use `POST .../test-reset` to get a clean, known state before the run, then use a mix of
   `PATCH .../stage` (to fast-forward through stages that aren't under test) and real UI
   interactions (for the stages where the four features actually render) to reach and exercise
   each feature.
3. For the Approvals ledger: confirm real approval rows accumulate with correct `stage_key`
   attribution as the event advances through at least 2-3 stages.
4. For artifact acceptances: accept a real artifact via the real UI form (matching what was
   manually verified live earlier — rationale required, drift/gate-precondition/context-policy
   selects present), confirm the "Artifact status" panel re-renders with the real
   accepted-by/rationale, confirm the Stage gate panel is unaffected by it.
5. For vendor coverage: reach the Responses stage (real prior data should already have vendor
   responses, given the event is parked past this stage) and confirm the real per-vendor
   coverage list renders with real counts, not a placeholder.
6. For the stage-view fallback: visit each of the 4 stages the golden event hasn't reached yet
   and confirm each shows its OWN honest content (real sample fixture or the "no illustrative
   preview built yet" placeholder) — never another stage's content.
7. Run the extended suite for real, capture real evidence via `_audit-harness.ts`, and report
   the actual pass/fail/skip state honestly — including for the pre-existing 9 skips in this
   file. If a pre-existing skip is now fixable given this session's work, fix it; if not,
   leave it skipped with an accurate, current reason (not the stale June 4 reason if it no
   longer applies).
8. Update the file's own header docstring's crawl-status line to reflect the real, current
   result of your run — don't leave the stale "2/11 green, 9 skipped" claim in place once you
   have a real, current number.
9. Write a release record (or extend an existing e2e-related one — check
   `docs/releases/records/` for a live SRC-004/golden-event record first) documenting exactly
   what was run, what passed/failed/skipped, and pointing at the real evidence artifacts under
   `reports/source-golden-event/`.

**Out of scope — do not do these in the same pass:**

- Do not touch `skyharbor-it-outsourcing-self-healing-crawl.spec.ts` or its `RESULTS.csv` —
  different event, different scenario, already a separate incomplete effort; don't conflate
  fixing/finishing it with this task.
- Do not add a CI workflow gate for `tests/e2e/source` — this suite stays operator-run for now
  unless separately asked.
- Do not attempt to fix every one of the file's pre-existing 9 skips if some are unrelated to
  this session's four features and would require unrelated investigation — only fix what's
  reasonably in scope; leave the rest accurately documented.
- Do not fabricate a brand-new synthetic multi-stage event from scratch — reuse SRC-004 as
  scoped above. If you find a genuine reason SRC-004 is unsuitable (e.g. it's now in a state
  that can't be reset), stop and report that rather than inventing a workaround.
- Do not mutate any other tenant's event data. `test-reset`'s own 403 guard already prevents
  this, but do not attempt to route around it.

## Verification required before calling this done

- The extended spec must actually run against a real dev server with real Clerk + Azure/Postgres
  credentials — per `AGENTS.md`'s own stated E2E requirements. Report the real command used and
  real output, not a description of what it would do.
- Real evidence artifacts under `reports/source-golden-event/<run-stamp>/` for the new test
  cases, following the same shape `_audit-harness.ts` already produces for existing cases.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  clean on the changed spec file.
- `npx eslint` clean on the changed spec file.
- `node scripts/release-check.mjs --base origin/main --head HEAD`.
- A release record with an honest QA/Validation section — state the real pass/fail/skip counts
  from your actual run, not an aspirational "all green" claim. If something doesn't pass, say
  so and explain why, per this repo's own established honesty discipline (see e.g.
  `docs/releases/records/2026-07-22-source-artifact-acceptances.md` for the tone/rigor bar).
- Open a PR (do not merge yourself unless explicitly instructed).

---

## PART 1 — Paste this to Codex

```
GOAL
Extend the existing Source "golden event" Playwright e2e suite to exercise four real
features shipped this session that currently have zero e2e coverage: the Approvals ledger
(SOURCE-SHELL-003), the artifact-acceptance action (SOURCE-SHELL-004), per-vendor response
coverage on the Responses stage (SOURCE-SHELL-005), and the per-stage sample-fallback fix
(SOURCE-SHELL-006/007). Use the existing, already-complex, already-real golden event —
do not fabricate a new synthetic multi-stage event.

GROUND TRUTH — VERIFIED ON DISK, DO NOT ASSUME OTHERWISE
1. The golden event already exists and is already complex: event code SRC-004, slug
   apex-retail-ams-outsourcing-2026, UUID 969440b7-a5e7-4b4c-9ff5-61b53894a994, tenant
   apexretail (Apex Retail), ~$35M. Per tests/e2e/source/golden-event-apex-ams.spec.ts's own
   docstring it is "parked mid-event (BAFO, May 15 deadline)" — stage 7 of 11, with real
   prior-stage data (strategy memo, scope, RFP, vendor responses, evaluation, pricing) behind
   it. Re-verify this file's current docstring and line numbers yourself before editing —
   it may have moved since this prompt was written.

2. This spec is stale and already known-incomplete — its own header says "Crawl 2026-06-04:
   2/11 green, 9 skipped (gaps documented inline)," last substantively touched June 4, only a
   trivial unrelated 1-line edit since (July 19). Grep tests/e2e/ for ArtifactAcceptancePanel,
   the accept route path, source_event_approvals, buildResponseCoverageInsight, and
   VendorCoverageView — zero hits anywhere. None of the four target features are covered
   today. You are not protecting a passing bar; you're adding real coverage where none exists,
   and honestly reporting the current state of the pre-existing 9 skips too.

3. A DIFFERENT prior e2e effort (SkyHarbor IT outsourcing self-healing crawl,
   tests/e2e/source/skyharbor-it-outsourcing-self-healing-crawl.spec.ts,
   docs/testing/source-e2e-it-outsourcing/) was never actually completed — its own
   RESULTS.csv has every live-run column empty, its own release record
   (docs/releases/records/2026-06-12-source-e2e-self-healing-gates.md) says the live crawl was
   "intentionally pending" and never happened. It only covers 4 of 11 stages and predates all
   four target features. DO NOT touch this file or its RESULTS.csv, and do not conflate it
   with this task — it's a different event, different scenario, separate incomplete effort.

4. Reusable auth/evidence harness, already real:
   - tests/e2e/source/_auth.ts — real Clerk sign-in per persona, storageState cached under
     .auth/*.json. The persona for this event is "apex-vp-sourcing"
     (cio@apex-retail.example.com as approver). Use it exactly as existing tests in
     golden-event-apex-ams.spec.ts already do — do not build a new auth mechanism.
   - tests/e2e/source/_audit-harness.ts — a Playwright fixture emitting per-test evidence
     (screenshots, console, HAR, audit.json) under reports/source-golden-event/<run-stamp>/.
     Use it for your new test cases too.

5. Two real, governed, already-sanctioned APIs to reach the right state without a
   dozens-of-clicks crawl:
   - POST /api/v1/source/[eventId]/test-reset — hard-restricted to exactly SRC-004
     (403 on any other event), resets it to Strategy stage. 404 in production. Use this to
     get a clean starting state, not a DB bypass to avoid.
   - PATCH /api/v1/source/[eventId]/stage — a real governed stage-advance API, still calls
     evaluateSourceGateAdvanceContract() against real persisted criteria/artifacts/evidence
     rows and requires a reason — not a shortcut that skips the gate. Use it to fast-forward
     through stages that aren't under test; use real UI interactions for the stages where the
     four target features actually render.

6. This suite is NOT CI-gated (no .github/workflows entry runs tests/e2e/source) — per
   AGENTS.md it needs real Clerk + Azure/Postgres credentials and a running dev server,
   operator/agent-run only. Do not add a CI gate for it in this pass unless separately asked.

7. Exact current locations of the four target features (re-verify line numbers before
   editing, they will have moved):
   - Approvals ledger: src/lib/source/approval-ledger.ts / approval-ledger-model.ts,
     rendered in ApprovalsWorkspace in SourceAnalyticsCanvas.tsx.
   - Artifact acceptances: POST /api/v1/source/[eventId]/artifacts/[artifactCode]/accept,
     rendered via src/components/source/canvas/analytics/ArtifactAcceptancePanel.tsx on each
     File Cabinet card. approvalRationale is required (non-empty); artifactState/artifactRole
     are computed server-side, never trust a client-supplied value if you're also touching
     the route itself (you shouldn't need to — it's already correct, this task is test
     coverage only).
   - Vendor coverage: buildResponseCoverageInsight/VendorCoverageView, rendered in the
     Responses stage's step body when factTemplateCode === 'RESPONSE_COVERAGE_V1'.
   - Stage-view fallback: sampleStageViewFor() in SourceAnalyticsCanvas.tsx — the golden
     event hasn't reached executive_decision/selection/transition/value yet (parked at
     bafo), so those 4 stages are exactly where this needs checking — confirm each shows its
     own honest content (real sample fixture or the "no illustrative preview built yet"
     placeholder), never another stage's content.

SCOPE — DO EXACTLY THIS
1. Extend tests/e2e/source/golden-event-apex-ams.spec.ts (this file already owns SRC-004
   coverage — do not create a parallel spec for the same event) with real test cases for the
   four features, using test-reset + PATCH .../stage + real UI actions as described above.
2. Approvals ledger: confirm real rows accumulate with correct stage_key attribution across
   at least 2-3 stage advances.
3. Artifact acceptances: accept a real artifact through the real UI form (rationale required;
   drift/gate-precondition/context-policy selects present), confirm the "Artifact status"
   panel re-renders with the real accepted-by/rationale, confirm the Stage gate panel is
   unaffected.
4. Vendor coverage: reach Responses (real prior vendor-response data should already exist
   given the event's parked position), confirm real per-vendor counts render, not a
   placeholder.
5. Stage-view fallback: visit the 4 not-yet-reached stages, confirm each is honestly
   stage-matched, never showing another stage's content.
6. Run the extended suite for real. Report the actual pass/fail/skip counts. Fix any of the
   pre-existing 9 skips that are now reasonably fixable given this session's work; for the
   rest, leave an accurate, CURRENT skip reason (not the stale June 4 one if it no longer
   applies) — don't claim more green than actually happened.
7. Update this file's own header docstring crawl-status line to the real, current result.
8. Write a release record (check docs/releases/records/ first for an existing live
   SRC-004/golden-event record to extend instead of creating a duplicate) with an honest
   QA/Validation section pointing at the real evidence under reports/source-golden-event/.

OUT OF SCOPE — DO NOT DO THESE
- Do not touch skyharbor-it-outsourcing-self-healing-crawl.spec.ts or its RESULTS.csv.
- Do not add a CI workflow gate for tests/e2e/source.
- Do not chase unrelated pre-existing skips outside this session's four features if they'd
  need separate investigation — document them accurately instead.
- Do not fabricate a new synthetic event from scratch. If SRC-004 turns out to be genuinely
  unusable (e.g. can't be reset), STOP and report that rather than inventing a workaround.
- Do not mutate any other tenant's event data — test-reset's own 403 guard already prevents
  this; do not attempt to route around it.

VERIFICATION REQUIRED BEFORE CALLING THIS DONE
- The extended spec must actually run against a real dev server with real Clerk +
  Azure/Postgres credentials (per AGENTS.md's stated E2E requirements) — report the real
  command and real output, not a description of what it would do.
- Real evidence artifacts under reports/source-golden-event/<run-stamp>/ for every new case.
- NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json
  clean on the changed file.
- npx eslint clean on the changed file.
- node scripts/release-check.mjs --base origin/main --head HEAD.
- A release record with an honest QA/Validation section — real pass/fail/skip counts from
  the actual run, not an aspirational "all green" claim. Match the honesty/rigor bar already
  set in docs/releases/records/2026-07-22-source-artifact-acceptances.md.
- Open a PR (do not merge yourself unless explicitly instructed).
```
