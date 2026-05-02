
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
