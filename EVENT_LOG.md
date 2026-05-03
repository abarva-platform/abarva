
## 2026-05-02T06:01:16Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Tower handoff verification.
- Finding: After Apex program reached P6, Tower surfaced exact financial values to a non-finance Programs operator.
- Severity: SEV-1 financial output firewall violation.
- Fix branch: codex/programs-milestone-idempotency.
- Fix summary: Tower synthesis now resolves the active user program access policy, injects restricted-output doctrine, sanitizes demo context and output for restricted users, uses policy-specific v2 cache keys, and redacts visible Home/Tower fixture fallback copy. Also refreshed visible Tower lifecycle copy from Build/Activate/Operate to Execution Roadmap/Approval & Mobilization/Tower Handoff.
- Regression: src/__tests__/integration/tower-financial-firewall.test.ts verifies public Home/Tower fixtures avoid exact dollar values and Tower synthesis bypasses stale unsanitized caches.
- Validation: Focused Tower financial firewall Jest and ESLint passed locally.

## 2026-05-02T06:14:30Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / P6 Tower handoff.
- Finding: Apex test program reached P6 in the database, but `/tower` did not visibly surface the handed-off program because Tower still rendered static fixture pressures only.
- Severity: SEV-2 cross-module handoff visibility gap.
- Fix branch: codex/programs-milestone-idempotency.
- Fix summary: `/tower` now queries live `engagements` for active-client P6 programs, applies program assignment scoping via `loadUserProgramAccessPolicy`, and renders a visible `Tower handoffs · P6 active` panel above the legacy pressure accordion.
- Regression: src/__tests__/integration/tower-p6-handoff-panel.test.ts pins tenant filtering, P6 filtering, assignment scoping, and the TowerIndexPage slot wiring.
- Validation: Focused Tower handoff Jest and ESLint passed locally.

## 2026-05-02T06:32:00Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Meridian preflight.
- Finding: Meridian login landed on `/home` with Meridian tenant chrome but Apex-specific Home content (`CDP`, Vendor C, AMS BAFO, AI spend), creating a cross-tenant UI/content leak.
- Severity: SEV-1 tenant-context leak in Home chrome/content.
- Fix summary: Home now gates Apex fixture content behind an Apex-only tenant check. Non-Apex tenants receive tenant-safe workspace copy, live tenant-scoped program rows only, restricted-financial copy, and no static Apex Tower/Source cards.
- Regression: src/__tests__/integration/home-tenant-scope.test.ts pins the Apex-only fixture guard and non-Apex safe copy.
- Validation: Focused Home tenant-scope Jest and ESLint passed locally.

## 2026-05-02T11:02:00Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Meridian approval path.
- Finding: Meridian user entered Setup/Admin from a Meridian program approval, but Setup chrome rendered Apex Retail Group because a stale active-client cookie could override explicit tenant-domain personas when Clerk role metadata was admin-ish.
- Severity: SEV-1 tenant indicator mismatch on approval surface.
- Fix summary: `getActiveClientKey()` now pins explicit tenant-domain identities to their inferred client before considering the active-client cookie. This enforces one-client sessions for real client personas even when role metadata is `admin`.
- Regression: src/lib/__tests__/active-client.test.ts verifies `nina.patel@meridian-health.example.com` resolves to Meridian despite a stale Apex cookie.
- Validation: Focused active-client Jest and ESLint passed locally.

## 2026-05-02T11:20:00Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Meridian Phase 0 unlock.
- Finding: After Setup approved a newly originated Meridian program, the database correctly held `current_phase=0`, but the Programs detail page clamped P0 to P1 and hid the P0 slot, showing contradictory chrome (`P1 Discovery` plus `Approved for Phase 0`).
- Severity: SEV-2 lifecycle-state UX/control-plane mismatch.
- Fix branch: codex/programs-p0-phase-label.
- Fix summary: Program detail view-model phase clamping now preserves P0, phase slots include P0-P6, and ProgramJourneyRail accepts P0 as a first-class phase. Regression expectations were also refreshed to the locked lifecycle labels: P4 Execution Roadmap, P5 Approval & Mobilization, P6 Tower Handoff.
- Regression: src/__tests__/integration/programs/gate-ribbon-view.test.ts pins newly approved DB-backed P0 programs to `currentPhase=0`, `viewingPhase=0`, P0 current / P1 pending rail state, and P0 workbench copy.
- Validation: Focused Programs gate-ribbon Jest and scoped ESLint passed locally. Local `next build` is blocked in this /tmp worktree by the known Turbopack symlink-root panic; `npx tsc --noEmit` is blocked by pre-existing missing optional package type declarations (`react-markdown`, `remark-gfm`, `rehype-sanitize`, `resend`, `docx`).

## 2026-05-02T11:32:00Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Meridian P0 continuity.
- Finding: P0 Nexus correctly loaded the approved program but told the user no sponsor was recorded, and the engagement row had no `maestro_person_id` even though origination/approval preserved the sponsor and lead in the approval snapshot.
- Severity: SEV-2 origination-to-P0 data continuity gap.
- Fix branch: codex/programs-origination-people-continuity.
- Fix summary: Program origination now writes `maestro_person_id` from the resolved lead, approval synchronization hydrates sponsor/lead person IDs from the brief snapshot, and Nexus program context injects sponsor/lead names and roles from the engagement row.
- Regression: src/lib/agent/tools/__tests__/commitProgram.test.ts verifies the engagement insert carries `maestro_person_id`; src/lib/programs/__tests__/approval.test.ts verifies approve synchronization writes sponsor and lead IDs back to `engagements`.
- Validation: Focused commitProgram + approval Jest and scoped ESLint passed locally.

## 2026-05-02T11:48:00Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Meridian P1 evidence capture.
- Finding: P1 pasted workshop notes were stored and parsed, but `program_attachments.phase` and `program_evidence_items.phase` were `null` because the upload route only honored an optional multipart `phase` field. The Programs chat upload path does not send that field.
- Severity: SEV-2 phase evidence traceability gap.
- Fix branch: codex/programs-evidence-phase-default.
- Fix summary: Attachment upload now defaults missing multipart phase to the program's current phase while preserving explicit phase overrides. Attachment metadata and evidence ingestion receive the same effective phase.
- Regression: src/app/api/programs/__tests__/attachments-upload.smoke.test.ts verifies omitted phase defaults to `program.currentPhase` and explicit multipart phase overrides it.
- Validation: Focused attachments upload Jest and scoped ESLint passed locally.

## 2026-05-02T12:18:00Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / Meridian P3 design generation.
- Finding: P3 target-state design generation produced a strong design package but the browser aborted the turn after 90 seconds, showing `Nexus response timed out` and preventing the user from trusting persistence/completion.
- Severity: SEV-2 long-form deliverable completion gap.
- Fix branch: codex/programs-agent-timeout-budget.
- Fix summary: AtlasPageStateProvider now uses a surface-aware timeout budget: default agent turns stay at 90 seconds, while Programs surfaces get 210 seconds for legitimate phase deliverable generation and tool-persistence turns.
- Regression: src/__tests__/integration/atlas-page-state-timeout.test.ts pins the default timeout, Programs timeout, and Programs surface matching.
- Validation: Focused Atlas timeout Jest and scoped ESLint passed locally.

## 2026-05-02T12:36:00Z — programs-module-e2e-crawler

- Workstream: Programs live E2E crawl / P3 deliverable persistence contract.
- Finding: Even after extending the Programs client timeout, P3 design-spec save still timed out because Nexus attempted to compose a large hidden `complete_deliverable` tool payload before streaming completion/progress to the user.
- Severity: SEV-2 large-deliverable persistence design flaw.
- Fix branch: codex/programs-bounded-deliverable-tools.
- Fix summary: `complete_deliverable` now supports bounded `content_outline` arrays for large artifacts, caps the content schema at 6,000 characters, and the Nexus Programs prompt now explicitly prohibits huge hidden tool payloads. Nexus should persist concise executive-grade artifacts and summarize what was saved instead of silently composing a full consulting deck inside JSON.
- Regression: src/lib/agent/tools/__tests__/completeDeliverable.test.ts verifies outline-to-markdown persistence; src/app/api/chat/agent/__tests__/agent-route-context-bundle.test.ts validates route prompt source still compiles under the updated doctrine.
- Validation: Focused complete_deliverable + agent route Jest and scoped ESLint passed locally.

## 2026-05-02T12:56:00Z — programs-module-e2e-crawler
- Live P3 traceability retest exposed a silent non-write: Nexus answered "composing" but did not call complete_deliverable, and DB showed no requirements_traceability deliverable or phase advance.
- Fix in progress: force explicit Programs deliverable save/sign-off requests through initial Anthropic tool_choice=complete_deliverable on the first tool-use-loop turn; subsequent turns can still call advance_phase naturally.
- Added regression coverage for route forcing and tool-use-loop first-turn tool_choice wiring.

## 2026-05-02T13:08:00Z — programs-module-e2e-crawler
- PR #1403 deployed and live rerun passed the P3 traceability persistence/advance path: requirements_traceability signed off and program advanced to current_phase=4.
- Follow-up doctrine defect found in live chat: Nexus said "P4 Build" after advancing, while the locked lifecycle label is P4 Execution Roadmap. Fix in progress to harden prompt/tool examples against old labels.

## 2026-05-02T13:24:00Z — programs-module-e2e-crawler
- Live P5 package request timed out after partial writes. DB confirmed business_case, readiness_and_change_plan, and tower_handoff_plan were signed off, but funding_approval and sponsor_alignment did not land and program remained current_phase=5.
- Root cause: P5 naturally requires multiple signed artifacts; one complete_deliverable call per artifact can exceed the Programs client timeout before gate evaluation.
- Fix in progress: add complete_deliverables batch tool and route multi-deliverable package requests to it on the initial tool turn.

## 2026-05-03T08:40:00-05:00 — codex/programs-phasea-pr2-mutations

- Workstream: Strategic Moves Phase A hardening (PR2 mutation routes excluding nexus/approvals).
- Scope: Added tenant guard + auth-mode plumbing to advance, milestones POST/PATCH, risks POST/PATCH, work-items POST/PATCH, module status, deliverable publish/sign-off.
- Security hardening: Added resource-id+engagement-id scoped mutation handling that now returns `404` when no row matches (prevents false-positive success on cross-tenant/resource-mismatch writes).
- Auth-mode plumbing: Added `mutation` route family in `programs-auth-mode-server` and routed all PR2 endpoints through `getProgramsRouteSupabase('mutation')`.
- Tests: Added `src/__tests__/integration/programs/programs-mutation-routes-tenant-guards.test.ts` with four-test minimum per route (own-tenant pass, foreign-tenant 404, cross-tenant write denied, no-membership denied).
- Validation: Focused Jest passed (45 tests), targeted ESLint clean, `npm run build` passed (existing `next.config.ts` NFT warning unchanged).
- Next: open PR for PR2 and merge after standard checks pass.

## 2026-05-03T09:15:00-05:00 — codex/programs-phasea-pr3-approvals-flags

- Workstream: Strategic Moves Phase A hardening (PR3 approval + flag mutation routes).
- Scope: Hardened `POST /approvals`, `POST /approvals/[approvalId]/decide`, and `POST /flags/[flagId]/resolve`.
- Fix summary: Added tenant guard pre-checks with `getProgramById(..., { supabase })`, routed handlers through `getProgramsRouteSupabase('mutation')`, and passed auth-mode-aware supabase to governance mutation helpers.
- Governance layer update: `decideApproval` and `resolveMaestroFlag` now accept optional `supabase` injection so route auth mode is honored end-to-end.
- Regression: Added `src/__tests__/integration/programs/programs-approval-flag-mutation-guards.test.ts` with four-test minimum per route (own-tenant pass, foreign-tenant 404, cross-tenant write denied, no-membership denied); updated existing tenant-guard test expectations for new helper signature.
- Validation: Focused Jest passed (57 tests across mutation guard suites), targeted ESLint clean, `npm run build` passed (existing `next.config.ts` NFT warning unchanged).
- Next: open PR for PR3 and merge after standard checks pass.

## 2026-05-03T09:50:00-05:00 — codex/programs-phasea-pr4-nexus

- Workstream: Strategic Moves Phase A hardening (PR4 nexus mutation routes).
- Scope: Hardened `POST /nexus/ask`, `POST /nexus/draft`, `POST /nexus/cxo-takeover`, and `POST /nexus/threads`.
- Fix summary: Added auth-mode plumbing via `getProgramsRouteSupabase('mutation')` and tenant-scoped pre-check (`getProgramById(..., { supabase })`) before nexus route logic.
- Additional guard: `nexus/ask` thread-ownership validation now uses route-level supabase client to keep checks consistent with auth mode.
- Regression: Added `src/__tests__/integration/programs/programs-nexus-mutation-guards.test.ts` with four-test minimum per route (own-tenant pass, foreign-tenant 404, cross-tenant write denied, no-membership denied).
- Validation: Focused Jest passed (73 tests across guard suites), targeted ESLint clean, `npm run build` passed (existing `next.config.ts` NFT warning unchanged).
- Next: open PR for PR4 and merge after standard checks pass.

## 2026-05-03T10:25:00-05:00 — codex/programs-phasea-pr5-origination

- Workstream: Strategic Moves Phase A hardening (PR5 origination routes).
- Scope: Hardened `/api/v1/programs/originate` (POST), `/api/v1/programs/originate/from-thread` (POST), and `/api/v1/programs/patterns` (GET).
- Fix summary: Added auth-mode plumbing via `getProgramsRouteSupabase('origination')` and removed direct `getServerSupabase()` usage in these routes.
- Auth helper update: extended `ProgramsAuthRouteFamily` with `origination`; unit tests now verify origination mode default/override resolution.
- Regression: Added `src/__tests__/integration/programs/programs-origination-routes-guards.test.ts` covering per-route guard expectations (valid flow, malformed/foreign scope denial, cross-tenant injection resilience, no-membership denial).
- Validation: Focused Jest passed (89 tests across Phase A guard suites + auth-mode unit), targeted ESLint clean, `npm run build` passed (existing `next.config.ts` NFT warning unchanged).
- Next: open PR for PR5 and merge after standard checks pass.

## 2026-05-03T11:05:00-05:00 — codex/programs-phasea-pr1-read-routes-clean

- Workstream: Strategic Moves Phase A PR1 replacement (read-route hardening).
- Background: Original PR #1478 became non-mergeable due stale/conflicting history; replayed the intended read-route commit onto current `main` as a clean branch.
- Scope: Hardened read GET endpoints (`execute`, `flags`, `approvals`, `milestones`, `risks`, `work-items`, `module/[key]`, `nexus/threads GET`) with tenant pre-check + `404` contract and auth-mode plumbing.
- Auth helper update: consolidated route families to include `program_read`, `mutation`, and `origination` together in `programs-auth-mode-server.ts`.
- Regression: included `src/__tests__/integration/programs/programs-read-routes-tenant-guards.test.ts` and verified compatibility with all Phase A guard suites.
- Validation: Focused Jest passed (97 tests), targeted ESLint clean, `npm run build` passed (existing `next.config.ts` NFT warning unchanged).
- Next: open clean PR replacing #1478 and merge after checks pass.
