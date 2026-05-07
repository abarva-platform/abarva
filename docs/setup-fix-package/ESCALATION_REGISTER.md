# Escalation Register
## Setup Fix Package · 9-PR run

Per `SETUP_FIX_PACKAGE_2026-05-07.md` §1.5. One entry per escalation: every time we paused for Anand input, why, and what was resolved.

| Entry | PR | What we needed | Decision | Resumed at |
|---|---|---|---|---|
| 1 | PR 3 (Gate 1) | Anand decision on Overview Client Data Landscape reconciliation direction. | **Option A** — landscape should reflect the same source Act 1 reads. Anand: "datasets have been updated fully — maybe we need to check the data bindings." Diagnostic confirmed substrate is loaded only for `apex-retail` and `meridian-health` (no `load-arcturus-setup-data.ts` exists); fix is to give the landscape an authored fallback derived from the capability matrix rather than a substrate-key remap. | Resumed at PR 3 implementation 2026-05-07. Shipped as [#1642](https://github.com/anandsundaram-hash/abarva/pull/1642). |
| 2 | PRs 6 / 7 / 8 (Gates 2 / 3 / 4) | Claude Design output (or "skip design pass" override) for Data Trust, Connectors, Agent Readiness redesigns. | **Deferred to Intelligence-aligned redesign session.** Anand recommendation 2026-05-07: ship PR 9 (cosmetic polish, no Gate dependency), wrap Setup at 6 of 9 done, and pivot to Intelligence design intent. Once Intelligence design intent is locked, Claude Design will produce HTML for Intelligence + the three pending Setup panels in one session (shared visual vocabulary → more efficient than per-panel design). A second Claude Code session will ship Setup PRs 6/7/8 and the new Intelligence surface together. | **Not resumed in this run.** Setup Fix Package terminated at 6 of 9 PRs merged + 1 deferred (PRs 6/7/8). PR 9 shipped per Anand 2026-05-07. |
