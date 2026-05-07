# Setup Redesign Package
## 3 PRs · structural Setup redesign · browser-Chrome QA · autonomous through deploy

---

## What this is

The Setup Fix Package shipped 5 of 9 PRs autonomously and paused at design gates for PRs 6/7/8. Rather than complete those 3 redesigns separately, this package replaces them with a tighter 3-PR structural redesign focused on the highest-leverage panels: **Overview, Data Trust, Agent Readiness**.

The redesign decentralizes Overview (currently doing 7 panels' worth of work) by redistributing its content to the panels that should own it. Each panel ends up with one clear job.

Connectors, Users & Access, and Production Readiness are NOT redesigned in this package — they stay in their current shipped state. Their redesign is deferred to follow-up packages if/when prioritized.

---

## What's different about this package

Compared to the Setup Fix Package, this package adds **browser-Chrome QA discipline**. Every PR must pass not just CI, but visual verification on Vercel preview using MCP browser tools. Layout matches wireframe, data bindings render correctly, interactions work, no console errors. Three screenshots per PR saved as audit trail.

This is the most important methodological addition. CI alone does not catch layout drift, data binding errors, or broken interactions. Browser-Chrome QA does.

---

## Contents

| File | Role | Read order |
|---|---|---|
| `SETUP_REDESIGN_PACKAGE_2026-05-07.md` | **Master prompt** — operational frame, autonomy authority, browser-Chrome QA discipline, 3 registers | First (Claude Code reads end-to-end before starting) |
| `WIREFRAME_REFERENCE.html` | **Authoritative layout** — 6 panels, low-fidelity, every block named | Continuously open during implementation |
| `DATA_BINDING_CATALOG.md` | **Authoritative data spec** — every block, every field, every fallback | Read sections relevant per PR |
| `PR_A_OVERVIEW.md` | Compress Overview from 7 sections to 4 blocks | Read at PR A |
| `PR_B_DATA_TRUST.md` | Absorb Overview's substrate content + new blocks | Read at PR B |
| `PR_C_AGENT_READINESS.md` | Matrix as hero + per-agent rail + eng/admin gap split | Read at PR C |

---

## How to use

### Step 1 — Commit to repo

Place all 6 files at:
```
docs/setup-redesign-package/
```

The `WIREFRAME_REFERENCE.html` should be reachable in the repo (so Claude Code can open it in browser-Chrome via MCP tools).

### Step 2 — Spin up Claude Code session

Brief it with:

> Read `docs/setup-redesign-package/SETUP_REDESIGN_PACKAGE_2026-05-07.md` end-to-end. That is your standing instruction set for the 3-PR Setup redesign package.
>
> You have autonomous authority to: open PRs, merge to main when CI green AND browser-Chrome QA passes, trigger deploys, verify deployed pages using browser-Chrome MCP tools, rerun failed tests, move from one PR to the next without confirmation.
>
> You MUST run browser-Chrome QA on Vercel preview before every merge — not just CI verification. Screenshots and visual layout verification are required.
>
> Begin with PR A. Confirm in a single comment that you have read the master prompt, created the three registers, verified browser-Chrome MCP tool is available, opened the wireframe reference, skimmed the data binding catalog, and are starting PR A. Do not wait for further confirmation.

### Step 3 — Be available for escalations

Claude Code will pause and request your input only when:
- Browser-Chrome QA fails 3 times on a single fix (real escalation, likely needs your design judgment)
- Wireframe and data binding catalog disagree on a specific block (doc inconsistency)
- Browser-Chrome MCP tool is unavailable (prerequisite failure)

Otherwise it ships autonomously through all 3 PRs.

---

## What you'll get back

After all 3 PRs ship:

- **Overview** — 4 small blocks (status / orientation / action queue / activity)
- **Data Trust** — substantive home for substrate and uploads, action queue, trust ladder
- **Agent Readiness** — matrix as page hero, per-agent rail, engineering vs admin gap separation
- **Three registers documented**: spec drift, substrate gaps, escalations
- **Browser-Chrome QA screenshots** for every panel, every PR
- **Final completion report** at `docs/setup-redesign-package/COMPLETION_REPORT.md`
- **Template registry future-work flag** in completion report

Calendar estimate: 4-6 days end-to-end with autonomy.

---

## What this does NOT do

- Does NOT redesign Connectors, Users & Access, or Production Readiness (defer to follow-up)
- Does NOT introduce a template registry as shared platform service (deferred per master prompt §3.3)
- Does NOT modify substrate / migrations / schema
- Does NOT touch surfaces outside Setup
- Does NOT replace the Setup Fix Package (this package depends on Setup Fix Package being fully merged first)

---

## Sequence at a glance

```
Predecessor: Setup Fix Package fully merged
        ↓
PR A: Overview compression (must merge first)
        ↓
PR B: Data Trust redesign (absorbs migrated content)
        ↓
PR C: Agent Readiness redesign (matrix as hero)
        ↓
Completion report + template registry future-work flag
```

PR B and PR C can technically run in parallel after PR A merges, but sequential is recommended to reduce merge conflicts.

---

End of README.
