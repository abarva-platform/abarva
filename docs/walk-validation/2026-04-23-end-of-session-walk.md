# End-of-session Walk · 2026-04-23

Consolidated walk report after today's sweep. Complements the earlier
`2026-04-23-walks.md` (catalog-level) and `2026-04-23-c1-c2-validation.md`
(content defect sweep).

## Prat golden path · 22 steps

1. Sign in at app.abarva.ai · Clerk → `/auth-redirect`
2. Home lands · C11 composite surface · verify tenant-row renders
3. Top nav → **Programs** → lands at `/preview/programs` (Sentinel-aligned redirect)
4. See tenant-scoped programs (Apex seeded · Keystone empty state if signed in as Keystone)
5. Click **+ New program** pill · 4-question guided-choice intake
6. Complete intake · approve charter → Phase 0 entry
7. Switch to existing program · Morrison Owned Brand Margin Recovery
8. Walk phase anchors P0 → P4 · verify pop animation · phase journey narrative
9. Open a Rich deliverable (D17 Decision Memo) · verify 12 Rich component regions
10. Click **Export as PDF** · verify print dialog opens
11. Click any evidence chip (E1-E32) · verify drawer opens in-page
12. Promote drawer to full page · verify navigation works
13. Click **Approve decision** on a Rich deliverable · verify ledger write + inline approved state
14. Back to program · verify phase-gate advance button visible when on live phase
15. Close phase gate · verify advanced state + timestamp
16. Top nav → **Intelligence** → `/preview/intelligence` · Sentinel rail
17. Select a pattern · verify Sentinel opener names confidence band (high/medium/thin)
18. Click **Cross-reference {related pattern}** chip · verify drawer opens with related pattern
19. Click **Apply this to a program** chip · verify handoff messaging → Nexus
20. Top nav → **Control Tower** → `/preview/tower` · Atlas rail
21. Read Atlas opener (3 sentences max) · verify dynamic hottest pressure reference
22. Click **Resolve via new program → Nexus ✱** chip · verify handoff narrative

## Cross-agent handoff checkpoint

- Atlas → Nexus handoff wired on Tower pressure cards
- Sentinel → Nexus handoff wired on Intelligence pattern detail
- Nexus + all surfaces post to `.approvals/*.json` ledgers
- Notifications bell in PrimaryNav reads all 3 ledgers · polls 60s

## Admin + provisioning

1. Sign in as admin-role user
2. Top nav → Platform → `/platform/admin`
3. See Steward rail (◆ blue)
4. Click **Invite user** → `/platform/admin/users`
5. Submit invite form · verify Clerk invitation API fires
6. Click **Check connector health** → `/platform/admin/connectors`
7. Click **Review audit log** → `/platform/admin/audit` · reads all 3 ledgers

## Queue + notifications

1. `/home/queue` · "What needs you"
2. Open tasks + recent approvals + phase gates + recently completed
3. Mark task done · verify PATCH to `/api/tasks` + inline ✓ state
4. Notification bell · badge count excludes self-authored events
5. Panel · event-kind color dots + timestamps
6. Click notification → deep-link to queue · localStorage lastRead bumps

## Known deferrals

- Atlas full chat-first rework (current voice-sharpened right-dock is demo-viable)
- Steward full voice polish (only structural anchoring shipped)
- Attention-event protocol consumers (provider + hook shipped; rails not yet subscribed)

## Integrity rollup

- All citations resolve across Morrison (9 files · 62 refs) and Meridian Ambient (10 files · ~120 refs)
- Timeline chronology coherent in both programs
- DOM linter · 0 violations · CI gate active
- Link crawler · catalog-level clean
- Composite disclaimer + demo-rendering disclaimer on every Rich deliverable
- Production 404 monitoring · console.error structured logging via `/src/app/not-found.tsx`

## Session scoreboard · PRs merged today

Content: #115 (C1 Morrison P1), #122 (C2 Morrison P2), #124 (C5 Meridian P1), #133 (C3 Morrison P3), #134 (C6 Meridian P2), #135 (C4 Morrison P4), #137 (C7 Meridian P3)

Product / commodity / workflow:
- #112 canon import · #120 Sentinel + drawer + DOM linter + tenant scoping · #121 tracker · #123 recovery · #126 recovery-2 · #132 provisioning · #136 Atlas voice · #138 approval · #140 phase-gate · #141 queue · #142 Steward · #143 notifications

Codex test harness: #127, #128, #129, #130, #131, #139.

**Total: 25+ PRs merged today.**
