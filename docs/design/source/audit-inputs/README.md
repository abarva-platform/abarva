# Source Audit Kit
## Complete bundle for Claude Code Source audit kickoff

This bundle contains everything a fresh Claude Code session needs to execute the read-only Source audit.

---

## Contents (5 files)

| # | File | Role | Read order |
|---|---|---|---|
| 1 | `SOURCE_AUDIT_PROMPT.md` | **Standing instructions for Claude Code** — the audit's full operational spec | First (Claude Code reads end to end before starting) |
| 2 | `SOURCE_DOSSIER_DIGESTION.md` | Doctrine baseline · structured summary of dossier v1.0 with anchor points | Second |
| 3 | `SOURCE_DESIGN_V03_RECONCILIATION.md` | Design baseline · what changed from dossier to v0.3 design + conflict resolution rules | Third |
| 4 | `Source_End-to-End.html` | The v0.3 design itself · 14 templates · open in browser to view | Reference (Mode 3 Chrome crawl baseline) |
| 5 | `AbarVa_Source_IT_Sourcing_Product_Requirements_Design_Dossier_v1.md` | Original dossier v1.0 · 3,139 lines · the raw doctrine source | Reference (do not re-digest; trust file #2) |

---

## How to use

### Step 1 — Commit to repo

Commit all 5 files to:
```
docs/design/source/audit-inputs/
```

This is the path the audit prompt assumes.

### Step 2 — Operational handoffs (you provide at kickoff)

Three things Claude Code will ask for before starting Mode 1:

1. **Vercel preview URL** for current `main` branch (for Mode 3 Chrome crawl)
2. **Canonical tenant credentials/persona-switch instructions** for Apex Retail (Maya Desai) and Meridian Health user (for Mode 3 walk-throughs)
3. **Branch protection confirmation** that `main` requires Anand approval before merge

### Step 3 — Brief the fresh Claude Code session

First message to Claude Code:

> Read `docs/design/source/audit-inputs/SOURCE_AUDIT_PROMPT.md` end to end. That is your standing instruction set for the Source audit. Acknowledge §12 checklist completion before starting Mode 1.

Claude Code works through the §12 checklist, posts acknowledgment, and starts Mode 1.

---

## Audit shape at a glance

- **6 modes** running in sequence (Substrate → Code-path → UI deployed → Agent behavior → Doc drift → Cross-reference matrix)
- **77–94 hours** of Claude Code work
- **~2.5 weeks** calendar with one Claude Code throughput
- **~10 days** if Mode 3 (Chrome crawl) runs in parallel with Modes 1+2
- **~600 testable assertions** organized into 16 anchor groups
- **Per-mode incremental PR reporting** — one PR per mode, Anand reviews on Tue/Fri batch schedule
- **Read-only · no `src/` modifications · no migrations · no fixes-while-auditing**

---

## What this audit does NOT do

- Touch any code (`src/` is off-limits)
- Run migrations or modify substrate
- Fix anything (findings only; fixing is a separate post-audit decision)
- Audit Strategic Moves, Tower, Setup, or Intelligence (Source-scoped only)
- Audit Tower integration (Tower not yet designed per v0.3 footnote)

---

## What you (Anand) do during the audit

- Resolve operational handoffs at kickoff (URL, credentials, branch protection)
- Review Mode N PRs on Tuesday + Friday morning batch schedule
- Answer open questions that surface during audit (logged in each mode's output)
- Sign off the final `00-AUDIT_SUMMARY.md` when Mode 6 completes

---

## After the audit

When all 6 modes are merged and you've signed off the audit summary, you have:

- A `SOURCE_GAP_REGISTER.md` with every gap found, severity-rated, recommendation-tagged
- A cross-reference matrix showing where substrate/code/UI/agent/docs disagree
- An executive summary answering: is Source solid, is Source drifted, what should be done first

Then — and only then — you make the call about what to fix in what order. The audit produces the truth; the next decision is yours.

---

End of README.
