# PR C · Agent Readiness redesign

| | |
|---|---|
| **PR number** | C of 3 |
| **Type** | Structural redesign — absorb matrix as page hero + per-agent rail + eng/admin gap split |
| **Branch** | `setup-redesign/c-agent-readiness` |
| **Depends on** | PR A merged (PR B not strictly required but recommended) |
| **Blocks** | None |
| **Estimated effort** | 14-18 hours |
| **Browser-Chrome QA required** | Yes |

---

## §1 · What this PR does

Redesigns Agent Readiness with three structural changes:

1. **Promotes the Capability Constellation 14×6 matrix to be the page hero** — currently a buried table on Overview (now removed in PR A), it deserves prominence as the agent capability map
2. **Adds a per-agent state header** showing what each of the 4 agents (Nexus / Sentinel / Steward / Atlas) can confidently do
3. **Separates engineering-tracked gaps from admin-actionable gaps** — the single most important UX improvement in the package; current panel conflates them, which misleads admins about what they can act on

**Reference:** `WIREFRAME_REFERENCE.html` Panel 5 (Agent Readiness). `DATA_BINDING_CATALOG.md` §5 for binding spec.

## §2 · The 3 blocks

Per wireframe Panel 5, top to bottom:

1. **Block 5.1** — State header (per-agent quick reads, 4 metrics)
2. **Block 5.2** — Capability constellation matrix (page hero)
3. **Block 5.3** — Per-agent next-action (admin-actionable vs engineering-tracked, visually distinct)

Right rail: Steward chat scoped to capability questions.

## §3 · What gets absorbed from Overview's old content

PR A migrated these out of Overview but left them in the codebase. PR C imports them into Agent Readiness:

### 3.1 Capability Constellation matrix → Block 5.2 (page hero)
The 14×6 matrix (segments × capabilities) becomes the Agent Readiness page hero. Refactor for:
- Visual prominence (centered, large)
- Interactive cells (click to see "what would deepen this cell")
- Color treatment per state (deep / partial / thin / empty / not-applicable)
- Cells where capability isn't relevant to segment shown as "—" or grey, distinct from "empty"

### 3.2 Four "What this tenant can reason about" prose cards → Block 5.3 (per-agent next-action)
The four cards (Cite financial-services patterns / Reason about active programs / Model run-rate / Detect operating telemetry) get replaced by per-agent items in Block 5.3. Same content, restructured:
- Per-agent (not per-capability)
- Linked to specific segments that would close the gap
- Linked to Data Trust panel to take action
- Engineering-tracked items visually muted and separated

## §4 · The engineering vs admin distinction (the most important visual decision)

This is the single most important UX improvement in the entire package. The current conflation of "live access mutation pipeline not wired" (platform engineering work, admin can't fix) with "Compliance posture not loaded" (admin can fix by uploading) misleads admins. The redesign visually separates them.

### 4.1 Admin-actionable items
- Prominent visual treatment: full opacity, severity dots (red/amber/green)
- Each item names the agent, the unmet capability, the segment(s) needed, and a direct link to Data Trust
- Format: `[Agent] → can't do [capability] · needs [segment] loaded · [Data Trust →]`

### 4.2 Engineering-tracked items
- Muted visual treatment: lower opacity, italic, no severity dots, smaller font
- Each item names the platform capability, the wave it's tracked in, NO action affordance for admin
- Format: `Tracked by AbarVa engineering: [capability] (Wave [N])`
- These are NOT failures — they're work in flight. Visual treatment communicates "this is being worked on; you don't need to act."

### 4.3 The visual separation
Two distinct sections under a shared header. Admin-actionable on top, engineering-tracked below. Clear visual divider (line, spacing, or section label). The wireframe shows this distinction; preserve it in implementation.

## §5 · New components to create

In `src/components/admin/agent-readiness/`:

- `AgentReadinessStateHeader.tsx` — 4-agent state header
- `CapabilityConstellation.tsx` — refactored matrix (likely renaming or adapting existing)
- `PerAgentActions.tsx` — admin-actionable + engineering-tracked sections

## §6 · Existing components to import or refactor

- The existing `CapabilityConstellation` (or whatever it's called) component — adapt for new prominence and interactivity
- The four "Reason about" prose cards — content (not components) feeds into per-agent action generation

## §7 · Hard scope rules

You MUST NOT:
- Modify Overview (PR A's scope)
- Modify Data Trust (PR B's scope)
- Modify other Setup panels
- Modify substrate / migrations
- Skip browser-Chrome QA before merge
- Implement new agent capability assessment logic if it doesn't exist (use catalog §10 derivation rules)

You MAY:
- Refactor matrix component for new prominence and interactivity
- Create per-agent action components
- Update Agent Readiness page composition
- Add tests
- Update Steward chat right-rail scope

## §8 · Test additions

1. Agent Readiness page renders exactly 3 blocks (StateHeader, Matrix, PerAgentActions)
2. State header shows 4 agents (Nexus, Sentinel, Steward, Atlas) with current capability levels
3. Matrix renders 14 rows × 6 columns
4. Matrix cells colored correctly per segment health and capability relevance
5. Matrix cells with non-applicable capabilities rendered distinctly from empty
6. Click on matrix cell expands tooltip/popover with deepening guidance
7. Admin-actionable items visually distinct from engineering-tracked
8. Admin-actionable items link to Data Trust panel
9. Engineering-tracked items have no action affordance
10. Per-agent next-action items derived correctly from agent-segment dependency map
11. Tenant data correct (regression check)
12. Right-rail chat scope is "capability questions"

## §9 · Browser-Chrome QA (required before merge)

1. Navigate to Vercel preview URL
2. Sign in as FCF admin
3. Load `/admin/agent-readiness`
4. Verify page shows exactly 3 blocks per wireframe Panel 5
5. Verify state header shows 4 agents with state indicators
6. Verify capability constellation matrix is visually prominent (page hero)
7. Verify matrix has 14 segment rows and 6 capability columns
8. Verify cells colored: deep cells distinct, partial cells distinct, thin cells distinct, empty cells distinct
9. Verify cells where capability is not relevant to segment shown distinctly (grey "—" or similar)
10. Click a partial-state cell — verify tooltip/popover appears with deepening guidance
11. Click a deep-state cell — verify it shows what makes it decision-grade
12. Verify per-agent next-action section has admin-actionable items prominent
13. Verify engineering-tracked items visually muted (smaller, lower opacity, italic, no severity dot)
14. Verify clear visual separation between admin-actionable and engineering-tracked
15. Click a "Data Trust →" link in admin-actionable — verify navigation to Data Trust
16. Verify NO action link on engineering-tracked items
17. Verify Wave references on engineering-tracked items (e.g., "Wave 27")
18. Open dev tools — no console errors
19. Network tab clean
20. Test on second tenant — verify tenant-specific matrix
21. Capture screenshots
22. Save to `docs/setup-redesign-package/screenshots/pr-c-agent-readiness-[timestamp].png`

## §10 · Branch + commit + PR mechanics

Standard. Branch: `setup-redesign/c-agent-readiness`. PR title: `[REDESIGN] Agent Readiness — matrix as hero + per-agent rail + eng/admin gap split (PR C of 3)`.

## §11 · Acceptance criteria

PR C complete when ALL true:

- [ ] Agent Readiness shows exactly 3 blocks per wireframe Panel 5
- [ ] State header shows 4 agents with state indicators
- [ ] Matrix promoted to page hero with prominence and interactivity
- [ ] Matrix cells colored correctly per state and capability relevance
- [ ] Matrix cell click reveals deepening guidance
- [ ] Admin-actionable vs engineering-tracked visually distinct
- [ ] Admin-actionable items link to Data Trust
- [ ] Engineering-tracked items have no action affordance, are muted
- [ ] Wave references on engineering-tracked items present
- [ ] Tenant data correct
- [ ] Right-rail chat scope updated
- [ ] Lint / type-check / build / tests pass
- [ ] New tests per §8 added and passing
- [ ] **Browser-Chrome QA all 22 checks passing**
- [ ] Multi-tenant verified
- [ ] No console errors
- [ ] Screenshots saved
- [ ] PR description references this spec
- [ ] Substrate gaps logged
- [ ] Spec drift logged

## §12 · Failure modes specific to PR C

### 12.1 The "all gaps look the same" trap
This is the trap the redesign exists to fix. If admin-actionable and engineering-tracked end up visually similar (same severity dots, same opacity, same prominence), the redesign has missed its central point. The visual distinction must be obvious — admin can scan in 3 seconds and know "what I act on" vs "what's tracked separately."

### 12.2 The "matrix is the only thing on the page" trap
The matrix is hero, not exclusive. State header on top, per-agent action items below. The matrix gets prominence; it doesn't crowd out the other blocks.

### 12.3 The "build new agent assessment logic" trap
If `agent_capability_assessments` substrate doesn't exist, derive per catalog §10 rule table. Don't build new substrate to support this PR. Log gap and use derivation.

### 12.4 The "engineering-tracked items need severity" trap
They don't. Severity (red/amber/green) is about action urgency. Engineering-tracked items aren't admin-actionable, so severity is misleading. Visual treatment: muted, italic, Wave reference, no severity dot.

### 12.5 The "make the matrix interactive everywhere" trap
Cell click → tooltip/popover is enough interactivity. Don't add filtering, sorting, drag-and-drop, segment-reordering. The matrix is a map, not an interactive dashboard.

### 12.6 The "preserve the four prose cards verbatim" trap
The four "Reason about" cards from old Overview (Cite financial-services / Reason about active / Model run-rate / Detect operating) are gone. Their content informs per-agent action items but isn't preserved as 4 prose cards. Per-agent format is tighter.

## §13 · After PR C merges and deploys

Per master prompt §1.10, post completion comment.

The Setup Redesign Package is now complete. Per master prompt §3.2, produce the final completion report at `docs/setup-redesign-package/COMPLETION_REPORT.md` covering all 3 PRs, all browser-Chrome QA findings, all substrate gaps, all spec drift, all escalations, and the template registry future-work flag per §3.3.

End of PR C spec.

---

# After PR C — Setup Redesign Package Complete

When PR C merges and deploys, post final completion comment per master prompt §1.10. Then produce the final completion report at `docs/setup-redesign-package/COMPLETION_REPORT.md` per master prompt §3.2.

The Setup section now has:

- **Overview** compressed to 4 small blocks (orient and route)
- **Data Trust** as the substantive home for substrate and uploads
- **Connectors** (unchanged from current shipped state — separate redesign needed)
- **Users & Access** (unchanged from current shipped state)
- **Agent Readiness** with matrix as hero and engineering/admin gap separation
- **Production Readiness** (unchanged from current shipped state)

Setup is now decluttered. Each panel does one job. Overview routes to the panels that do the work.

The package is complete. Stop. Anand reviews.

End.
