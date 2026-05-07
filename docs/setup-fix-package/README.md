# Setup Fix Package
## Hand to Claude Code · 9 PRs autonomous through deploy

---

## Contents

| File | Role | Read order |
|---|---|---|
| `SETUP_FIX_PACKAGE_2026-05-07.md` | **Master prompt** — operational frame, sequence, registers, gates, autonomy authority | First (Claude Code reads end to end before starting) |
| `PR_01_REMOVE_4_PANELS.md` | Remove AI Initiatives, Build Progress, Architecture, Reasoning | Read at PR 1 |
| `PR_02_TENANT_BINDING_FIX.md` | Fix cross-tenant data bleed defect | Read at PR 2 |
| `PR_03_OVERVIEW_LANDSCAPE_RECONCILIATION.md` | Reconcile 0/14 contradiction (**Gate 1**) | Read at PR 3 |
| `PR_04_OVERVIEW_ACT3_TEMPLATES.md` | Add upload templates to 4 Act 3 segments | Read at PR 4 |
| `PR_05_USERS_ACCESS_SSO.md` | Add SSO instructions + consequence copy | Read at PR 5 |
| `PR_06_DATA_TRUST_REDESIGN.md` | Structural redesign (**Gate 2** — needs design) | Read at PR 6 |
| `PR_07_CONNECTORS_REDESIGN.md` | Structural redesign (**Gate 3** — needs design) | Read at PR 7 |
| `PR_08_AGENT_READINESS_REDESIGN.md` | Structural redesign (**Gate 4** — needs design) | Read at PR 8 |
| `PR_09_PRODUCTION_READINESS_POLISH.md` | Linked blockers + tenant-correct copy | Read at PR 9 |

---

## How to use

### Step 1 — Commit to repo

Place all 10 files at:
```
docs/setup-fix-package/
```

### Step 2 — Spin up Claude Code session

Brief it with:

> Read `docs/setup-fix-package/SETUP_FIX_PACKAGE_2026-05-07.md` end to end. That is your standing instruction set for the 9-PR Setup section fix package.
>
> You have autonomous authority to: open PRs, merge to main when CI green, trigger deploys, verify deployed pages, rerun failed tests, move from one PR to the next without confirmation.
>
> You MUST pause for: Gate 1 (PR 3 — Anand decision), Gates 2/3/4 (PRs 6/7/8 — Claude Design output), or any failure escalation per master prompt §1.4.
>
> Begin with PR 1. Confirm in a single comment that you have read the master prompt, created the three registers, understood the gates, and are starting PR 1. Do not wait for further confirmation.

### Step 3 — Be available for gates

You'll be asked to respond at:
- **Gate 1 (PR 3):** A vs B decision on Overview landscape reconciliation. Default A.
- **Gate 2 (PR 6):** Provide Claude Design output for Data Trust, OR opt to skip design pass.
- **Gate 3 (PR 7):** Same for Connectors.
- **Gate 4 (PR 8):** Same for Agent Readiness.

---

## What you'll get back

After all 9 PRs ship:
- Setup left-nav goes from 10 → 6 panels
- All panels show correct tenant data
- Overview no longer contradicts itself
- Templates exist where needed (Q2 fail addressed)
- Consequence copy exists where needed (Q3 fail addressed)
- Three registers documented: spec drift, substrate gaps, escalations
- Final completion report at `docs/setup-fix-package/COMPLETION_REPORT.md`

---

## Sequence at a glance

```
Wave A: PR 1 (alone)
        ↓
Wave B: PR 2 + PR 5 (parallel)
        ↓
Wave C: PR 9 in flight; pause for Gate 1
        ↓
Wave D: PR 3 → PR 4
        ↓
Wave E: Gates 2, 3, 4 → PRs 6, 7, 8 (sequential or parallel per design output availability)
```

Calendar estimate: 3-5 days end to end, depending on gate response time.

---

End of README.
