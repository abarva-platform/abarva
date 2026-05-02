# Cross-Session Event Log

Append-only coordination log for active Codex sessions.

## 2026-05-02T08:20:00-05:00 - codex-restore-cockpit-shell

- status: started-clean-worktree
- branch: `codex/restore-cockpit-shell`
- worktree: `/private/tmp/nexus-cockpit-shell`
- scope: restore global cockpit shell/top-nav; sunset legacy left app rail as default
- files_touched: `src/components/shell/AppShell.tsx`, `src/components/shell/AppTopBar.tsx`, shell nav tests, `/learn` route
- guardrail: no Source API, Source lifecycle, Source data, auth provisioning, private data plane, or cleanup files touched
- validation: focused Jest guards passed; TypeScript passed; production build passed; unauthenticated local shell screenshots captured; authenticated Apex screenshots blocked by local Clerk currentUser hang

## 2026-05-02T08:55:00-05:00 - codex-programs-e2e-p5-gate-fix

- status: fix-in-progress
- branch: `codex/programs-p5-signed-artifact-gates`
- worktree: `/private/tmp/nexus-programs-private-plane-fix`
- scope: Programs E2E crawler found P5 advanced to P6 after `program_modules` completion even though `funding_approval` and `sponsor_alignment` signed deliverables failed to persist.
- files_touched: `src/lib/programs/governance.ts`, `src/lib/agent/tools/program/completeModule.ts`, `supabase/migrations/20260502043000_program_lifecycle_deliverable_types.sql`, `src/lib/programs/__tests__/governance-evaluate-gates.test.ts`
- live_db: additive idempotent seed applied for missing P5 deliverable types (`funding_approval`, `capacity_approval`, `approval_memo`, `sponsor_alignment`, `stakeholder_alignment`); `business_case` applicable phases updated to include P5.
- validation: focused Programs/Nexus Jest and ESLint passed locally; deployment/rerun pending PR merge.
