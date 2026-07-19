# Source legacy-surface retirement plan

Status: **in progress** · Owner: Source · Created 2026-06-15 · Updated 2026-07-18

This tees up the full "delete old pages/workflows" cleanup. It is **not** done in one shot, because most
"old" Source surfaces are **fallbacks behind feature flags** — deleting them before the new flow is the
default would 404 every non-flagged tenant. The sequence below makes that safe.

## The hard rule

You cannot delete a legacy surface while the new surface is flag-gated. The order is always:
**verify new flow → flip the flag to default-on → confirm no fallback path remains → then delete.**

## The flags to flip (new flow → default-on)

| Flag | Makes default | Gates the old surface |
|---|---|---|
| `workspace_explorer_source` | Decluttered canvas + by-step explorer | old per-stage tabs / file-cabinet / gate / report pages |
| `source_strategy_at_p0` | Approve → Scope (Strategy folded into P0) | the standalone Strategy stage page |
| `source_strategy_auto_draft` | Auto-draft on entry | manual "Draft with Sentinel" only |

Flip each to `platform` policy (default-on) **only after** the live verification below passes per tenant.

## Verification gates before any deletion

1. Create → approve a fresh event → lands in **Scope**, Strategy shown done, memo generated.
2. Workspace explorer: left = steps, right = docs Uploaded/Pending, Upload works.
3. Canvas: in-place Draft-with-Sentinel, collapsed gate, next-step look-ahead.
4. Confirm **no component links** to the legacy routes once the flag is default (grep `href=` per route).

## Surfaces to retire (after the gates pass), with current status

| Route / component | Status today | Action |
|---|---|---|
| `/source/deliverables` (page) | **orphaned (0 links)** | ✅ deleted in this PR |
| `ProgressionPanel` (WorkspaceExplorer) | dead code (not rendered) | ✅ removed in this PR |
| `/source/events` (standalone page) | archived | redirects to `/source/portfolio` |
| `/source/events/[eventId]/gate` (page) | archived | redirects to the event canvas |
| `/source/events/[eventId]/file-cabinet` (page) | archived | redirects to the event workspace |
| `/source/events/[eventId]/report` (page) | archived | redirects to the event canvas |
| `/source/events/[eventId]/scorecard` (page) | archived | redirects to the event canvas evaluation stage |
| `/source/events/[eventId]/artifacts/[artifactId]` (page) | archived | redirects to the event workspace with `artifactId` query |
| `/source/events/[eventId]/vendors/[vendorId]` (page) | archived | redirects to the event canvas responses stage |
| `EventWorkspace` tabbed canvas | flag-fallback (non-decluttered path) | delete after `workspace_explorer_source` default |
| `buildSourceWorkspaceProgression` + `source-progression.ts` | now unused by the explorer | delete after confirming no other caller |
| standalone Strategy stage rendering | flag-fallback | delete after `source_strategy_at_p0` default |

## Surfaces to KEEP (verified live, not legacy)

`/source/compare`, `/source/value`, `/source/portfolio`, `/source/queue`, `/source/approvals`,
`/source/new`, `/source/learn`, `/source/patterns`, `/source/renewal/*`, `/source/setup`.

## Environment risk

`main` has been unstable (multi-actor resets reverted earlier explorer work). Each retirement PR must be
built from a fresh worktree off `origin/main` and deployed as an immutable image; re-confirm the new flow is
still default after any other actor's deploy.
