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
