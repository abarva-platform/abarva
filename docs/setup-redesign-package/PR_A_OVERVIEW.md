# PR A · Overview redesign

| | |
|---|---|
| **PR number** | A of 3 |
| **Type** | Structural redesign — compress and redistribute |
| **Branch** | `setup-redesign/a-overview` |
| **Depends on** | Setup Fix Package fully merged |
| **Blocks** | PR B (Data Trust absorbs migrated content) and PR C (Agent Readiness absorbs matrix) |
| **Estimated effort** | 8-12 hours |
| **Browser-Chrome QA required** | Yes |

---

## §1 · What this PR does

Compresses Overview from 7 substantial sections to 4 small sections per the wireframe. Migrates substrate content (fact cards, matrix, landscape table, upload templates) out of Overview — they will be absorbed by Data Trust (PR B) and Agent Readiness (PR C). Until those PRs merge, the migrated content sits in the codebase but is no longer rendered on Overview.

**Reference:** `WIREFRAME_REFERENCE.html` Panel 1 (Overview).

## §2 · The 4 blocks

Per the wireframe, Overview after this PR has 4 blocks in priority order top-to-bottom:

1. **Block 1.1** — Status header (single line)
2. **Block 1.2** — Steward orientation (3 sentences max + 2 CTAs)
3. **Block 1.3** — Action queue (only shown if non-empty)
4. **Block 1.4** — Recent activity (last 7 days, max 5 items, only shown if non-empty)

Right rail: Steward chat scoped to Setup orientation (existing pattern, scope updated).

**Read `DATA_BINDING_CATALOG.md` §1 for the data binding spec for each block.**

## §3 · What gets removed from Overview

Removed (NOT deleted from codebase yet — components stay; they're just not imported into Overview):

- **Act 1 — six fact cards** (will be absorbed by Data Trust in PR B)
- **Capability Constellation matrix** (will be absorbed by Agent Readiness in PR C)
- **Four "What this tenant can reason about" cards** (will be absorbed by Agent Readiness in PR C)
- **Act 3 — upload templates section** (will be absorbed by Data Trust action queue in PR B)
- **Client Data Landscape full segment table** (will be absorbed by Data Trust in PR B)
- **Live caveat banner** (move to footer, all panels)
- **Nexus program approvals empty queue** (hidden when empty; show only when there's a real review queue)

The old "Act 1 / Act 2 / Act 3" framing is gone. The Three Acts metaphor doesn't survive the redesign.

## §4 · What gets added to Overview

- **Status header** (Block 1.1) — new, computed per data binding catalog
- **Steward orientation block** (Block 1.2) — new, deterministic copy generation server-side per template in catalog
- **Action queue** (Block 1.3) — new, ranked per impact algorithm in catalog §6
- **Recent activity** (Block 1.4) — re-scoped to "last 7 days, real changes only" — fake-looking entries from current activity feed are filtered out

## §5 · Component-level changes

### 5.1 Files to modify

The Overview page is likely at `src/app/admin/page.tsx` or similar. Identify the actual file and modify.

**In Overview page component:**
- Remove imports for Act 1 cards, Capability Constellation, Act 3 templates, Landscape table components
- Add imports for new blocks: StatusHeader, StewardOrientation, ActionQueue, RecentActivity
- Compose page from 4 new blocks in order

### 5.2 New components to create

Create in `src/components/admin/overview/`:

- `StatusHeader.tsx` — single-line status component
- `StewardOrientation.tsx` — 3-sentence orientation with 2 CTAs
- `ActionQueue.tsx` — ranked queue with severity dots and panel links
- `RecentActivity.tsx` — last-7-days activity feed

Each component follows the data binding catalog spec for its block.

### 5.3 Components to leave in place (NOT delete)

These components stay in the codebase, just not imported into Overview:

- Act 1 fact cards components
- CapabilityConstellation matrix component
- Four prose cards under matrix
- Act 3 upload template components
- ClientDataLandscape table component

PR B and PR C will import these into their respective panels. **Do not delete them in this PR.**

### 5.4 Visual treatment

Use existing AbarVa Setup design vocabulary:
- Cream background `#f5f1eb`
- Paper card backgrounds `#faf7f1`
- Fraunces (serif) for titles, Inter (sans) for body, JetBrains Mono for codes
- Eyebrows: mono caps with letter-spacing
- Severity dots: green / amber / red
- Cards: thin borders, subtle shadows

Match the existing Setup post-Setup-Fix-Package look. No new visual primitives.

## §6 · Hard scope rules

You MUST NOT:
- Delete components that PR B and PR C will need (Act 1 cards, matrix, etc.)
- Modify other Setup panels (Data Trust, Connectors, Users & Access, Agent Readiness, Production Readiness)
- Modify substrate / migrations
- Change the global nav
- Add new substrate fields (log gaps, use catalog fallbacks)
- Modify components consumed by surfaces outside Setup
- Skip browser-Chrome QA before merge

You MAY:
- Modify Overview page composition
- Create new block components per §5.2
- Update imports
- Add tests for new blocks
- Update activity-feed filtering logic (to exclude fake entries)
- Add CSS for new blocks consistent with existing vocabulary

## §7 · Test additions

Add tests verifying:

1. Overview page renders exactly 4 blocks (StatusHeader, StewardOrientation, ActionQueue, RecentActivity)
2. Old components (Act 1 cards, matrix, landscape table, Act 3 templates) are NOT imported into Overview
3. StatusHeader displays correct tenant name, readiness %, agent level, blocked tracks count
4. StewardOrientation generates correct 3-sentence narrative with proper template fill
5. ActionQueue is hidden when no items pending, shown when items exist
6. ActionQueue items link to correct destination panels
7. RecentActivity is hidden when no real activity, shown otherwise
8. RecentActivity filters out fake/platform-administrative entries
9. Both CTAs in StewardOrientation navigate to correct panels (Data Trust, Agent Readiness)
10. Right-rail Steward chat scope is "Setup orientation" (verify via the suggested asks shown)

## §8 · Verification commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four pass before opening PR.

## §9 · Browser-Chrome QA (required before merge)

Per master prompt §1.5. After CI green:

1. Navigate to Vercel preview URL
2. Sign in as FCF admin (or whichever test admin available)
3. Load `/admin` (Overview)
4. Verify visually that the page shows exactly the 4 blocks per the wireframe
5. Verify NO Act 1 cards, NO matrix, NO landscape table, NO Act 3 templates, NO Live caveat banner at top
6. Verify status header shows correct tenant name and computed metrics
7. Verify Steward orientation is 3 sentences, anchored to current loaded data
8. Verify both CTAs navigate to correct panels — click "Go to Data Trust →", verify URL is `/admin/data-trust`; back; click "Go to Agent Readiness →", verify URL is `/admin/agent-readiness`
9. Verify action queue items have severity dots and link correctly
10. Click an action queue item — verify it navigates to the right panel
11. Verify recent activity shows real changes only (not "Steward authored financial-services setup posture · Today" type fake entries)
12. Open browser dev tools, verify no console errors
13. Verify network tab shows no 4xx/5xx errors
14. Capture screenshot of Overview at 1280px wide
15. Save to `docs/setup-redesign-package/screenshots/pr-a-overview-[timestamp].png`

If any check fails, fix and redeploy. Up to 3 attempts before escalation.

## §10 · Branch + commit + PR mechanics

```bash
git checkout main
git pull origin main
git checkout -b setup-redesign/a-overview

# ... do the work ...

git add -A
git commit -m "[REDESIGN] Overview — compress to 4 blocks, prepare migration

Per docs/setup-redesign-package/SETUP_REDESIGN_PACKAGE_2026-05-07.md PR A.
Compresses Overview from 7 sections to 4 (status / orientation / action queue / activity).
Migrates substrate content out (preserved in codebase for PR B / PR C absorption).
Removes Three Acts framing.
"

git push origin setup-redesign/a-overview
gh pr create --base main --head setup-redesign/a-overview --title "[REDESIGN] Overview compression (PR A of 3)" --body-file /tmp/pr-a-body.md
```

## §11 · Acceptance criteria

PR A complete when ALL true:

- [ ] Overview shows exactly 4 blocks per wireframe Panel 1
- [ ] Status header displays correct tenant + computed metrics
- [ ] Steward orientation is 3 sentences max, generated per template
- [ ] Action queue ranked by impact, hidden when empty
- [ ] Recent activity shows real changes only, hidden when empty
- [ ] Old Overview content (Act 1 cards, matrix, landscape, Act 3) no longer rendered on Overview
- [ ] Old components NOT deleted (PR B and C need them)
- [ ] CTAs in StewardOrientation navigate correctly
- [ ] Action queue items link to correct destination panels
- [ ] Right-rail Steward chat scope updated to Setup orientation
- [ ] Lint passes / type-check passes / build passes
- [ ] Existing tests pass
- [ ] New tests added per §7 and passing
- [ ] **Browser-Chrome QA all 15 checks passing**
- [ ] Screenshot saved to docs/setup-redesign-package/screenshots/
- [ ] No console errors in browser
- [ ] No network errors
- [ ] PR description references this spec
- [ ] Substrate gaps logged
- [ ] Spec drift logged

## §12 · Failure modes specific to PR A

### 12.1 The "delete the old components" trap
You'll see Act 1 cards and matrix sitting unused in the codebase after Overview no longer imports them. Tempting to delete. **Don't.** PR B imports the Act 1 cards. PR C imports the matrix. Deleting in PR A breaks PR B and PR C.

### 12.2 The "improve the old components" trap
While you're moving things around, you'll see places where Act 1 cards or matrix could be improved. **Don't improve them in PR A.** PR B and PR C handle their respective components' redesigns. PR A is compression and migration only.

### 12.3 The "merge other Setup fixes while I'm here" trap
Other Setup panels (Connectors, Users & Access) have minor improvements possible per the wireframe (state headers added, etc.). **Out of scope for PR A.** Connectors and Users & Access are NOT redesigned in this package.

### 12.4 The "Steward orientation is creative writing" trap
The orientation block uses deterministic template-fill, not LLM at runtime. Don't call an LLM in the page render path. Generate copy server-side from a template using static substrate data. Catalog §1 Block 1.2 specifies the template.

### 12.5 The "action queue must include everything pending" trap
Cap at 5. If there are 10 things pending, show top 5 by impact, link to "View all (N) →". Don't render a 20-item queue.

### 12.6 The "recent activity should always show something" trap
If genuinely nothing happened in last 7 days, hide the entire block. Don't show "No recent activity" filler. Empty state is hidden state for this block.

## §13 · After PR A merges and deploys

Per master prompt §1.10, post completion comment, then:
- **Begin PR B** (`PR_B_DATA_TRUST.md`) — Data Trust absorbs Act 1 cards, Act 3 templates, landscape table from Overview's old content
- After PR B, **Begin PR C** (`PR_C_AGENT_READINESS.md`) — Agent Readiness absorbs matrix and prose cards

End of PR A spec.
