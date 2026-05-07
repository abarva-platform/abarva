# PR 8 · Agent Readiness structural redesign

| | |
|---|---|
| **PR number** | 8 of 9 |
| **Type** | Structural redesign — implements Claude Design output |
| **Branch** | `setup-fix/08-agent-readiness-redesign` |
| **Depends on** | PR 1 + PR 2 merged + Claude Design output (Gate 4) |
| **Blocks** | None |
| **Estimated effort** | 10-12 hours |
| **Gate?** | **YES — Gate 4** |

---

## §1 · What this PR does

Redesigns the Agent Readiness panel to:

1. Show tenant-correct data (per PR 2 fix)
2. **Separate engineering blockers from admin-actionable items** — currently they're conflated, which is the panel's single biggest problem per inventory §2.6
3. Promote the context coverage matrix to be the panel hero
4. Pair each matrix cell with next-action paths (admin-actionable) AND build-state notes (engineering-tracked)

Per inventory §2.6: top-line gaps like "Live access mutation pipeline not wired" describe platform build state that the admin cannot affect. The panel conflates these with admin actions, which is misleading. Admin sees "blocker" and assumes they need to act; in fact, that blocker is engineering work they can do nothing about.

## §2 · Gate 4 — Claude Design output required

Same gate pattern. Required deliverable:

```
docs/design/setup/agent-readiness-redesign.html
```

Covering at minimum the new panel structure with the three principles (engineering vs admin separation; matrix hero; per-cell actions).

## §3 · Design intent

### 3.1 Two-track gap model

Every gap in agent readiness falls into one of two buckets:

**Build-state gaps (engineering owned):**
- "Live access mutation pipeline not wired" → AbarVa engineering ships this
- "Confidence scoring not wired to live evidence" → AbarVa engineering ships this
- "Pressure cards run on seed data only" → AbarVa engineering ships this

**Admin-actionable gaps:**
- "Steward needs FCF Compliance segment loaded to gate AI sourcing decisions" → Admin uploads
- "Atlas needs IT System Landscape segment to reason about core banking dependencies" → Admin uploads
- "Nexus needs at least 2 active programs to enable cross-program synthesis" → Admin / sponsor enables programs

**Visual treatment:**
- Build-state gaps: separate section, muted treatment, "Tracked in Wave [N]" timestamp
- Admin-actionable gaps: prominent section, action affordance, links to the panel that resolves (Overview Act 3, Connectors, etc.)

### 3.2 Context coverage matrix as hero

The matrix (4 agents × 5 surfaces) is genuinely valuable and currently buried. Promote it to be the panel's central element.

For each cell that's not "Decision-grade":
- Tooltip / inline note: what would promote this cell
- Click expands to show per-cell action path
- Color treatment: green (decision-grade), amber (partial), grey (thin), red (blocked)

### 3.3 Per-agent next-action

Below the matrix, one row per agent:
- Agent name + current readiness level
- 1-3 admin-actionable items to improve readiness
- 1-3 build-state items being tracked separately (greyed)

## §4 · The 3 states

Empty (no substrate loaded — agents universally thin), Partial (some segments loaded, mixed readiness), Mature (most segments loaded, decision-grade across most cells).

## §5 · Hard scope rules

Same as PRs 6, 7. Do not modify substrate. Do not build the actual agent capability gating.

## §6 · Test additions

Standard. Plus: tests verifying engineering vs admin gap categorization renders correctly.

## §7 · Acceptance criteria

- [ ] Gate 4 resolved
- [ ] Engineering and admin-actionable gaps clearly separated
- [ ] Context coverage matrix promoted to hero
- [ ] Per-cell action paths present where applicable
- [ ] Tenant data correct post-PR 2
- [ ] All 3 states render
- [ ] Standard verification gates pass
- [ ] Substrate gaps logged

## §8 · Failure modes

### 8.1 The "all gaps look the same" trap
The whole point of this redesign is that they're different. If the implementation visually treats them the same, it has missed the point.

### 8.2 The "matrix is the only thing on the page" trap
The matrix is hero, not exclusive. Editorial card, action queue, agent rail still belong — just subordinated to the matrix.

End of PR 8 spec.
