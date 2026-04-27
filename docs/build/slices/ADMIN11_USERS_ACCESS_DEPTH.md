# ADMIN11 — Users & Access Depth

## Metadata
- ID: ADMIN11
- Title: Users & Access depth — tabs + user table + role detail drawer + invite stub
- Track: 06-admin-readiness-architecture
- Wave: wave-admin-completion
- Status: backlog
- Type: ui
- Dependencies: ADMIN9 audit, AGENT1
- Estimated complexity: L

## Purpose
Lift `/admin/users-access` from a thin Steward editorial card to a full canvas with active-users table, pending-invitations table, user detail drawer, and an Invite User form rendered in disabled (HARD-GATED) state. Promotes the substantive content of legacy `/platform/admin/users` (real Clerk integration) into the canonical shell.

## Context
Today `/admin/users-access` renders the canonical 3-zone shell with an editorial card and not much else. Real user provisioning lives at `/platform/admin/users` (158 lines, real Clerk integration, InviteUserForm). ADMIN11 brings that into the canonical shell with proper sub-tabs and a drawer pattern. Live Clerk writes (Invite, Suspend, Change role) ship as STUBs / HARD-GATED with disabled buttons + reason copy — the real writes defer to Wave 27.

## Target state
- `/admin/users-access` renders 4 sub-tabs: Active Users (default) / Pending Invites / Roles & Permissions / Audit.
- Active Users tab shows a paginated table (50 rows) with name / email / role / tenant / last sign-in / status.
- Pending Invites tab shows email / invited role / invited by / sent-at / status.
- Clicking a user row opens a right-side drawer with Clerk publicMetadata + last 10 sign-ins (deterministic seed in non-pilot environment).
- Invite User form rendered in disabled state with "Invite available in pilot environment — Wave 27" banner.
- AGENT1 Steward editorial body explains current user-provisioning state (count of pending invites, missing role assignments).

## Allowed files
- `src/app/(maestro)/admin/users-access/page.tsx`
- `src/lib/admin/users-access-page-view.ts` (new view-model)
- `src/components/admin/users/UsersTable.tsx` (new)
- `src/components/admin/users/PendingInvitesTable.tsx` (new)
- `src/components/admin/users/UserDetailDrawer.tsx` (new)
- `src/components/admin/users/InviteUserStub.tsx` (new — disabled)
- `src/__tests__/integration/admin/admin11-users-access-depth.test.ts` (new)
- `docs/build/slices/ADMIN11_USERS_ACCESS_DEPTH.md`

## Forbidden files
- `/api/admin/invite/**` — no Clerk write logic touched (already exists; we don't call it from canonical until Wave 27)
- Other admin pages
- `src/lib/agent/**` — AGENT1 foundation untouched

## Implementation scope
1. Build `users-access-page-view.ts` view-model: deterministic seed of 12 users + 4 pending invites in non-pilot mode; reads real Clerk in pilot (gated on env).
2. Build the 4 components (UsersTable, PendingInvitesTable, UserDetailDrawer, InviteUserStub).
3. Wire `/admin/users-access` page with tabs + canvas layout.
4. Render Invite button as `<button disabled aria-disabled="true">` with Steward-styled reason chip "Available in pilot — Wave 27".
5. Hook AGENT1 editorial: pass `users-access` page key + tenant; editorial body should mention pending-invite count.

## Tests
- Drawer opens on row click, closes on backdrop click.
- Tabs switch (Active / Pending / Roles / Audit).
- Invite button is disabled and has accessible reason text.
- AGENT1 editorial card renders with deterministic copy.
- Visual lock: no banned hex tokens; uses ADMIN1 design tokens.

## Validation
```bash
npx tsc --noEmit --pretty false
npm run lint -- src/components/admin/users src/app/\(maestro\)/admin/users-access
npx jest src/__tests__/integration/admin/admin11-users-access-depth
bash scripts/integration/check_admin_design_tokens.sh
```

## Acceptance criteria
1. 4 tabs render with deterministic data.
2. Drawer pattern works with seed data.
3. Invite button disabled with reason text.
4. AGENT1 editorial card unchanged-by-template (same string output).
5. ADMIN7 visual-lock regression suite passes.

## Risks
- Drawer pattern is new — codify a reusable `<Drawer>` primitive if other ADMIN12–17 slices need it (ADMIN13's connector drawer + ADMIN14's dataset drawer + ADMIN16's blocker drawer + ADMIN17's component drawer all want this). Ship the primitive in ADMIN11 to amortize.

## Founder review
Visit `/admin/users-access`. See 4 tabs, click a user row → drawer slides in. Click Invite User → button is disabled with explanation. Editorial card body mentions pending-invite count.
